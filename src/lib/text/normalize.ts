// Normalisasi teks untuk mencocokkan kutipan dengan sumbernya.
// Setiap karakter hasil dicatat posisi aslinya agar kutipan bisa disorot
// tepat di teks yang dilihat petugas.

const QUOTE_MAP: Record<string, string> = {
  "“": '"',
  "”": '"',
  "„": '"',
  "«": '"',
  "»": '"',
  "‘": "'",
  "’": "'",
  "‚": "'",
  "`": "'",
  "´": "'",
  "–": "-",
  "—": "-",
};

const INVISIBLE = /[​-‏‪-‮⁠﻿]/;
const SPACE = /[\s  ]/;

export type NormalizedText = { text: string; map: number[] };

export function normalizeWithMap(input: string): NormalizedText {
  let text = "";
  const map: number[] = [];
  let pendingSpace = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i] ?? "";
    if (INVISIBLE.test(ch)) continue;
    if (SPACE.test(ch)) {
      pendingSpace = text.length > 0;
      continue;
    }
    if (pendingSpace) {
      text += " ";
      map.push(i - 1);
      pendingSpace = false;
    }
    text += (QUOTE_MAP[ch] ?? ch).toLowerCase();
    map.push(i);
  }
  return { text, map };
}

export function normalizeText(input: string): string {
  return normalizeWithMap(input).text;
}

/** Kutipan dari model sering dibungkus tanda kutip atau diakhiri titik. */
function trimQuote(quote: string): string {
  return quote.replace(/^["'\s.,;:]+|["'\s.,;:]+$/g, "");
}

/** Posisi kutipan di teks asli, atau null jika kutipan tidak ada di sumber. */
export function locateQuote(source: string, quote: string): { start: number; end: number } | null {
  const needle = normalizeText(trimQuote(quote));
  if (needle.length === 0) return null;
  const hay = normalizeWithMap(source);
  const at = hay.text.indexOf(needle);
  if (at < 0) return null;
  const start = hay.map[at];
  const end = hay.map[at + needle.length - 1];
  if (start === undefined || end === undefined) return null;
  return { start, end: end + 1 };
}

export function quoteAppearsIn(source: string, quote: string): boolean {
  return locateQuote(source, quote) !== null;
}
