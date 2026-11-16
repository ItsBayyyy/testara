"use client";

/**
 * Klik angka: gulir ke kutipan sumbernya dan beri satu sapuan stabilo.
 * Gerak dimatikan otomatis oleh CSS jika pengguna memilih kurangi gerakan.
 */
export function EvidenceJump({
  targetId,
  children,
}: {
  targetId: string;
  children: React.ReactNode;
}) {
  function jump() {
    const el = document.getElementById(targetId);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
    el.removeAttribute("data-sweep");
    // Paksa reflow agar animasi bisa diputar ulang pada klik berikutnya.
    void el.getBoundingClientRect();
    el.setAttribute("data-sweep", "true");
  }
  return (
    <button
      type="button"
      onClick={jump}
      className="num font-bold underline decoration-dotted underline-offset-4"
    >
      {children}
    </button>
  );
}
