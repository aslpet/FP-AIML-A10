import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/ui/Navbar";

export const metadata: Metadata = {
  title: "debat.in",
  description:
    "Latih argumentasimu setiap hari. Beradu argumen 3 ronde melawan AI, topik dari berita terkini.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
