import {
  COUNT_FIELDS,
  type ClaimField,
  type CountField,
  type IncidentReview,
} from "@/lib/domain/types";
import type { IncidentGroup } from "./group";
import { isCountField } from "./verify";

// Pilihan petugas di meja periksa. Klien hanya mengirim urutan nilai yang dipilih;
// nilainya diambil ulang dari data server supaya tidak bisa diisi angka karangan.

/** Field hitungan yang selalu ditampilkan, meski tidak disebut ("tidak disebut", bukan 0). */
export const ALWAYS_SHOWN: CountField[] = [
  "meninggal",
  "hilang",
  "luka",
  "mengungsi_kk",
  "mengungsi_jiwa",
];

export function resolveChoices(
  group: IncidentGroup,
  picks: Partial<Record<ClaimField, number>>,
): { chosen: IncidentReview["chosen"]; missing: ClaimField[] } {
  const chosen: IncidentReview["chosen"] = {};
  const missing: ClaimField[] = [];
  for (const f of group.fields.filter((x) => isCountField(x.field))) {
    if (f.values.length === 1 && f.values[0]) {
      chosen[f.field] = f.values[0].value;
      continue;
    }
    const pick = picks[f.field];
    const value = pick === undefined ? undefined : f.values[pick];
    if (value) chosen[f.field] = value.value;
    else missing.push(f.field);
  }
  return { chosen, missing };
}

/** Angka berbeda yang belum dipilih petugas pada ulasan tersimpan. */
export function differingLeft(group: IncidentGroup, review: IncidentReview | null): number {
  return group.fields.filter((f) => f.differs && review?.chosen[f.field] === undefined).length;
}

/** Nilai untuk ringkasan WhatsApp: hanya angka yang sudah diperiksa, urut sesuai daftar field. */
export function summaryValues(group: IncidentGroup, review: IncidentReview | null) {
  if (!review) return [];
  return COUNT_FIELDS.filter((field) => review.chosen[field] !== undefined).map((field) => {
    const value = review.chosen[field] as number | string;
    const evidence =
      group.fields.find((f) => f.field === field)?.values.find((v) => v.value === value)
        ?.evidence ?? [];
    return {
      field,
      value,
      approximate: evidence.length > 0 && evidence.every((e) => e.approximate),
    };
  });
}
