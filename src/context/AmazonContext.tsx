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
  // Computed
  monthlySales: number;
  monthlyRevenue: number;
  tier: string;
}

export type AmazonSearchType = "product" | "brand";

interface AmazonState {
  keyword: string;
  results: AmazonProduct[];
  loading: boolean;
  error: string;
  searchType: AmazonSearchType;
  totalResults: number;
}

interface AmazonContextType extends AmazonState {
  search: (keyword: string, searchType: AmazonSearchType, maxItems?: number) => void;
  setKeyword: (k: string) => void;
  clearResults: () => void;
}

const AmazonContext = createContext<AmazonContextType | null>(null);

function enrichProduct(raw: Omit<AmazonProduct, "monthlySales" | "monthlyRevenue" | "tier">): AmazonProduct {
  const monthlySales = raw.bsr > 0 ? estimateMonthlySales(raw.bsr, raw.category) : 0;
  const monthlyRevenue = raw.bsr > 0 && raw.price > 0 ? estimateRevenue(raw.bsr, raw.price, raw.category) : 0;
  const tier = monthlySales > 0 ? salesTier(monthlySales) : "-";
  return { ...raw, monthlySales, monthlyRevenue, tier };
}

export function AmazonProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [state, setState] = useState<AmazonState>({
    keyword: "",
    results: [],
    loading: false,
    error: "",
    searchType: "product",
    totalResults: 0,
  });
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(
    async (keyword: string, searchType: AmazonSearchType, maxItems = 30) => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState((prev) => ({
        ...prev,
        keyword,
        searchType,
        loading: true,
        error: "",
        results: [],
      }));

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/amazon", {
          method: "POST",
          headers,
          body: JSON.stringify({ keyword, maxItems, searchType }),
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

        const products: AmazonProduct[] = (data.products || []).map(
          (p: Omit<AmazonProduct, "monthlySales" | "monthlyRevenue" | "tier">) => enrichProduct(p)
        );

        setState((prev) => ({
          ...prev,
          results: products,
          loading: false,
          totalResults: data.total || products.length,
        }));
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: (err as Error).message || "Amazon arama hatasi",
        }));
      }
    },
    [token]
  );

  const setKeyword = useCallback((k: string) => {
    setState((prev) => ({ ...prev, keyword: k }));
  }, []);

  const clearResults = useCallback(() => {
    setState((prev) => ({ ...prev, results: [], totalResults: 0, error: "" }));
  }, []);

  return (
    <AmazonContext.Provider value={{ ...state, search, setKeyword, clearResults }}>
      {children}
    </AmazonContext.Provider>
  );
}

export function useAmazon() {
  const ctx = useContext(AmazonContext);
  if (!ctx) throw new Error("useAmazon must be used within AmazonProvider");
  return ctx;
}
