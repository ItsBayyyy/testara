import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  BoardContent,
  BoardVersion,
  IncidentReview,
  Report,
  ReportEvent,
} from "@/lib/domain/types";
import type { ReportFilter, ReportPatch, Scope, Store } from "./store";

// Penyimpanan Supabase memakai kunci service role/secret, hanya di server.
// Semua query membawa lingkup (sesi demo + kabupaten) secara eksplisit.

type ReportRow = {
  id: string;
  public_code: string;
  demo_session_id: string | null;
  regency_code: string;
  village_code: string | null;
  needs: string[];
  vulnerable: string[];
  for_self: boolean;
  story_text: string;
  reporter_phone: string | null;
  source: string;
  source_meta: Report["sourceMeta"];
  status: string;
  urgency: string;
  urgency_source: string;
  urgency_reason: string;
  urgency_quote: string | null;
  ai_state: string;
  extraction: Report["extraction"];
  created_at: string;
  updated_at: string;
  expires_at: string;
};

function toReport(r: ReportRow): Report {
  return {
    id: r.id,
    publicCode: r.public_code,
    demoSessionId: r.demo_session_id,
    villageCode: r.village_code,
    needs: r.needs as Report["needs"],
    vulnerable: r.vulnerable as Report["vulnerable"],
    forSelf: r.for_self,
    storyText: r.story_text,
    reporterPhone: r.reporter_phone,
    source: r.source as Report["source"],
    sourceMeta: r.source_meta,
    status: r.status as Report["status"],
    urgency: r.urgency as Report["urgency"],
    urgencySource: r.urgency_source as Report["urgencySource"],
    urgencyReason: r.urgency_reason,
    urgencyQuote: r.urgency_quote,
    aiState: r.ai_state as Report["aiState"],
    extraction: r.extraction,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    expiresAt: r.expires_at,
  };
}

function toRow(r: Report, scope: Scope): ReportRow {
  return {
    id: r.id,
    public_code: r.publicCode,
    demo_session_id: scope.demoSessionId,
    regency_code: scope.regencyCode,
    village_code: r.villageCode,
    needs: r.needs,
    vulnerable: r.vulnerable,
    for_self: r.forSelf,
    story_text: r.storyText,
    reporter_phone: r.reporterPhone,
    source: r.source,
    source_meta: r.sourceMeta,
    status: r.status,
    urgency: r.urgency,
    urgency_source: r.urgencySource,
    urgency_reason: r.urgencyReason,
    urgency_quote: r.urgencyQuote,
    ai_state: r.aiState,
    extraction: r.extraction,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
    expires_at: r.expiresAt,
  };
}

const PATCH_COLUMNS: Record<keyof ReportPatch, string> = {
  status: "status",
  urgency: "urgency",
  urgencySource: "urgency_source",
  urgencyReason: "urgency_reason",
  urgencyQuote: "urgency_quote",
  aiState: "ai_state",
  extraction: "extraction",
  villageCode: "village_code",
};

type IncidentRow = {
  demo_session_id: string | null;
  village_code: string;
  hazard: string;
  chosen: IncidentReview["chosen"];
  reviewed_by: string;
  reviewed_at: string;
};

const toIncident = (r: IncidentRow): IncidentReview => ({
  demoSessionId: r.demo_session_id,
  villageCode: r.village_code,
  hazard: r.hazard as IncidentReview["hazard"],
  chosen: r.chosen,
  reviewedBy: r.reviewed_by,
  reviewedAt: r.reviewed_at,
});

type BoardRow = {
  id: string;
  demo_session_id: string | null;
  village_code: string;
  content: BoardContent;
  published_at: string;
  published_by: string;
};

const toBoard = (r: BoardRow): BoardVersion => ({
  id: r.id,
  demoSessionId: r.demo_session_id,
  villageCode: r.village_code,
  content: r.content,
  publishedAt: r.published_at,
  publishedBy: r.published_by,
});

/** PostgREST memakai `is null` untuk data sungguhan dan `eq` untuk sesi demo. */
function sessionFilter(scope: Scope): [string, "is" | "eq", string | null] {
  return scope.demoSessionId === null
    ? ["demo_session_id", "is", null]
    : ["demo_session_id", "eq", scope.demoSessionId];
}

function fail(op: string, error: { code?: string; message: string } | null): never {
  // Hanya kode error yang dicatat, tanpa isi laporan.
  throw new Error(`Supabase ${op} gagal${error?.code ? ` (${error.code})` : ""}`);
}

export class SupabaseStore implements Store {
  readonly kind = "supabase" as const;
  private db: SupabaseClient;

  constructor(url: string, serviceKey: string) {
    this.db = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async ping() {
    const { error } = await this.db.from("usage_daily").select("day").limit(1);
    return !error;
  }

  async insertReports(reports: Report[], scope: Scope) {
    const { error } = await this.db.from("reports").insert(reports.map((r) => toRow(r, scope)));
    if (error) fail("insert reports", error);
  }

  async addEvents(events: ReportEvent[]) {
    if (events.length === 0) return;
    const { error } = await this.db.from("report_events").insert(
      events.map((e) => ({
        report_id: e.reportId,
        status: e.status,
        actor: e.actor,
        created_at: e.createdAt,
      })),
    );
    if (error) fail("insert events", error);
  }

  async getReport(id: string, scope: Scope) {
    const { data, error } = await this.db
      .from("reports")
      .select("*")
      .eq("id", id)
      .filter(...sessionFilter(scope))
      .eq("regency_code", scope.regencyCode)
      .maybeSingle();
    if (error) fail("get report", error);
    return data ? toReport(data as ReportRow) : null;
  }

  async getReportByCode(code: string) {
    const { data, error } = await this.db
      .from("reports")
      .select("*")
      .eq("public_code", code)
      .maybeSingle();
    if (error) fail("get report by code", error);
    return data ? toReport(data as ReportRow) : null;
  }

  async listReports(scope: Scope, filter: ReportFilter = {}) {
    let q = this.db
      .from("reports")
      .select("*")
      .filter(...sessionFilter(scope))
      .eq("regency_code", scope.regencyCode);
    if (filter.villageCode) q = q.eq("village_code", filter.villageCode);
    if (filter.status) q = q.eq("status", filter.status);
    const { data, error } = await q.order("created_at", { ascending: false }).limit(500);
    if (error) fail("list reports", error);
    return (data as ReportRow[]).map(toReport);
  }

  async updateReport(id: string, scope: Scope, patch: ReportPatch) {
    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const [k, v] of Object.entries(patch)) row[PATCH_COLUMNS[k as keyof ReportPatch]] = v;
    const { data, error } = await this.db
      .from("reports")
      .update(row)
      .eq("id", id)
      .filter(...sessionFilter(scope))
      .eq("regency_code", scope.regencyCode)
      .select("*")
      .maybeSingle();
    if (error) fail("update report", error);
    return data ? toReport(data as ReportRow) : null;
  }

  async listEvents(reportId: string) {
    const { data, error } = await this.db
      .from("report_events")
      .select("report_id, status, actor, created_at")
      .eq("report_id", reportId)
      .order("created_at", { ascending: true });
    if (error) fail("list events", error);
    return (data as { report_id: string; status: string; actor: string; created_at: string }[]).map(
      (e) => ({
        reportId: e.report_id,
        status: e.status as ReportEvent["status"],
        actor: e.actor as ReportEvent["actor"],
        createdAt: e.created_at,
      }),
    );
  }

  async getIncidentReview(scope: Scope, villageCode: string, hazard: string) {
    const { data, error } = await this.db
      .from("incidents")
      .select("*")
      .eq("village_code", villageCode)
      .eq("hazard", hazard)
      .filter(...sessionFilter(scope))
      .eq("regency_code", scope.regencyCode)
      .maybeSingle();
    if (error) fail("get incident", error);
    return data ? toIncident(data as IncidentRow) : null;
  }

  async listIncidentReviews(scope: Scope) {
    const { data, error } = await this.db
      .from("incidents")
      .select("*")
      .filter(...sessionFilter(scope))
      .eq("regency_code", scope.regencyCode);
    if (error) fail("list incidents", error);
    return (data as IncidentRow[]).map(toIncident);
  }

  async saveIncidentReview(review: IncidentReview, scope: Scope) {
    const values = {
      demo_session_id: scope.demoSessionId,
      regency_code: scope.regencyCode,
      village_code: review.villageCode,
      hazard: review.hazard,
      chosen: review.chosen,
      reviewed_by: review.reviewedBy,
      reviewed_at: review.reviewedAt,
    };
    const existing = await this.getIncidentReview(scope, review.villageCode, review.hazard);
    const { error } = existing
      ? await this.db
          .from("incidents")
          .update(values)
          .eq("village_code", review.villageCode)
          .eq("hazard", review.hazard)
          .filter(...sessionFilter(scope))
          .eq("regency_code", scope.regencyCode)
      : await this.db.from("incidents").insert(values);
    if (error) fail("save incident", error);
  }

  async publishBoard(version: BoardVersion, scope: Scope) {
    const { error } = await this.db.from("board_versions").insert({
      id: version.id,
      demo_session_id: scope.demoSessionId,
      regency_code: scope.regencyCode,
      village_code: version.villageCode,
      content: version.content,
      published_at: version.publishedAt,
      published_by: version.publishedBy,
    });
    if (error) fail("publish board", error);
  }

  async listLatestBoards(scope: Scope) {
    const { data, error } = await this.db
      .from("board_versions")
      .select("*")
      .filter(...sessionFilter(scope))
      .eq("regency_code", scope.regencyCode)
      .order("published_at", { ascending: false })
      .limit(1000);
    if (error) fail("list boards", error);
    const latest = new Map<string, BoardVersion>();
    for (const row of data as BoardRow[])
      if (!latest.has(row.village_code)) latest.set(row.village_code, toBoard(row));
    return [...latest.values()];
  }

  async listBoardVersions(scope: Scope, villageCode: string) {
    const { data, error } = await this.db
      .from("board_versions")
      .select("*")
      .eq("village_code", villageCode)
      .filter(...sessionFilter(scope))
      .eq("regency_code", scope.regencyCode)
      .order("published_at", { ascending: false })
      .limit(50);
    if (error) fail("list board versions", error);
    return (data as BoardRow[]).map(toBoard);
  }

  async cacheGet(key: string) {
    const { data, error } = await this.db
      .from("ai_cache")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error) fail("cache get", error);
    return data ? (data as { value: unknown }).value : null;
  }

  async cacheSet(key: string, value: unknown) {
    const { error } = await this.db.from("ai_cache").upsert({ key, value });
    if (error) fail("cache set", error);
  }

  async hitRateLimit(key: string, windowStart: string) {
    const { data, error } = await this.db.rpc("hit_rate_limit", {
      p_key: key,
      p_window: windowStart,
    });
    if (error) fail("rate limit", error);
    return Number(data);
  }

  async incrementUsage(day: string) {
    const { data, error } = await this.db.rpc("increment_ai_usage", { p_day: day });
    if (error) fail("usage", error);
    return Number(data);
  }

  async getUsage(day: string) {
    const { data, error } = await this.db
      .from("usage_daily")
      .select("ai_requests")
      .eq("day", day)
      .maybeSingle();
    if (error) fail("usage get", error);
    return data ? Number((data as { ai_requests: number }).ai_requests) : 0;
  }

  async purge(now: Date, demoOlderThan: Date) {
    const demoIso = demoOlderThan.toISOString();
    const expired = await this.db
      .from("reports")
      .delete({ count: "exact" })
      .is("demo_session_id", null)
      .lt("expires_at", now.toISOString());
    if (expired.error) fail("purge reports", expired.error);
    const demo = await this.db
      .from("reports")
      .delete({ count: "exact" })
      .not("demo_session_id", "is", null)
      .lt("created_at", demoIso);
    if (demo.error) fail("purge demo", demo.error);
    const others = await Promise.all([
      this.db
        .from("incidents")
        .delete()
        .not("demo_session_id", "is", null)
        .lt("reviewed_at", demoIso),
      this.db
        .from("board_versions")
        .delete()
        .not("demo_session_id", "is", null)
        .lt("published_at", demoIso),
      this.db.from("rate_limits").delete().lt("window_start", demoIso),
    ]);
    const failed = others.find((r) => r.error);
    if (failed?.error) fail("purge lainnya", failed.error);
    return { reports: expired.count ?? 0, demo: demo.count ?? 0 };
  }
}
