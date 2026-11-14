import type { Claim, ClaimField, Hazard, ReportSource } from "@/lib/domain/types";
import { CLAIM_FIELDS } from "@/lib/domain/types";
import { isCountField } from "./verify";

// Pengelompokan kejadian (CLAUDE.md 4D): satu kejadian = (desa, jenis bencana).
// Semua nilai disimpan beserta sumbernya; angka berbeda ditandai, tidak dipilih otomatis.

export type GroupableReport = {
  id: string;
  publicCode: string;
  villageCode: string | null;
  hazard: Hazard | null;
  claims: Claim[];
  source: ReportSource;
  at: string;
};

export type ValueEvidence = {
  reportId: string;
  /** Urutan klaim di laporan, untuk menunjuk kutipan yang tepat di layar. */
  claimIndex: number;
  publicCode: string;
  quote: string;
  approximate: boolean;
  source: ReportSource;
  at: string;
};

export type FieldValue = { value: number | string; evidence: ValueEvidence[] };

export type FieldSummary = {
  field: ClaimField;
  values: FieldValue[];
  /** true jika ada lebih dari satu angka berbeda untuk field hitungan. */
  differs: boolean;
};

export type IncidentGroup = {
  key: string;
  villageCode: string;
  hazard: Hazard;
  reportIds: string[];
  fields: FieldSummary[];
  differingCount: number;
  lastAt: string;
};

export function incidentKey(villageCode: string, hazard: Hazard): string {
  return `${villageCode.replace(/\./g, "")}-${hazard}`;
}

export function parseIncidentKey(key: string): { villageSlug: string; hazard: string } | null {
  const m = /^(\d{10})-([a-z_]+)$/.exec(key);
  return m && m[1] && m[2] ? { villageSlug: m[1], hazard: m[2] } : null;
}

function sameValue(a: number | string, b: number | string): boolean {
  if (typeof a === "number" && typeof b === "number") return a === b;
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

export function groupIncidents(reports: GroupableReport[]): IncidentGroup[] {
  const groups = new Map<string, IncidentGroup & { byField: Map<ClaimField, FieldValue[]> }>();

  for (const r of reports) {
    if (!r.villageCode) continue;
    const hazard = r.hazard ?? "lainnya";
    const key = incidentKey(r.villageCode, hazard);
    let g = groups.get(key);
    if (!g) {
      g = {
        key,
        villageCode: r.villageCode,
        hazard,
        reportIds: [],
        fields: [],
        differingCount: 0,
        lastAt: r.at,
        byField: new Map(),
      };
      groups.set(key, g);
    }
    g.reportIds.push(r.id);
    if (r.at > g.lastAt) g.lastAt = r.at;

    for (const [claimIndex, c] of r.claims.entries()) {
      const list = g.byField.get(c.field) ?? [];
      const evidence: ValueEvidence = {
        reportId: r.id,
        claimIndex,
        publicCode: r.publicCode,
        quote: c.quote,
        approximate: c.approximate,
        source: r.source,
        at: r.at,
      };
      const existing = list.find((v) => sameValue(v.value, c.value));
      if (existing) existing.evidence.push(evidence);
      else list.push({ value: c.value, evidence: [evidence] });
      g.byField.set(c.field, list);
    }
  }

  return [...groups.values()]
    .map(({ byField, ...g }) => {
      const fields: FieldSummary[] = CLAIM_FIELDS.filter((f) => byField.has(f)).map((field) => {
        const values = byField.get(field) ?? [];
        return { field, values, differs: isCountField(field) && values.length > 1 };
      });
      return { ...g, fields, differingCount: fields.filter((f) => f.differs).length };
    })
    .sort((a, b) => b.differingCount - a.differingCount || b.lastAt.localeCompare(a.lastAt));
}
