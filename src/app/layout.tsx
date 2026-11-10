import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Belgische Staatsrekening | Inkomsten, uitgaven en overheidsschuld",
    template: "%s | Belgische Staatsrekening",
  },
  description:
    "Bekijk waar Belgisch overheidsgeld vandaan komt, waar het naartoe gaat en hoe de overheidsschuld evolueert.",
  openGraph: {
    title: "Belgische Staatsrekening",
    description:
      "Bekijk waar Belgisch overheidsgeld vandaan komt, waar het naartoe gaat en hoe de overheidsschuld evolueert.",
    locale: "nl_BE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Belgische Staatsrekening",
    description:
      "Bekijk waar Belgisch overheidsgeld vandaan komt, waar het naartoe gaat en hoe de overheidsschuld evolueert.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
