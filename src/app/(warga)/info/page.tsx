import type { Metadata } from "next";
import Link from "next/link";
import { getStore } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getRequestScope } from "@/lib/server/scope";
import { findVillage, getRegency, villageLabel, villageSlug } from "@/lib/wilayah";

export const metadata: Metadata = { title: "Papan info desa" };

export default async function InfoIndexPage() {
  const scope = await getRequestScope();
  const boards = await getStore().listLatestBoards(scope);
  const regency = getRegency();
  const rows = boards
    .map((b) => ({ board: b, village: findVillage(b.villageCode) }))
    .filter((r) => r.village !== null)
    .sort((a, b) => b.board.publishedAt.localeCompare(a.board.publishedAt));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl">Papan info desa</h1>
        <p className="mt-1 text-ink-2">
          Informasi resmi dari petugas posko di {regency.name}. Hanya berisi yang sudah diterbitkan
          petugas.
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="sheet">
          Belum ada papan info yang diterbitkan. Jika butuh bantuan sekarang,{" "}
          <Link href="/lapor" className="font-bold underline">
            kirim laporan
          </Link>
          .
        </p>
      ) : (
        <ul className="sheet divide-y divide-line !py-0">
          {rows.map(({ board, village }) => (
            <li key={board.villageCode}>
              <Link
                href={`/info/${villageSlug(board.villageCode)}`}
                className="flex min-h-14 flex-col py-4 no-underline hover:bg-bg"
              >
                <span className="text-lg font-bold underline">
                  {village && villageLabel(village)}
                </span>
                <span className="text-sm text-ink-2">
                  Kecamatan {village?.districtName}. Diperbarui{" "}
                  <span className="num">{formatDateTime(board.publishedAt)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
