import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import BottomNav from "@/components/BottomNav";
import AuthGate from "@/components/AuthGate";
import {
  getCategories, saveCategories,
  getAccounts, saveAccounts,
  getLargeExpenseThreshold, saveLargeExpenseThreshold,
} from "@/utils/storage";
import { ArrowLeft, Trash2, Plus, Smartphone, X } from "lucide-react";

export default function SettingsPage() {
  return (
    <>
      <Head><title>ตั้งค่า — NotiWallet</title></Head>
      <AuthGate>{(user) => <SettingsContent user={user} />}</AuthGate>
    </>
  );
}

function SettingsContent({ user }) {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [newCatLabel, setNewCatLabel] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("📦");
  const [newAccLabel, setNewAccLabel] = useState("");
  const [threshold, setThreshold] = useState("5000");
  const [addingKwFor, setAddingKwFor] = useState(null);
  const [newKwText, setNewKwText] = useState("");

  useEffect(() => {
    setCategories(getCategories());
    setAccounts(getAccounts());
    setThreshold(String(getLargeExpenseThreshold()));
  }, []);

  function addCategory() {
    const label = newCatLabel.trim();
    if (!label) return;
    const id = "cat_" + Date.now();
    const next = [...categories, { id, label, emoji: newCatEmoji }];
    setCategories(next);
    saveCategories(next);
    setNewCatLabel("");
    setNewCatEmoji("📦");
  }

  function deleteCategory(id) {
    const next = categories.filter((c) => c.id !== id);
    setCategories(next);
    saveCategories(next);
  }

  function addAccount() {
    const label = newAccLabel.trim();
    if (!label) return;
    const id = "acc_" + label.toLowerCase().replace(/\s+/g, "_") + "_" + Date.now();
    const next = [...accounts, { id, label }];
    setAccounts(next);
    saveAccounts(next);
    setNewAccLabel("");
  }

  function deleteAccount(id) {
    const next = accounts.filter((a) => a.id !== id);
    setAccounts(next);
    saveAccounts(next);
  }

  function addKeyword(accountId) {
    const kw = newKwText.trim();
    setAddingKwFor(null);
    setNewKwText("");
    if (!kw) return;
    const next = accounts.map((a) =>
      a.id === accountId
        ? { ...a, keywords: [...(a.keywords ?? []).filter((k) => k !== kw), kw] }
        : a
    );
    setAccounts(next);
    saveAccounts(next);
  }

  function removeKeyword(accountId, kw) {
    const next = accounts.map((a) =>
      a.id === accountId
        ? { ...a, keywords: (a.keywords ?? []).filter((k) => k !== kw) }
        : a
    );
    setAccounts(next);
    saveAccounts(next);
  }

  return (
    <div className="min-h-dvh pb-28">
      <header className="sticky top-0 z-20 bg-[#0C0C0A]/95 backdrop-blur-sm border-b border-white/[0.06] px-4">
        <div className="flex items-center h-14 gap-3 max-w-lg mx-auto">
          <button onClick={() => router.back()} className="btn-ghost p-2 -ml-2" aria-label="กลับ">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display font-semibold text-slate-100">ตั้งค่า</h1>
        </div>
      </header>

      <main className="px-4 pt-4 max-w-lg mx-auto space-y-8">

        {/* iOS Shortcut */}
        <section aria-label="iOS Shortcut">
          <button
            onClick={() => router.push("/shortcuts")}
            className="w-full glass pressable px-4 py-4 flex items-center justify-between text-left border-lime-400/15 bg-lime-400/[0.04]"
          >
            <div className="flex items-center gap-3">
              <Smartphone size={20} className="text-lime-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-200">ตั้งค่า iOS Shortcut</p>
                <p className="text-xs text-slate-500 mt-0.5">จับ notification ธนาคาร → บันทึกอัตโนมัติ</p>
              </div>
            </div>
            <span className="text-slate-600 text-lg">›</span>
          </button>
        </section>

        {/* Categories */}
        <section aria-label="จัดการหมวดหมู่">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">หมวดหมู่</h2>

          <div className="glass divide-y divide-white/[0.06]">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-xl w-7 text-center" role="img" aria-hidden="true">{c.emoji}</span>
                <span className="flex-1 text-sm text-slate-200">{c.label}</span>
                <button
                  onClick={() => deleteCategory(c.id)}
                  className="p-1.5 text-slate-600 hover:text-red-400 pressable transition-colors duration-150"
                  aria-label={`ลบหมวด ${c.label}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Add category */}
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              value={newCatEmoji}
              onChange={(e) => setNewCatEmoji(e.target.value)}
              className="field w-14 text-center text-xl px-2"
              maxLength={2}
              aria-label="emoji หมวดหมู่"
            />
            <input
              type="text"
              value={newCatLabel}
              onChange={(e) => setNewCatLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCategory()}
              placeholder="ชื่อหมวดหมู่"
              className="field flex-1"
              aria-label="ชื่อหมวดหมู่ใหม่"
            />
            <button
              onClick={addCategory}
              disabled={!newCatLabel.trim()}
              className="w-12 h-[46px] bg-lime-400 text-gray-900 rounded-xl flex items-center justify-center pressable disabled:opacity-30"
              aria-label="เพิ่มหมวดหมู่"
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          </div>
        </section>

        {/* Accounts */}
        <section aria-label="จัดการบัญชี">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">บัญชี</h2>

          <div className="space-y-2">
            {accounts.map((a) => (
              <div key={a.id} className="glass px-4 py-3 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="flex-1 text-sm text-slate-200">{a.label}</span>
                  <span className="text-xs text-slate-600 font-mono hidden sm:inline">{a.id}</span>
                  <button
                    onClick={() => deleteAccount(a.id)}
                    className="p-1.5 text-slate-600 hover:text-red-400 pressable transition-colors duration-150"
                    aria-label={`ลบบัญชี ${a.label}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {/* Keyword chips */}
                <div className="flex flex-wrap gap-1.5 items-center">
                  {(a.keywords ?? []).map((kw) => (
                    <button
                      key={kw}
                      onClick={() => removeKeyword(a.id, kw)}
                      className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-400 hover:bg-red-500/15 hover:text-red-400 pressable transition-colors duration-150"
                      aria-label={`ลบ keyword ${kw}`}
                    >
                      {kw}<X size={9} className="ml-0.5" />
                    </button>
                  ))}
                  {addingKwFor === a.id ? (
                    <input
                      type="text"
                      value={newKwText}
                      onChange={(e) => setNewKwText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addKeyword(a.id);
                        if (e.key === "Escape") { setAddingKwFor(null); setNewKwText(""); }
                      }}
                      onBlur={() => addKeyword(a.id)}
                      autoFocus
                      placeholder="keyword"
                      className="text-[10px] bg-white/[0.06] border border-lime-400/30 rounded-full px-2 py-0.5 text-lime-300 outline-none w-24"
                      aria-label="keyword ใหม่"
                    />
                  ) : (
                    <button
                      onClick={() => { setAddingKwFor(a.id); setNewKwText(""); }}
                      className="text-[10px] px-2 py-0.5 rounded-full border border-dashed border-white/20 text-slate-600 hover:text-lime-400 hover:border-lime-400/40 pressable transition-colors duration-150"
                      aria-label={`เพิ่ม keyword สำหรับ ${a.label}`}
                    >
                      + keyword
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add account */}
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              value={newAccLabel}
              onChange={(e) => setNewAccLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addAccount()}
              placeholder="ชื่อบัญชี เช่น SCB"
              className="field flex-1"
              aria-label="ชื่อบัญชีใหม่"
            />
            <button
              onClick={addAccount}
              disabled={!newAccLabel.trim()}
              className="w-12 h-[46px] bg-lime-400 text-gray-900 rounded-xl flex items-center justify-center pressable disabled:opacity-30"
              aria-label="เพิ่มบัญชี"
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          </div>
        </section>

        {/* Large expense threshold */}
        <section aria-label="ขีดจำกัดรายจ่ายก้อนใหญ่">
          <h2 className="text-sm font-semibold text-slate-300 mb-1">รายจ่ายก้อนใหญ่</h2>
          <p className="text-xs text-slate-500 mb-3">รายการที่เกินกว่านี้จะแยกออกจากกราฟวงกลม เพื่อไม่ให้บิดเบือนยอดรายเดือน</p>
          <div className="flex gap-2 items-center">
            <div className="glass flex items-center gap-2 flex-1 px-4 py-3">
              <span className="text-slate-400 text-sm">฿</span>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="bg-transparent flex-1 text-slate-100 text-sm font-mono outline-none min-w-0"
                placeholder="5000"
                min="0"
                aria-label="ยอดขีดจำกัดรายจ่ายก้อนใหญ่"
              />
            </div>
            <button
              onClick={() => {
                const n = Number(threshold);
                if (!isNaN(n) && n >= 0) saveLargeExpenseThreshold(n);
              }}
              className="w-12 h-[46px] bg-lime-400 text-gray-900 rounded-xl flex items-center justify-center pressable font-bold text-lg"
              aria-label="บันทึกขีดจำกัด"
            >
              ✓
            </button>
          </div>
        </section>

      </main>

      <BottomNav />
    </div>
  );
}
