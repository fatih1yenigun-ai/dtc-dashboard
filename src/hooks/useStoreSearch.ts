"use client";

import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

export interface StoreResult {
  id: string;
  shopName: string;
  shopImage: string;
  description: string;
  salesVolume: number;
  gmvUsd: number;
  score: number;
  videoCount: number;
  playCount: number;
  shareCount: number;
  personCount: number;
  region: string[];
  categories: Array<{ id: string; name: string }>;
  foundTime: number;
  lastFoundTime: number;
  minCpm: number;
  maxCpm: number;
  currency: string;
  shopId: string;
  goodsCount: number;
  goodsAdCount: number;
  avgPriceUsd: number;
  bestSellingGoods: Array<{ productId: string; image: string; salesVolume: number }>;
  salesTrend: number;
  productType: string[];
  delivery: string[];
  isManaged: boolean;
  isInMarketplace: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapStore(item: any): StoreResult {
  return {
    id: item.id || item.shop_id || "",
    shopName: item.shop_name || item.title || "",
    shopImage: item.shop_image || item.image || "",
    description: item.desc || "",
    salesVolume: item.sales_volume || 0,
    gmvUsd: item.gmv_usd || item.gmv || 0,
    score: item.score || 0,
    videoCount: item.video_count || 0,
    playCount: item.play_count || 0,
    shareCount: item.share_count || 0,
    personCount: item.person_count || 0,
    region: item.region || [],
    categories: (item.categorize || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c: any) => ({ id: c._id || "", name: c.name_en || c.name_zh || "" })
    ),
    foundTime: item.found_time || 0,
    lastFoundTime: item.last_found_time || 0,
    minCpm: item.min_cpm || 0,
    maxCpm: item.max_cpm || 0,
    currency: item.currency || "USD",
    shopId: item.shop_id || item.id || "",
    goodsCount: item.goods_count || 0,
    goodsAdCount: Number(item.goods_ad_count) || 0,
    avgPriceUsd: item.avg_price_usd || 0,
    bestSellingGoods: (item.best_selling_goods || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (g: any) => ({
        productId: g.product_id || "",
        image: g.image || "",
        salesVolume: g.sales_volume || 0,
      })
    ),
    salesTrend: item.sales_trend || 0,
    productType: item.product_type || [],
    delivery: item.delivery || [],
    isManaged: item.is_managed || false,
    isInMarketplace: item.is_in_marketplace || false,
  };
}

const PAGE_SIZE = 20;

export function useStoreSearch() {
  const { token } = useAuth();
  const [allStores, setAllStores] = useState<StoreResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const loadingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const searchParamsRef = useRef<{
    keyword: string;
    sort: number;
    sortType: string;
  } | null>(null);

  const fetchPage = useCallback(
    async (pageNum: number, append: boolean) => {
      const params = searchParamsRef.current;
      if (!params) return;
      if (append && loadingMoreRef.current) return;

      if (!append) {
        if (abortRef.current) abortRef.current.abort();
        setLoading(true);
        loadingRef.current = true;
        setError("");
      } else {
        setLoadingMore(true);
        loadingMoreRef.current = true;
      }

      const controller = new AbortController();
      if (!append) abortRef.current = controller;

      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/tiktok-shop", {
          method: "POST",
          headers,
          body: JSON.stringify({
            keyword: params.keyword,
            page: pageNum,
            pageSize: PAGE_SIZE,
            searchMode: "store",
            productSort: params.sort,
            sortType: params.sortType,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `API error ${res.status}`);
        }

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        const list = data.result?.data || data.data?.list || [];
        const mapped: StoreResult[] = list.map(mapStore);

        if (append) {
          setAllStores((prev) => {
            const ids = new Set(prev.map((s) => s.id));
            const unique = mapped.filter((s) => !ids.has(s.id));
            return [...prev, ...unique];
          });
        } else {
          setAllStores(mapped);
        }

        const more = mapped.length >= PAGE_SIZE;
        setHasMore(more);
        hasMoreRef.current = more;
        pageRef.current = pageNum;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError((err as Error).message || "Bir hata olustu");
      } finally {
        setLoading(false);
        setLoadingMore(false);
        loadingRef.current = false;
        loadingMoreRef.current = false;
      }
    },
    [token]
  );

  const search = useCallback(
    (keyword: string, sort: number = 2, sortType: string = "desc") => {
      if (!keyword.trim()) return;
      searchParamsRef.current = { keyword, sort, sortType };
      setAllStores([]);
      setHasMore(true);
      hasMoreRef.current = true;
      pageRef.current = 1;
      fetchPage(1, false);
    },
    [fetchPage]
  );

  const loadMore = useCallback(() => {
    if (!hasMoreRef.current || loadingMoreRef.current || loadingRef.current) return;
    fetchPage(pageRef.current + 1, true);
  }, [fetchPage]);

  const resort = useCallback(
    (sort: number, sortType: string) => {
      const params = searchParamsRef.current;
      if (!params) return;
      searchParamsRef.current = { ...params, sort, sortType };
      setAllStores([]);
      setHasMore(true);
      hasMoreRef.current = true;
      pageRef.current = 1;
      fetchPage(1, false);
    },
    [fetchPage]
  );

  // Sentinel ref for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (!node) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMoreRef.current();
        }
      },
      { rootMargin: "300px" }
    );
    observerRef.current.observe(node);
  }, []);

  return {
    stores: allStores,
    allCount: allStores.length,
    loading,
    loadingMore,
    error,
    hasMore,
    search,
    resort,
    sentinelRef,
  };
}
