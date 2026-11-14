// Penyamaran nomor HP Indonesia sebelum teks dikirim ke server atau AI.
// Mencakup awalan +62, 62, dan 08 dengan pemisah spasi, titik, atau tanda hubung.

export const MASKED_PHONE = "[nomor disamarkan]";

const PHONE = /(?<![\d+])(?:\+62|62|0)[\s.-]?8(?:[\s.-]?\d){7,11}(?!\d)/g;

export function maskPhoneNumbers(text: string): string {
  return text.replace(PHONE, MASKED_PHONE);
}

export function containsPhoneNumber(text: string): boolean {
  PHONE.lastIndex = 0;
  const found = PHONE.test(text);
  PHONE.lastIndex = 0;
  return found;
}
