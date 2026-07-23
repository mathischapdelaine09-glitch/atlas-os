import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "ATLAS OS",
  description: "Mon système personnel",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-900 text-slate-100">
        {children}
      </body>
    </html>
  );
}