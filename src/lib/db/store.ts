import type {
  BoardVersion,
  Hazard,
  IncidentReview,
  Report,
  ReportEvent,
  ReportStatus,
} from "@/lib/domain/types";

/**
 * Lingkup data: `demoSessionId` null berarti data sungguhan; selain itu data
 * milik satu sesi demo. Setiap query wajib membawa lingkup supaya sesi demo
 * tidak pernah melihat data sungguhan atau data sesi lain.
 */
export type Scope = { demoSessionId: string | null; regencyCode: string };

export type ReportFilter = { villageCode?: string; status?: ReportStatus };

export type ReportPatch = Partial<
  Pick<
    Report,
    | "status"
    | "urgency"
    | "urgencySource"
    | "urgencyReason"
    | "urgencyQuote"
    | "aiState"
    | "extraction"
    | "villageCode"
  >
>;

export interface Store {
  readonly kind: "supabase" | "memori";
  ping(): Promise<boolean>;

  insertReports(reports: Report[], scope: Scope): Promise<void>;
  addEvents(events: ReportEvent[]): Promise<void>;
  getReport(id: string, scope: Scope): Promise<Report | null>;
  /** Untuk halaman status publik: hanya berdasarkan kode yang sulit ditebak. */
  getReportByCode(code: string): Promise<Report | null>;
  listReports(scope: Scope, filter?: ReportFilter): Promise<Report[]>;
  updateReport(id: string, scope: Scope, patch: ReportPatch): Promise<Report | null>;
  listEvents(reportId: string): Promise<ReportEvent[]>;

  getIncidentReview(
    scope: Scope,
    villageCode: string,
    hazard: Hazard,
  ): Promise<IncidentReview | null>;
  listIncidentReviews(scope: Scope): Promise<IncidentReview[]>;
  saveIncidentReview(review: IncidentReview, scope: Scope): Promise<void>;

  publishBoard(version: BoardVersion, scope: Scope): Promise<void>;
  /** Versi terbaru per desa (hanya yang sudah terbit). */
  listLatestBoards(scope: Scope): Promise<BoardVersion[]>;
  listBoardVersions(scope: Scope, villageCode: string): Promise<BoardVersion[]>;

  cacheGet(key: string): Promise<unknown | null>;
  cacheSet(key: string, value: unknown): Promise<void>;
  /** Tambah hitungan untuk kunci dan jendela waktu; kembalikan hitungan baru. */
  hitRateLimit(key: string, windowStart: string): Promise<number>;
  incrementUsage(day: string): Promise<number>;
  getUsage(day: string): Promise<number>;

  /** Hapus laporan kedaluwarsa dan data demo lama. */
  purge(now: Date, demoOlderThan: Date): Promise<{ reports: number; demo: number }>;
}
