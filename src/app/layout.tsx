import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TranslationProvider } from "@/context/TranslationContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DHG - School Management System",
  description: "Système complet de gestion scolaire professionnelle",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <TranslationProvider>
          {children}
          <div id="portal-root"></div>
        </TranslationProvider>
      </body>
    </html>
  );
}
