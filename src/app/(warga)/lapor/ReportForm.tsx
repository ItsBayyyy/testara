"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { NEED_LABELS, VULNERABLE_LABELS } from "@/lib/domain/labels";
import { NEEDS, VULNERABLE, type Need, type Vulnerable } from "@/lib/domain/types";
import {
  clearDraft,
  EMPTY_DRAFT,
  quickValidate,
  readDraft,
  rememberReport,
  writeDraft,
  type ReportDraft,
} from "@/lib/reports/draft";
import { buildFallbackReportMessage, whatsappLink } from "@/lib/whatsapp/format";
import { CopyButton } from "@/components/CopyButton";
import { VillagePicker, type VillageOption } from "./VillagePicker";

type Phase = { kind: "isi" } | { kind: "mengirim" } | { kind: "gagal"; message: string };

type SendResult =
  | { kind: "ok"; id: string; code: string }
  | { kind: "isian"; fields: Record<string, string> }
  | { kind: "gagal"; message: string };

const SIGNAL_MESSAGE =
  "Laporan belum terkirim karena sinyal. Kirim lewat WhatsApp, atau coba lagi.";

async function postOnce(draft: ReportDraft): Promise<SendResult | "ulang"> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, phone: draft.phone.trim() || null }),
      signal: controller.signal,
    });
    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      code?: string;
      fields?: Record<string, string>;
      message?: string;
    };
    if (res.status === 201 && data.id && data.code)
      return { kind: "ok", id: data.id, code: data.code };
    if (res.status === 400) return { kind: "isian", fields: data.fields ?? {} };
    if (res.status === 429) return { kind: "gagal", message: data.message ?? SIGNAL_MESSAGE };
    return "ulang";
  } catch {
    return "ulang";
  } finally {
    clearTimeout(timer);
  }
}

/** Kirim dengan satu kali coba ulang otomatis untuk gangguan jaringan atau server. */
async function sendReport(draft: ReportDraft): Promise<SendResult> {
  const first = await postOnce(draft);
  if (first !== "ulang") return first;
  await new Promise((r) => setTimeout(r, 1500));
  const second = await postOnce(draft);
  return second === "ulang" ? { kind: "gagal", message: SIGNAL_MESSAGE } : second;
}

type FormProps = {
  villages: VillageOption[];
  poskoWhatsApp: string;
  poskoIsExample: boolean;
};

const noSubscribe = () => () => {};

/**
 * Draf hanya ada di perangkat, jadi formulir dirender ulang sekali setelah
 * terbuka di browser dengan isian yang tersimpan.
 */
export function ReportForm(props: FormProps) {
  const onClient = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  return (
    <ReportFormInner
      key={onClient ? "perangkat" : "server"}
      initial={onClient ? (readDraft() ?? EMPTY_DRAFT) : EMPTY_DRAFT}
      {...props}
    />
  );
}

function ReportFormInner({
  initial,
  villages,
  poskoWhatsApp,
  poskoIsExample,
}: FormProps & { initial: ReportDraft }) {
  const router = useRouter();
  const [draft, setDraft] = useState<ReportDraft>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<Phase>({ kind: "isi" });
  const summaryRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase.kind === "gagal") fallbackRef.current?.focus();
  }, [phase]);

  // Simpan ke perangkat di setiap perubahan agar tidak hilang saat halaman dimuat ulang.
  const update = (patch: Partial<ReportDraft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    writeDraft(next);
  };

  const toggleNeed = (n: Need) =>
    update({
      needs: draft.needs.includes(n) ? draft.needs.filter((x) => x !== n) : [...draft.needs, n],
    });

  const toggleVulnerable = (v: Vulnerable) =>
    update({
      vulnerable: draft.vulnerable.includes(v)
        ? draft.vulnerable.filter((x) => x !== v)
        : [...draft.vulnerable, v],
    });

  const villageLabel = villages.find((v) => v.code === draft.villageCode)?.label ?? null;
  const fallbackText = buildFallbackReportMessage({
    villageLabel,
    needs: draft.needs,
    vulnerable: draft.vulnerable,
    story: draft.story,
    forSelf: draft.forSelf,
    phone: draft.phone.trim() || null,
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const found = quickValidate(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setPhase({ kind: "mengirim" });
    const result = await sendReport(draft);
    if (result.kind === "ok") {
      rememberReport(result.code);
      clearDraft();
      router.push(`/status/${result.code}?baru=1`);
      return;
    }
    if (result.kind === "isian") {
      setErrors(result.fields);
      setPhase({ kind: "isi" });
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setPhase({ kind: "gagal", message: result.message });
  }

  const errorList = Object.values(errors);
  const sending = phase.kind === "mengirim";

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
      {errorList.length > 0 && (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="flag-action panel px-4 py-3">
          <p className="font-bold">Laporan belum bisa dikirim:</p>
          <ul className="mt-1 list-disc pl-5">
            {errorList.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      <VillagePicker
        villages={villages}
        value={draft.villageCode}
        onChange={(code) => update({ villageCode: code })}
        error={errors.villageCode}
      />

      <fieldset>
        <legend className="label">Apa yang dibutuhkan?</legend>
        <p className="hint mb-2">Boleh pilih lebih dari satu.</p>
        <div className="grid grid-cols-2 gap-3">
          {NEEDS.map((n) => (
            <button
              key={n}
              type="button"
              className="choice"
              aria-pressed={draft.needs.includes(n)}
              onClick={() => toggleNeed(n)}
            >
              {NEED_LABELS[n]}
            </button>
          ))}
        </div>
        {errors.needs && <p className="error-text mt-2">{errors.needs}</p>}
      </fieldset>

      <fieldset>
        <legend className="label">Ada yang perlu didahulukan?</legend>
        <div className="grid grid-cols-1 gap-x-4 gap-y-1 min-[400px]:grid-cols-2">
          {VULNERABLE.map((v) => (
            <label key={v} className="flex min-h-12 cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                className="check"
                checked={draft.vulnerable.includes(v)}
                onChange={() => toggleVulnerable(v)}
              />
              {VULNERABLE_LABELS[v]}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="cerita" className="label">
          Ceritakan apa yang terjadi
        </label>
        <p id="cerita-hint" className="hint mb-2">
          Boleh singkat, boleh bahasa daerah. Untuk bicara, tekan ikon mikrofon di keyboard HP.
        </p>
        <textarea
          id="cerita"
          className="field min-h-36"
          value={draft.story}
          maxLength={2000}
          onChange={(e) => update({ story: e.target.value })}
          aria-describedby={`cerita-hint${errors.story ? " cerita-error" : ""}`}
          aria-invalid={errors.story ? true : undefined}
        />
        {errors.story && (
          <p id="cerita-error" className="error-text mt-1">
            {errors.story}
          </p>
        )}
      </div>

      <fieldset>
        <legend className="label">Laporan ini untuk siapa?</legend>
        <div className="flex flex-wrap gap-x-6">
          {[
            { value: true, label: "Untuk saya sendiri" },
            { value: false, label: "Untuk orang lain" },
          ].map((o) => (
            <label key={o.label} className="flex min-h-12 cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="untuk"
                className="check"
                checked={draft.forSelf === o.value}
                onChange={() => update({ forSelf: o.value })}
              />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="hp" className="label">
          Nomor HP untuk dihubungi petugas{" "}
          <span className="font-normal text-ink-2">(tidak wajib)</span>
        </label>
        <p id="hp-hint" className="hint mb-2">
          Hanya petugas yang bisa melihat nomor ini.
        </p>
        <input
          id="hp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          className="field"
          value={draft.phone}
          onChange={(e) => update({ phone: e.target.value })}
          aria-describedby={`hp-hint${errors.phone ? " hp-error" : ""}`}
          aria-invalid={errors.phone ? true : undefined}
        />
        {errors.phone && (
          <p id="hp-error" className="error-text mt-1">
            {errors.phone}
          </p>
        )}
      </div>

      <div>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="check mt-0.5"
            checked={draft.consent}
            onChange={(e) => update({ consent: e.target.checked })}
            aria-invalid={errors.consent ? true : undefined}
          />
          <span>
            Saya setuju laporan ini disimpan dan dibaca petugas. Laporan dihapus otomatis setelah 30
            hari.
          </span>
        </label>
        {errors.consent && <p className="error-text mt-1">{errors.consent}</p>}
      </div>

      {phase.kind === "gagal" ? (
        <div
          ref={fallbackRef}
          tabIndex={-1}
          role="alert"
          className="flag-action panel flex flex-col gap-3 px-4 py-4"
        >
          <p className="font-bold">{phase.message}</p>
          <p className="text-base text-ink-2">
            Pesan WhatsApp sudah tersusun dari isian Anda.
            {poskoIsExample && " Nomor posko di demo ini adalah nomor contoh."}
          </p>
          <a
            className="btn btn-primary"
            href={whatsappLink(poskoWhatsApp, fallbackText)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Kirim lewat WhatsApp
          </a>
          <CopyButton
            text={fallbackText}
            label="Salin pesan"
            doneLabel="Pesan disalin. Tempel di WhatsApp atau SMS."
            className="btn btn-secondary w-full"
          />
          <button type="submit" className="btn btn-quiet">
            Coba kirim lagi
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <button type="submit" className="btn btn-primary w-full text-lg" disabled={sending}>
            {sending ? "Mengirim laporan..." : "Kirim laporan"}
          </button>
          <p className="hint text-center" aria-live="polite">
            {sending
              ? "Mohon tunggu, jangan tutup halaman ini."
              : "Isian tersimpan di HP ini sampai laporan terkirim."}
          </p>
        </div>
      )}
    </form>
  );
}
