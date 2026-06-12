import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import AuthGate from "@/components/AuthGate";
import { getGasUrl } from "@/utils/storage";
import { ArrowLeft, Copy, Check } from "lucide-react";

export default function ShortcutsPage() {
  return (
    <>
      <Head><title>ตั้งค่า iOS Shortcut — NotiWallet</title></Head>
      <AuthGate>{(user) => <ShortcutsContent user={user} />}</AuthGate>
    </>
  );
}

function CopyBlock({ label, value }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <div className="glass mt-1">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.06]">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs pressable text-lime-400 hover:text-lime-300"
          aria-label={`คัดลอก ${label}`}
        >
          {copied ? <><Check size={12} />คัดลอกแล้ว</> : <><Copy size={12} />คัดลอก</>}
        </button>
      </div>
      <p className="font-mono text-xs text-slate-300 px-3 py-2.5 break-all select-all">{value}</p>
    </div>
  );
}

function Step({ n, title, children }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-7 h-7 rounded-full bg-lime-400/20 border border-lime-400/30 flex items-center justify-center shrink-0">
          <span className="text-lime-400 text-xs font-bold">{n}</span>
        </div>
        <div className="w-px flex-1 bg-white/[0.06] mt-2" />
      </div>
      <div className="pb-6 flex-1 min-w-0">
        <p className="font-semibold text-slate-200 text-sm mb-2">{title}</p>
        <div className="text-xs text-slate-400 space-y-2">{children}</div>
      </div>
    </div>
  );
}

function ShortcutsContent({ user }) {
  const router = useRouter();
  const [gasUrl, setGasUrlState] = useState("");
  const appOrigin = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    setGasUrlState(getGasUrl());
  }, []);

  const payloadTemplate = JSON.stringify({
    action: "ingestNotification",
    userId: user.uid,
    rawText: "<<Notification Content>>",
    capturedAt: "<<Current Date>>",
  }, null, 2);

  const redirectTemplate =
    `${appOrigin}/quick-confirm` +
    `?amount=<<parsed.amount>>` +
    `&account_id=<<parsed.account_id>>` +
    `&date=<<parsed.date>>` +
    `&recipient=<<parsed.recipient>>` +
    `&dedup_hash=<<parsed.dedup_hash>>` +
    `&duplicate=<<parsed.duplicate>>`;

  return (
    <div className="min-h-dvh pb-16">
      <header className="sticky top-0 z-20 bg-[#0C0C0A]/95 backdrop-blur-sm border-b border-white/[0.06] px-4">
        <div className="flex items-center h-14 gap-3 max-w-lg mx-auto">
          <button onClick={() => router.back()} className="btn-ghost p-2 -ml-2" aria-label="กลับ">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display font-semibold text-slate-100">ตั้งค่า iOS Shortcut</h1>
        </div>
      </header>

      <main className="px-4 pt-4 max-w-lg mx-auto">
        {/* Intro */}
        <div className="glass p-4 mb-6 border-lime-400/15 bg-lime-400/[0.04]">
          <p className="text-sm text-slate-300 leading-relaxed">
            iOS Shortcuts Automation จะจับข้อความแจ้งเตือนจากแอปธนาคาร ส่งไปให้ Gemini วิเคราะห์ยอด แล้วเปิดหน้า{" "}
            <span className="text-lime-300 font-medium">quick-confirm</span>{" "}
            พร้อมข้อมูล pre-fill ให้คุณแตะยืนยันแค่ 2 ครั้ง
          </p>
        </div>

        {/* Steps */}
        <div>
          {/* Step 0 — prerequisites */}
          <Step n="0" title="ข้อมูลที่ต้องใช้">
            <p>เก็บค่าทั้งสองนี้ไว้ใช้ในขั้นตอนถัดไป</p>
            <div className="space-y-1.5">
              <p className="text-slate-500">GAS Web App URL</p>
              {gasUrl ? (
                <CopyBlock label="GAS URL" value={gasUrl} />
              ) : (
                <div className="glass px-3 py-2 text-lime-400 text-xs">
                  ยังไม่ได้ตั้งค่า NEXT_PUBLIC_GAS_WEBAPP_URL
                </div>
              )}
              <p className="text-slate-500 mt-3">User ID (Firebase UID ของคุณ)</p>
              <CopyBlock label="User ID" value={user.uid} />
            </div>
          </Step>

          {/* Step 1 — create automation */}
          <Step n="1" title="สร้าง Automation ใน Shortcuts">
            <p>เปิดแอป <span className="text-slate-200 font-medium">Shortcuts</span> → แท็บ <span className="text-slate-200 font-medium">Automation</span> → <span className="text-slate-200">+</span> → <span className="text-slate-200 font-medium">App</span></p>
            <p className="mt-1">เลือกแอปธนาคาร (Kbank, TrueMoney ฯลฯ) ที่ส่ง push notification แล้วติ๊ก <span className="text-slate-200 font-medium">Notification Received</span></p>
            <p className="mt-1 text-lime-400/80">ปิด &ldquo;Ask Before Running&rdquo; เพื่อให้ทำงานอัตโนมัติ (iOS 17+: ติ๊ก &ldquo;Run Immediately&rdquo;)</p>
          </Step>

          {/* Step 2 — text variable */}
          <Step n="2" title="รับข้อความ notification">
            <p>เพิ่ม action: <span className="text-slate-200 font-medium">Text</span> — ใส่ค่า <span className="text-slate-200 font-medium">Notification Content</span> (แตะ magic variable)</p>
            <p className="mt-1 text-slate-500">ค่านี้คือ rawText ที่จะส่งไป GAS</p>
          </Step>

          {/* Step 3 — POST to GAS */}
          <Step n="3" title="POST ไปยัง GAS Web App">
            <p>เพิ่ม action: <span className="text-slate-200 font-medium">Get Contents of URL</span></p>
            <ul className="space-y-1 mt-1">
              <li>• URL: ค่า GAS URL จาก Step 0</li>
              <li>• Method: <span className="text-slate-200">POST</span></li>
              <li>• Request Body: <span className="text-slate-200">JSON</span></li>
            </ul>
            <p className="mt-2 text-slate-500">Body ที่ต้องส่ง (แทน <code className="text-lime-400/80">&lt;&lt;…&gt;&gt;</code> ด้วย magic variable):</p>
            <CopyBlock label="JSON Payload" value={payloadTemplate} />
            <div className="mt-2 space-y-1 text-slate-500">
              <p>• <code className="text-slate-300">rawText</code>: magic variable <span className="text-slate-200 font-medium">Provided Input</span> จาก Step 2</p>
              <p>• <code className="text-slate-300">capturedAt</code>: magic variable <span className="text-slate-200 font-medium">Current Date</span> → format ISO 8601</p>
              <p>• <code className="text-slate-300">userId</code>: ค่า User ID จาก Step 0 (hardcode)</p>
            </div>
          </Step>

          {/* Step 4 — parse response */}
          <Step n="4" title="แตก JSON response">
            <p>เพิ่ม action: <span className="text-slate-200 font-medium">Get Dictionary Value</span></p>
            <ul className="space-y-1 mt-1">
              <li>• Key: <code className="text-slate-200">parsed</code></li>
              <li>• Dictionary: ผลลัพธ์จาก Step 3</li>
            </ul>
            <p className="mt-2 text-slate-500">ได้ dictionary ที่มีคีย์: <code className="text-slate-300">amount, account_id, date, recipient, dedup_hash, duplicate</code></p>
          </Step>

          {/* Step 5 — open URL */}
          <Step n="5" title="เปิด quick-confirm">
            <p>เพิ่ม action: <span className="text-slate-200 font-medium">Open URLs</span></p>
            <p className="mt-1 text-slate-500">URL ที่ต้องสร้าง (ต่อ query string จาก dictionary):</p>
            <CopyBlock label="URL Pattern" value={redirectTemplate} />
            <p className="mt-2 text-slate-500">แต่ละ <code className="text-lime-400/80">&lt;&lt;parsed.xxx&gt;&gt;</code> คือ <span className="text-slate-200 font-medium">Get Dictionary Value</span> ดึง key นั้นออกมาจากผลลัพธ์ Step 4</p>
          </Step>

          {/* Step 6 — test */}
          <Step n="6" title="ทดสอบ">
            <p>รัน Automation ด้วยตนเอง 1 ครั้งก่อน โดยใช้ข้อความตัวอย่าง เช่น:</p>
            <CopyBlock
              label="ตัวอย่าง notification"
              value="K PLUS: รายการโอนเงิน 350.00 บาท วันที่ 12/06/69 เวลา 19:20 น."
            />
            <p className="mt-2">หน้า quick-confirm ควรเปิดโดยอัตโนมัติพร้อมยอด ฿350 pre-fill แล้ว</p>
            <p className="mt-1 text-slate-500">ถ้าเห็น &ldquo;รายการนี้บันทึกแล้ว&rdquo; = dedup ทำงานถูกต้อง (ลองใหม่ด้วยยอด/เวลาต่างกัน)</p>
          </Step>
        </div>
      </main>
    </div>
  );
}
