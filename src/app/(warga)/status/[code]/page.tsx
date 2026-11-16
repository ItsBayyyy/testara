import type { Metadata } from "next";
import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";
import { Ticket } from "@/components/Ticket";
import { Timeline } from "@/components/Timeline";
import { getStore } from "@/lib/db";
import { normalizePublicCode } from "@/lib/domain/code";
import { NEED_LABELS } from "@/lib/domain/labels";
import { buildTimeline } from "@/lib/domain/status";
import { formatDateTime } from "@/lib/format";
import { findVillage, villageLabel, villageSlug } from "@/lib/wilayah";
import { AutoRefresh } from "./AutoRefresh";

export const metadata: Metadata = { title: "Status laporan", robots: { index: false } };

export default async function StatusPage({ params, searchParams }: PageProps<"/status/[code]">) {
  const { code: rawCode } = await params;
  const { baru } = await searchParams;
  const code = normalizePublicCode(decodeURIComponent(rawCode));
  const store = getStore();
  const report = code ? await store.getReportByCode(code) : null;

  if (!report) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl">Kode laporan tidak ditemukan</h1>
        <p>
          Periksa lagi kodenya. Laporan juga dihapus otomatis setelah 30 hari, jadi kode lama tidak
          bisa dibuka.
        </p>
        <Link href="/status" className="btn btn-primary self-start">
          Masukkan kode lain
        </Link>
      </div>
    );
  }

  // Hanya kolom aman yang ditampilkan: tanpa isi cerita dan tanpa nomor HP.
  const events = await store.listEvents(report.id);
  const steps = buildTimeline(events);
  const village = findVillage(report.villageCode);
  const isNew = baru === "1";
  const lastUpdate = events.at(-1)?.createdAt ?? report.createdAt;

  return (
    <div className="flex flex-col gap-8">
      <AutoRefresh />
      <h1 className="text-xl">{isNew ? "Laporan Anda sudah kami terima." : "Status laporan"}</h1>

      <Ticket
        code={report.publicCode}
        caption={
          <>
            {village ? villageLabel(village) : "Karcis laporan"},{" "}
            <span className="num">{formatDateTime(report.createdAt)}</span>
          </>
        }
      >
        {isNew && <p className="mt-3 text-sm">Simpan kode ini untuk melihat perkembangannya.</p>}
        <div className="mt-4 flex flex-wrap items-start gap-x-4 gap-y-2">
          <CopyButton text={report.publicCode} label="Salin kode" doneLabel="Kode disalin." />
          <Link href={`/status/${report.publicCode}`} className="btn btn-quiet">
            Tautan halaman status
          </Link>
        </div>
      </Ticket>

      <section aria-label="Perkembangan" className="flex flex-col gap-4">
        <Timeline steps={steps} />
        <p className="text-sm text-ink-2">
          Status ini menunjukkan laporan Anda sudah diproses petugas, bukan jaminan waktu kedatangan
          bantuan.
        </p>
        <p className="text-sm text-ink-2">
          {report.needs.length
            ? report.needs.map((n) => NEED_LABELS[n]).join(", ")
            : "Kebutuhan tidak disebut"}
          . Diperbarui <span className="num">{formatDateTime(lastUpdate)}</span>.
        </p>
      </section>

      {village && (
        <Link href={`/info/${villageSlug(village.code)}`} className="btn btn-secondary w-full">
          Lihat papan info {villageLabel(village)}
        </Link>
      )}
    </div>
  );
}
