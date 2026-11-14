import type { ReportStatus } from "./types";

// Transisi status laporan. Linimasa korban harus selalu urut:
// Diterima -> Dibaca petugas -> (Masuk laporan resmi | Perlu konfirmasi).

const ALLOWED: Record<ReportStatus, ReportStatus[]> = {
  diterima: ["dibaca", "resmi", "perlu_konfirmasi"],
  dibaca: ["resmi", "perlu_konfirmasi"],
  resmi: ["perlu_konfirmasi"],
  perlu_konfirmasi: ["resmi"],
};

export function canTransition(from: ReportStatus, to: ReportStatus): boolean {
  return ALLOWED[from].includes(to);
}

/**
 * Status yang perlu dicatat di linimasa untuk berpindah dari `from` ke `to`.
 * Lompat langsung dari Diterima ke status akhir tetap mencatat "Dibaca petugas",
 * karena status akhir mustahil tanpa dibaca.
 */
export function transitionSteps(from: ReportStatus, to: ReportStatus): ReportStatus[] {
  if (!canTransition(from, to)) return [];
  if (from === "diterima" && to !== "dibaca") return ["dibaca", to];
  return [to];
}

export type TimelineStep = {
  key: "diterima" | "dibaca" | "akhir";
  label: string;
  done: boolean;
  at: string | null;
};

/** Susun tiga langkah linimasa korban dari riwayat status. */
export function buildTimeline(
  events: { status: ReportStatus; createdAt: string }[],
): TimelineStep[] {
  const firstAt = (s: ReportStatus) => events.find((e) => e.status === s)?.createdAt ?? null;
  const last = [...events]
    .reverse()
    .find((e) => e.status === "resmi" || e.status === "perlu_konfirmasi");
  return [
    { key: "diterima", label: "Diterima", done: true, at: firstAt("diterima") },
    {
      key: "dibaca",
      label: "Dibaca petugas",
      done: firstAt("dibaca") !== null,
      at: firstAt("dibaca"),
    },
    {
      key: "akhir",
      label: last
        ? last.status === "resmi"
          ? "Masuk laporan resmi"
          : "Perlu konfirmasi"
        : "Masuk laporan resmi atau perlu konfirmasi",
      done: last !== undefined,
      at: last?.createdAt ?? null,
    },
  ];
}
