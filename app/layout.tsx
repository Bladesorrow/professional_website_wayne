import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "My Finance", description: "Family finance manager" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IE">
      <body>{children}</body>
    </html>
  );
}
