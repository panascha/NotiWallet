import { getGasUrl, getAccounts } from "@/utils/storage";

async function post(body) {
  const res = await fetch(getGasUrl(), {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function scanSlip(userId, imageBase64) {
  return post({ action: "scanSlip", userId, imageBase64 });
}

export async function ingestNotification(userId, rawText, capturedAt) {
  const accounts = getAccounts();
  return post({ action: "ingestNotification", userId, rawText, capturedAt, accounts });
}

export async function createTransaction(userId, data) {
  return post({ action: "createTransaction", userId, data });
}

export async function getTransactions(userId, month) {
  const url = `${getGasUrl()}?action=getTransactions&userId=${userId}&month=${month}`;
  const res = await fetch(url);
  return res.json();
}

export async function createBatch(userId, transactionIds, title) {
  return post({ action: "createBatch", userId, transactionIds, title });
}

export async function markBatchPaid(userId, batchId) {
  return post({ action: "markBatchPaid", userId, batchId });
}

export async function updateTransaction(userId, transactionId, data) {
  return post({ action: "updateTransaction", userId, transactionId, data });
}

export async function deleteTransaction(userId, transactionId) {
  return post({ action: "deleteTransaction", userId, transactionId });
}
