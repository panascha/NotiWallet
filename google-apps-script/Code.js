// Google Apps Script — NotiWallet Backend
// Deploy: Web App, Execute as Me, Anyone can access
// Add GEMINI_API_KEY in Project Settings → Script Properties

const SHEET_NAME = {
  TRANSACTIONS: 'Transactions',
  ACCOUNTS: 'Accounts',
  CATEGORIES: 'Categories',
  BATCHES: 'Batches',
};

// ── Entry points ──────────────────────────────────────────────

function doGet(e) {
  const p = e.parameter;
  if (p.action === 'getTransactions') {
    return respond(getTransactions(p.userId, p.month));
  }
  return respond({ error: 'Unknown action' }, 400);
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); }
  catch { return respond({ error: 'Invalid JSON' }, 400); }

  if (!body.userId) return respond({ error: 'userId required' }, 400);

  switch (body.action) {
    case 'scanSlip':          return respond(scanSlip(body.userId, body.imageBase64));
    case 'ingestNotification':return respond(ingestNotification(body.userId, body.rawText, body.capturedAt, body.accounts));
    case 'createTransaction': return respond(createTransaction(body.userId, body.data));
    case 'createBatch':       return respond(createBatch(body.userId, body.transactionIds, body.title));
    case 'markBatchPaid':     return respond(markBatchPaid(body.userId, body.batchId));
    default:                  return respond({ error: 'Unknown action' }, 400);
  }
}

function respond(data, status) {
  const output = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ── Gemini helper ─────────────────────────────────────────────

function callGemini(prompt, imagePart) {
  const key = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + key;

  const parts = [];
  if (imagePart) parts.push({ inlineData: { mimeType: 'image/jpeg', data: imagePart } });
  parts.push({ text: prompt });

  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ contents: [{ parts }] }),
  });

  const json = JSON.parse(res.getContentText());
  const text = json.candidates[0].content.parts[0].text;
  // Strip markdown code fences if present
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

// ── Actions ───────────────────────────────────────────────────

function scanSlip(userId, imageBase64) {
  const prompt = `Extract data from this bank transfer slip image. Return ONLY valid JSON with these keys:
{
  "amount": number,
  "date": "ISO8601 string",
  "recipient": "string or null",
  "bank": "string or null",
  "category": "food|grocery|personal|transport|education|subscription|monthly|other"
}`;

  const raw = callGemini(prompt, imageBase64);
  const parsed = JSON.parse(raw);
  return { status: 'success', parsed };
}

function ingestNotification(userId, rawText, capturedAt, accounts) {
  // Build account mapping from caller-supplied list; fall back to hardcoded defaults
  const accountList = (accounts && accounts.length)
    ? accounts
    : [
        { id: 'acc_kbank',     keywords: ['K PLUS', 'KBANK', 'กสิกร'] },
        { id: 'acc_truemoney', keywords: ['TrueMoney', 'ทรูมันนี่'] },
        { id: 'acc_paotang',   keywords: ['เป๋าตัง', 'Pao Tang'] },
      ];

  const accountIds = accountList.map(a => `"${a.id}"`).join(' | ');
  const rules = accountList
    .filter(a => a.keywords && a.keywords.length)
    .map(a => `${a.keywords.join('/')} → "${a.id}"`)
    .join(', ');
  const fallbackId = accountList[0] ? accountList[0].id : 'acc_unknown';

  const prompt = `Parse this bank push notification text and return ONLY valid JSON:
Text: "${rawText}"
Return:
{
  "amount": number,
  "account_id": ${accountIds},
  "recipient": "string or null"
}
Rules: ${rules}. If no keyword matches, use "${fallbackId}".`;

  const raw = callGemini(prompt);
  const parsed = JSON.parse(raw);

  const date = capturedAt || new Date().toISOString();
  const dedupHash = computeDedupHash(parsed.amount, date, parsed.account_id);

  // Check for duplicate
  const sheet = getSheet(SHEET_NAME.TRANSACTIONS);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const hashCol = headers.indexOf('dedup_hash');
  const userCol = headers.indexOf('user_id');

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][userCol] === userId && rows[i][hashCol] === dedupHash) {
      return { status: 'success', parsed: { ...parsed, date, dedup_hash: dedupHash, duplicate: true } };
    }
  }

  return { status: 'success', parsed: { ...parsed, date, dedup_hash: dedupHash, duplicate: false } };
}

function createTransaction(userId, data) {
  const sheet = getSheet(SHEET_NAME.TRANSACTIONS);
  const id = 'tx_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  const now = new Date().toISOString();

  const row = [
    id,
    userId,
    data.date || now,
    data.type || 'expense',
    Number(data.amount),
    data.category || '',
    data.account_id || '',
    data.recipient || '',
    data.bank || '',
    data.note || '',
    data.source || 'manual',
    data.reimbursable ? 'TRUE' : 'FALSE',
    data.batch_id || '',
    data.dedup_hash || '',
    now,
  ];

  sheet.appendRow(row);
  return { status: 'success', id };
}

function getTransactions(userId, month) {
  const sheet = getSheet(SHEET_NAME.TRANSACTIONS);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];

  const col = (name) => headers.indexOf(name);

  const transactions = rows.slice(1)
    .filter((r) => r[col('user_id')] === userId)
    .filter((r) => {
      if (!month) return true;
      const d = String(r[col('date')]);
      return d.startsWith(month);
    })
    .map((r) => ({
      id: r[col('id')],
      user_id: r[col('user_id')],
      date: r[col('date')],
      type: r[col('type')],
      amount: r[col('amount')],
      category: r[col('category')],
      account_id: r[col('account_id')],
      recipient: r[col('recipient')],
      bank: r[col('bank')],
      note: r[col('note')],
      source: r[col('source')],
      reimbursable: r[col('reimbursable')] === 'TRUE' || r[col('reimbursable')] === true,
      batch_id: r[col('batch_id')] || null,
      dedup_hash: r[col('dedup_hash')] || null,
      created_at: r[col('created_at')],
    }));

  return { status: 'success', transactions };
}

function createBatch(userId, transactionIds, title) {
  // Compute total from transactions
  const txSheet = getSheet(SHEET_NAME.TRANSACTIONS);
  const txRows = txSheet.getDataRange().getValues();
  const txHeaders = txRows[0];
  const idCol = txHeaders.indexOf('id');
  const amtCol = txHeaders.indexOf('amount');
  const batchIdCol = txHeaders.indexOf('batch_id');

  const batchId = 'batch_' + Utilities.formatDate(new Date(), 'UTC', 'yyyyMMdd') + '_' +
    Math.random().toString(36).slice(2, 6);
  const now = new Date().toISOString();

  let total = 0;
  const idSet = new Set(transactionIds);

  for (let i = 1; i < txRows.length; i++) {
    if (idSet.has(txRows[i][idCol])) {
      total += Number(txRows[i][amtCol]);
      txSheet.getRange(i + 1, batchIdCol + 1).setValue(batchId);
    }
  }

  // Write batch row
  const batchSheet = getSheet(SHEET_NAME.BATCHES);
  batchSheet.appendRow([batchId, userId, title || '', 'open', total, now, '']);

  return { status: 'success', batchId, total };
}

function markBatchPaid(userId, batchId) {
  const sheet = getSheet(SHEET_NAME.BATCHES);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idCol = headers.indexOf('id');
  const statusCol = headers.indexOf('status');
  const paidAtCol = headers.indexOf('paid_at');

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idCol] === batchId) {
      sheet.getRange(i + 1, statusCol + 1).setValue('paid');
      sheet.getRange(i + 1, paidAtCol + 1).setValue(new Date().toISOString());
      return { status: 'success' };
    }
  }

  return { status: 'error', message: 'Batch not found' };
}

// ── Helpers ───────────────────────────────────────────────────

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    writeHeaders(sheet, name);
  }
  return sheet;
}

function writeHeaders(sheet, name) {
  const headers = {
    [SHEET_NAME.TRANSACTIONS]: [
      'id','user_id','date','type','amount','category','account_id',
      'recipient','bank','note','source','reimbursable','batch_id','dedup_hash','created_at'
    ],
    [SHEET_NAME.ACCOUNTS]: ['id','user_id','name','type','balance','updated_at'],
    [SHEET_NAME.CATEGORIES]: ['id','user_id','name','budget_limit','icon'],
    [SHEET_NAME.BATCHES]: ['id','user_id','title','status','total','created_at','paid_at'],
  };
  if (headers[name]) sheet.appendRow(headers[name]);
}

function computeDedupHash(amount, dateString, accountId) {
  // hash(amount + minute + account_id)
  const d = new Date(dateString);
  const minute = `${d.getUTCFullYear()}${d.getUTCMonth()}${d.getUTCDate()}${d.getUTCHours()}${d.getUTCMinutes()}`;
  const raw = `${amount}${minute}${accountId}`;
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, raw);
  return bytes.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('').slice(0, 12);
}
