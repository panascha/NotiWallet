import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import AuthGate from "@/components/AuthGate";
import BottomNav from "@/components/BottomNav";
import { getTransactions } from "@/services/gas.service";
import { logout } from "@/services/auth.service";
import { getCategories, getLargeExpenseThreshold, getCachedTxns, setCachedTxns, getBillingCycleStart, getHideBalances } from "@/utils/storage";
import { LogOut, TrendingDown, TrendingUp, ChevronRight, Plus, Settings } from "lucide-react";

const MONTH_LABELS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

const PALETTE = [
  "#F59E0B", "#10B981", "#A78BFA", "#60A5FA",
  "#F87171", "#FB923C", "#34D399", "#94A3B8",
  "#F472B6", "#38BDF8",
];

const CAT_COLORS = {
  food: "#F59E0B",
  grocery: "#10B981",
  personal: "#A78BFA",
  transport: "#60A5FA",
  education: "#F87171",
  subscription: "#FB923C",
  monthly: "#34D399",
  other: "#94A3B8",
};

function getCategoryColor(catId, index) {
  return CAT_COLORS[catId] ?? PALETTE[index % PALETTE.length];
}

function groupByDate(transactions) {
  const groups = {};
  transactions.forEach((t) => {
    const key = t.date.slice(0, 10);
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

function formatThaiDate(isoDate) {
  const d = new Date(isoDate);
  return `${d.getDate()} ${MONTH_LABELS[d.getMonth()]}`;
}

function getCycleRange(cycleMonthStr, cycleStart) {
  const [y, m] = cycleMonthStr.split("-").map(Number);
  const start = new Date(y, m - 1, cycleStart);
  const end = new Date(y, m, cycleStart - 1, 23, 59, 59, 999);
  return { start, end };
}

function filterByCycle(txns, start, end) {
  return txns.filter((t) => { const d = new Date(t.date); return d >= start && d <= end; });
}

function DonutChart({ segments, total, hideAmount }) {
  const size = 120, stroke = 18;
  const r = (size - stroke) / 2;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const quarter = circ / 4;
  let acc = 0;
  const segs = segments.map((s) => {
    const dash = total > 0 ? (s.amount / total) * circ : 0;
    const seg = { ...s, dash, offset: quarter - acc };
    acc += dash;
    return seg;
  });
  const label = hideAmount ? "***" : (total >= 10000
    ? `${Math.round(total / 1000)}K`
    : total.toLocaleString("th-TH"));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
      {segs.map((s) => (
        <circle
          key={s.id}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={s.color}
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={`${s.dash} ${circ - s.dash}`}
          strokeDashoffset={s.offset}
        />
      ))}
      <text
        x={cx} y={cy - 6}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#e2e8f0"
        fontSize="11"
        fontFamily="JetBrains Mono, monospace"
        fontWeight="600"
      >
        {label}
      </text>
      <text
        x={cx} y={cy + 8}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#64748b"
        fontSize="8"
        fontFamily="Inter, system-ui, sans-serif"
      >
        ปกติ
      </text>
    </svg>
  );
}

export default function Home() {
  return (
    <>
      <Head><title>NotiWallet</title></Head>
      <AuthGate>
        {(user) => <HomeContent user={user} />}
      </AuthGate>
    </>
  );
}

function HomeContent({ user }) {
  const router = useRouter();
  const now = new Date();
  const [month, setMonth] = useState(now.toISOString().slice(0, 7));
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState(5000);
  const [allCategories, setAllCategories] = useState([]);
  const [cycleStart, setCycleStart] = useState(1);
  const [hideBalances, setHideBalances] = useState(false);

  useEffect(() => {
    setThreshold(getLargeExpenseThreshold());
    setAllCategories(getCategories());
    const cs = getBillingCycleStart();
    setCycleStart(cs);
    if (cs > 1) {
      const today = new Date();
      if (today.getDate() < cs) {
        const lastM = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        setMonth(lastM.toISOString().slice(0, 7));
      }
    }
    setHideBalances(getHideBalances());
  }, []);

  useEffect(() => {
    if (cycleStart > 1) {
      const { start, end } = getCycleRange(month, cycleStart);
      const [y, m] = month.split("-").map(Number);
      const nextM = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
      const c1 = getCachedTxns(user.uid, month);
      const c2 = getCachedTxns(user.uid, nextM);
      if (c1 && c2) {
        setTransactions(filterByCycle([...c1.transactions, ...c2.transactions], start, end));
        setLoading(false);
      } else {
        setLoading(true);
      }
      Promise.all([getTransactions(user.uid, month), getTransactions(user.uid, nextM)])
        .then(([d1, d2]) => {
          const t1 = d1.transactions ?? [];
          const t2 = d2.transactions ?? [];
          setCachedTxns(user.uid, month, t1);
          setCachedTxns(user.uid, nextM, t2);
          setTransactions(filterByCycle([...t1, ...t2], start, end));
        })
        .catch(() => { if (!c1 && !c2) setTransactions([]); })
        .finally(() => setLoading(false));
    } else {
      const cached = getCachedTxns(user.uid, month);
      if (cached) {
        setTransactions(cached.transactions);
        setLoading(false);
      } else {
        setLoading(true);
      }
      getTransactions(user.uid, month)
        .then((d) => {
          const txns = d.transactions ?? [];
          setTransactions(txns);
          setCachedTxns(user.uid, month, txns);
        })
        .catch(() => { if (!cached) setTransactions([]); })
        .finally(() => setLoading(false));
    }
  }, [user.uid, month, cycleStart]);

  const expenses = transactions.filter((t) => t.type === "expense");
  const incomes = transactions.filter((t) => t.type === "income");
  const totalExpense = expenses.reduce((s, t) => s + Number(t.amount), 0);
  const totalIncome = incomes.reduce((s, t) => s + Number(t.amount), 0);
  const pending = transactions.filter((t) => t.reimbursable && !t.batch_id);
  const pendingTotal = pending.reduce((s, t) => s + Number(t.amount), 0);
  const groups = groupByDate(transactions);

  const largeExpenses = expenses.filter((t) => Number(t.amount) >= threshold);
  const regularExpenses = expenses.filter((t) => Number(t.amount) < threshold);
  const regularTotal = regularExpenses.reduce((s, t) => s + Number(t.amount), 0);
  const largeTotal = largeExpenses.reduce((s, t) => s + Number(t.amount), 0);

  const catAmounts = {};
  regularExpenses.forEach((t) => {
    catAmounts[t.category] = (catAmounts[t.category] ?? 0) + Number(t.amount);
  });
  const catData = Object.entries(catAmounts)
    .sort(([, a], [, b]) => b - a)
    .map(([id, amount], i) => {
      const cat = allCategories.find((c) => c.id === id);
      return { id, label: cat?.label ?? id, emoji: cat?.emoji ?? "📦", amount, color: getCategoryColor(id, i) };
    });

  const [yr, mo] = month.split("-").map(Number);
  let monthLabel;
  if (cycleStart > 1) {
    const { start, end } = getCycleRange(month, cycleStart);
    monthLabel = `${start.getDate()} ${MONTH_LABELS[start.getMonth()]} – ${end.getDate()} ${MONTH_LABELS[end.getMonth()]} ${end.getFullYear() + 543}`;
  } else {
    monthLabel = `${MONTH_LABELS[mo - 1]} ${yr + 543}`;
  }
  const currentCycleAnchor = cycleStart > 1 && now.getDate() < cycleStart
    ? new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7)
    : now.toISOString().slice(0, 7);

  function prevMonth() {
    const d = new Date(`${month}-01`);
    d.setMonth(d.getMonth() - 1);
    setMonth(d.toISOString().slice(0, 7));
  }
  function nextMonth() {
    const d = new Date(`${month}-01`);
    d.setMonth(d.getMonth() + 1);
    if (d.toISOString().slice(0, 7) <= currentCycleAnchor) setMonth(d.toISOString().slice(0, 7));
  }

  return (
    <div className="min-h-dvh pb-28">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#0C0C0A]/95 backdrop-blur-sm border-b border-white/[0.06] px-4 pt-safe-top">
        <div className="flex items-center justify-between h-14 max-w-lg mx-auto">
          <h1 className="font-display text-xl font-bold text-slate-100">NotiWallet</h1>
          <div className="flex items-center gap-1">
            {user.photoURL && (
              <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full border border-white/10 mr-1" />
            )}
            <button
              onClick={() => router.push("/settings")}
              className="btn-ghost p-2 rounded-xl"
              aria-label="ตั้งค่า"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={() => logout()}
              className="btn-ghost p-2 rounded-xl"
              aria-label="ออกจากระบบ"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 max-w-lg mx-auto space-y-4 mt-4">
        {/* Month selector */}
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="btn-ghost px-3 py-1.5 text-xl">‹</button>
          <span className="font-display font-semibold text-slate-200">{monthLabel}</span>
          <button
            onClick={nextMonth}
            disabled={month >= currentCycleAnchor}
            className="btn-ghost px-3 py-1.5 text-xl disabled:opacity-30"
          >›</button>
        </div>

        {/* Summary card */}
        <div className="glass p-5 animate-fade-up">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">สรุปเดือนนี้</p>
          <div className="flex gap-6">
            <div>
              <div className="flex items-center gap-1.5 text-red-400 mb-1">
                <TrendingDown size={14} />
                <span className="text-xs text-slate-400">รายจ่าย</span>
              </div>
              <p className={`amount text-2xl font-semibold text-slate-100${hideBalances ? " blur-sm select-none" : ""}`}>
                ฿{totalExpense.toLocaleString("th-TH")}
              </p>
            </div>
            <div className="w-px bg-white/10" />
            <div>
              <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
                <TrendingUp size={14} />
                <span className="text-xs text-slate-400">รายรับ</span>
              </div>
              <p className={`amount text-2xl font-semibold text-slate-100${hideBalances ? " blur-sm select-none" : ""}`}>
                ฿{totalIncome.toLocaleString("th-TH")}
              </p>
            </div>
          </div>
        </div>

        {/* Reimburse card */}
        {pending.length > 0 && (
          <button
            onClick={() => router.push("/reimburse")}
            className="w-full text-left glass pressable p-4 border-lime-400/20 bg-lime-400/5 animate-fade-up"
            aria-label={`รอเบิก ${pending.length} รายการ ฿${pendingTotal.toLocaleString()}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-lime-400/80 font-medium mb-1">รอเบิก</p>
                <p className={`amount text-2xl font-bold text-lime-300${hideBalances ? " blur-sm select-none" : ""}`}>
                  ฿{pendingTotal.toLocaleString("th-TH")}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{pending.length} รายการ</p>
              </div>
              <ChevronRight size={20} className="text-lime-400/60" />
            </div>
          </button>
        )}

        {/* Category breakdown chart */}
        {!loading && catData.length > 0 && (
          <div className="glass p-5 animate-fade-up">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-4">รายจ่ายตามหมวด</p>
            <div className="flex items-center gap-4">
              <DonutChart segments={catData} total={regularTotal} hideAmount={hideBalances} />
              <div className="flex-1 space-y-2 min-w-0">
                {catData.map((c) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                    <span className="text-xs text-slate-400 truncate flex-1">{c.label}</span>
                    <span className={`amount text-xs text-slate-300 shrink-0${hideBalances ? " blur-sm select-none" : ""}`}>
                      ฿{c.amount.toLocaleString("th-TH")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Large expenses */}
        {!loading && largeExpenses.length > 0 && (
          <div className="glass p-4 animate-fade-up border-red-500/15 bg-red-500/[0.04]">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">รายจ่ายก้อนใหญ่</p>
            <div className="space-y-2">
              {largeExpenses.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-300 truncate">{t.note || t.recipient || t.category}</p>
                    <p className="text-xs text-slate-600">{t.category}</p>
                  </div>
                  <span className={`amount text-sm font-semibold text-red-400 shrink-0${hideBalances ? " blur-sm select-none" : ""}`}>
                    ฿{Number(t.amount).toLocaleString("th-TH")}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-white/[0.06] flex justify-between items-center">
              <span className="text-xs text-slate-500">{largeExpenses.length} รายการ</span>
              <span className={`amount text-sm font-bold text-red-400${hideBalances ? " blur-sm select-none" : ""}`}>
                ฿{largeTotal.toLocaleString("th-TH")}
              </span>
            </div>
          </div>
        )}

        {/* Transaction list */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass p-4 animate-pulse">
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <div className="h-3 w-24 bg-white/10 rounded" />
                    <div className="h-2.5 w-16 bg-white/5 rounded" />
                  </div>
                  <div className="h-4 w-16 bg-white/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="glass p-10 text-center">
            <p className="text-slate-500">ยังไม่มีรายการ</p>
            <button
              onClick={() => router.push("/manual")}
              className="mt-4 flex items-center gap-1.5 text-lime-400 text-sm mx-auto pressable hover:text-lime-300"
            >
              <Plus size={16} />
              เพิ่มรายการแรก
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-up">
            {groups.map(([date, items]) => (
              <div key={date}>
                <p className="text-xs text-slate-500 font-medium px-1 mb-2">
                  {formatThaiDate(date)}
                </p>
                <div className="space-y-2">
                  {items.map((t) => (
                    <TransactionRow key={t.id} t={t} hideBalances={hideBalances} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function TransactionRow({ t, hideBalances }) {
  const router = useRouter();
  const isExpense = t.type === "expense";
  return (
    <div
      className="glass pressable px-4 py-3 flex items-center justify-between gap-3 cursor-pointer"
      onClick={() => router.push(`/manual?edit=${t.id}`)}
      role="button"
      tabIndex={0}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-200 truncate">
          {t.note || t.recipient || t.category}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-500">{t.category}</span>
          {t.reimbursable && !t.batch_id && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-lime-400/15 text-lime-400 border border-lime-400/20">
              รอเบิก
            </span>
          )}
          {t.reimbursable && t.batch_id && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              เบิกแล้ว
            </span>
          )}
        </div>
      </div>
      <span className={`amount text-sm font-semibold shrink-0 ${isExpense ? "text-red-400" : "text-emerald-400"}${hideBalances ? " blur-sm select-none" : ""}`}>
        {isExpense ? "-" : "+"}฿{Number(t.amount).toLocaleString("th-TH")}
      </span>
    </div>
  );
}
