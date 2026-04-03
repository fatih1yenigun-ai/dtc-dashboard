"use client";

import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

export interface ProductResult {
  id: string;
  title: string;
  titleTr: string;
  marketingAngle: string;
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
}

// Simple title-to-Turkish translation using keyword mapping
function translateTitle(title: string): string {
  const dict: Record<string, string> = {
    // Kitchen
    "kitchen": "mutfak", "gadget": "alet", "tool": "alet", "tools": "aletler",
    "juicer": "sikacagi", "press": "pres", "manual": "manuel", "electric": "elektrikli",
    "can opener": "konserve acicisi", "garlic": "sarimsak", "garlic press": "sarimsak presi",
    "blender": "blender", "mixer": "mikser", "knife": "bicak", "cutting board": "kesme tahtasi",
    "pan": "tava", "pot": "tencere", "spatula": "spatula", "peeler": "soyucu",
    "grater": "rende", "whisk": "cirpici", "strainer": "suzgec", "colander": "kevgir",
    // Beauty & Skincare
    "skincare": "cilt bakimi", "skin care": "cilt bakimi", "serum": "serum",
    "cream": "krem", "moisturizer": "nemlendirici", "cleanser": "temizleyici",
    "face mask": "yuz maskesi", "sunscreen": "gunes kremi", "lip": "dudak",
    "makeup": "makyaj", "brush": "firca", "hair": "sac", "shampoo": "sampuan",
    "conditioner": "sac kremi", "nail": "tirnak", "beauty": "guzellik",
    // Home
    "led": "LED", "lamp": "lamba", "light": "isik", "pillow": "yastik",
    "blanket": "battaniye", "organizer": "duzenleyici", "storage": "depolama",
    "shelf": "raf", "hook": "askisi", "hanger": "aski", "mat": "paspas",
    "towel": "havlu", "curtain": "perde", "rug": "hali", "decor": "dekor",
    // Fashion
    "shirt": "gomlek", "dress": "elbise", "shoes": "ayakkabi", "bag": "canta",
    "watch": "saat", "sunglasses": "gunes gozlugu", "hat": "sapka", "belt": "kemer",
    "ring": "yuzuk", "necklace": "kolye", "bracelet": "bileklik", "earring": "kupe",
    // Tech
    "phone": "telefon", "case": "kilif", "charger": "sarj cihazi", "cable": "kablo",
    "headphone": "kulaklik", "speaker": "hoparlor", "camera": "kamera",
    // General
    "portable": "tasinabilir", "stainless steel": "paslanmaz celik", "steel": "celik",
    "plastic": "plastik", "silicone": "silikon", "wooden": "ahsap", "bamboo": "bambu",
    "mini": "mini", "set": "seti", "pack": "paket",
    "waterproof": "su gecirmez", "wireless": "kablosuz", "rechargeable": "sarj edilebilir",
    "adjustable": "ayarlanabilir", "foldable": "katlanabilir", "multifunctional": "cok fonksiyonlu",
    // Animals
    "pet": "evcil hayvan", "dog": "kopek", "cat": "kedi", "teddy bear": "oyuncak ayi",
    "plush": "pelus", "toy": "oyuncak", "stuffed animal": "pelus oyuncak",
    // Fitness
    "yoga": "yoga", "gym": "spor salonu", "fitness": "fitness", "exercise": "egzersiz",
    "water bottle": "su sisesi", "bottle": "sise",
  };

  let result = title;
  // Sort by length (longer phrases first) to match multi-word terms
  const sorted = Object.entries(dict).sort((a, b) => b[0].length - a[0].length);
  for (const [en, tr] of sorted) {
    const regex = new RegExp(`\\b${en}\\b`, "gi");
    result = result.replace(regex, tr);
  }
  return result;
}

// Generate a marketing angle from product data
function generateMarketingAngle(p: ProductResult): string {
  const angles: string[] = [];

  if (p.sales_volume > 10000) angles.push(`${(p.sales_volume / 1000).toFixed(0)}K+ satis`);
  else if (p.sales_volume > 1000) angles.push(`${(p.sales_volume / 1000).toFixed(1)}K satis`);

  if (p.video_count > 50) angles.push(`${p.video_count} viral video`);
  if (p.like_count > 100000) angles.push(`${(p.like_count / 1000000).toFixed(1)}M begeni`);

  if (p.price_usd < 10) angles.push("dusuk fiyat, yuksek hacim");
  else if (p.price_usd > 50) angles.push("premium fiyat segmenti");

  if (p.gmv_usd > 100000) angles.push("yuksek ciro potansiyeli");

  if (p.score >= 4.5) angles.push("yuksek puan");

  if (angles.length === 0) angles.push("trend urun");

  return angles.slice(0, 2).join(" · ");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProduct(item: any): ProductResult {
  const p: ProductResult = {
    id: item.id || "",
    title: item.title || "",
    titleTr: "",
    marketingAngle: "",
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
  p.titleTr = translateTitle(p.title);
  p.marketingAngle = generateMarketingAngle(p);
  return p;
}

// Server-side pagination works for products — fetch page by page
const PAGE_SIZE = 20;

export function useProductSearch() {
  const { token } = useAuth();
  const [allProducts, setAllProducts] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const loadingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const searchParamsRef = useRef<{ keyword: string; sortKey: string; sortType: string } | null>(null);

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
            searchMode: "product",
            sortKey: params.sortKey,
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

        const list = data.result?.data || data.data?.list || data.list || [];
        const mapped: ProductResult[] = list.map(mapProduct);

        if (append) {
          setAllProducts((prev) => {
            const ids = new Set(prev.map((p) => p.id));
            const unique = mapped.filter((p) => !ids.has(p.id));
            return [...prev, ...unique];
          });
        } else {
          setAllProducts(mapped);
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
    (keyword: string, sortKey: string, sortType: string = "desc") => {
      if (!keyword.trim()) return;
      searchParamsRef.current = { keyword, sortKey, sortType };
      setAllProducts([]);
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

  // Re-search with new sort key/type (server-side sort)
  const resort = useCallback(
    (sortKey: string, sortType?: string) => {
      const params = searchParamsRef.current;
      if (!params) return;
      searchParamsRef.current = { ...params, sortKey, sortType: sortType || params.sortType };
      setAllProducts([]);
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
    products: allProducts,
    allCount: allProducts.length,
    loading,
    loadingMore,
    error,
    hasMore,
    search,
    resort,
    sentinelRef,
  };
}
