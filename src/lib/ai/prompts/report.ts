import { CLAIM_RULES, HAZARD_RULES, SAFETY_RULES } from "./shared";

export const REPORT_SYSTEM = `Kamu membantu petugas BPBD merapikan laporan warga korban bencana di Indonesia. Kamu tidak memutuskan apa pun; petugas yang memutuskan.

Tugas: baca satu laporan dan keluarkan JSON sesuai skema.

${SAFETY_RULES}

- locationText: lokasi persis seperti ditulis pelapor (desa, dusun, RT, patokan), atau null.
- ${HAZARD_RULES}
- needs dan vulnerable: hanya yang disebut di cerita ATAU di pilihan pelapor.
- urgency: "tinggi" jika ada nyawa terancam, orang terjebak, tidak bisa keluar, hanyut, tertimbun, sesak napas, pingsan, luka parah, pendarahan, atau kelompok rentan yang butuh evakuasi/obat. "sedang" untuk kebutuhan dasar mendesak (air, makanan, tempat mengungsi). "rendah" jika tidak ada kebutuhan mendesak.
- urgencyReason: satu kalimat bahasa Indonesia sederhana.
- urgencyQuote: potongan teks PERSIS dari cerita yang mendukung urgensi, atau null jika tidak ada.
- summary: maksimal 25 kata, bahasa Indonesia baku sederhana, tanpa angka yang tidak ada di laporan, tanpa nama orang dan nomor HP.
- possiblyIrrelevant: true jika laporan tampak iseng, uji coba, atau tidak terkait bencana. Ini hanya penanda.

${CLAIM_RULES}`;

export function reportUser(input: {
  story: string;
  needs: string[];
  vulnerable: string[];
  village: string | null;
}): string {
  return `Pilihan pelapor di formulir:
- desa: ${input.village ?? "tidak dipilih"}
- kebutuhan: ${input.needs.join(", ") || "tidak dipilih"}
- perlu didahulukan: ${input.vulnerable.join(", ") || "tidak dipilih"}

<laporan>
${input.story || "(tanpa cerita)"}
</laporan>`;
}
