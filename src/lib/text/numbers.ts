import { normalizeText } from "./normalize";

// Ekstraksi angka dari teks bahasa Indonesia, baik digit ("12", "1.200")
// maupun kata bilangan ("tiga", "dua puluh lima"). Dipakai untuk memastikan
// angka pada klaim dan teks buatan AI punya saksi di teks sumber.

const UNITS: Record<string, number> = {
  nol: 0,
  satu: 1,
  dua: 2,
  tiga: 3,
  empat: 4,
  lima: 5,
  enam: 6,
  tujuh: 7,
  delapan: 8,
  sembilan: 9,
};

const SE_WORDS: Record<string, number> = {
  sepuluh: 10,
  sebelas: 11,
  seratus: 100,
};

function digitNumbers(text: string): number[] {
  const out: number[] = [];
  // Pemisah ribuan titik atau koma ("1.200"); selain itu digit dibaca apa adanya.
  for (const m of text.matchAll(/\d{1,3}(?:[.,]\d{3})+(?![\d])|\d+/g)) {
    out.push(Number(m[0].replace(/[.,]/g, "")));
  }
  return out;
}

function wordNumbers(text: string): number[] {
  const out: number[] = [];
  const tokens = text.split(/[^a-z]+/).filter(Boolean);
  let total = 0;
  let group = 0;
  let last = 0;
  let started = false;

  const flush = () => {
    if (started) out.push(total + group + last);
    total = 0;
    group = 0;
    last = 0;
    started = false;
  };

  for (const t of tokens) {
    if (t in UNITS) {
      // "dua tiga" adalah dua angka terpisah, bukan lima.
      if (started && last !== 0) flush();
      last = UNITS[t] ?? 0;
      started = true;
    } else if (t in SE_WORDS) {
      group += SE_WORDS[t] ?? 0;
      started = true;
    } else if (t === "seribu") {
      total += 1000;
      started = true;
    } else if (started && t === "belas") {
      group += last + 10;
      last = 0;
    } else if (started && t === "puluh") {
      group += last * 10;
      last = 0;
    } else if (started && t === "ratus") {
      group += last * 100;
      last = 0;
    } else if (started && t === "ribu") {
      total += (group + last || 1) * 1000;
      group = 0;
      last = 0;
    } else {
      flush();
    }
  }
  flush();
  return out;
}

export function numbersInText(text: string): number[] {
  const norm = normalizeText(text);
  return [...digitNumbers(norm), ...wordNumbers(norm)];
}

/** Penjaga angka: setiap angka di teks buatan harus ada di sumber. */
export function checkNumbersSupported(
  generated: string,
  sources: string[],
): { ok: boolean; unsupported: number[] } {
  const allowed = new Set(sources.flatMap(numbersInText));
  const unsupported = [...new Set(numbersInText(generated))].filter((n) => !allowed.has(n));
  return { ok: unsupported.length === 0, unsupported };
}
