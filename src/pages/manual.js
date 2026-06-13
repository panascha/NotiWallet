import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import AuthGate from "@/components/AuthGate";
import BottomNav from "@/components/BottomNav";
import { createTransaction, updateTransaction, deleteTransaction } from "@/services/gas.service";
import { getCategories, getAccounts, getCachedTxns, setCachedTxns } from "@/utils/storage";
import { ArrowLeft, Check, Trash2 } from "lucide-react";

export default function ManualPage() {
  return (
    <>
      <Head><title>บันทึกรายการ — NotiWallet</title></Head>
      <AuthGate>{(user) => <ManualForm user={user} />}</AuthGate>
    </>
  );
}

function ManualForm({ user }) {
  const router = useRouter();
  const { edit: editId } = router.query;
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState("");
  const [account, setAccount] = useState("");
  const [note, setNote] = useState("");
  const [recipient, setRecipient] = useState("");
  const [reimbursable, setReimbursable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [editTx, setEditTx] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const cats = getCategories();
    const accs = getAccounts();
    setCategories(cats);
    setAccounts(accs);
    if (!editId) setAccount(accs[0]?.id ?? "");
  }, []);

  useEffect(() => {
    if (!editId || !router.isReady) return;
    const prefix = `nw_txns_${user.uid}_`;
    const allKeys = Object.keys(localStorage).filter((k) => k.startsWith(prefix));
    for (const key of allKeys) {
      try {
        const cached = JSON.parse(localStorage.getItem(key) || "null");
        const tx = cached?.transactions?.find((t) => t.id === editId);
        if (tx) {
          setEditTx(tx);
          setType(tx.type);
          setAmount(String(tx.amount));
          setDate(tx.date.slice(0, 10));
          setCategory(tx.category);
          setAccount(tx.account_id || "");
          setNote(tx.note || "");
          setRecipient(tx.recipient || "");
          setReimbursable(tx.reimbursable);
          break;
        }
      } catch {}
    }
  }, [editId, router.isReady]);

  async function handleSave() {
    if (!amount || !category) return;
    setSaving(true);
    try {
      const data = {
        type,
        amount: Number(amount),
        date: new Date(date).toISOString(),
        category,
        account_id: account,
        note,
        recipient,
        reimbursable,
      };
      if (editId) {
        await updateTransaction(user.uid, editId, data);
        const month = data.date.slice(0, 7);
        const cached = getCachedTxns(user.uid, month);
        if (cached) {
          setCachedTxns(user.uid, month, cached.transactions.map((t) =>
            t.id === editId ? { ...t, ...data } : t
          ));
        }
      } else {
        await createTransaction(user.uid, { ...data, source: "manual" });
      }
      setDone(true);
      setTimeout(() => router.push("/"), 800);
    } catch {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteTransaction(user.uid, editId);
      const month = editTx.date.slice(0, 7);
      const cached = getCachedTxns(user.uid, month);
      if (cached) {
        setCachedTxns(user.uid, month, cached.transactions.filter((t) => t.id !== editId));
      }
      router.push("/");
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="min-h-dvh pb-28">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#0C0C0A]/95 backdrop-blur-sm border-b border-white/[0.06] px-4">
        <div className="flex items-center h-14 gap-3 max-w-lg mx-auto">
          <button onClick={() => router.back()} className="btn-ghost p-2 -ml-2" aria-label="กลับ">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display font-semibold text-slate-100">{editId ? "แก้ไขรายการ" : "บันทึกรายการ"}</h1>
        </div>
      </header>

      <main className="px-4 pt-4 max-w-lg mx-auto space-y-5">
        {/* Type toggle */}
        <div className="glass p-1.5 flex gap-1">
          {["expense", "income"].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold pressable transition-all duration-200 ${
                type === t
                  ? t === "expense"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {t === "expense" ? "รายจ่าย" : "รายรับ"}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs text-slate-400 mb-2 font-medium">ยอดเงิน *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono">฿</span>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="field pl-8 amount text-2xl font-semibold"
              autoFocus
              aria-label="จำนวนเงิน"
              required
            />
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs text-slate-400 mb-2 font-medium">วันที่ *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="field"
            aria-label="วันที่"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs text-slate-400 mb-2 font-medium">หมวดหมู่ *</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`chip ${category === c.id ? "chip-active" : ""}`}
                aria-pressed={category === c.id}
              >
                {c.emoji && <span className="mr-1" aria-hidden="true">{c.emoji}</span>}
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Account */}
        <div>
          <label className="block text-xs text-slate-400 mb-2 font-medium">บัญชี</label>
          <div className="flex flex-wrap gap-2">
            {accounts.map((a) => (
              <button
                key={a.id}
                onClick={() => setAccount(a.id)}
                className={`chip ${account === a.id ? "chip-active" : ""}`}
                aria-pressed={account === a.id}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recipient / Note */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-2 font-medium">ร้าน / ผู้รับ</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="เช่น ร้านกาแฟ"
              className="field"
              aria-label="ร้านหรือผู้รับเงิน"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-2 font-medium">โน้ต</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม"
              className="field"
              aria-label="โน้ต"
            />
          </div>
        </div>

        {/* Reimbursable toggle */}
        <button
          onClick={() => setReimbursable((v) => !v)}
          className={`w-full glass pressable p-4 flex items-center justify-between transition-colors duration-200 ${
            reimbursable ? "border-lime-400/30 bg-lime-400/5" : ""
          }`}
          aria-pressed={reimbursable}
          role="switch"
        >
          <div>
            <p className={`text-sm font-medium ${reimbursable ? "text-lime-300" : "text-slate-300"}`}>
              รอเบิกคืน/รอเพื่อนโอนคืน
            </p>
            <p className="text-xs text-slate-500 mt-0.5">จ่ายเองก่อน รอคนอื่นโอนคืน</p>
          </div>
          <div className={`w-12 h-6 rounded-full border transition-all duration-200 flex items-center px-0.5 ${
            reimbursable
              ? "bg-lime-400 border-lime-400"
              : "bg-white/10 border-white/20"
          }`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
              reimbursable ? "translate-x-6" : "translate-x-0"
            }`} />
          </div>
        </button>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!amount || !category || saving}
          className="btn-primary flex items-center justify-center gap-2"
          aria-busy={saving}
        >
          {done ? (
            <><Check size={18} /> บันทึกแล้ว</>
          ) : saving ? (
            <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
          ) : editId ? (
            "บันทึกการแก้ไข"
          ) : (
            "บันทึก"
          )}
        </button>
        {editId && (
          <div className="pt-2 border-t border-white/[0.06]">
            {editTx?.batch_id ? (
              <p className="text-xs text-slate-500 text-center py-3">รายการนี้อยู่ใน Batch แล้ว ไม่สามารถลบได้</p>
            ) : !confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full py-3 text-sm text-red-400 pressable rounded-xl hover:bg-red-500/10 transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 size={14} />ลบรายการ
              </button>
            ) : (
              <div className="glass border border-red-500/20 p-4 space-y-3">
                <p className="text-sm text-center text-slate-300">ยืนยันลบรายการนี้?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2.5 text-sm text-slate-400 glass pressable rounded-xl"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500/80 pressable rounded-xl disabled:opacity-50"
                  >
                    {deleting ? "กำลังลบ..." : "ลบเลย"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
