import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScamLens: Scan. Understand. Verify.",
  description: "Understand suspicious financial content before you act.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
