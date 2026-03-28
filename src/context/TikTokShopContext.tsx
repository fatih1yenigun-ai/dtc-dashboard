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
  // Video search fields
  product_name: string;
  shop_name: string;
  shop_handle: string;
  cover_image: string;
  video_url: string;
  play_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  duration: number;
  region: string;
  tags: string[];
  hook: string;
  ad_create_time: number;
  put_days: number;
  hot_value: number;
  // Product search fields
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
}

interface TikTokShopContextType extends TTSState {
  search: (keyword: string, mode: SearchMode, pageSize: number, page?: number) => void;
  setKeyword: (k: string) => void;
  goToPage: (page: number) => void;
  setSearchMode: (mode: SearchMode) => void;
  setPageSize: (size: number) => void;
}

const TikTokShopContext = createContext<TikTokShopContextType | null>(null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapVideoResult(item: any): TTSProduct {
  return {
    product_name: item.desc || item.ai_analysis_main_hook || "",
    shop_name: item.app_name || item.nickname || "",
    shop_handle: item.unique_id || "",
    cover_image: item.cover || "",
    video_url: item.video_url || "",
    play_count: item.play_count || 0,
    like_count: item.digg_count || 0,
    comment_count: item.comment_count || 0,
    share_count: item.share_count || 0,
    duration: item.duration || 0,
    region: item.fetch_region?.[0] || item.region || "",
    tags: item.ai_analysis_tags || [],
    hook: item.ai_analysis_main_hook || "",
    ad_create_time: item.ad_create_time || 0,
    put_days: item.put_days || 0,
    hot_value: item.hot_value || 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProductResult(item: any): TTSProduct {
  return {
    product_name: item.product_name || item.name || "",
    shop_name: item.shop_name || "",
    shop_handle: "",
    cover_image: item.cover || item.image || "",
    video_url: "",
    play_count: 0,
    like_count: 0,
    comment_count: 0,
    share_count: 0,
    duration: 0,
    region: item.region || "",
    tags: [],
    hook: "",
    ad_create_time: 0,
    put_days: 0,
    hot_value: 0,
    estimated_gmv: item.cost ? item.cost / 100 : 0,
    total_videos: item.post || 0,
    impression: item.impression || 0,
    category: item.first_ecom_category?.value || item.category || "",
    cpa: item.cpa || 0,
    ctr: item.ctr || 0,
    cvr: item.cvr || 0,
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
    searchMode: "video",
    pageSize: 20,
  });
  const abortRef = useRef<AbortController | null>(null);
  const lastSearchRef = useRef<{
    keyword: string;
    mode: SearchMode;
    pageSize: number;
  } | null>(null);

  const search = useCallback(
    async (keyword: string, mode: SearchMode, pageSize: number, page = 1) => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      lastSearchRef.current = { keyword, mode, pageSize };

      setState((prev) => ({
        ...prev,
        keyword,
        searchMode: mode,
        pageSize,
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
          const list = data.data?.list || data.list || [];
          products = list.map(mapProductResult);
          const totalCount = data.data?.total || data.total || list.length;
          total = Math.max(1, Math.ceil(totalCount / pageSize));
        } else {
          const list = data.data?.list || data.list || [];
          products = list.map(mapVideoResult);
          const totalCount = data.data?.total || data.total || list.length;
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
          error: (err as Error).message || "Araştırma sırasında hata oluştu",
        }));
      }
    },
    [token]
  );

  const goToPage = useCallback(
    (page: number) => {
      const last = lastSearchRef.current;
      if (!last) return;
      search(last.keyword, last.mode, last.pageSize, page);
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

  return (
    <TikTokShopContext.Provider
      value={{
        ...state,
        search,
        setKeyword,
        goToPage,
        setSearchMode,
        setPageSize,
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
