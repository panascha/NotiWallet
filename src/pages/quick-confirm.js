import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import AuthGate from "@/components/AuthGate";
import { createTransaction } from "@/services/gas.service";
import { getCategories, getAccounts } from "@/utils/storage";
import { Check, AlertCircle } from "lucide-react";

export default function QuickConfirmPage() {
  return (
    <>
      <Head><title>ยืนยันรายการ — NotiWallet</title></Head>
      <AuthGate>{(user) => <QuickConfirmForm user={user} />}</AuthGate>
    </>
  );
}

function QuickConfirmForm({ user }) {
  const router = useRouter();
  const {
    amount: qAmount = "",
    account_id: qAccount = "acc_kbank",
    date: qDate = new Date().toISOString(),
    recipient: qRecipient = "",
    dedup_hash: qHash = "",
    duplicate,
  } = router.query;

  const [category, setCategory] = useState("");
  const [reimbursable, setReimbursable] = useState(false);
  const [note, setNote] = useState(qRecipient);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    setCategories(getCategories());
    setAccounts(getAccounts());
  }, []);

  async function handleSave() {
    if (!category) return;
    setSaving(true);
    try {
      await createTransaction(user.uid, {
        type: "expense",
        amount: Number(qAmount),
        date: qDate,
        category,
        account_id: qAccount,
        recipient: qRecipient,
        note,
        reimbursable,
        dedup_hash: qHash,
        source: "notification",
      });
      setDone(true);
      setTimeout(() => router.push("/"), 800);
    } catch {
      setSaving(false);
    }
  }

  if (duplicate === "true") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 gap-4">
        <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
          <AlertCircle size={28} className="text-amber-400" />
        </div>
        <p className="text-slate-300 font-medium text-center">รายการนี้บันทึกแล้ว</p>
        <button onClick={() => router.push("/")} className="btn-ghost">กลับหน้าหลัก</button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col px-4 pt-safe-top pb-8 max-w-lg mx-auto">
      <div className="flex-1 flex flex-col justify-center gap-6 animate-fade-up">
        {/* Amount display */}
        <div className="glass p-6 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">จำนวนเงิน</p>
          <p className="amount text-5xl font-bold text-slate-100">
            ฿{Number(qAmount).toLocaleString("th-TH")}
          </p>
          <div className="flex items-center justify-center gap-3 mt-3 text-sm text-slate-400">
            <span>{accounts.find((a) => a.id === qAccount)?.label ?? qAccount}</span>
            {qRecipient && <><span className="text-white/20">·</span><span>{qRecipient}</span></>}
          </div>
        </div>

        {/* Category picker */}
        <div>
          <p className="text-xs text-slate-400 font-medium mb-3">เลือกหมวดหมู่ *</p>
          <div className="grid grid-cols-4 gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`glass pressable flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all duration-150 ${
                  category === c.id
                    ? "border-amber-500/50 bg-amber-500/10"
                    : "border-white/[0.06] hover:border-white/20"
                }`}
                aria-pressed={category === c.id}
                aria-label={c.label}
              >
                <span className="text-xl" role="img" aria-hidden="true">{c.emoji}</span>
                <span className={`text-[10px] font-medium leading-tight text-center ${category === c.id ? "text-amber-300" : "text-slate-400"}`}>
                  {c.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Note (editable recipient) */}
        <div>
          <label className="block text-xs text-slate-400 mb-2 font-medium">โน้ต</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="ร้านอะไร / ค่าอะไร"
            className="field"
            aria-label="โน้ต"
          />
        </div>

        {/* Reimbursable toggle */}
        <button
          onClick={() => setReimbursable((v) => !v)}
          className={`glass pressable p-4 flex items-center justify-between transition-colors duration-200 ${
            reimbursable ? "border-amber-500/30 bg-amber-500/5" : ""
          }`}
          role="switch"
          aria-pressed={reimbursable}
        >
          <div>
            <p className={`text-sm font-semibold ${reimbursable ? "text-amber-300" : "text-slate-300"}`}>
              รอเบิกคืน/รอเพื่อนโอนคืน
            </p>
            <p className="text-xs text-slate-500 mt-0.5">จ่ายเองก่อน รอคนอื่นโอนคืน</p>
          </div>
          <div className={`w-12 h-6 rounded-full border transition-all duration-200 flex items-center px-0.5 ${
            reimbursable ? "bg-amber-500 border-amber-400" : "bg-white/10 border-white/20"
          }`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
              reimbursable ? "translate-x-6" : "translate-x-0"
            }`} />
          </div>
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={!category || saving}
          className="btn-primary flex items-center justify-center gap-2"
          aria-busy={saving}
        >
          {done ? (
            <><Check size={18} />บันทึกแล้ว</>
          ) : saving ? (
            <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
          ) : (
            "บันทึก"
          )}
        </button>
      </div>
    </div>
  );
}
