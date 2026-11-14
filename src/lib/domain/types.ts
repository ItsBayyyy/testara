// Tipe domain bersama. Nilai enum ditulis dalam bahasa Indonesia karena
// tersimpan di database dan dibaca petugas; nama tipe tetap bahasa Inggris.

export const NEEDS = [
  "evakuasi",
  "air_bersih",
  "makanan",
  "obat",
  "pengungsian",
  "lainnya",
] as const;
export type Need = (typeof NEEDS)[number];

export const VULNERABLE = [
  "lansia",
  "disabilitas",
  "ibu_hamil",
  "bayi_balita",
  "orang_sakit",
] as const;
export type Vulnerable = (typeof VULNERABLE)[number];

export const URGENCIES = ["tinggi", "sedang", "rendah"] as const;
export type Urgency = (typeof URGENCIES)[number];

export type UrgencySource = "aturan" | "ai" | "petugas";

export const REPORT_STATUSES = ["diterima", "dibaca", "resmi", "perlu_konfirmasi"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export type ReportSource = "form" | "whatsapp";

/** Status pemrosesan AI, terpisah dari status laporan yang dilihat korban. */
export type AiState = "menunggu" | "selesai" | "gagal";

export const HAZARDS = [
  "banjir",
  "banjir_bandang",
  "tanah_longsor",
  "cuaca_ekstrem",
  "angin_kencang",
  "gelombang_pasang_abrasi",
  "kebakaran_hutan_lahan",
  "gempa_bumi",
  "lainnya",
] as const;
export type Hazard = (typeof HAZARDS)[number];

export const COUNT_FIELDS = [
  "meninggal",
  "hilang",
  "luka",
  "mengungsi_jiwa",
  "mengungsi_kk",
  "terdampak_jiwa",
  "terdampak_kk",
  "rumah_rusak_berat",
  "rumah_rusak_sedang",
  "rumah_rusak_ringan",
  "rumah_terendam",
  "fasilitas_rusak",
] as const;
export const TEXT_FIELDS = ["kebutuhan_mendesak", "upaya_penanganan", "kondisi_terkini"] as const;
export const CLAIM_FIELDS = [...COUNT_FIELDS, ...TEXT_FIELDS] as const;
export type CountField = (typeof COUNT_FIELDS)[number];
export type ClaimField = (typeof CLAIM_FIELDS)[number];

export type Claim = {
  messageId: string;
  locationText: string;
  hazard: Hazard;
  field: ClaimField;
  value: number | string;
  approximate: boolean;
  quote: string;
};

export type DroppedClaim = { claim: Claim; reason: string };

/** Hasil ekstraksi laporan warga (CLAUDE.md 4A) setelah lolos verifikasi. */
export type ReportExtraction = {
  locationText: string | null;
  hazard: Hazard | null;
  claims: Claim[];
  needs: Need[];
  vulnerable: Vulnerable[];
  urgency: Urgency;
  urgencyReason: string;
  urgencyQuote: string | null;
  summary: string;
  possiblyIrrelevant: boolean;
};

export type StoredExtraction = ReportExtraction & {
  droppedClaims: DroppedClaim[];
  provider: string;
  model: string;
  promptVersion: string;
};

export type Report = {
  id: string;
  publicCode: string;
  demoSessionId: string | null;
  villageCode: string | null;
  needs: Need[];
  vulnerable: Vulnerable[];
  forSelf: boolean;
  storyText: string;
  reporterPhone: string | null;
  source: ReportSource;
  /** Nama pengirim dan jam asli untuk laporan dari WhatsApp. */
  sourceMeta: { sender: string | null; sentAt: string | null } | null;
  status: ReportStatus;
  urgency: Urgency;
  urgencySource: UrgencySource;
  urgencyReason: string;
  urgencyQuote: string | null;
  aiState: AiState;
  extraction: StoredExtraction | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
};

export type ReportEvent = {
  reportId: string;
  status: ReportStatus;
  actor: "system" | "petugas";
  createdAt: string;
};

/** Pilihan angka petugas untuk satu kejadian (desa, jenis bencana). */
export type IncidentReview = {
  demoSessionId: string | null;
  villageCode: string;
  hazard: Hazard;
  chosen: Partial<Record<ClaimField, number | string>>;
  reviewedBy: string;
  reviewedAt: string;
};

export const AID_KINDS = ["air_bersih", "dapur_umum", "pos_kesehatan", "lainnya"] as const;
export type AidKind = (typeof AID_KINDS)[number];

export type BoardShelter = { id: string; name: string; location: string; note: string };
export type BoardAidPoint = {
  id: string;
  kind: AidKind;
  name: string;
  location: string;
  hours: string;
  note: string;
};
export type BoardNeed = { id: string; text: string };
export type BoardContact = { id: string; name: string; phone: string; note: string };
export type BoardNote = { id: string; text: string };

export type BoardContent = {
  shelters: BoardShelter[];
  aidPoints: BoardAidPoint[];
  announcedNeeds: BoardNeed[];
  contacts: BoardContact[];
  notes: BoardNote[];
};

export type BoardVersion = {
  id: string;
  demoSessionId: string | null;
  villageCode: string;
  content: BoardContent;
  publishedAt: string;
  publishedBy: string;
};

export type Staff = {
  id: string;
  name: string;
  /** true untuk petugas demo; hanya boleh melihat data sesi demonya. */
  demo: boolean;
  demoSessionId: string | null;
};
