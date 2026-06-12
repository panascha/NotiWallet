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
  { id: "acc_kbank", label: "Kbank" },
  { id: "acc_truemoney", label: "Truemoney" },
  { id: "acc_paotang", label: "เป๋าตัง" },
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
    return stored ? JSON.parse(stored) : DEFAULT_ACCOUNTS;
  } catch {
    return DEFAULT_ACCOUNTS;
  }
}

export function saveAccounts(accounts) {
  localStorage.setItem("nw_accounts", JSON.stringify(accounts));
}
