import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Notebook Token Dashboard",
  description: "Google Form -> Token -> WhatsApp workflow",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
