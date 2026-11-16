import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BoardView } from "@/components/BoardView";
import { publicConfig } from "@/lib/config";
import { getStore } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getRequestScope } from "@/lib/server/scope";
import { villageFromSlug, villageLabel } from "@/lib/wilayah";
import { AskBox } from "./AskBox";
import { ShareButton } from "./ShareButton";

export async function generateMetadata({
  params,
}: PageProps<"/info/[village]">): Promise<Metadata> {
  const village = villageFromSlug((await params).village);
  return { title: village ? `Papan info ${villageLabel(village)}` : "Papan info" };
}

export default async function BoardPage({ params }: PageProps<"/info/[village]">) {
  const village = villageFromSlug((await params).village);
  if (!village) notFound();
  const scope = await getRequestScope();
  const [latest] = await getStore().listBoardVersions(scope, village.code);
  const config = publicConfig();
  const title = `Papan info ${villageLabel(village)}`;
  const poskoPhone = config.poskoWhatsApp.replace(/\D/g, "").replace(/^62/, "0");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl">{title}</h1>
        <p className="mt-1 text-ink-2">Kecamatan {village.districtName}</p>
        {latest && (
          <p className="mt-4 inline-flex flex-wrap items-baseline gap-x-2 bg-surface px-3 py-2">
            <span>Diperbarui petugas</span>
            <span className="num font-bold">{formatDateTime(latest.publishedAt)}</span>
          </p>
        )}
      </div>

      {latest ? (
        <>
          <AskBox
            villageCode={village.code}
            poskoPhone={poskoPhone}
            poskoIsExample={config.poskoIsExample}
          />
          <BoardView content={latest.content} />
          <ShareButton title={title} />
        </>
      ) : (
        <div className="sheet flex flex-col gap-4">
          <h2 className="text-lg">Belum ada papan info resmi untuk desa ini.</h2>
          <p>
            Petugas belum menerbitkan informasi. Jika butuh bantuan sekarang, kirim laporan, atau
            telepon {config.emergencyNumber} jika ada nyawa yang terancam.
          </p>
          <Link href="/lapor" className="btn btn-primary self-start">
            Kirim laporan
          </Link>
        </div>
      )}
    </div>
  );
}
