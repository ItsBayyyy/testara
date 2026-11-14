import type { Metadata } from "next";
import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";
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
        <h1 className="text-[1.75rem]">Kode laporan tidak ditemukan</h1>
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
    <div className="flex flex-col gap-7">
      <AutoRefresh />
      <div>
        <h1 className="text-[1.75rem]">
          {isNew ? "Laporan Anda sudah kami terima." : "Status laporan"}
        </h1>
        {isNew && <p className="mt-2">Simpan kode ini untuk melihat perkembangannya.</p>}
      </div>

      <section
        aria-label="Kode laporan"
        className="panel flex flex-col items-start gap-4 rounded-[var(--radius-receipt)] border-2 border-ink px-5 py-6"
      >
        <p className="text-base text-ink-2">Kode laporan</p>
        <p className="code-text break-all text-[2.5rem] font-bold leading-none tracking-wide">
          {report.publicCode}
        </p>
        <CopyButton text={report.publicCode} label="Salin kode" doneLabel="Kode disalin." />
      </section>

      <section aria-labelledby="perkembangan" className="flex flex-col gap-4">
        <h2 id="perkembangan" className="text-xl">
          Perkembangan
        </h2>
        <Timeline steps={steps} />
        <p className="flag-action panel px-4 py-3 text-base">
          Status ini menunjukkan laporan Anda sudah diproses petugas, bukan jaminan waktu kedatangan
          bantuan.
        </p>
      </section>

      <section aria-labelledby="rincian" className="flex flex-col gap-2">
        <h2 id="rincian" className="text-xl">
          Rincian
        </h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="text-ink-2">Desa</dt>
          <dd>{village ? villageLabel(village) : "tidak disebut"}</dd>
          <dt className="text-ink-2">Kebutuhan</dt>
          <dd>
            {report.needs.length
              ? report.needs.map((n) => NEED_LABELS[n]).join(", ")
              : "tidak disebut"}
          </dd>
          <dt className="text-ink-2">Diperbarui</dt>
          <dd className="num">{formatDateTime(lastUpdate)}</dd>
        </dl>
      </section>

      <div className="flex flex-col gap-3">
        {village && (
          <Link href={`/info/${villageSlug(village.code)}`} className="btn btn-primary">
            Lihat papan info {villageLabel(village)}
          </Link>
        )}
        <Link href={`/status/${report.publicCode}`} className="btn btn-quiet">
          Perbarui status
        </Link>
      </div>
    </div>
  );
}
