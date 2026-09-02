import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "@/client/providers";

export const metadata: Metadata = {
  title: "KDT Tool – WK-Planung",
  description: "Wochenarbeitsplan und Tagesbefehle planen",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
