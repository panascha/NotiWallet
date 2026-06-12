const GAS_URL = process.env.NEXT_PUBLIC_GAS_WEBAPP_URL;

async function post(body) {
  const res = await fetch(GAS_URL, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function scanSlip(userId, imageBase64) {
  return post({ action: "scanSlip", userId, imageBase64 });
}

export async function ingestNotification(userId, rawText, capturedAt) {
  return post({ action: "ingestNotification", userId, rawText, capturedAt });
}

export async function createTransaction(userId, data) {
  return post({ action: "createTransaction", userId, data });
}

export async function getTransactions(userId, month) {
  const url = `${GAS_URL}?action=getTransactions&userId=${userId}&month=${month}`;
  const res = await fetch(url);
  return res.json();
}

export async function createBatch(userId, transactionIds, title) {
  return post({ action: "createBatch", userId, transactionIds, title });
}

export async function markBatchPaid(userId, batchId) {
  return post({ action: "markBatchPaid", userId, batchId });
}
