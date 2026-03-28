"use client";

import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import LoginPage from "@/app/login/page";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

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

  if (!user) {
    return <LoginPage />;
  }

  return <>{children}</>;
}
