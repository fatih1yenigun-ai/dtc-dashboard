"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { estimateMonthlySales, estimateRevenue, salesTier } from "@/lib/bsr";

// ── Types ──────────────────────────────────────────────────────────────────

export interface AmazonProduct {
  asin: string;
  title: string;
  brand: string;
  price: number;
  rating: number;
  reviewCount: number;
  bsr: number;
  category: string;
  isPrime: boolean;
  image: string;
  url: string;
  keyword: string;
  monthlySales: number;
  monthlyRevenue: number;
  tier: string;
}

export interface KeywordVolume {
  keyword: string;
  monthlyVolume: number;
  difficulty: number;
  cpc: number;
  trend: "up" | "down" | "stable";
}

export interface TopWebsite {
  rank: number;
  domain: string;
  brandName: string;
  monthlyTraffic: number;
  category: string;
  description: string;
}

// ── State ──────────────────────────────────────────────────────────────────

interface HacimlerState {
  keyword: string;
  amazonResults: AmazonProduct[];
  keywordResults: KeywordVolume[];
  websiteResults: TopWebsite[];
  loading: boolean;
  error: string;
}

interface HacimlerContextType extends HacimlerState {
  search: (keyword: string) => void;
  setKeyword: (k: string) => void;
  clearResults: () => void;
}

const HacimlerContext = createContext<HacimlerContextType | null>(null);

// ── Helpers ────────────────────────────────────────────────────────────────

function enrichProduct(raw: Omit<AmazonProduct, "monthlySales" | "monthlyRevenue" | "tier">): AmazonProduct {
  const monthlySales = raw.bsr > 0 ? estimateMonthlySales(raw.bsr, raw.category) : 0;
  const monthlyRevenue = raw.bsr > 0 && raw.price > 0 ? estimateRevenue(raw.bsr, raw.price, raw.category) : 0;
  const tier = monthlySales > 0 ? salesTier(monthlySales) : "-";
  return { ...raw, monthlySales, monthlyRevenue, tier };
}

// ── Provider ───────────────────────────────────────────────────────────────

export function HacimlerProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [state, setState] = useState<HacimlerState>({
    keyword: "",
    amazonResults: [],
    keywordResults: [],
    websiteResults: [],
    loading: false,
    error: "",
  });
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(
    async (keyword: string) => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState((prev) => ({
        ...prev,
        keyword,
        loading: true,
        error: "",
        amazonResults: [],
        keywordResults: [],
        websiteResults: [],
      }));

      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/hacimler", {
          method: "POST",
          headers,
          body: JSON.stringify({ keyword }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `API error ${res.status}`);
        }

        const data = await res.json();

        if (data.error) {
          const debugInfo = data.debug ? ` | Debug: ${data.debug}` : "";
          setState((prev) => ({ ...prev, loading: false, error: data.error + debugInfo }));
          return;
        }

        const amazonProducts: AmazonProduct[] = (data.amazon?.products || []).map(
          (p: Omit<AmazonProduct, "monthlySales" | "monthlyRevenue" | "tier">) => enrichProduct(p)
        );

        setState((prev) => ({
          ...prev,
          amazonResults: amazonProducts,
          keywordResults: data.keywords || [],
          websiteResults: data.websites || [],
          loading: false,
        }));
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: (err as Error).message || "Hacimler arama hatasi",
        }));
      }
    },
    [token]
  );

  const setKeyword = useCallback((k: string) => {
    setState((prev) => ({ ...prev, keyword: k }));
  }, []);

  const clearResults = useCallback(() => {
    setState((prev) => ({
      ...prev,
      amazonResults: [],
      keywordResults: [],
      websiteResults: [],
      error: "",
    }));
  }, []);

  return (
    <HacimlerContext.Provider value={{ ...state, search, setKeyword, clearResults }}>
      {children}
    </HacimlerContext.Provider>
  );
}

export function useHacimler() {
  const ctx = useContext(HacimlerContext);
  if (!ctx) throw new Error("useHacimler must be used within HacimlerProvider");
  return ctx;
}
