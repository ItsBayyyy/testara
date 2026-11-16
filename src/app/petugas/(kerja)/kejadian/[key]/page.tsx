import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/CopyButton";
import { HighlightedText } from "@/components/petugas/HighlightedText";
import { requireStaff, staffScope } from "@/lib/auth/staff";
import { getStore } from "@/lib/db";
import { FIELD_LABELS, incidentTitle, STATUS_LABELS } from "@/lib/domain/labels";
import { ALWAYS_SHOWN, differingLeft, summaryValues } from "@/lib/extract/review";
import { formatDateTime } from "@/lib/format";
import { loadIncidents } from "@/lib/incidents";
import { buildIncidentSummary } from "@/lib/whatsapp/format";
import { findVillage, villageLabel } from "@/lib/wilayah";
import { ReviewForm, type ReviewRow } from "./ReviewForm";

export const metadata: Metadata = { title: "Meja periksa", robots: { index: false } };

const evidenceId = (reportId: string, claimIndex: number) => `bukti-${reportId}-${claimIndex}`;

export default async function IncidentPage({ params }: PageProps<"/petugas/kejadian/[key]">) {
  const { key } = await params;
  const scope = staffScope(await requireStaff());
  const store = getStore();
  const group = (await loadIncidents(scope)).find((g) => g.key === key);
  if (!group) notFound();

  const village = findVillage(group.villageCode);
  const label = village ? villageLabel(village) : group.villageCode;
  const review = await store.getIncidentReview(scope, group.villageCode, group.hazard);
  const reports = (await store.listReports(scope)).filter((r) => group.reportIds.includes(r.id));

  const shown = new Set([...ALWAYS_SHOWN, ...group.fields.map((f) => f.field)]);
  const rows: ReviewRow[] = [...shown].map((field) => {
    const summary = group.fields.find((f) => f.field === field);
    const values = summary?.values ?? [];
    const chosen = review?.chosen[field];
    return {
      field,
      label: FIELD_LABELS[field],
      differs: summary?.differs ?? false,
      chosenIndex: chosen === undefined ? null : values.findIndex((v) => v.value === chosen),
      values: values.map((v) => ({
        display: `${v.evidence.every((e) => e.approximate) && typeof v.value === "number" ? "sekitar " : ""}${v.value}`,
        evidenceCount: new Set(v.evidence.map((e) => e.reportId)).size,
        firstEvidenceId: evidenceId(v.evidence[0]?.reportId ?? "", v.evidence[0]?.claimIndex ?? 0),
      })),
    };
  });

  const summaryText = buildIncidentSummary({
    villageLabel: label,
    districtName: village?.districtName ?? "",
    hazardLabel: incidentTitle(group.hazard),
    reportCount: group.reportIds.length,
    values: summaryValues(group, review),
    reviewedAt: review ? formatDateTime(review.reviewedAt) : null,
    differingLeft: differingLeft(group, review),
  });

  return (
    <div className="lg:grid lg:grid-cols-2">
      <section
        aria-labelledby="judul-kejadian"
        className="border-r border-line bg-surface px-4 py-6 lg:px-6"
      >
        <Link href="/petugas/kejadian" className="font-bold">
          Semua kejadian
        </Link>
        <h1 id="judul-kejadian" className="mt-2 text-xl">
          {incidentTitle(group.hazard)}, {label}
        </h1>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-ink-2">
          <span className="num">{group.reportIds.length}</span> laporan.
          {review ? (
            <>
              Diperiksa {review.reviewedBy},{" "}
              <span className="num">{formatDateTime(review.reviewedAt)}</span>.
            </>
          ) : (
            <span className="tag tag-action">Belum diperiksa</span>
          )}
        </p>
        <p className="mt-3 text-sm text-ink-2">
          Klik angka untuk melihat kalimat sumbernya. Angka yang berbeda antar pelapor tidak dipilih
          otomatis.
        </p>
        <div className="mt-4">
          <ReviewForm incidentKey={group.key} rows={rows} />
        </div>

        <section aria-labelledby="judul-ringkasan" className="mt-12">
          <h2 id="judul-ringkasan" className="text-lg">
            Ringkasan untuk WhatsApp
          </h2>
          <p className="hint">Hanya berisi angka yang sudah diperiksa.</p>
          <pre className="notice mt-2 whitespace-pre-wrap px-3 py-2 font-sans text-sm">
            {summaryText}
          </pre>
          <div className="mt-2">
            <CopyButton text={summaryText} label="Salin ringkasan" doneLabel="Ringkasan disalin." />
          </div>
        </section>
      </section>

      <section
        aria-labelledby="judul-sumber"
        className="px-4 py-6 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto lg:px-6"
      >
        <h2 id="judul-sumber" className="text-lg">
          Pesan sumber
        </h2>
        <ol className="mt-4 flex flex-col gap-3">
          {reports
            .sort((a, b) =>
              (a.sourceMeta?.sentAt ?? a.createdAt).localeCompare(
                b.sourceMeta?.sentAt ?? b.createdAt,
              ),
            )
            .map((r) => (
              <li key={r.id} className="rounded-[var(--radius-sheet)] bg-surface px-4 py-3">
                <p className="num text-sm text-ink-2">
                  {formatDateTime(r.sourceMeta?.sentAt ?? r.createdAt)},{" "}
                  {r.source === "form"
                    ? "formulir"
                    : `WhatsApp${r.sourceMeta?.sender ? ` (${r.sourceMeta.sender})` : ""}`}
                  , {STATUS_LABELS[r.status]}
                </p>
                <div className="mt-1">
                  <HighlightedText
                    text={r.storyText || "(tanpa cerita)"}
                    quotes={(r.extraction?.claims ?? []).map((c, i) => ({
                      id: evidenceId(r.id, i),
                      quote: c.quote,
                    }))}
                  />
                </div>
                <Link href={`/petugas?laporan=${r.id}`} className="mt-2 inline-block">
                  Buka laporan <span className="code-text">{r.publicCode}</span>
                </Link>
              </li>
            ))}
        </ol>
      </section>
    </div>
  );
}
