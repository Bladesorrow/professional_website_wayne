import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { profile } from "../content/profile";
import "./globals.css";

const body = Barlow({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-body", display: "swap" });
const display = Barlow_Condensed({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: `${profile.brand} | ${profile.tagline}`,
  description: `${profile.name} rides a recumbent trike with cerebral palsy. ${profile.tagline}`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
