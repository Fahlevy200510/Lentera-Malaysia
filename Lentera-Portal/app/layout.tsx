import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "LENTERA — Adaptive Science Lab Companion",
  description:
    "LENTERA: an adaptive science lab companion for blind and visually impaired learners, powered by the Smart Tactile Experiment Board and Context-Aware Learning Engine.",
  icons: {
    icon: "/logo-lentera.png",
    shortcut: "/logo-lentera.png",
    apple: "/logo-lentera.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
