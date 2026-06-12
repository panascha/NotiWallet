import "@/styles/globals.css";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { getGasUrl } from "@/utils/storage";

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.pathname === "/setup") return;
    if (!getGasUrl()) {
      router.replace("/setup");
    }
  }, [router]);

  return <Component {...pageProps} />;
}
