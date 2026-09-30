import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono, Newsreader } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Reveal } from "@/components/layout/Reveal";
import { SearchDialog } from "@/components/search/SearchDialog";
import { TODAY } from "@/lib/data/repository";
import { fmtStamp } from "@/lib/format";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-newsreader", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-jetbrains", display: "swap" });

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fightcore.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "FIGHTCORE — The core of MMA", template: "%s · FIGHTCORE" },
  description: "Datos, historia y scouting del MMA. Rating propio transparente, rankings, perfiles de luchador y comparaciones visuales.",
  applicationName: "FIGHTCORE",
  openGraph: { type: "website", siteName: "FIGHTCORE", locale: "es_ES" },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0b0c0e",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${archivo.variable} ${newsreader.variable} ${jetbrains.variable}`}>
      <body>
        <a href="#main" className="skip-link">Saltar al contenido</a>
        <Header stamp={fmtStamp(TODAY)} />
        <main id="main" tabIndex={-1}>{children}</main>
        <Footer />
        <SearchDialog />
        <Reveal />
      </body>
    </html>
  );
}
