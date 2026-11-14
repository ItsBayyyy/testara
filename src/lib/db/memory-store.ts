import type { BoardVersion, IncidentReview, Report, ReportEvent } from "@/lib/domain/types";
import type { ReportFilter, ReportPatch, Scope, Store } from "./store";

// Penyimpanan di memori proses. Dipakai untuk pengembangan lokal, test E2E,
// dan cadangan jika Supabase belum dikonfigurasi. Data hilang saat server
// dimulai ulang, jadi /api/health melaporkannya sebagai "memori".

type Row<T> = T & { regencyCode: string };

type State = {
  reports: Row<Report>[];
  events: ReportEvent[];
  incidents: Row<IncidentReview>[];
  boards: Row<BoardVersion>[];
  cache: Map<string, unknown>;
  rate: Map<string, number>;
  usage: Map<string, number>;
};

const globalState = globalThis as unknown as { __testaraMemory?: State };

function state(): State {
  globalState.__testaraMemory ??= {
    reports: [],
    events: [],
    incidents: [],
    boards: [],
    cache: new Map(),
    rate: new Map(),
    usage: new Map(),
  };
  return globalState.__testaraMemory;
}

const inScope = (row: { demoSessionId: string | null; regencyCode: string }, scope: Scope) =>
  row.demoSessionId === scope.demoSessionId && row.regencyCode === scope.regencyCode;

const clone = <T>(v: T): T => structuredClone(v);

function strip<T extends { regencyCode: string }>(row: T): Omit<T, "regencyCode"> {
  const { regencyCode: _ignored, ...rest } = row;
  return rest;
}

export class MemoryStore implements Store {
  readonly kind = "memori" as const;

  async ping() {
    return true;
  }

  async insertReports(reports: Report[], scope: Scope) {
    state().reports.push(...reports.map((r) => clone({ ...r, regencyCode: scope.regencyCode })));
  }

  async addEvents(events: ReportEvent[]) {
    state().events.push(...clone(events));
  }

  async getReport(id: string, scope: Scope) {
    const row = state().reports.find((r) => r.id === id && inScope(r, scope));
    return row ? clone(strip(row)) : null;
  }

  async getReportByCode(code: string) {
    const row = state().reports.find((r) => r.publicCode === code);
    return row ? clone(strip(row)) : null;
  }

  async listReports(scope: Scope, filter: ReportFilter = {}) {
    return state()
      .reports.filter(
        (r) =>
          inScope(r, scope) &&
          (!filter.villageCode || r.villageCode === filter.villageCode) &&
          (!filter.status || r.status === filter.status),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((r) => clone(strip(r)));
  }

  async updateReport(id: string, scope: Scope, patch: ReportPatch) {
    const row = state().reports.find((r) => r.id === id && inScope(r, scope));
    if (!row) return null;
    Object.assign(row, clone(patch), { updatedAt: new Date().toISOString() });
    return clone(strip(row));
  }

  async listEvents(reportId: string) {
    return state()
      .events.filter((e) => e.reportId === reportId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(clone);
  }

  async getIncidentReview(scope: Scope, villageCode: string, hazard: string) {
    const row = state().incidents.find(
      (i) => inScope(i, scope) && i.villageCode === villageCode && i.hazard === hazard,
    );
    return row ? clone(strip(row)) : null;
  }

  async listIncidentReviews(scope: Scope) {
    return state()
      .incidents.filter((i) => inScope(i, scope))
      .map((i) => clone(strip(i)));
  }

  async saveIncidentReview(review: IncidentReview, scope: Scope) {
    const list = state().incidents;
    const idx = list.findIndex(
      (i) =>
        inScope(i, scope) && i.villageCode === review.villageCode && i.hazard === review.hazard,
    );
    const row = clone({ ...review, regencyCode: scope.regencyCode });
    if (idx >= 0) list[idx] = row;
    else list.push(row);
  }

  async publishBoard(version: BoardVersion, scope: Scope) {
    state().boards.push(clone({ ...version, regencyCode: scope.regencyCode }));
  }

  async listLatestBoards(scope: Scope) {
    const latest = new Map<string, Row<BoardVersion>>();
    for (const b of state().boards.filter((x) => inScope(x, scope))) {
      const cur = latest.get(b.villageCode);
      if (!cur || b.publishedAt > cur.publishedAt) latest.set(b.villageCode, b);
    }
    return [...latest.values()].map((b) => clone(strip(b)));
  }

  async listBoardVersions(scope: Scope, villageCode: string) {
    return state()
      .boards.filter((b) => inScope(b, scope) && b.villageCode === villageCode)
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .map((b) => clone(strip(b)));
  }

  async cacheGet(key: string) {
    return state().cache.has(key) ? clone(state().cache.get(key)) : null;
  }

  async cacheSet(key: string, value: unknown) {
    state().cache.set(key, clone(value));
  }

  async hitRateLimit(key: string, windowStart: string) {
    const k = `${key}|${windowStart}`;
    const next = (state().rate.get(k) ?? 0) + 1;
    state().rate.set(k, next);
    return next;
  }

  async incrementUsage(day: string) {
    const next = (state().usage.get(day) ?? 0) + 1;
    state().usage.set(day, next);
    return next;
  }

  async getUsage(day: string) {
    return state().usage.get(day) ?? 0;
  }

  async purge(now: Date, demoOlderThan: Date) {
    const s = state();
    const nowIso = now.toISOString();
    const demoIso = demoOlderThan.toISOString();
    const expired = (r: Row<Report>) => r.expiresAt < nowIso;
    const oldDemo = (r: Row<Report>) => r.demoSessionId !== null && r.createdAt < demoIso;
    const reports = s.reports.filter((r) => expired(r) && !oldDemo(r)).length;
    const demo = s.reports.filter(oldDemo).length;
    const removed = new Set(s.reports.filter((r) => expired(r) || oldDemo(r)).map((r) => r.id));
    s.reports = s.reports.filter((r) => !removed.has(r.id));
    s.events = s.events.filter((e) => !removed.has(e.reportId));
    s.incidents = s.incidents.filter((i) => !(i.demoSessionId !== null && i.reviewedAt < demoIso));
    s.boards = s.boards.filter((b) => !(b.demoSessionId !== null && b.publishedAt < demoIso));
    return { reports, demo };
  }
}
