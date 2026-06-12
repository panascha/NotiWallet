import { useRouter } from "next/router";
import { Home, Camera, PenLine, ReceiptText } from "lucide-react";

const tabs = [
  { href: "/", icon: Home, label: "หน้าหลัก" },
  { href: "/scan", icon: Camera, label: "สแกน" },
  { href: "/manual", icon: PenLine, label: "บันทึก" },
  { href: "/reimburse", icon: ReceiptText, label: "เบิก" },
];

export default function BottomNav() {
  const router = useRouter();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-xl border-t border-white/[0.08] safe-bottom"
      aria-label="Navigation"
    >
      <div className="flex justify-around pt-2 pb-1 max-w-lg mx-auto">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = router.pathname === href;
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl pressable transition-colors duration-150 ${
                active ? "text-lime-400" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 1.8}
                className={active ? "drop-shadow-[0_0_6px_rgba(168,255,62,0.5)]" : ""}
              />
              <span className={`text-[10px] font-medium ${active ? "text-lime-400" : ""}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
