import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff, staffScope } from "@/lib/auth/staff";
import { getStore } from "@/lib/db";
import { HAZARD_LABELS } from "@/lib/domain/labels";
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
      <h1 className="text-2xl">Kejadian</h1>
      <p className="mt-1 text-ink-2">
        Laporan dikelompokkan per desa dan jenis bencana. Periksa angka yang berbeda sebelum
        diteruskan ke pimpinan.
      </p>
      {groups.length === 0 ? (
        <p className="panel mt-6 px-4 py-4">
          Belum ada kejadian. Kejadian terbentuk dari laporan yang desanya sudah diketahui.
        </p>
      ) : (
        <ul className="panel mt-6 divide-y divide-line">
          {groups.map((g) => {
            const village = findVillage(g.villageCode);
            const review =
              reviews.find((r) => r.villageCode === g.villageCode && r.hazard === g.hazard) ?? null;
            const left = differingLeft(g, review);
            return (
              <li
                key={g.key}
                className={left > 0 || !review ? "flag-action" : "border-l-4 border-l-transparent"}
              >
                <Link
                  href={`/petugas/kejadian/${g.key}`}
                  className="block px-4 py-3 no-underline hover:bg-bg"
                >
                  <span className="font-bold underline">
                    {HAZARD_LABELS[g.hazard]}, {village ? villageLabel(village) : g.villageCode}
                  </span>
                  <span className="block text-[0.9375rem] text-ink-2">
                    <span className="num">{g.reportIds.length}</span> laporan, terakhir{" "}
                    <span className="num">{formatDateTime(g.lastAt)}</span>
                  </span>
                  <span className="block text-[0.9375rem]">
                    {left > 0 && (
                      <span className="font-bold text-action-ink">
                        <span className="num">{left}</span> angka berbeda.{" "}
                      </span>
                    )}
                    {review ? (
                      <span>
                        Sudah diperiksa{" "}
                        <span className="num">{formatDateTime(review.reviewedAt)}</span>
                      </span>
                    ) : (
                      <span className="font-bold text-action-ink">Belum diperiksa</span>
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
