import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff, staffScope } from "@/lib/auth/staff";
import { getStore } from "@/lib/db";
import { NEED_LABELS, STATUS_LABELS, VULNERABLE_LABELS } from "@/lib/domain/labels";
import { REPORT_STATUSES, type Report, type ReportStatus } from "@/lib/domain/types";
import { formatDateTime } from "@/lib/format";
import { urgencyRank } from "@/lib/triage/rules";
import { findVillage, listVillages } from "@/lib/wilayah";
import { ProcessPending } from "./ProcessPending";
import { ReportDetail } from "./ReportDetail";

export const metadata: Metadata = { title: "Antrean laporan", robots: { index: false } };

function sortQueue(reports: Report[]): Report[] {
  return [...reports].sort(
    (a, b) =>
      urgencyRank(b.urgency) - urgencyRank(a.urgency) || b.createdAt.localeCompare(a.createdAt),
  );
}

function shortLine(r: Report): string {
  const parts = [
    ...r.needs.map((n) => NEED_LABELS[n].toLowerCase()),
    ...r.vulnerable.map((v) => VULNERABLE_LABELS[v].toLowerCase()),
  ];
  if (parts.length) return parts.join(", ");
  return r.extraction?.summary ?? r.storyText.slice(0, 60);
}

function QueueItem({ r, selected, query }: { r: Report; selected: boolean; query: string }) {
  const village = findVillage(r.villageCode);
  return (
    <li>
      <Link
        href={`/petugas?${query}${query ? "&" : ""}laporan=${r.id}`}
        aria-current={selected ? "true" : undefined}
        className={`block border-b border-line px-4 py-3 no-underline hover:bg-bg ${
          r.urgency === "tinggi" ? "flag-action" : "border-l-4 border-l-transparent"
        } ${selected ? "bg-bg" : ""}`}
      >
        <span className="flex justify-between gap-2">
          <span className="font-semibold">{village?.name ?? "Desa belum diketahui"}</span>
          <span className="num text-[0.875rem] text-ink-2">{formatDateTime(r.createdAt)}</span>
        </span>
        <span className="block text-[0.9375rem]">{shortLine(r)}</span>
        <span className="block text-[0.875rem] text-ink-2">
          {STATUS_LABELS[r.status]}
          {r.source === "whatsapp" && ", dari WhatsApp"}
          {r.aiState !== "selesai" && ", belum dirapikan AI"}
        </span>
      </Link>
    </li>
  );
}

export default async function QueuePage({ searchParams }: PageProps<"/petugas">) {
  const staff = await requireStaff();
  const scope = staffScope(staff);
  const params = await searchParams;
  const desa = typeof params.desa === "string" ? params.desa : "";
  const status =
    typeof params.status === "string" && REPORT_STATUSES.includes(params.status as ReportStatus)
      ? (params.status as ReportStatus)
      : undefined;
  const selectedId = typeof params.laporan === "string" ? params.laporan : null;

  const store = getStore();
  const reports = sortQueue(
    await store.listReports(scope, { villageCode: desa || undefined, status }),
  );
  const urgent = reports.filter((r) => r.urgency === "tinggi");
  const others = reports.filter((r) => r.urgency !== "tinggi");
  const selected = selectedId ? await store.getReport(selectedId, scope) : null;
  const pending = reports
    .filter((r) => r.aiState === "menunggu")
    .slice(0, 5)
    .map((r) => r.id);

  const villages = listVillages();
  const reportedVillages = [...new Set((await store.listReports(scope)).map((r) => r.villageCode))]
    .map((c) => findVillage(c))
    .filter((v) => v !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
  const query = new URLSearchParams({
    ...(desa && { desa }),
    ...(status && { status }),
  }).toString();

  return (
    <>
      <ProcessPending ids={pending} />
      <div className="lg:grid lg:min-h-[calc(100dvh-3.5rem)] lg:grid-cols-[minmax(20rem,26rem)_1fr]">
        <section
          aria-labelledby="judul-antrean"
          className={`border-r border-line ${selected ? "max-lg:hidden" : ""}`}
        >
          <div className="border-b border-line px-4 py-3">
            <h1 id="judul-antrean" className="text-xl">
              Antrean <span className="num">({reports.length})</span>
            </h1>
            <form className="mt-2 flex flex-wrap items-end gap-2" action="/petugas">
              <div>
                <label htmlFor="filter-desa" className="text-[0.875rem] font-semibold">
                  Desa
                </label>
                <select
                  id="filter-desa"
                  name="desa"
                  defaultValue={desa}
                  className="field !min-h-10 !py-1"
                >
                  <option value="">Semua desa</option>
                  {reportedVillages.map((v) => (
                    <option key={v.code} value={v.code}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="filter-status" className="text-[0.875rem] font-semibold">
                  Status
                </label>
                <select
                  id="filter-status"
                  name="status"
                  defaultValue={status ?? ""}
                  className="field !min-h-10 !py-1"
                >
                  <option value="">Semua status</option>
                  {REPORT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-secondary btn-compact">
                Saring
              </button>
            </form>
          </div>

          {reports.length === 0 ? (
            <p className="px-4 py-6 text-ink-2">
              {desa || status
                ? "Tidak ada laporan dengan saringan ini. Hapus saringan untuk melihat semua."
                : "Belum ada laporan. Laporan baru dari warga dan WhatsApp muncul di sini."}
            </p>
          ) : (
            <>
              <h2 className="px-4 pb-1 pt-4 text-[0.875rem] font-semibold text-ink-2">
                Mendesak <span className="num">({urgent.length})</span>
              </h2>
              <ul aria-label="Laporan mendesak">
                {urgent.map((r) => (
                  <QueueItem key={r.id} r={r} selected={r.id === selected?.id} query={query} />
                ))}
              </ul>
              <h2 className="px-4 pb-1 pt-5 text-[0.875rem] font-semibold text-ink-2">
                Lainnya <span className="num">({others.length})</span>
              </h2>
              <ul aria-label="Laporan lainnya">
                {others.map((r) => (
                  <QueueItem key={r.id} r={r} selected={r.id === selected?.id} query={query} />
                ))}
              </ul>
            </>
          )}
        </section>

        <section
          aria-label="Detail laporan"
          className={`px-4 py-4 lg:px-8 ${selected ? "" : "max-lg:hidden"}`}
        >
          {selected ? (
            <>
              <Link
                href={`/petugas${query ? `?${query}` : ""}`}
                className="mb-3 inline-block font-semibold lg:hidden"
              >
                Kembali ke antrean
              </Link>
              <ReportDetail report={selected} villages={villages} />
            </>
          ) : (
            <p className="text-ink-2">Pilih laporan di antrean untuk melihat rinciannya.</p>
          )}
        </section>
      </div>
    </>
  );
}
