import "server-only";
import type { Scope } from "@/lib/db";
import { getStore } from "@/lib/db";
import { groupIncidents, type IncidentGroup } from "@/lib/extract/group";

/** Semua kejadian dalam lingkup, dari laporan yang desanya sudah diketahui. */
export async function loadIncidents(scope: Scope): Promise<IncidentGroup[]> {
  const reports = await getStore().listReports(scope);
  return groupIncidents(
    reports.map((r) => ({
      id: r.id,
      publicCode: r.publicCode,
      villageCode: r.villageCode,
      hazard: r.extraction?.hazard ?? null,
      claims: r.extraction?.claims ?? [],
      source: r.source,
      at: r.sourceMeta?.sentAt ?? r.createdAt,
    })),
  );
}
