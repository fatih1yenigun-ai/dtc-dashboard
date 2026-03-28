"use client";

import { createContext, useContext, useState, useRef, useCallback, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

interface TTSProduct {
  product_name: string;
  shop_name: string;
  product_url: string;
  product_price: number;
  estimated_gmv: number;
  total_views: number;
  total_videos: number;
  marketing_angle: string;
  category: string;
  creation_date: string;
  country: string;
  insight: string;
  niche_summary?: string;
  niche_pros?: string;
  niche_cons?: string;
}

interface NicheSummary {
  summary: string;
  pros: string[];
  cons: string[];
}

interface TTSState {
  keyword: string;
  results: TTSProduct[];
  loading: boolean;
  nicheSummary: NicheSummary | null;
  error: string;
}

interface TTSFilters {
  country?: string;
  gmvRange?: string;
  dateRange?: string;
}

interface TikTokShopContextType extends TTSState {
  startResearch: (keyword: string, count: number, filters?: TTSFilters) => void;
  setKeyword: (k: string) => void;
}

const TikTokShopContext = createContext<TikTokShopContextType | null>(null);

export function TikTokShopProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [state, setState] = useState<TTSState>({
    keyword: "",
    results: [],
    loading: false,
    nicheSummary: null,
    error: "",
  });
  const abortRef = useRef<AbortController | null>(null);

  const startResearch = useCallback(async (keyword: string, count: number, filters?: TTSFilters) => {
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

    const BATCH_SIZE = 10;
    const MAX_RETRIES = Math.ceil(count * 3 / BATCH_SIZE);
    const allProducts: TTSProduct[] = [];
    const seenNames = new Set<string>();
    let nicheSummaryResult: NicheSummary | null = null;
    let retries = 0;

    try {
      while (allProducts.length < count && retries < MAX_RETRIES) {
        if (controller.signal.aborted) return;
        retries++;

        const remaining = count - allProducts.length;
        const batchCount = Math.min(BATCH_SIZE, remaining + 5);

        // Build exclude list from existing results
        const exclude = allProducts.slice(-20).map((p) => p.product_name).join(", ");

        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch("/api/tiktok-shop", {
          method: "POST",
          headers,
          body: JSON.stringify({ keyword, count: batchCount, exclude, country: filters?.country, gmvRange: filters?.gmvRange, dateRange: filters?.dateRange }),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        if (data.error) {
          setState((prev) => ({ ...prev, loading: false, error: data.error }));
          return;
        }

        const batchProducts: TTSProduct[] = (data.products || [])
          .filter((p: TTSProduct) => {
            const name = (p.product_name || "").toLowerCase();
            if (!name || seenNames.has(name)) return false;
            seenNames.add(name);
            return true;
          })
          .map((p: TTSProduct) => {
            const product_price = typeof p.product_price === "number" ? p.product_price : parseFloat(String(p.product_price)) || 0;
            const estimated_gmv = typeof p.estimated_gmv === "number" ? p.estimated_gmv : parseFloat(String(p.estimated_gmv)) || 0;
            const total_views = typeof p.total_views === "number" ? p.total_views : parseInt(String(p.total_views)) || 0;
            const total_videos = typeof p.total_videos === "number" ? p.total_videos : parseInt(String(p.total_videos)) || 0;
            return { ...p, product_price, estimated_gmv, total_views, total_videos };
          })
          .filter((p: TTSProduct) => {
            // Client-side GMV filter
            const gmv = p.estimated_gmv || 0;
            const range = filters?.gmvRange;
            if (!range || range === "all") return true;
            if (range === "below-50k") return gmv < 50000;
            if (range === "50k-300k") return gmv >= 50000 && gmv <= 300000;
            if (range === "300k+") return gmv >= 300000;
            return true;
          });

        // Extract niche summary from first batch
        if (!nicheSummaryResult && batchProducts.length > 0) {
          const first = batchProducts[0];
          if (first?.niche_summary) {
            nicheSummaryResult = {
              summary: first.niche_summary,
              pros: (first.niche_pros || "").split(",").map((s: string) => s.trim()).filter(Boolean),
              cons: (first.niche_cons || "").split(",").map((s: string) => s.trim()).filter(Boolean),
            };
          }
        }

        allProducts.push(...batchProducts);

        // Progressive update — show results as they come in
        const sorted = [...allProducts].sort((a, b) => (b.estimated_gmv || 0) - (a.estimated_gmv || 0));
        setState((prev) => ({
          ...prev,
          results: sorted,
          nicheSummary: nicheSummaryResult,
        }));
      }

      // Final sort and save
      allProducts.sort((a, b) => (b.estimated_gmv || 0) - (a.estimated_gmv || 0));
      setState((prev) => ({
        ...prev,
        results: allProducts,
        nicheSummary: nicheSummaryResult,
        loading: false,
      }));

      try {
        sessionStorage.setItem(
          "lastTTSResearch",
          JSON.stringify({ keyword, results: allProducts, nicheSummary: nicheSummaryResult })
        );
      } catch { /* ignore */ }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      // If we have partial results, keep them
      if (allProducts.length > 0) {
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
    <TikTokShopContext.Provider
      value={{ ...state, startResearch, setKeyword }}
    >
      {children}
    </TikTokShopContext.Provider>
  );
}

export function useTikTokShop() {
  const ctx = useContext(TikTokShopContext);
  if (!ctx) throw new Error("useTikTokShop must be used within TikTokShopProvider");
  return ctx;
}
