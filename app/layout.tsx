import type { Metadata, Viewport } from "next";
import { ViewTransition } from "react";
import { Archivo, JetBrains_Mono, Newsreader } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { THEME_SCRIPT } from "@/components/layout/theme-script";
import { BackToTop } from "@/components/layout/BackToTop";
import { NavProgress } from "@/components/layout/NavProgress";
import { Reveal } from "@/components/layout/Reveal";
import { ScrollDirection } from "@/components/layout/ScrollDirection";
import { ServiceWorker } from "@/components/layout/ServiceWorker";
import { SearchDialog } from "@/components/search/SearchDialog";
import { IS_DEMO, TODAY } from "@/lib/data/repository";
import { fmtDate, fmtStamp, SITE_URL } from "@/lib/format";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
// Reading face: "optional" never redraws text once shown (on a slow phone the
// late swap was pushing the largest paint back ~4 s); cached, it's there next time.
const newsreader = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-newsreader", display: "optional" });
// Small labels: not worth competing with the display face for the first bytes.
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-jetbrains", display: "swap", preload: false });

const SITE = SITE_URL;

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
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-theme is set before paint by THEME_SCRIPT, so React mustn't complain about it.
    <html lang="es" className={`${archivo.variable} ${newsreader.variable} ${jetbrains.variable}`} data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <a href="#main" className="skip-link">Saltar al contenido</a>
        <NavProgress />
        <Header stamp={fmtStamp(TODAY)} demo={IS_DEMO} />
        <main id="main" tabIndex={-1}>
          {/* Route changes crossfade instead of cutting (browsers with View Transitions). */}
          <ViewTransition>{children}</ViewTransition>
        </main>
        <Footer demo={IS_DEMO} asOf={fmtDate(TODAY)} />
        <SearchDialog demo={IS_DEMO} />
        <Reveal />
        <ScrollDirection />
        <BackToTop />
        <ServiceWorker />
      </body>
    </html>
  );
}
