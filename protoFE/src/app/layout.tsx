import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "debat.in — Arena Argumentasi Harian",
  description:
    "Prototype FE: beradu argumen 3 ronde melawan AI, mosi harian, dinilai 4 dimensi. (Data simulasi.)",
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
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
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
