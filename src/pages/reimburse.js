import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import AuthGate from "@/components/AuthGate";
import BottomNav from "@/components/BottomNav";
import { getTransactions, createBatch, markBatchPaid } from "@/services/gas.service";
import { generateReimburseText, toThaiShortDate } from "@/utils/reimburseText";
import { ArrowLeft, Copy, Check, CheckCircle2 } from "lucide-react";

export default function ReimbursePage() {
  return (
    <>
      <Head><title>รอเบิก — NotiWallet</title></Head>
      <AuthGate>{(user) => <ReimburseContent user={user} />}</AuthGate>
    </>
  );
}

function ReimburseContent({ user }) {
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [closing, setClosing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [batchTitle, setBatchTitle] = useState(() => {
    const now = new Date();
    const m = now.toLocaleString("th-TH", { month: "short" });
    const y = (now.getFullYear() + 543) % 100;
    return `เบิก ${m} ${y}`;
  });

  const month = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    getTransactions(user.uid, month)
      .then((d) => {
        const all = d.transactions ?? [];
        setTransactions(all.filter((t) => t.reimbursable));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.uid, month]);

  const pending = transactions.filter((t) => !t.batch_id);
  const batches = [...new Set(transactions.filter((t) => t.batch_id).map((t) => t.batch_id))]
    .map((id) => ({
      id,
      items: transactions.filter((t) => t.batch_id === id),
    }));

  const selectedItems = pending.filter((t) => selected.has(t.id));
  const selectedTotal = selectedItems.reduce((s, t) => s + Number(t.amount), 0);

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(pending.map((t) => t.id)));
  }

  async function closeBatch() {
    if (selected.size === 0) return;
    setClosing(true);
    try {
      await createBatch(user.uid, [...selected], batchTitle);
      setLoading(true);
      setSelected(new Set());
      const d = await getTransactions(user.uid, month);
      setTransactions((d.transactions ?? []).filter((t) => t.reimbursable));
    } catch {
      setClosing(false);
    } finally {
      setClosing(false);
      setLoading(false);
    }
  }

  function copyBatchText(items) {
    const text = generateReimburseText(items);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleMarkPaid(batchId) {
    await markBatchPaid(user.uid, batchId);
    setLoading(true);
    const d = await getTransactions(user.uid, month);
    setTransactions((d.transactions ?? []).filter((t) => t.reimbursable));
    setLoading(false);
  }

  return (
    <div className="min-h-dvh pb-28">
      <header className="sticky top-0 z-20 bg-[#0C0C0A]/95 backdrop-blur-sm border-b border-white/[0.06] px-4">
        <div className="flex items-center h-14 gap-3 max-w-lg mx-auto">
          <button onClick={() => router.back()} className="btn-ghost p-2 -ml-2" aria-label="กลับ">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display font-semibold text-slate-100">รอเบิก</h1>
        </div>
      </header>

      <main className="px-4 pt-4 max-w-lg mx-auto space-y-6">
        {loading ? (
          <div className="flex justify-center pt-10">
            <div className="w-8 h-8 border-2 border-lime-400/30 border-t-lime-400 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Pending section */}
            {pending.length > 0 ? (
              <section aria-label="รายการรอเบิก">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-slate-300">รายการรอเบิก</h2>
                  <button onClick={selectAll} className="btn-ghost text-lime-400 hover:text-lime-300 text-xs">
                    เลือกทั้งหมด
                  </button>
                </div>

                <div className="space-y-2">
                  {pending.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => toggleSelect(t.id)}
                      className={`w-full text-left glass pressable px-4 py-3 flex items-center gap-3 transition-colors duration-150 ${
                        selected.has(t.id) ? "border-lime-400/40 bg-lime-400/5" : ""
                      }`}
                      aria-pressed={selected.has(t.id)}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-150 ${
                        selected.has(t.id) ? "border-lime-400 bg-lime-400" : "border-white/20"
                      }`}>
                        {selected.has(t.id) && <Check size={10} className="text-gray-900" strokeWidth={3} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">
                          {t.note || t.recipient || t.category}
                        </p>
                        <p className="text-xs text-slate-500">{toThaiShortDate(t.date)}</p>
                      </div>
                      <span className="amount text-sm font-semibold text-lime-300 shrink-0">
                        ฿{Number(t.amount).toLocaleString("th-TH")}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Close batch panel */}
                {selected.size > 0 && (
                  <div className="glass mt-4 p-4 space-y-3 animate-scale-in border-lime-400/20">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400">{selected.size} รายการ</p>
                      <p className="amount text-lg font-bold text-lime-300">
                        ฿{selectedTotal.toLocaleString("th-TH")}
                      </p>
                    </div>
                    <input
                      type="text"
                      value={batchTitle}
                      onChange={(e) => setBatchTitle(e.target.value)}
                      placeholder="ชื่อรอบเบิก"
                      className="field text-sm"
                      aria-label="ชื่อรอบเบิก"
                    />
                    <button
                      onClick={closeBatch}
                      disabled={closing}
                      className="btn-primary flex items-center justify-center gap-2"
                      aria-busy={closing}
                    >
                      {closing ? (
                        <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                      ) : (
                        "ปิดรอบ"
                      )}
                    </button>
                  </div>
                )}
              </section>
            ) : (
              <div className="glass p-8 text-center">
                <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">ไม่มีรายการรอเบิก</p>
              </div>
            )}

            {/* Closed batches */}
            {batches.length > 0 && (
              <section aria-label="รอบที่ปิดแล้ว">
                <h2 className="text-sm font-semibold text-slate-300 mb-3">รอบที่ปิดแล้ว</h2>
                <div className="space-y-3">
                  {batches.map((batch) => {
                    const batchTotal = batch.items.reduce((s, t) => s + Number(t.amount), 0);
                    return (
                      <div key={batch.id} className="glass p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-200">{batch.id}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{batch.items.length} รายการ</p>
                          </div>
                          <p className="amount text-lg font-bold text-lime-300">
                            ฿{batchTotal.toLocaleString("th-TH")}
                          </p>
                        </div>

                        {/* Batch items */}
                        <div className="space-y-1.5 border-t border-white/[0.06] pt-3">
                          {batch.items.map((t) => (
                            <div key={t.id} className="flex justify-between text-xs">
                              <span className="text-slate-400 truncate">
                                {t.note || t.recipient || t.category}
                                <span className="text-slate-600 ml-1.5">{toThaiShortDate(t.date)}</span>
                              </span>
                              <span className="amount text-slate-300 shrink-0 ml-2">
                                {Number(t.amount).toLocaleString("th-TH")}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => copyBatchText(batch.items)}
                            className="flex-1 glass pressable py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-slate-300 hover:text-slate-100 border-white/10"
                            aria-label="คัดลอกข้อความเบิก"
                          >
                            {copied ? (
                              <><Check size={15} className="text-emerald-400" />คัดลอกแล้ว</>
                            ) : (
                              <><Copy size={15} />ก็อปส่ง LINE</>
                            )}
                          </button>
                          <button
                            onClick={() => handleMarkPaid(batch.id)}
                            className="flex-1 glass pressable py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 border-emerald-500/20"
                            aria-label="ทำเครื่องหมายว่าได้รับเงินแล้ว"
                          >
                            <CheckCircle2 size={15} />
                            ได้แล้ว
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
