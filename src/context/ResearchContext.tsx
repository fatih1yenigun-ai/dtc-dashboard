"use client";

import { createContext, useContext, useState, useRef, useCallback, ReactNode } from "react";
import { tqsToConversion, estimateRevenue } from "@/lib/tqs";

interface BrandResult {
  brand_name: string;
  website: string;
  category: string;
  niche: string;
  aov: number;
  estimated_traffic: number;
  insight: string;
  marketing_angles: string;
  growth_method: string;
  history: string;
  founded: number;
  country: string;
  meta_ads_url: string;
  niche_summary?: string;
  niche_pros?: string;
  niche_cons?: string;
  tqs?: number;
  conversion?: number;
  estimated_revenue?: number;
}

interface NicheSummary {
  summary: string;
  pros: string[];
  cons: string[];
}

interface ResearchState {
  keyword: string;
  results: BrandResult[];
  loading: boolean;
  nicheSummary: NicheSummary | null;
  error: string;
}

interface ResearchContextType extends ResearchState {
  startResearch: (keyword: string, count: number) => void;
  setKeyword: (k: string) => void;
}

const ResearchContext = createContext<ResearchContextType | null>(null);

export function ResearchProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ResearchState>({
    keyword: "",
    results: [],
    loading: false,
    nicheSummary: null,
    error: "",
  });
  const abortRef = useRef<AbortController | null>(null);

  const startResearch = useCallback(async (keyword: string, count: number) => {
    // Cancel any previous request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((prev) => ({
      ...prev,
      keyword,
      loading: true,
      error: "",
      results: [],
      nicheSummary: null,
    }));

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, count }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("API error");
      const data = await res.json();

      if (data.error) {
        setState((prev) => ({ ...prev, loading: false, error: data.error }));
        return;
      }

      // Enrich with TQS/conversion/revenue
      const enriched: BrandResult[] = (data.brands || []).map((b: BrandResult) => {
        const tqs = 5.5;
        const conversion = tqsToConversion(tqs, b.niche);
        const aov = typeof b.aov === "number" ? b.aov : parseFloat(String(b.aov)) || 0;
        const traffic = typeof b.estimated_traffic === "number" ? b.estimated_traffic : 0;
        const revenue = estimateRevenue(traffic, aov, conversion);
        return { ...b, aov, estimated_traffic: traffic, tqs, conversion, estimated_revenue: revenue };
      });

      // Extract niche summary from first brand
      let nicheSummary: NicheSummary | null = null;
      const first = enriched[0];
      if (first?.niche_summary) {
        nicheSummary = {
          summary: first.niche_summary,
          pros: (first.niche_pros || "").split(",").map((s: string) => s.trim()).filter(Boolean),
          cons: (first.niche_cons || "").split(",").map((s: string) => s.trim()).filter(Boolean),
        };
      }

      // Sort by revenue desc
      enriched.sort((a, b) => (b.estimated_revenue || 0) - (a.estimated_revenue || 0));

      setState((prev) => ({
        ...prev,
        results: enriched,
        nicheSummary,
        loading: false,
      }));

      // Save to sessionStorage
      try {
        sessionStorage.setItem(
          "lastResearch",
          JSON.stringify({ keyword, results: enriched, nicheSummary })
        );
      } catch {
        // sessionStorage full or unavailable
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Araştırma sırasında hata oluştu",
      }));
    }
  }, []);

  const setKeyword = useCallback((k: string) => {
    setState((prev) => ({ ...prev, keyword: k }));
  }, []);

  return (
    <ResearchContext.Provider
      value={{ ...state, startResearch, setKeyword }}
    >
      {children}
    </ResearchContext.Provider>
  );
}

export function useResearch() {
  const ctx = useContext(ResearchContext);
  if (!ctx) throw new Error("useResearch must be used within ResearchProvider");
  return ctx;
}

// Restore from sessionStorage on first load
export function useRestoreResearch() {
  const { results, startResearch } = useResearch();
  if (results.length === 0 && typeof window !== "undefined") {
    try {
      const saved = sessionStorage.getItem("lastResearch");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
  }
  return null;
}
