"use client";

import { createContext, useContext, useState, useRef, useCallback, ReactNode } from "react";
import { tqsToConversion, estimateRevenue } from "@/lib/tqs";
import { useAuth } from "@/context/AuthContext";

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

interface ResearchFilters {
  country?: string;
  foundedAfter?: string;
  revenueRange?: string;
}

interface ResearchContextType extends ResearchState {
  startResearch: (keyword: string, count: number, filters?: ResearchFilters) => void;
  setKeyword: (k: string) => void;
}

const ResearchContext = createContext<ResearchContextType | null>(null);

export function ResearchProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [state, setState] = useState<ResearchState>({
    keyword: "",
    results: [],
    loading: false,
    nicheSummary: null,
    error: "",
  });
  const abortRef = useRef<AbortController | null>(null);

  const startResearch = useCallback(async (keyword: string, count: number, filters?: ResearchFilters) => {
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

    const BATCH_SIZE = 5;
    const totalBatches = Math.ceil(count / BATCH_SIZE);
    const allBrands: BrandResult[] = [];
    const seenNames = new Set<string>();
    let nicheSummaryResult: NicheSummary | null = null;

    try {
      for (let batch = 0; batch < totalBatches; batch++) {
        if (controller.signal.aborted) return;

        const batchCount = Math.min(BATCH_SIZE, count - allBrands.length);
        if (batchCount <= 0) break;

        // Build exclude list from existing results
        const exclude = allBrands.slice(-20).map((b) => b.brand_name).join(", ");

        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch("/api/research", {
          method: "POST",
          headers,
          body: JSON.stringify({ keyword, count: batchCount, exclude, country: filters?.country, foundedAfter: filters?.foundedAfter, revenueRange: filters?.revenueRange }),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        if (data.error) {
          setState((prev) => ({ ...prev, loading: false, error: data.error }));
          return;
        }

        // Enrich batch with TQS/conversion/revenue
        const batchBrands: BrandResult[] = (data.brands || [])
          .filter((b: BrandResult) => {
            const name = (b.brand_name || "").toLowerCase();
            if (!name || seenNames.has(name)) return false;
            seenNames.add(name);
            return true;
          })
          .map((b: BrandResult) => {
            const tqs = 5.5;
            const conversion = tqsToConversion(tqs, b.niche);
            const aov = typeof b.aov === "number" ? b.aov : parseFloat(String(b.aov)) || 0;
            const traffic = typeof b.estimated_traffic === "number" ? b.estimated_traffic : 0;
            const revenue = estimateRevenue(traffic, aov, conversion);
            return { ...b, aov, estimated_traffic: traffic, tqs, conversion, estimated_revenue: revenue };
          });

        // Extract niche summary from first batch
        if (batch === 0 && batchBrands.length > 0) {
          const first = batchBrands[0];
          if (first?.niche_summary) {
            nicheSummaryResult = {
              summary: first.niche_summary,
              pros: (first.niche_pros || "").split(",").map((s: string) => s.trim()).filter(Boolean),
              cons: (first.niche_cons || "").split(",").map((s: string) => s.trim()).filter(Boolean),
            };
          }
        }

        allBrands.push(...batchBrands);

        // Progressive update — show results as they come in
        const sorted = [...allBrands].sort((a, b) => (b.estimated_revenue || 0) - (a.estimated_revenue || 0));
        setState((prev) => ({
          ...prev,
          results: sorted,
          nicheSummary: nicheSummaryResult,
        }));
      }

      // Final sort and save
      allBrands.sort((a, b) => (b.estimated_revenue || 0) - (a.estimated_revenue || 0));
      setState((prev) => ({
        ...prev,
        results: allBrands,
        nicheSummary: nicheSummaryResult,
        loading: false,
      }));

      try {
        sessionStorage.setItem(
          "lastResearch",
          JSON.stringify({ keyword, results: allBrands, nicheSummary: nicheSummaryResult })
        );
      } catch { /* ignore */ }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      // If we have partial results, keep them
      if (allBrands.length > 0) {
        setState((prev) => ({ ...prev, loading: false }));
      } else {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Araştırma sırasında hata oluştu",
        }));
      }
    }
  }, [token]);

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
