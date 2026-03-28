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

export interface TTSProduct {
  id: string;
  title: string;
  image: string;
  image_list: string[];
  landing_page: string;
  price_usd: number;
  sales_volume: number;
  gmv_usd: number;
  score: number;
  shop_name: string;
  shop_image: string;
  shop_id: string;
  video_count: number;
  play_count: number;
  like_count: number;
  share_count: number;
  comment_count: number;
  region: string;
  person_count: number;
  commission_rate: number;
  seller_location: string;
  found_time: number;
  day7_gmv_usd: number;
  day7_sales: number;
  day30_gmv_usd: number;
  day30_sales: number;
  put_days: number;
  // For video search (keep backward compat)
  product_name?: string;
  shop_handle?: string;
  cover_image?: string;
  video_url?: string;
  hook?: string;
  tags?: string[];
  hot_value?: number;
  duration?: number;
  ad_create_time?: number;
  estimated_gmv?: number;
  total_videos?: number;
  impression?: number;
  category?: string;
  cpa?: number;
  ctr?: number;
  cvr?: number;
}

export type SearchMode = "video" | "product";

interface TTSState {
  keyword: string;
  results: TTSProduct[];
  loading: boolean;
  error: string;
  page: number;
  totalPages: number;
  searchMode: SearchMode;
  pageSize: number;
  sortBy: number;
  sortKey: string;
}

interface TikTokShopContextType extends TTSState {
  search: (keyword: string, mode: SearchMode, pageSize: number, page?: number, sortBy?: number, sortKey?: string) => void;
  setKeyword: (k: string) => void;
  goToPage: (page: number) => void;
  setSearchMode: (mode: SearchMode) => void;
  setPageSize: (size: number) => void;
  setSortBy: (sortBy: number) => void;
  setSortKey: (sortKey: string) => void;
}

const TikTokShopContext = createContext<TikTokShopContextType | null>(null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapVideoResult(item: any): TTSProduct {
  return {
    id: item.id || "",
    title: item.desc || item.ai_analysis_main_hook || "",
    image: item.cover || "",
    image_list: [],
    landing_page: "",
    price_usd: 0,
    sales_volume: 0,
    gmv_usd: 0,
    score: 0,
    shop_name: item.app_name || item.nickname || "",
    shop_image: "",
    shop_id: "",
    video_count: 0,
    play_count: item.play_count || 0,
    like_count: item.digg_count || 0,
    share_count: item.share_count || 0,
    comment_count: item.comment_count || 0,
    region: item.fetch_region?.[0] || item.region || "",
    person_count: 0,
    commission_rate: 0,
    seller_location: "",
    found_time: 0,
    day7_gmv_usd: 0,
    day7_sales: 0,
    day30_gmv_usd: 0,
    day30_sales: 0,
    put_days: item.put_days || 0,
    // Video-specific fields
    product_name: item.desc || item.ai_analysis_main_hook || "",
    shop_handle: item.unique_id || "",
    cover_image: item.cover || "",
    video_url: item.video_url || "",
    hook: item.ai_analysis_main_hook || "",
    tags: item.ai_analysis_tags || [],
    hot_value: item.hot_value || 0,
    duration: item.duration || 0,
    ad_create_time: item.ad_create_time || 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProductResult(item: any): TTSProduct {
  return {
    id: item.id || "",
    title: item.title || "",
    image: item.image || "",
    image_list: item.image_list || [],
    landing_page: item.landing_page || "",
    price_usd: item.price_usd || item.price || 0,
    sales_volume: item.sales_volume || 0,
    gmv_usd: item.gmv_usd || item.gmv || 0,
    score: item.score || 0,
    shop_name: item.shop_name || "",
    shop_image: item.shop_image || "",
    shop_id: item.shop_id || "",
    video_count: item.video_count || 0,
    play_count: item.play_count || 0,
    like_count: item.like_count || 0,
    share_count: item.share_count || 0,
    comment_count: item.comment_count || 0,
    region: item.region || "",
    person_count: item.person_count || 0,
    commission_rate: item.commission_rate || 0,
    seller_location: item.seller_location || "",
    found_time: item.found_time || 0,
    day7_gmv_usd: item.day7?.gmv_usd || 0,
    day7_sales: item.day7?.sales_volume || 0,
    day30_gmv_usd: item.day30?.gmv_usd || 0,
    day30_sales: item.day30?.sales_volume || 0,
    put_days: item.put_days || 0,
  };
}

export function TikTokShopProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [state, setState] = useState<TTSState>({
    keyword: "",
    results: [],
    loading: false,
    error: "",
    page: 1,
    totalPages: 1,
    searchMode: "product",
    pageSize: 20,
    sortBy: 999,
    sortKey: "gmv",
  });
  const abortRef = useRef<AbortController | null>(null);
  const lastSearchRef = useRef<{
    keyword: string;
    mode: SearchMode;
    pageSize: number;
    sortBy: number;
    sortKey: string;
  } | null>(null);

  const search = useCallback(
    async (keyword: string, mode: SearchMode, pageSize: number, page = 1, sortBy = 999, sortKey = "gmv") => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      lastSearchRef.current = { keyword, mode, pageSize, sortBy, sortKey };

      setState((prev) => ({
        ...prev,
        keyword,
        searchMode: mode,
        pageSize,
        sortBy,
        sortKey,
        loading: true,
        error: "",
        results: [],
        page,
      }));

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/tiktok-shop", {
          method: "POST",
          headers,
          body: JSON.stringify({
            keyword,
            page,
            pageSize,
            searchMode: mode,
            sortBy,
            sortKey,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `API error ${res.status}`);
        }

        const data = await res.json();

        if (data.error) {
          setState((prev) => ({ ...prev, loading: false, error: data.error }));
          return;
        }

        // Map results based on search mode
        let products: TTSProduct[];
        let total = 1;

        if (mode === "product") {
          const list = data.result?.data || data.data?.list || data.list || [];
          products = list.map(mapProductResult);
          const totalCount = data.result?.total || data.data?.total || data.total || list.length;
          total = Math.max(1, Math.ceil(totalCount / pageSize));
        } else {
          const list = data.result?.data || data.data?.list || data.list || [];
          products = list.map(mapVideoResult);
          const totalCount = data.result?.total || data.data?.total || data.total || list.length;
          total = Math.max(1, Math.ceil(totalCount / pageSize));
        }

        setState((prev) => ({
          ...prev,
          results: products,
          loading: false,
          page,
          totalPages: total,
        }));
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: (err as Error).message || "Arastirma sirasinda hata olustu",
        }));
      }
    },
    [token]
  );

  const goToPage = useCallback(
    (page: number) => {
      const last = lastSearchRef.current;
      if (!last) return;
      search(last.keyword, last.mode, last.pageSize, page, last.sortBy, last.sortKey);
    },
    [search]
  );

  const setKeyword = useCallback((k: string) => {
    setState((prev) => ({ ...prev, keyword: k }));
  }, []);

  const setSearchMode = useCallback((mode: SearchMode) => {
    setState((prev) => ({ ...prev, searchMode: mode }));
  }, []);

  const setPageSize = useCallback((size: number) => {
    setState((prev) => ({ ...prev, pageSize: size }));
  }, []);

  const setSortBy = useCallback((sortBy: number) => {
    setState((prev) => ({ ...prev, sortBy }));
  }, []);

  const setSortKey = useCallback((sortKey: string) => {
    setState((prev) => ({ ...prev, sortKey }));
  }, []);

  return (
    <TikTokShopContext.Provider
      value={{
        ...state,
        search,
        setKeyword,
        goToPage,
        setSearchMode,
        setPageSize,
        setSortBy,
        setSortKey,
      }}
    >
      {children}
    </TikTokShopContext.Provider>
  );
}

export function useTikTokShop() {
  const ctx = useContext(TikTokShopContext);
  if (!ctx)
    throw new Error("useTikTokShop must be used within TikTokShopProvider");
  return ctx;
}
