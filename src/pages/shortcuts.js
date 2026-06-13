import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import AuthGate from "@/components/AuthGate";
import { getGasUrl } from "@/utils/storage";
import { ArrowLeft, Copy, Check, ExternalLink } from "lucide-react";

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
    rawText: "<<Clipboard>>",
    capturedAt: "<<Current Date>>",
  }, null, 2);

  const quickConfirmBase = `${appOrigin}/quick-confirm`;

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
        {/* Quick install card */}
        <div className="glass p-4 mb-4 border-amber-400/20 bg-amber-400/[0.04]">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">ติดตั้ง Shortcut สำเร็จรูป</p>
          <a
            href="https://www.icloud.com/shortcuts/4da3406b3466462ba405ab4cbc7525c3"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-3 rounded-xl bg-lime-400/10 border border-lime-400/30 text-lime-300 text-sm pressable mb-4"
          >
            <span className="font-medium">เพิ่ม Shortcut ลง iPhone</span>
            <ExternalLink size={15} />
          </a>
          <p className="text-xs text-slate-400 mb-1">
            หลังติดตั้งแล้ว แก้ค่าเดียวในขั้นตอน <span className="text-slate-300 font-medium">Get Contents of URL</span>{" "}
            — เปลี่ยนแค่ <code className="text-amber-300/90">userId</code> เป็นค่าของคุณ:
          </p>
          <CopyBlock label="User ID ของคุณ" value={user.uid} />
          <p className="text-xs text-slate-500 mt-3 mb-1.5">แก้ตรงนี้ใน Shortcut:</p>
          <img
            src="/icons/userId.jpg"
            alt="ตำแหน่งช่อง userId ใน iOS Shortcuts"
            className="w-full rounded-xl border border-white/10"
          />
        </div>

        {/* Intro */}
        <div className="glass p-4 mb-4 border-lime-400/15 bg-lime-400/[0.04]">
          <p className="text-sm text-slate-300 leading-relaxed">
            แอปธนาคารไทยส่วนใหญ่ block trigger อัตโนมัติของ iOS Shortcuts ได้ วิธีนี้ใช้{" "}
            <span className="text-lime-300 font-medium">Clipboard</span>{" "}
            แทน — copy ข้อความ notification แล้วแตะ shortcut 1 ครั้ง หน้า{" "}
            <span className="text-lime-300 font-medium">quick-confirm</span>{" "}
            จะเปิดพร้อม pre-fill ยอดเงินให้ทันที
          </p>
        </div>

        {/* Usage flow */}
        <div className="glass p-4 mb-6">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">วิธีใช้งาน (หลังตั้งค่าแล้ว)</p>
          <div className="flex items-start gap-3">
            {[
              { n: "1", text: "Long-press notification จากธนาคาร → Copy" },
              { n: "2", text: "แตะไอคอน NotiWallet Shortcut บน Home Screen" },
              { n: "3", text: "หน้า quick-confirm เปิดพร้อมยอดเงิน pre-fill" },
            ].map(({ n, text }) => (
              <div key={n} className="flex-1 flex flex-col items-center gap-1.5 text-center">
                <div className="w-6 h-6 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center">
                  <span className="text-amber-400 text-[10px] font-bold">{n}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{text}</p>
              </div>
            ))}
          </div>
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

          {/* Step 1 — create shortcut */}
          <Step n="1" title="สร้าง Shortcut ใหม่">
            <p>เปิดแอป <span className="text-slate-200 font-medium">Shortcuts</span> → แท็บ <span className="text-slate-200 font-medium">Shortcuts</span> (ไม่ใช่ Automation) → แตะ <span className="text-slate-200 font-medium">+</span> มุมขวาบน</p>
            <p className="mt-1 text-slate-500">ตั้งชื่อ Shortcut ว่า <span className="text-slate-300">NotiWallet</span> เพื่อให้หาง่าย</p>
          </Step>

          {/* Step 2 — get clipboard */}
          <Step n="2" title="ดึงข้อความจาก Clipboard">
            <p>แตะ <span className="text-slate-200 font-medium">Add Action</span> → ค้นหา <span className="text-slate-200 font-medium">Get Clipboard</span> → แตะเพิ่ม</p>
            <p className="mt-1 text-slate-500">action นี้ดึงข้อความที่ copy ไว้ล่าสุดมาใช้เป็น rawText — ไม่ต้องตั้งค่าอะไรเพิ่ม</p>
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
              <p>• <code className="text-slate-300">rawText</code>: magic variable <span className="text-slate-200 font-medium">Clipboard</span> (ผลลัพธ์จาก Step 2)</p>
              <p>• <code className="text-slate-300">capturedAt</code>: magic variable <span className="text-slate-200 font-medium">Current Date</span> → format ISO 8601 (เปิด Include Time ไว้)</p>
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
            <p className="mt-2 text-amber-400/80">ข้อความในบล็อก iOS อาจแสดงค่า default เช่น &ldquo;ปุ่ม&rdquo; — แตะตรงนั้นแล้วเปลี่ยนเป็น <code className="text-amber-300">parsed</code></p>
            <p className="mt-1 text-slate-500">ได้ dictionary ที่มีคีย์: <code className="text-slate-300">amount, account_id, date, recipient, dedup_hash, duplicate</code></p>
          </Step>

          {/* Step 5 — open URL */}
          <Step n="5" title="เปิด quick-confirm">
            <p>เพิ่ม action: <span className="text-slate-200 font-medium">Open URLs</span></p>
            <p className="mt-2 text-amber-400/80">iOS ไม่แปลง <code>&lt;&lt;…&gt;&gt;</code> จากการ paste — ต้องแทรกตัวแปรด้วยมือทีละตัว</p>
            <p className="mt-2 text-slate-500">วิธีสร้าง URL:</p>
            <ol className="mt-1 space-y-2 list-none">
              <li><span className="text-slate-300 font-medium">1.</span> พิมพ์ base URL ลงในช่อง URL:</li>
            </ol>
            <CopyBlock label="Base URL" value={quickConfirmBase} />
            <ol className="mt-2 space-y-1.5 list-none text-slate-500">
              <li><span className="text-slate-300 font-medium">2.</span> พิมพ์ <code className="text-slate-300">?amount=</code> ต่อท้าย → แตะแถบตัวแปรเหนือคีย์บอร์ด → เลือกผลลัพธ์จาก Step 4 → แตะตัวแปรนั้น → ตั้ง Key: <code className="text-slate-300">amount</code></li>
              <li><span className="text-slate-300 font-medium">3.</span> ทำซ้ำกับทุก field โดยพิมพ์ <code className="text-slate-300">&amp;key=</code> แล้วแทรกตัวแปร parsed พร้อม key ตามตาราง:</li>
            </ol>
            <div className="mt-2 glass px-3 py-2 space-y-1">
              {[
                ["account_id", "account_id"],
                ["date", "date"],
                ["recipient", "recipient"],
                ["dedup_hash", "dedup_hash"],
                ["duplicate", "duplicate"],
              ].map(([param, key]) => (
                <div key={param} className="flex items-center gap-2 text-xs">
                  <code className="text-slate-400">&amp;{param}=</code>
                  <span className="text-slate-600">→</span>
                  <span className="text-slate-300">parsed</span>
                  <span className="text-slate-600">→ Key:</span>
                  <code className="text-lime-400/80">{key}</code>
                </div>
              ))}
            </div>
          </Step>

          {/* Step 6 — add to home screen */}
          <Step n="6" title="เพิ่มลง Home Screen">
            <p>ใน Shortcuts → แตะ Shortcut NotiWallet ค้างไว้ → <span className="text-slate-200 font-medium">Share</span> → <span className="text-slate-200 font-medium">Add to Home Screen</span></p>
            <p className="mt-1 text-slate-500">ไอคอนจะอยู่บน Home Screen แตะได้ทันทีหลัง copy notification</p>
            <p className="mt-2 text-slate-500">ต้องการแชร์ให้คนอื่น: แตะ Shortcut ค้างไว้ → Share → <span className="text-slate-300 font-medium">Copy iCloud Link</span> ส่งลิงก์ให้เขากด Add Shortcut แล้วให้เขาแก้ <code className="text-slate-300">userId</code> ใน Step 3 เป็นของตัวเองก็ใช้ได้เลย</p>
          </Step>

          {/* Step 7 — test */}
          <Step n="7" title="ทดสอบ">
            <p>Copy ข้อความตัวอย่างนี้ก่อน แล้วแตะ Shortcut:</p>
            <CopyBlock
              label="ตัวอย่าง notification"
              value="K PLUS: รายการโอนเงิน 350.00 บาท วันที่ 12/06/69 เวลา 19:20 น."
            />
            <p className="mt-2">หน้า quick-confirm ควรเปิดพร้อมยอด <span className="text-slate-200 font-medium">฿350</span> pre-fill แล้ว</p>
            <p className="mt-1 text-slate-500">ถ้าเห็น &ldquo;รายการนี้บันทึกแล้ว&rdquo; = dedup ทำงานถูกต้อง (ลองใหม่ด้วยยอด/เวลาต่างกัน)</p>
          </Step>
        </div>
      </main>
    </div>
  );
}
