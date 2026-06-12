import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { saveGasUrl, getGasUrl, getOrCreateLocalUserId } from "@/utils/storage";
import { IS_FIREBASE_MODE } from "@/services/auth.service";
import { Wallet, Copy, Check } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [gasUrl, setGasUrl] = useState("");
  const [localUserId, setLocalUserId] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Pre-fill if an env-var URL exists (developer mode)
    const existing = getGasUrl();
    if (existing) setGasUrl(existing);
    if (!IS_FIREBASE_MODE) {
      setLocalUserId(getOrCreateLocalUserId());
    }
  }, []);

  const isValidUrl = gasUrl.trim().startsWith("https://");

  function handleSave() {
    if (!isValidUrl) return;
    saveGasUrl(gasUrl.trim());
    router.replace("/");
  }

  function copyUserId() {
    navigator.clipboard.writeText(localUserId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12 gap-8">
      <Head><title>ตั้งค่า — NotiWallet</title></Head>

      {/* Branding */}
      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-3xl bg-lime-400/15 border border-lime-400/20 flex items-center justify-center">
          <Wallet size={36} className="text-lime-400" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-slate-100">NotiWallet</h1>
          <p className="text-slate-400 text-sm mt-1">ตั้งค่าเพื่อเริ่มใช้งาน</p>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-6">
        {/* GAS URL */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-200">
            GAS Web App URL
          </label>
          <p className="text-xs text-slate-500 leading-relaxed">
            Deploy <code className="text-lime-400/80">Code.js</code> ใน Google Apps Script แล้ว copy URL ที่ได้ มาวางที่นี่
          </p>
          <textarea
            value={gasUrl}
            onChange={(e) => setGasUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/…/exec"
            className="field resize-none text-xs h-20 leading-relaxed"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="GAS Web App URL"
          />
          {gasUrl && !isValidUrl && (
            <p className="text-xs text-red-400">URL ต้องขึ้นต้นด้วย https://</p>
          )}
        </div>

        {/* Single-user mode: show User ID */}
        {!IS_FIREBASE_MODE && localUserId && (
          <div className="glass p-4 border-lime-400/15 bg-lime-400/[0.04] space-y-2">
            <p className="text-xs font-semibold text-lime-400">User ID ของคุณ</p>
            <div className="flex items-center gap-2">
              <p className="font-mono text-xs text-slate-300 break-all flex-1">{localUserId}</p>
              <button
                onClick={copyUserId}
                className="shrink-0 pressable p-1.5 text-slate-400 hover:text-lime-400"
                aria-label="คัดลอก User ID"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              บันทึก ID นี้ไว้สำหรับการตั้งค่า iOS Shortcut — ตั้งค่า → iOS Shortcut
            </p>
          </div>
        )}

        {/* Single-user mode info badge */}
        {!IS_FIREBASE_MODE && (
          <div className="glass px-4 py-3 border-slate-500/10">
            <p className="text-xs text-slate-400">
              โหมดนี้ใช้งานได้โดยไม่ต้องมีบัญชี Google — ข้อมูลผูกกับอุปกรณ์นี้
            </p>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!isValidUrl}
          className="btn-primary w-full"
          aria-label="เริ่มใช้งาน NotiWallet"
        >
          เริ่มใช้งาน
        </button>
      </div>
    </div>
  );
}
