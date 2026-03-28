import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import FloatingChat from "@/components/FloatingChat";
import { ResearchProvider } from "@/context/ResearchContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "DTC Arastirma Paneli",
  description: "DTC marka arastirma ve analiz araci",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex">
        <ResearchProvider>
          <Sidebar />
          <main className="flex-1 min-h-screen bg-[#f8f9fa]">
            <div className="p-6 md:p-8 max-w-7xl mx-auto">{children}</div>
          </main>
          <FloatingChat />
        </ResearchProvider>
      </body>
    </html>
  );
}
