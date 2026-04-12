"use client";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import FaycomLoader from "@/components/FaycomLoader";
import LoginPage from "@/app/login/page";
import Sidebar from "@/components/Sidebar";
import FloatingChat from "@/components/FloatingChat";
import { ResearchProvider } from "@/context/ResearchContext";
import { TikTokShopProvider } from "@/context/TikTokShopContext";
import { HacimlerProvider } from "@/context/HacimlerContext";
import { MetaAdsProvider } from "@/context/MetaAdsContext";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const pathname = usePathname();

  // Landing page: render without auth wrapper
  if (pathname === "/" || pathname.startsWith("/join")) {
    return <>{children}</>;
  }

  // Loading state — full screen
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <FaycomLoader />
      </div>
    );
  }

  // Not logged in — full screen login, NO sidebar
  if (!user) {
    return <LoginPage />;
  }

  // Logged in — sidebar + main content + chat
  return (
    <ResearchProvider>
      <TikTokShopProvider>
        <HacimlerProvider>
          <MetaAdsProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className={`flex-1 min-h-screen bg-bg-main w-0 ${theme === "dark" ? "bg-grid-dark" : ""}`}>
              <div className="p-3 pt-14 md:pt-8 md:p-8 max-w-7xl mx-auto">{children}</div>
            </main>
            <FloatingChat />
          </div>
        </MetaAdsProvider>
        </HacimlerProvider>
      </TikTokShopProvider>
    </ResearchProvider>
  );
}
