export const DEFAULT_CATEGORIES = [
  { id: "food", label: "อาหาร/คาเฟ่", emoji: "🍔" },
  { id: "grocery", label: "ของใช้/Makro", emoji: "🛒" },
  { id: "personal", label: "ดูแลตัว", emoji: "✂️" },
  { id: "transport", label: "เดินทาง", emoji: "🚗" },
  { id: "education", label: "การศึกษา", emoji: "🎓" },
  { id: "subscription", label: "Subscription", emoji: "📺" },
  { id: "monthly", label: "รายเดือน", emoji: "📅" },
  { id: "other", label: "อื่นๆ", emoji: "📦" },
];

export const DEFAULT_ACCOUNTS = [
  { id: "acc_kbank", label: "Kbank", keywords: ["K PLUS", "KBANK", "กสิกร"] },
  { id: "acc_truemoney", label: "Truemoney", keywords: ["TrueMoney", "ทรูมันนี่"] },
  { id: "acc_paotang", label: "เป๋าตัง", keywords: ["เป๋าตัง", "Pao Tang"] },
];

export function getCategories() {
  if (typeof window === "undefined") return DEFAULT_CATEGORIES;
  try {
    const stored = localStorage.getItem("nw_categories");
    return stored ? JSON.parse(stored) : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategories(cats) {
  localStorage.setItem("nw_categories", JSON.stringify(cats));
}

export function getAccounts() {
  if (typeof window === "undefined") return DEFAULT_ACCOUNTS;
  try {
    const stored = localStorage.getItem("nw_accounts");
    if (!stored) return DEFAULT_ACCOUNTS;
    const parsed = JSON.parse(stored);
    // Migrate: inject default keywords for known accounts if missing
    return parsed.map((a) => {
      if (Array.isArray(a.keywords)) return a;
      const def = DEFAULT_ACCOUNTS.find((d) => d.id === a.id);
      return { ...a, keywords: def?.keywords ?? [] };
    });
  } catch {
    return DEFAULT_ACCOUNTS;
  }
}

export function saveAccounts(accounts) {
  localStorage.setItem("nw_accounts", JSON.stringify(accounts));
}

export function getLargeExpenseThreshold() {
  if (typeof window === "undefined") return 5000;
  try {
    const v = localStorage.getItem("nw_large_threshold");
    return v ? Number(v) : 5000;
  } catch {
    return 5000;
  }
}

export function saveLargeExpenseThreshold(n) {
  localStorage.setItem("nw_large_threshold", String(Number(n)));
}

export function getGasUrl() {
  if (typeof window === "undefined") return process.env.NEXT_PUBLIC_GAS_WEBAPP_URL ?? "";
  try {
    return localStorage.getItem("nw_gas_url") || process.env.NEXT_PUBLIC_GAS_WEBAPP_URL || "";
  } catch {
    return process.env.NEXT_PUBLIC_GAS_WEBAPP_URL ?? "";
  }
}

export function saveGasUrl(url) {
  localStorage.setItem("nw_gas_url", url.trim());
}

export function getOrCreateLocalUserId() {
  if (typeof window === "undefined") return "local_user";
  try {
    let id = localStorage.getItem("nw_user_id");
    if (!id) {
      id = "user_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      localStorage.setItem("nw_user_id", id);
    }
    return id;
  } catch {
    return "local_user";
  }
}

export function getCachedTxns(userId, month) {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`nw_txns_${userId}_${month}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCachedTxns(userId, month, transactions) {
  try {
    localStorage.setItem(
      `nw_txns_${userId}_${month}`,
      JSON.stringify({ transactions, cachedAt: new Date().toISOString() })
    );
  } catch {}
}

export function exportBackupJSON() {
  if (typeof window === "undefined") return "{}";
  const result = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("nw_txns_")) {
      try {
        result[key] = JSON.parse(localStorage.getItem(key));
      } catch {}
    }
  }
  return JSON.stringify(result, null, 2);
}

export function getBillingCycleStart() {
  if (typeof window === "undefined") return 1;
  try {
    const v = localStorage.getItem("nw_billing_start");
    const n = v ? Number(v) : 1;
    return Math.min(28, Math.max(1, n));
  } catch {
    return 1;
  }
}

export function saveBillingCycleStart(day) {
  const n = Math.min(28, Math.max(1, Number(day)));
  localStorage.setItem("nw_billing_start", String(n));
}

export function getHideBalances() {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("nw_hide_balances") === "true";
  } catch {
    return false;
  }
}

export function saveHideBalances(bool) {
  localStorage.setItem("nw_hide_balances", bool ? "true" : "false");
}

export function getShortcutDone() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem("nw_shortcut_done") === "true";
}

export function saveShortcutDone() {
  localStorage.setItem("nw_shortcut_done", "true");
}

export function exportCacheAsCSV() {
  if (typeof window === "undefined") return "";
  const COLS = ["id", "date", "type", "amount", "category", "account_id", "recipient", "bank", "note", "source", "reimbursable", "batch_id"];
  const rows = [COLS.join(",")];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith("nw_txns_")) continue;
    try {
      const data = JSON.parse(localStorage.getItem(key));
      (data.transactions ?? []).forEach((t) => {
        rows.push(COLS.map((c) => {
          const s = String(t[c] ?? "");
          return s.includes(",") || s.includes('"') || s.includes("\n")
            ? `"${s.replace(/"/g, '""')}"`
            : s;
        }).join(","));
      });
    } catch {}
  }
  return rows.join("\n");
}

export function clearCachedTransactions() {
  if (typeof window === "undefined") return;
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("nw_txns_")) keys.push(key);
  }
  keys.forEach((k) => localStorage.removeItem(k));
}
