import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "DTC Araştırma Paneli",
  description: "DTC marka araştırma ve analiz aracı",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full font-sans" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
