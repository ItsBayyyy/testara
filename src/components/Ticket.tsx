import type { ReactNode } from "react";

/**
 * Karcis laporan: kepala biru, kode besar, tepi bawah sobek.
 * Dipakai di tanda terima/status (besar) dan di layar petugas (kecil).
 */
export function Ticket({
  code,
  caption,
  small = false,
  children,
}: {
  code: string;
  caption: ReactNode;
  small?: boolean;
  children?: ReactNode;
}) {
  return (
    <section aria-label="Karcis laporan" className={`ticket ${small ? "ticket-small" : ""}`}>
      <p className="text-sm text-ink-2">{caption}</p>
      <p className={`code-text whitespace-nowrap ${small ? "mt-1 text-lg" : "mt-2 text-code"}`}>
        {code}
      </p>
      {children}
    </section>
  );
}
