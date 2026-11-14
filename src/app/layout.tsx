import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Mono, Atkinson_Hyperlegible_Next } from "next/font/google";
import "./globals.css";

// next/font mengunduh berkas font saat build dan menyajikannya dari domain sendiri.
const sans = Atkinson_Hyperlegible_Next({
  subsets: ["latin"],
  variable: "--font-atkinson",
  display: "swap",
  // Metrik fallback tidak tersedia untuk keluarga ini di next/font.
  adjustFontFallback: false,
  fallback: ["system-ui", "Segoe UI", "Roboto", "sans-serif"],
});

const mono = Atkinson_Hyperlegible_Mono({
  subsets: ["latin"],
  variable: "--font-atkinson-mono",
  display: "swap",
  weight: ["500", "700"],
  adjustFontFallback: false,
  fallback: ["ui-monospace", "Consolas", "monospace"],
});

const FULL_TITLE =
  "TESTARA: Platform Respons Bencana Dua Arah Berbasis AI untuk Pelaporan Korban Tanpa Aplikasi, Prioritas Penanganan Kelompok Rentan, dan Informasi Posko Terverifikasi";

export const metadata: Metadata = {
  title: {
    default: "Testara: Platform Respons Bencana Dua Arah",
    template: "%s | Testara",
  },
  description: FULL_TITLE,
  applicationName: "Testara",
};

export const viewport: Viewport = {
  themeColor: "#1b2a3a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
