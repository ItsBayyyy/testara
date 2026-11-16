import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff, staffScope } from "@/lib/auth/staff";
import { getStore } from "@/lib/db";
import { incidentTitle } from "@/lib/domain/labels";
import { differingLeft } from "@/lib/extract/review";
import { formatDateTime } from "@/lib/format";
import { loadIncidents } from "@/lib/incidents";
import { findVillage, villageLabel } from "@/lib/wilayah";

export const metadata: Metadata = { title: "Kejadian", robots: { index: false } };

export default async function IncidentsPage() {
  const scope = staffScope(await requireStaff());
  const [groups, reviews] = await Promise.all([
    loadIncidents(scope),
    getStore().listIncidentReviews(scope),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-xl">Kejadian</h1>
      <p className="mt-1 text-ink-2">Per desa dan jenis bencana.</p>
      {groups.length === 0 ? (
        <p className="mt-6">
          Belum ada kejadian. Kejadian terbentuk dari laporan yang desanya sudah diketahui.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-line border-y border-line bg-surface">
          {groups.map((g) => {
            const village = findVillage(g.villageCode);
            const review =
              reviews.find((r) => r.villageCode === g.villageCode && r.hazard === g.hazard) ?? null;
            const left = differingLeft(g, review);
            return (
              <li key={g.key}>
                <Link
                  href={`/petugas/kejadian/${g.key}`}
                  className="block px-4 py-3 no-underline hover:bg-bg"
                >
                  <span className="font-bold underline">
                    {incidentTitle(g.hazard)}, {village ? villageLabel(village) : g.villageCode}
                  </span>
                  <span className="block text-sm text-ink-2">
                    <span className="num">{g.reportIds.length}</span> laporan, terakhir{" "}
                    <span className="num">{formatDateTime(g.lastAt)}</span>
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-2">
                    {left > 0 && (
                      <span className="tag tag-action">
                        <span className="num">{left}</span> angka berbeda
                      </span>
                    )}
                    {review ? (
                      <span className="text-ink-2">
                        Sudah diperiksa{" "}
                        <span className="num">{formatDateTime(review.reviewedAt)}</span>
                      </span>
                    ) : (
                      <span className="tag tag-action">Belum diperiksa</span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
