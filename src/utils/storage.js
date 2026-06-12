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
