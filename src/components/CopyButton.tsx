"use client";

import { useState } from "react";

/** Tombol salin dengan pesan konfirmasi yang dibacakan pembaca layar. */
export function CopyButton({
  text,
  label,
  doneLabel,
  className = "btn btn-secondary",
}: {
  text: string;
  label: string;
  doneLabel: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("done");
    } catch {
      setState("failed");
    }
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <button type="button" onClick={copy} className={className}>
        {label}
      </button>
      <span aria-live="polite" className="text-base">
        {state === "done"
          ? doneLabel
          : state === "failed"
            ? "Tidak bisa menyalin. Tekan lama teksnya untuk menyalin."
            : ""}
      </span>
    </span>
  );
}
