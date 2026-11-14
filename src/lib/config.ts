import "server-only";

// Konfigurasi yang boleh ditampilkan ke pengguna (nomor darurat, nomor posko).
// Kunci rahasia tidak pernah dibaca di sini.

export type PublicConfig = {
  emergencyNumber: string;
  poskoWhatsApp: string;
  /** true jika nomor posko masih nomor contoh bawaan, sehingga UI memberi label "contoh". */
  poskoIsExample: boolean;
};

const EXAMPLE_POSKO = "6281200000000";

export function publicConfig(): PublicConfig {
  const posko = process.env.POSKO_WHATSAPP_NUMBER?.trim() || EXAMPLE_POSKO;
  return {
    emergencyNumber: process.env.EMERGENCY_NUMBER_LABEL?.trim() || "112",
    poskoWhatsApp: posko,
    poskoIsExample: posko === EXAMPLE_POSKO || /^62812?0000/.test(posko),
  };
}

export function dailyAiBudget(): number {
  const n = Number(process.env.DAILY_AI_REQUEST_BUDGET);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 300;
}
