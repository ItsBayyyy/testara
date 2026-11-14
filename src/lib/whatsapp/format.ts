import type { ClaimField, Need, Vulnerable } from "@/lib/domain/types";
import { FIELD_LABELS, NEED_LABELS, VULNERABLE_LABELS } from "@/lib/domain/labels";

// Pesan WhatsApp tersusun: cadangan korban saat sinyal jelek, dan ringkasan
// kejadian untuk pimpinan. Format WA memakai *tebal*.

export function whatsappLink(number: string, text: string): string {
  const digits = number.replace(/\D/g, "").replace(/^0/, "62");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function whatsappShareLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export type FallbackReport = {
  villageLabel: string | null;
  needs: Need[];
  vulnerable: Vulnerable[];
  story: string;
  forSelf: boolean;
  phone: string | null;
};

export function buildFallbackReportMessage(r: FallbackReport): string {
  const lines = ["*Laporan warga (dikirim lewat WhatsApp karena sinyal)*"];
  lines.push(`Desa: ${r.villageLabel ?? "tidak disebut"}`);
  lines.push(
    `Kebutuhan: ${r.needs.length ? r.needs.map((n) => NEED_LABELS[n]).join(", ") : "tidak disebut"}`,
  );
  if (r.vulnerable.length) {
    lines.push(`Perlu didahulukan: ${r.vulnerable.map((v) => VULNERABLE_LABELS[v]).join(", ")}`);
  }
  lines.push(`Untuk: ${r.forSelf ? "pelapor sendiri" : "orang lain"}`);
  if (r.story.trim()) lines.push("", r.story.trim());
  if (r.phone) lines.push("", `Nomor yang bisa dihubungi: ${r.phone}`);
  return lines.join("\n");
}

export type SummaryInput = {
  villageLabel: string;
  districtName: string;
  hazardLabel: string;
  reportCount: number;
  values: { field: ClaimField; value: number | string; approximate: boolean }[];
  reviewedAt: string | null;
  differingLeft: number;
};

export function buildIncidentSummary(s: SummaryInput): string {
  const lines = [`*${s.hazardLabel} di ${s.villageLabel}, Kec. ${s.districtName}*`];
  lines.push(`Dari ${s.reportCount} laporan.`);
  if (s.values.length === 0) {
    lines.push("Belum ada angka yang sudah diperiksa.");
  } else {
    lines.push("");
    for (const v of s.values) {
      const prefix = v.approximate && typeof v.value === "number" ? "sekitar " : "";
      lines.push(`- ${FIELD_LABELS[v.field]}: *${prefix}${v.value}*`);
    }
  }
  if (s.differingLeft > 0) {
    lines.push("", `Masih ada ${s.differingLeft} angka berbeda yang belum dipilih petugas.`);
  }
  lines.push("", s.reviewedAt ? `Diperiksa petugas ${s.reviewedAt}.` : "Belum diperiksa petugas.");
  return lines.join("\n");
}
