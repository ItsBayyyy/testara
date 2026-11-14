// Kode laporan publik, mis. TS-7K4Q-9M2X. Alfabet tanpa 0/O, 1/I/L, dan U
// supaya tidak tertukar saat dibacakan atau diketik ulang. 8 karakter dari
// 30 simbol = sekitar 39 bit, cukup sulit ditebak untuk laporan berumur 30 hari.

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

export function generatePublicCode(randomBytes: (n: number) => Uint8Array): string {
  const chars: string[] = [];
  while (chars.length < 8) {
    for (const b of randomBytes(16)) {
      // Tolak nilai di atas kelipatan 30 agar distribusi tetap rata.
      if (b < 240 && chars.length < 8) chars.push(ALPHABET[b % 30] ?? "");
    }
  }
  return `TS-${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
}

/** Rapikan kode yang diketik pengguna: huruf besar, tanpa spasi, tanda hubung ditata. */
export function normalizePublicCode(input: string): string | null {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const body = raw.startsWith("TS") ? raw.slice(2) : raw;
  if (body.length !== 8) return null;
  if ([...body].some((c) => !ALPHABET.includes(c))) return null;
  return `TS-${body.slice(0, 4)}-${body.slice(4)}`;
}
