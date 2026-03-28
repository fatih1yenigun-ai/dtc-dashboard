"use client";

import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import LoginPage from "@/app/login/page";
import Sidebar from "@/components/Sidebar";
import FloatingChat from "@/components/FloatingChat";
import { ResearchProvider } from "@/context/ResearchContext";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // Loading state — full screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-[#667eea] mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Yükleniyor...</p>
        </div>
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
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 min-h-screen bg-[#f8f9fa]">
          <div className="p-6 md:p-8 max-w-7xl mx-auto">{children}</div>
        </main>
        <FloatingChat />
      </div>
    </ResearchProvider>
  );
}
