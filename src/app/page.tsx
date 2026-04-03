"use client";

import { useEffect } from "react";
import HeroSection from "@/components/landing/HeroSection";
import ToolsSection from "@/components/landing/ToolsSection";

export default function LandingPage() {
  useEffect(() => {
    document.body.style.background = "#ffffff";
    return () => {
      document.body.style.background = "";
    };
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <HeroSection />
      <ToolsSection />
    </main>
  );
}
