"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Muat ulang status secara berkala selama halaman terlihat, supaya linimasa ikut bergerak. */
export function AutoRefresh({ seconds = 30 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
