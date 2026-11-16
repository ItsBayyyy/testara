/** Ajakan menelepon nomor darurat. Selalu tampil paling atas di halaman lapor. */
export function EmergencyNotice({ number }: { number: string }) {
  const tel = number.replace(/[^\d+]/g, "");
  return (
    <section
      aria-labelledby="darurat-judul"
      className="alert-call flex items-center justify-between gap-4 py-2 pl-4 pr-2"
    >
      <h2 id="darurat-judul" className="text-base font-normal">
        Nyawa terancam?
      </h2>
      <a
        href={`tel:${tel}`}
        className="btn shrink-0 border-white bg-white text-ink hover:bg-bg active:bg-line"
      >
        Telepon {number}
      </a>
    </section>
  );
}
