import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import AuthGate from "@/components/AuthGate";
import BottomNav from "@/components/BottomNav";
import { getTransactions } from "@/services/gas.service";
import { logout } from "@/services/auth.service";
import { LogOut, TrendingDown, TrendingUp, ChevronRight, Plus, Settings } from "lucide-react";

const MONTH_LABELS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

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

  useEffect(() => {
    setLoading(true);
    getTransactions(user.uid, month)
      .then((d) => setTransactions(d.transactions ?? []))
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, [user.uid, month]);

  const expenses = transactions.filter((t) => t.type === "expense");
  const incomes = transactions.filter((t) => t.type === "income");
  const totalExpense = expenses.reduce((s, t) => s + Number(t.amount), 0);
  const totalIncome = incomes.reduce((s, t) => s + Number(t.amount), 0);
  const pending = transactions.filter((t) => t.reimbursable && !t.batch_id);
  const pendingTotal = pending.reduce((s, t) => s + Number(t.amount), 0);
  const groups = groupByDate(transactions);

  const [yr, mo] = month.split("-").map(Number);
  const monthLabel = `${MONTH_LABELS[mo - 1]} ${yr + 543}`;

  function prevMonth() {
    const d = new Date(`${month}-01`);
    d.setMonth(d.getMonth() - 1);
    setMonth(d.toISOString().slice(0, 7));
  }
  function nextMonth() {
    const d = new Date(`${month}-01`);
    d.setMonth(d.getMonth() + 1);
    if (d <= now) setMonth(d.toISOString().slice(0, 7));
  }

  return (
    <div className="min-h-dvh pb-28">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#080812]/80 backdrop-blur-xl border-b border-white/[0.06] px-4 pt-safe-top">
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
            disabled={month >= now.toISOString().slice(0, 7)}
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
              <p className="amount text-2xl font-semibold text-slate-100">
                ฿{totalExpense.toLocaleString("th-TH")}
              </p>
            </div>
            <div className="w-px bg-white/10" />
            <div>
              <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
                <TrendingUp size={14} />
                <span className="text-xs text-slate-400">รายรับ</span>
              </div>
              <p className="amount text-2xl font-semibold text-slate-100">
                ฿{totalIncome.toLocaleString("th-TH")}
              </p>
            </div>
          </div>
        </div>

        {/* Reimburse card */}
        {pending.length > 0 && (
          <button
            onClick={() => router.push("/reimburse")}
            className="w-full text-left glass pressable p-4 border-amber-500/20 bg-amber-500/5 animate-fade-up"
            aria-label={`รอเบิก ${pending.length} รายการ ฿${pendingTotal.toLocaleString()}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-400/80 font-medium mb-1">รอเบิก</p>
                <p className="amount text-2xl font-bold text-amber-300">
                  ฿{pendingTotal.toLocaleString("th-TH")}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{pending.length} รายการ</p>
              </div>
              <ChevronRight size={20} className="text-amber-500/60" />
            </div>
          </button>
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
              className="mt-4 flex items-center gap-1.5 text-amber-400 text-sm mx-auto pressable hover:text-amber-300"
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
                    <TransactionRow key={t.id} t={t} />
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

function TransactionRow({ t }) {
  const isExpense = t.type === "expense";
  return (
    <div className="glass pressable px-4 py-3 flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-200 truncate">
          {t.note || t.recipient || t.category}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-500">{t.category}</span>
          {t.reimbursable && !t.batch_id && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
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
      <span className={`amount text-sm font-semibold shrink-0 ${isExpense ? "text-red-400" : "text-emerald-400"}`}>
        {isExpense ? "-" : "+"}฿{Number(t.amount).toLocaleString("th-TH")}
      </span>
    </div>
  );
}
