import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff, staffScope } from "@/lib/auth/staff";
import { emptyBoard } from "@/lib/board/items";
import { getStore } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { villageFromSlug, villageLabel, villageSlug } from "@/lib/wilayah";
import { BoardEditor } from "./BoardEditor";

export const metadata: Metadata = { title: "Sunting papan info", robots: { index: false } };

export default async function EditBoardPage({ params }: PageProps<"/petugas/papan/[village]">) {
  const village = villageFromSlug((await params).village);
  if (!village) notFound();
  const scope = staffScope(await requireStaff());
  const versions = await getStore().listBoardVersions(scope, village.code);
  const latest = versions[0];

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-6 lg:grid-cols-[1fr_18rem]">
      <div>
        <Link href="/petugas/papan" className="font-semibold">
          Semua papan info
        </Link>
        <h1 className="mt-2 text-2xl">Papan info {villageLabel(village)}</h1>
        <p className="mb-6 text-ink-2">
          Kecamatan {village.districtName}. Warga hanya melihat isi yang sudah diterbitkan.
        </p>
        <BoardEditor
          villageCode={village.code}
          villageName={villageLabel(village)}
          initial={latest?.content ?? emptyBoard()}
        />
      </div>
      <aside aria-labelledby="judul-riwayat" className="lg:pt-10">
        <h2 id="judul-riwayat" className="text-lg">
          Riwayat terbit
        </h2>
        {versions.length === 0 ? (
          <p className="text-ink-2">Belum pernah diterbitkan.</p>
        ) : (
          <ol className="panel mt-2 divide-y divide-line">
            {versions.map((v, i) => (
              <li key={v.id} className="px-3 py-2 text-[0.9375rem]">
                <span className="num font-semibold">{formatDateTime(v.publishedAt)}</span>
                {i === 0 && " (tampil sekarang)"}
                <span className="block text-ink-2">oleh {v.publishedBy}</span>
              </li>
            ))}
          </ol>
        )}
        {latest && (
          <Link href={`/info/${villageSlug(village.code)}`} className="btn btn-quiet mt-3 w-full">
            Lihat halaman warga
          </Link>
        )}
      </aside>
    </div>
  );
}
