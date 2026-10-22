import type { Metadata } from "next";
import { Quicksand, Caveat } from "next/font/google";
import { profile } from "../content/profile";
import "./globals.css";

const body = Quicksand({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const script = Caveat({ subsets: ["latin"], variable: "--font-script", display: "swap" });

export const metadata: Metadata = {
  title: `${profile.name} | ${profile.title}`,
  description: profile.tagline,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${script.variable}`}>
      <body>{children}</body>
    </html>
  );
}
