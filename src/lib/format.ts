// Format waktu dan angka untuk tampilan. Semua waktu ditampilkan dalam WIB
// karena wilayah layanan (Bengkulu) berada di zona Asia/Jakarta.

const TIME = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  hour: "2-digit",
  minute: "2-digit",
});

const DATE = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  day: "numeric",
  month: "short",
});

/** "21.10, 14 Nov" */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${TIME.format(d)}, ${DATE.format(d)}`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : TIME.format(d);
}

/** Waktu lokal dari ekspor WhatsApp ("2026-11-14T21:05") ke ISO dengan zona WIB. */
export function wibLocalToIso(local: string): string {
  return new Date(`${local}:00+07:00`).toISOString();
}

/** Tanggal (YYYY-MM-DD) di zona WIB, untuk anggaran harian. */
export function wibDay(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(now);
}
