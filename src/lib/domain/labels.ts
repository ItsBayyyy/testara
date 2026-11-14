import type {
  AidKind,
  ClaimField,
  Hazard,
  Need,
  ReportStatus,
  Urgency,
  UrgencySource,
  Vulnerable,
} from "./types";

export const NEED_LABELS: Record<Need, string> = {
  evakuasi: "Evakuasi/terjebak",
  air_bersih: "Air bersih",
  makanan: "Makanan",
  obat: "Obat/perawatan",
  pengungsian: "Tempat mengungsi",
  lainnya: "Lainnya",
};

export const VULNERABLE_LABELS: Record<Vulnerable, string> = {
  lansia: "Lansia",
  disabilitas: "Disabilitas",
  ibu_hamil: "Ibu hamil",
  bayi_balita: "Bayi/balita",
  orang_sakit: "Orang sakit",
};

export const URGENCY_LABELS: Record<Urgency, string> = {
  tinggi: "Mendesak",
  sedang: "Sedang",
  rendah: "Rendah",
};

export const URGENCY_SOURCE_LABELS: Record<UrgencySource, string> = {
  aturan: "aturan",
  ai: "usulan otomatis",
  petugas: "petugas",
};

export const STATUS_LABELS: Record<ReportStatus, string> = {
  diterima: "Diterima",
  dibaca: "Dibaca petugas",
  resmi: "Masuk laporan resmi",
  perlu_konfirmasi: "Perlu konfirmasi",
};

export const HAZARD_LABELS: Record<Hazard, string> = {
  banjir: "Banjir",
  banjir_bandang: "Banjir bandang",
  tanah_longsor: "Tanah longsor",
  cuaca_ekstrem: "Cuaca ekstrem",
  angin_kencang: "Angin kencang",
  gelombang_pasang_abrasi: "Gelombang pasang/abrasi",
  kebakaran_hutan_lahan: "Kebakaran hutan dan lahan",
  gempa_bumi: "Gempa bumi",
  lainnya: "Lainnya",
};

/** Judul kejadian; "lainnya" biasanya berarti laporan belum dirapikan AI. */
export function incidentTitle(hazard: Hazard): string {
  return hazard === "lainnya" ? "Jenis bencana belum diketahui" : HAZARD_LABELS[hazard];
}

export const FIELD_LABELS: Record<ClaimField, string> = {
  meninggal: "Meninggal",
  hilang: "Hilang",
  luka: "Luka",
  mengungsi_jiwa: "Mengungsi (jiwa)",
  mengungsi_kk: "Mengungsi (KK)",
  terdampak_jiwa: "Terdampak (jiwa)",
  terdampak_kk: "Terdampak (KK)",
  rumah_rusak_berat: "Rumah rusak berat",
  rumah_rusak_sedang: "Rumah rusak sedang",
  rumah_rusak_ringan: "Rumah rusak ringan",
  rumah_terendam: "Rumah terendam",
  fasilitas_rusak: "Fasilitas rusak",
  kebutuhan_mendesak: "Kebutuhan mendesak",
  upaya_penanganan: "Upaya penanganan",
  kondisi_terkini: "Kondisi terkini",
};

export const AID_KIND_LABELS: Record<AidKind, string> = {
  air_bersih: "Air bersih",
  dapur_umum: "Dapur umum",
  pos_kesehatan: "Pos kesehatan",
  lainnya: "Bantuan lain",
};
