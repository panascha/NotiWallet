import { useState, useRef } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import AuthGate from "@/components/AuthGate";
import BottomNav from "@/components/BottomNav";
import { scanSlip, createTransaction } from "@/services/gas.service";
import { ArrowLeft, Camera, Check, RefreshCw } from "lucide-react";

const ACCOUNTS = [
  { id: "acc_kbank", label: "Kbank" },
  { id: "acc_truemoney", label: "Truemoney" },
  { id: "acc_paotang", label: "เป๋าตัง" },
];

export default function ScanPage() {
  return (
    <>
      <Head><title>สแกนสลิป — NotiWallet</title></Head>
      <AuthGate>{(user) => <ScanContent user={user} />}</AuthGate>
    </>
  );
}

function ScanContent({ user }) {
  const router = useRouter();
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result.split(",")[1];
      setPreview(ev.target.result);
      setScanning(true);
      setError("");
      setResult(null);
      try {
        const res = await scanSlip(user.uid, base64);
        setResult(res.parsed ?? res);
      } catch {
        setError("สแกนไม่สำเร็จ ลองใหม่อีกครั้ง");
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    try {
      await createTransaction(user.uid, {
        ...result,
        source: "ocr",
        type: "expense",
        date: result.date || new Date().toISOString(),
      });
      setDone(true);
      setTimeout(() => router.push("/"), 800);
    } catch {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-dvh pb-28">
      <header className="sticky top-0 z-20 bg-[#080812]/80 backdrop-blur-xl border-b border-white/[0.06] px-4">
        <div className="flex items-center h-14 gap-3 max-w-lg mx-auto">
          <button onClick={() => router.back()} className="btn-ghost p-2 -ml-2" aria-label="กลับ">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display font-semibold text-slate-100">สแกนสลิป</h1>
        </div>
      </header>

      <main className="px-4 pt-6 max-w-lg mx-auto space-y-5">
        {/* Camera / image picker */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFile}
          aria-label="เลือกรูปสลิป"
        />

        {!preview ? (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full glass pressable flex flex-col items-center justify-center gap-4 py-16 border-dashed border-white/20 hover:border-amber-500/40 transition-colors duration-200"
            aria-label="ถ่ายรูปหรือเลือกรูปสลิป"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Camera size={28} className="text-amber-400" strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <p className="text-slate-300 font-medium">ถ่ายรูปสลิป</p>
              <p className="text-slate-500 text-sm mt-1">หรือเลือกจากคลังรูป</p>
            </div>
          </button>
        ) : (
          <div className="space-y-4 animate-fade-up">
            {/* Preview */}
            <div className="glass overflow-hidden">
              <img src={preview} alt="สลิปที่อัปโหลด" className="w-full max-h-56 object-cover" />
            </div>

            {/* Rescan button */}
            <button
              onClick={() => { setPreview(null); setResult(null); setError(""); }}
              className="btn-ghost w-full flex items-center justify-center gap-2"
            >
              <RefreshCw size={15} />
              สแกนใหม่
            </button>

            {/* Scanning state */}
            {scanning && (
              <div className="glass p-6 flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                <p className="text-slate-400 text-sm">กำลังอ่านข้อมูล...</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="glass p-4 border-red-500/20 bg-red-500/5">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="glass p-5 space-y-4 animate-scale-in">
                <p className="text-xs text-slate-400 uppercase tracking-wider">ข้อมูลจากสลิป</p>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">ยอดเงิน</span>
                    <span className="amount text-2xl font-bold text-slate-100">
                      ฿{Number(result.amount || 0).toLocaleString("th-TH")}
                    </span>
                  </div>
                  {result.recipient && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">ผู้รับ</span>
                      <span className="text-slate-200 text-sm">{result.recipient}</span>
                    </div>
                  )}
                  {result.bank && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">ธนาคาร</span>
                      <span className="text-slate-200 text-sm">{result.bank}</span>
                    </div>
                  )}
                  {result.category && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">หมวด</span>
                      <span className="text-slate-200 text-sm">{result.category}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary flex items-center justify-center gap-2"
                  aria-busy={saving}
                >
                  {done ? (
                    <><Check size={18} />บันทึกแล้ว</>
                  ) : saving ? (
                    <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                  ) : (
                    "บันทึกรายการนี้"
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
