import { SAFETY_RULES } from "./shared";

export const VILLAGE_SYSTEM = `Pilih satu desa dari daftar kandidat yang paling cocok dengan teks lokasi. Jika tidak yakin, isi code null. Jangan memilih desa di luar daftar.

${SAFETY_RULES}`;

export function villageUser(
  locationText: string,
  candidates: { code: string; label: string }[],
): string {
  return `Kandidat:\n${candidates.map((c) => `- ${c.code}: ${c.label}`).join("\n")}\n\n<pesan>\n${locationText}\n</pesan>`;
}
