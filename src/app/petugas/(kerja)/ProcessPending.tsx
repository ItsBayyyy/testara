"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Laporan yang belum dirapikan AI diproses ulang saat antrean dibuka.
 * Berjalan satu per satu agar tidak membebani kuota, lalu memuat ulang antrean.
 */
export function ProcessPending({ ids }: { ids: string[] }) {
  const router = useRouter();
  const started = useRef(false);
  const [done, setDone] = useState(0);
  const key = ids.join(",");

  useEffect(() => {
    if (started.current || ids.length === 0) return;
    started.current = true;
    let changed = false;
    (async () => {
      for (const id of ids) {
        const res = await fetch(`/api/reports/${id}/process`, { method: "POST" }).catch(() => null);
        const body = (await res?.json().catch(() => null)) as { aiState?: string } | null;
        if (body?.aiState === "selesai") changed = true;
        setDone((n) => n + 1);
      }
      if (changed) router.refresh();
    })();
    // key mewakili isi ids; efek hanya perlu jalan sekali per daftar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (ids.length === 0 || done >= ids.length) return null;
  return (
    <p className="bg-bg px-4 py-2 text-sm text-ink-2" aria-live="polite">
      Merapikan {ids.length - done} laporan otomatis...
    </p>
  );
}
