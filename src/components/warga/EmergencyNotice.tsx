/** Ajakan menelepon nomor darurat. Selalu tampil di atas formulir lapor. */
export function EmergencyNotice({ number }: { number: string }) {
  const tel = number.replace(/[^\d+]/g, "");
  return (
    <section
      aria-labelledby="darurat-judul"
      className="flag-action panel flex flex-wrap items-center justify-between gap-3 px-4 py-3"
    >
      <div>
        <h2 id="darurat-judul" className="text-lg">
          Ada yang terancam nyawanya?
        </h2>
        <p>Telepon {number} sekarang. Testara tidak menggantikan layanan darurat.</p>
      </div>
      <a href={`tel:${tel}`} className="btn btn-primary">
        Telepon {number}
      </a>
    </section>
  );
}
