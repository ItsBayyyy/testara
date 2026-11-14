"use client";

import Link from "next/link";
import { useMemo, useState, type ChangeEvent } from "react";
import { maskPhoneNumbers } from "@/lib/privacy/mask";
import { parseWhatsAppExport, toBatches } from "@/lib/whatsapp/parse";

type Progress =
  | { kind: "siap" }
  | { kind: "proses"; done: number; total: number }
  | { kind: "selesai"; created: number; skipped: number; aiAll: boolean }
  | { kind: "gagal"; message: string; created: number };

const MAX_FILE_BYTES = 2_000_000;

export function WhatsAppImport() {
  const [raw, setRaw] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress>({ kind: "siap" });

  const parsed = useMemo(() => {
    const result = parseWhatsAppExport(raw);
    return {
      ...result,
      messages: result.messages.map((m) => ({ ...m, text: maskPhoneNumbers(m.text) })),
    };
  }, [raw]);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setFileError(null);
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setFileError("Berkas lebih dari 2 MB. Ekspor chat tanpa media, atau tempel sebagian pesan.");
      return;
    }
    setRaw(await file.text());
  }

  async function run() {
    const batches = toBatches(parsed.messages);
    let created = 0;
    let skipped = 0;
    let aiAll = true;
    setProgress({ kind: "proses", done: 0, total: batches.length });
    for (const [i, batch] of batches.entries()) {
      const res = await fetch("/api/whatsapp/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first: i === 0, messages: batch }),
      }).catch(() => null);
      const body = (await res?.json().catch(() => null)) as {
        created?: number;
        skipped?: number;
        ai?: boolean;
        message?: string;
      } | null;
      if (!res || !res.ok || !body) {
        setProgress({
          kind: "gagal",
          created,
          message:
            body?.message ??
            `Batch ${i + 1} dari ${batches.length} belum terkirim. Periksa sinyal, lalu proses lagi pesan yang tersisa.`,
        });
        return;
      }
      created += body.created ?? 0;
      skipped += body.skipped ?? 0;
      aiAll &&= body.ai === true;
      setProgress({ kind: "proses", done: i + 1, total: batches.length });
    }
    setProgress({ kind: "selesai", created, skipped, aiAll });
  }

  const busy = progress.kind === "proses";
  const total = parsed.messages.length;

  return (
    <div className="mt-6 flex flex-col gap-5">
      <div>
        <label htmlFor="tempel" className="label">
          Tempel pesan
        </label>
        <textarea
          id="tempel"
          className="field min-h-56 font-mono text-[0.875rem]"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={"14/11/26 21.02 - Kades Taba Terunjam: Air sdh masuk rmh warga RT 3..."}
          disabled={busy}
        />
      </div>
      <div>
        <label htmlFor="berkas" className="label">
          Atau unggah berkas .txt
        </label>
        <input id="berkas" type="file" accept=".txt,text/plain" onChange={onFile} disabled={busy} />
        {fileError && <p className="error-text mt-1">{fileError}</p>}
      </div>

      {raw.trim() && (
        <p className="panel px-4 py-3" aria-live="polite">
          <span className="num font-bold">{total}</span> pesan terbaca
          {parsed.skipped > 0 && (
            <>
              , <span className="num">{parsed.skipped}</span> pesan sistem/media dilewati
            </>
          )}
          .{" "}
          {parsed.format === "baris"
            ? "Format ekspor tidak dikenali, jadi setiap baris dianggap satu pesan tanpa jam."
            : `Format ${parsed.format === "android" ? "Android" : "iPhone"}.`}
        </p>
      )}

      <button
        type="button"
        className="btn btn-primary self-start"
        disabled={busy || total === 0}
        onClick={run}
      >
        {busy
          ? `Memproses ${progress.done} dari ${progress.total} kelompok...`
          : `Proses ${total} pesan`}
      </button>

      <div aria-live="polite">
        {progress.kind === "selesai" && (
          <div className="panel flex flex-col gap-2 px-4 py-3">
            <p className="font-bold">
              {progress.created} laporan masuk antrean. {progress.skipped} pesan bukan laporan
              (salam, &ldquo;siap pak&rdquo;, terusan peringatan cuaca).
            </p>
            {!progress.aiAll && (
              <p>
                Sebagian pesan belum dirapikan AI. Pesan tetap masuk antrean apa adanya dengan
                urgensi dari aturan.
              </p>
            )}
            <Link href="/petugas?status=diterima" className="btn btn-secondary self-start">
              Buka antrean
            </Link>
          </div>
        )}
        {progress.kind === "gagal" && (
          <p role="alert" className="flag-action panel px-4 py-3">
            {progress.message}{" "}
            {progress.created > 0 && `${progress.created} laporan sudah masuk antrean.`}
          </p>
        )}
      </div>
    </div>
  );
}
