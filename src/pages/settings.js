import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import BottomNav from "@/components/BottomNav";
import AuthGate from "@/components/AuthGate";
import {
  getCategories, saveCategories,
  getAccounts, saveAccounts,
} from "@/utils/storage";
import { ArrowLeft, Trash2, Plus } from "lucide-react";

export default function SettingsPage() {
  return (
    <>
      <Head><title>ตั้งค่า — NotiWallet</title></Head>
      <AuthGate>{() => <SettingsContent />}</AuthGate>
    </>
  );
}

function SettingsContent() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [newCatLabel, setNewCatLabel] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("📦");
  const [newAccLabel, setNewAccLabel] = useState("");

  useEffect(() => {
    setCategories(getCategories());
    setAccounts(getAccounts());
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

  return (
    <div className="min-h-dvh pb-28">
      <header className="sticky top-0 z-20 bg-[#080812]/80 backdrop-blur-xl border-b border-white/[0.06] px-4">
        <div className="flex items-center h-14 gap-3 max-w-lg mx-auto">
          <button onClick={() => router.back()} className="btn-ghost p-2 -ml-2" aria-label="กลับ">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display font-semibold text-slate-100">ตั้งค่า</h1>
        </div>
      </header>

      <main className="px-4 pt-4 max-w-lg mx-auto space-y-8">

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
              className="w-12 h-[46px] bg-amber-500 text-gray-900 rounded-xl flex items-center justify-center pressable disabled:opacity-30"
              aria-label="เพิ่มหมวดหมู่"
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          </div>
        </section>

        {/* Accounts */}
        <section aria-label="จัดการบัญชี">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">บัญชี</h2>

          <div className="glass divide-y divide-white/[0.06]">
            {accounts.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex-1 text-sm text-slate-200">{a.label}</span>
                <span className="text-xs text-slate-600 font-mono">{a.id}</span>
                <button
                  onClick={() => deleteAccount(a.id)}
                  className="p-1.5 text-slate-600 hover:text-red-400 pressable transition-colors duration-150"
                  aria-label={`ลบบัญชี ${a.label}`}
                >
                  <Trash2 size={16} />
                </button>
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
              className="w-12 h-[46px] bg-amber-500 text-gray-900 rounded-xl flex items-center justify-center pressable disabled:opacity-30"
              aria-label="เพิ่มบัญชี"
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          </div>
        </section>

      </main>

      <BottomNav />
    </div>
  );
}
