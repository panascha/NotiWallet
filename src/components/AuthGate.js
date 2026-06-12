import { useEffect, useState } from "react";
import { onAuthChange, signInWithGoogle } from "@/services/auth.service";
import { Wallet, LogIn } from "lucide-react";

export default function AuthGate({ children }) {
  const [user, setUser] = useState(undefined);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthChange((u) => setUser(u));
    return unsub;
  }, []);

  if (user === undefined) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-6 px-6">
        <div className="animate-scale-in flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
            <Wallet size={36} className="text-amber-400" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold text-slate-100">NotiWallet</h1>
            <p className="text-slate-400 text-sm mt-1">บันทึกค่าใช้จ่ายอัจฉริยะ</p>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center max-w-xs">{error}</p>
        )}

        <button
          onClick={() =>
            signInWithGoogle().catch((e) => setError(e.message))
          }
          className="w-full max-w-xs glass pressable flex items-center justify-center gap-3 py-4 px-6 rounded-2xl hover:bg-white/10 transition-colors duration-150"
          aria-label="เข้าสู่ระบบด้วย Google"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#4285F4" d="M47.5 24.6c0-1.6-.1-3.1-.4-4.6H24v8.7h13.1c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.3 7.4-10.6 7.4-17.3z"/>
            <path fill="#34A853" d="M24 48c6.5 0 12-2.2 16-5.8l-7.9-6c-2.2 1.5-5 2.3-8.1 2.3-6.2 0-11.5-4.2-13.4-9.9H2.5v6.2C6.5 42.6 14.7 48 24 48z"/>
            <path fill="#FBBC05" d="M10.6 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6v-6.2H2.5C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.8l8.1-6.2z"/>
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.9 2.2 30.4 0 24 0 14.7 0 6.5 5.4 2.5 13.2l8.1 6.2C12.5 13.7 17.8 9.5 24 9.5z"/>
          </svg>
          <span className="font-semibold text-slate-100">เข้าสู่ระบบด้วย Google</span>
          <LogIn size={16} className="text-slate-400 ml-auto" />
        </button>
      </div>
    );
  }

  return children(user);
}
