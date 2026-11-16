"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/petugas", label: "Antrean" },
  { href: "/petugas/tambah-whatsapp", label: "Tambah dari WhatsApp" },
  { href: "/petugas/kejadian", label: "Kejadian" },
  { href: "/petugas/papan", label: "Papan info" },
] as const;

export function PetugasNav() {
  const path = usePathname();
  return (
    <nav aria-label="Menu petugas">
      <ul className="-mx-4 flex gap-x-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {ITEMS.map((item) => {
          const active =
            item.href === "/petugas" ? path === "/petugas" : path.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-10 items-center whitespace-nowrap border-b-4 px-2 no-underline ${active ? "border-spidol font-bold" : "border-transparent hover:border-line"}`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
