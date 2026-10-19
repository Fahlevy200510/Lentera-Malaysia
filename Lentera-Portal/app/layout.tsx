import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "LENTERA — Pendamping Lab Sains Adaptif",
  description:
    "LENTERA: pendamping lab sains adaptif untuk siswa tunanetra dan low vision, didukung Smart Tactile Experiment Board dan Context-Aware Learning Engine.",
  icons: {
    icon: "/logo-lentera.png",
    shortcut: "/logo-lentera.png",
    apple: "/logo-lentera.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
