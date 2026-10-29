import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { ViewModeProvider } from "@/components/view-mode";

export const metadata: Metadata = {
  title: "B047 WWT — Engineering Dossier | RAMSIS Engineering",
  description:
    "Design calculations, equipment register, make-vs-buy, BOM/MTO, procurement recommendations and estimate for the 500 m³/h Diwanya Refinery Waste Water Treatment package.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <ViewModeProvider>
          <Nav />
          <main className="mx-auto max-w-[1500px] px-4 py-6">{children}</main>
          <footer className="mt-10 border-t border-line px-4 py-5">
            <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-2 text-[10.5px] text-mist-400">
              <span>
                RAMSIS Engineering W.L.L., Bahrain · B047 WWT dossier · Rev A (pre-bid)
              </span>
              <span className="font-mono">2024B047-MR-0022 Rev B · BOD-0001 Rev 1 · BOD-0002 Rev 0</span>
            </div>
          </footer>
        </ViewModeProvider>
      </body>
    </html>
  );
}
