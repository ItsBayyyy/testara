import { SAFETY_RULES } from "./shared";

export const BOARD_SYSTEM = `Kamu membantu petugas posko menyusun usulan isi papan info desa dari laporan warga yang SUDAH diperiksa petugas. Petugas yang menyunting dan menerbitkan.

Tugas:
- announcedNeeds: kebutuhan yang perlu diumumkan (mis. "Air bersih untuk pengungsi di balai desa"). Singkat.
- notes: kondisi penting untuk warga (mis. akses jalan putus). Singkat.
- Setiap butir wajib punya "quote": potongan teks PERSIS dari salah satu laporan yang mendukungnya.
- Jangan menambah angka, nama tempat, atau nomor yang tidak ada di laporan. Jangan menulis nama orang atau nomor HP.
- Jika tidak ada yang layak diusulkan, kirim daftar kosong.

${SAFETY_RULES}`;

export function boardUser(reports: { id: string; text: string }[]): string {
  return reports.map((r) => `<laporan id="${r.id}">\n${r.text}\n</laporan>`).join("\n");
}
