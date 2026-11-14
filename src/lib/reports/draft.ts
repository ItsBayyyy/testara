import type { Need, Vulnerable } from "@/lib/domain/types";

// Draf formulir lapor di perangkat korban. Tanpa zod agar halaman lapor
// tetap ringan; validasi lengkap tetap dilakukan server.

export type ReportDraft = {
  villageCode: string | null;
  needs: Need[];
  vulnerable: Vulnerable[];
  story: string;
  forSelf: boolean;
  phone: string;
  consent: boolean;
};

export const EMPTY_DRAFT: ReportDraft = {
  villageCode: null,
  needs: [],
  vulnerable: [],
  story: "",
  forSelf: true,
  phone: "",
  consent: false,
};

export const DRAFT_KEY = "testara:draf-laporan";
export const VILLAGE_KEY = "testara:desa-terakhir";
export const MY_REPORTS_KEY = "testara:laporan-saya";

/** Pemeriksaan cepat di perangkat; pesan sama dengan validasi server. */
export function quickValidate(d: ReportDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  const story = d.story.trim();
  if (d.needs.length === 0 && story === "") {
    errors.needs = "Pilih minimal satu kebutuhan, atau tulis ceritanya.";
  }
  if (d.villageCode === null && story === "") {
    errors.story = "Desa belum dipilih. Tulis lokasinya di cerita.";
  }
  const digits = d.phone.replace(/\D/g, "");
  if (
    d.phone.trim() !== "" &&
    (!/^[+\d][\d\s.-]{7,20}$/.test(d.phone.trim()) || digits.length < 9 || digits.length > 15)
  ) {
    errors.phone = "Nomor HP hanya berisi angka, contoh 0812 3456 7890.";
  }
  if (!d.consent) errors.consent = "Centang persetujuan agar laporan bisa disimpan.";
  return errors;
}

/** Baca draf dari localStorage; abaikan isi rusak atau penyimpanan yang diblokir. */
export function readDraft(): ReportDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    const village = localStorage.getItem(VILLAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<ReportDraft>) : {};
    if (!raw && !village) return null;
    return {
      ...EMPTY_DRAFT,
      ...parsed,
      villageCode: parsed.villageCode ?? village ?? null,
      consent: false,
    };
  } catch {
    return null;
  }
}

export function writeDraft(d: ReportDraft): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...d, consent: false }));
    if (d.villageCode) localStorage.setItem(VILLAGE_KEY, d.villageCode);
  } catch {
    // Penyimpanan perangkat bisa penuh atau diblokir; formulir tetap jalan.
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // diabaikan, lihat writeDraft
  }
}

export function rememberReport(code: string): void {
  try {
    const list = JSON.parse(localStorage.getItem(MY_REPORTS_KEY) ?? "[]") as string[];
    localStorage.setItem(
      MY_REPORTS_KEY,
      JSON.stringify([code, ...list.filter((c) => c !== code)].slice(0, 10)),
    );
  } catch {
    // diabaikan, lihat writeDraft
  }
}
