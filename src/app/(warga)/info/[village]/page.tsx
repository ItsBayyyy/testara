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
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-xl">{title}</h1>
        <p className="mt-1 text-ink-2">
          Kecamatan {village.districtName}
          {latest && (
            <>
              . Diperbarui petugas{" "}
              <span className="num font-semibold text-ink">
                {formatDateTime(latest.publishedAt)}
              </span>
            </>
          )}
        </p>
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
        <div className="flex flex-col gap-4">
          <p>Belum ada papan info resmi untuk desa ini.</p>
          <Link href="/lapor" className="btn btn-primary self-start">
            Kirim laporan
          </Link>
        </div>
      )}
    </div>
  );
}
