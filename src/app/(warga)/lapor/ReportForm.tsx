"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { NEED_LABELS, VULNERABLE_LABELS } from "@/lib/domain/labels";
import { NEEDS, VULNERABLE } from "@/lib/domain/types";
import {
  clearDraft,
  quickValidate,
  readDraft,
  readLastVillage,
  rememberReport,
  writeDraft,
  type ReportDraft,
} from "@/lib/reports/draft";
import { buildFallbackReportMessage, whatsappLink } from "@/lib/whatsapp/format";
import { CopyButton } from "@/components/CopyButton";
import { VillagePicker, type VillageOption } from "./VillagePicker";

// Formulir ini bekerja tanpa JavaScript (kirim biasa ke /api/reports/form), lalu
// diperkaya setelah JS termuat: validasi di tempat, draf, coba ulang, cadangan WhatsApp.
// Isian sengaja tidak dikendalikan React supaya teks yang diketik sebelum JS
// selesai dimuat (sinyal lambat) tidak terhapus saat hidrasi.

type Phase =
  { kind: "isi" } | { kind: "mengirim" } | { kind: "gagal"; message: string; text: string };

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
    if (res.status === 201 && data.id && data.code) {
      return { kind: "ok", id: data.id, code: data.code };
    }
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

function readForm(form: HTMLFormElement): ReportDraft {
  const fd = new FormData(form);
  return {
    villageCode: String(fd.get("villageCode") ?? "") || null,
    needs: fd.getAll("needs").map(String) as ReportDraft["needs"],
    vulnerable: fd.getAll("vulnerable").map(String) as ReportDraft["vulnerable"],
    story: String(fd.get("story") ?? ""),
    forSelf: fd.get("forSelf") !== "0",
    phone: String(fd.get("phone") ?? ""),
    consent: fd.get("consent") === "1",
  };
}

/** Isi kolom dari draf tersimpan, hanya jika pengguna belum mulai mengisi. */
function restoreDraft(form: HTMLFormElement, draft: ReportDraft) {
  const current = readForm(form);
  const untouched =
    current.story === "" &&
    current.phone === "" &&
    current.needs.length === 0 &&
    current.vulnerable.length === 0;
  if (!untouched) return;
  const story = form.elements.namedItem("story");
  if (story instanceof HTMLTextAreaElement) story.value = draft.story;
  const phone = form.elements.namedItem("phone");
  if (phone instanceof HTMLInputElement) phone.value = draft.phone;
  for (const box of form.querySelectorAll<HTMLInputElement>('input[name="needs"]')) {
    box.checked = (draft.needs as string[]).includes(box.value);
  }
  for (const box of form.querySelectorAll<HTMLInputElement>('input[name="vulnerable"]')) {
    box.checked = (draft.vulnerable as string[]).includes(box.value);
  }
  for (const radio of form.querySelectorAll<HTMLInputElement>('input[name="forSelf"]')) {
    radio.checked = radio.value === (draft.forSelf ? "1" : "0");
  }
}

const noSubscribe = () => () => {};

export function ReportForm({
  villages,
  poskoWhatsApp,
  poskoIsExample,
}: {
  villages: VillageOption[];
  poskoWhatsApp: string;
  poskoIsExample: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef<HTMLDivElement>(null);
  // Desa terakhir dibaca dari perangkat; `undefined` berarti belum memilih di kunjungan ini.
  const storedVillage = useSyncExternalStore(noSubscribe, readLastVillage, () => null);
  const [chosenVillage, setChosenVillage] = useState<string | null | undefined>(undefined);
  const villageCode = chosenVillage === undefined ? storedVillage : chosenVillage;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<Phase>({ kind: "isi" });

  useEffect(() => {
    const saved = readDraft();
    if (formRef.current && saved) restoreDraft(formRef.current, saved);
  }, []);

  useEffect(() => {
    if (phase.kind === "gagal") fallbackRef.current?.focus();
  }, [phase]);

  /** Simpan draf, dan hapus pesan error yang sudah tidak berlaku setelah isian diperbaiki. */
  function onFormChange(villageOverride?: string | null) {
    if (!formRef.current) return;
    const draft = readForm(formRef.current);
    if (villageOverride !== undefined) draft.villageCode = villageOverride;
    writeDraft(draft);
    if (Object.keys(errors).length > 0) {
      const still = quickValidate(draft);
      const local = new Set(["needs", "story", "phone", "consent"]);
      setErrors((prev) =>
        Object.fromEntries(Object.entries(prev).filter(([k]) => !local.has(k) || k in still)),
      );
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const draft = readForm(e.currentTarget);
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
      // Perapian AI berjalan terpisah; kegagalannya tidak memengaruhi pelapor.
      fetch(`/api/reports/${result.id}/process`, { method: "POST", keepalive: true }).catch(
        () => {},
      );
      router.push(`/status/${result.code}?baru=1`);
      return;
    }
    if (result.kind === "isian") {
      setErrors(result.fields);
      setPhase({ kind: "isi" });
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    const text = buildFallbackReportMessage({
      villageLabel: villages.find((v) => v.code === draft.villageCode)?.label ?? null,
      needs: draft.needs,
      vulnerable: draft.vulnerable,
      story: draft.story,
      forSelf: draft.forSelf,
      phone: draft.phone.trim() || null,
    });
    setPhase({ kind: "gagal", message: result.message, text });
  }

  const errorList = Object.values(errors);
  const sending = phase.kind === "mengirim";

  return (
    <form
      ref={formRef}
      method="post"
      action="/api/reports/form"
      onSubmit={onSubmit}
      onChange={() => onFormChange()}
      noValidate
      className="sheet flex flex-col gap-8"
    >
      {errorList.length > 0 && (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="alert-action px-4 py-3">
          <p className="font-bold">Laporan belum bisa dikirim. Lengkapi dulu:</p>
          <ul className="mt-1 list-disc pl-5">
            {errorList.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      <input type="hidden" name="villageCode" value={villageCode ?? ""} />
      <VillagePicker
        villages={villages}
        value={villageCode}
        onChange={(code) => {
          setChosenVillage(code);
          onFormChange(code);
        }}
        error={errors.villageCode}
      />

      <fieldset>
        <legend className="label">Apa yang dibutuhkan?</legend>
        <p className="hint mb-2">Boleh pilih lebih dari satu.</p>
        <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
          {NEEDS.map((n) => (
            <label key={n} className="choice">
              <input
                type="checkbox"
                name="needs"
                value={n}
                className="choice-input"
                aria-label={NEED_LABELS[n]}
              />
              {/* <wbr> agar "Evakuasi/terjebak" bisa patah baris di layar 360 px. */}
              <span aria-hidden>
                {NEED_LABELS[n].split("/").map((part, i) => (
                  <span key={part}>
                    {i > 0 && "/"}
                    {i > 0 && <wbr />}
                    {part}
                  </span>
                ))}
              </span>
            </label>
          ))}
        </div>
        {errors.needs && <p className="error-text mt-2">{errors.needs}</p>}
      </fieldset>

      <fieldset>
        <legend className="label">Ada yang perlu didahulukan?</legend>
        <div className="grid grid-cols-1 gap-x-4 gap-y-1 min-[400px]:grid-cols-2">
          {VULNERABLE.map((v) => (
            <label key={v} className="flex min-h-12 cursor-pointer items-center gap-3">
              <input type="checkbox" name="vulnerable" value={v} className="check" />
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
          name="story"
          className="field min-h-36"
          maxLength={2000}
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
          <label className="flex min-h-12 cursor-pointer items-center gap-3">
            <input type="radio" name="forSelf" value="1" className="check" defaultChecked />
            Untuk saya sendiri
          </label>
          <label className="flex min-h-12 cursor-pointer items-center gap-3">
            <input type="radio" name="forSelf" value="0" className="check" />
            Untuk orang lain
          </label>
        </div>
      </fieldset>

      <div>
        <label htmlFor="hp" className="label">
          Nomor HP <span className="font-normal text-ink-2">(tidak wajib)</span>
        </label>
        <p id="hp-hint" className="hint mb-2">
          Supaya petugas bisa menghubungi Anda. Hanya petugas yang bisa melihatnya.
        </p>
        <input
          id="hp"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          className="field"
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
            name="consent"
            value="1"
            className="check mt-1"
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
          className="alert-action flex flex-col gap-3 px-4 py-4"
        >
          <p className="font-semibold">{phase.message}</p>
          <p className="text-base text-ink-2">
            Pesan WhatsApp sudah tersusun dari isian Anda.
            {poskoIsExample && " Nomor posko di demo ini adalah nomor contoh."}
          </p>
          <a
            className="btn btn-primary"
            href={whatsappLink(poskoWhatsApp, phase.text)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Kirim lewat WhatsApp
          </a>
          <CopyButton
            text={phase.text}
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
          <button
            type="submit"
            className="btn btn-primary min-h-14 w-full text-lg"
            aria-busy={sending}
            disabled={sending}
          >
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
