"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";

export interface VideoResult {
  id: string;
  title: string;
  image: string;
  cover_image: string;
  video_url: string;
  hook: string;
  tags: string[];
  play_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  duration: number;
  hot_value: number;
  region: string;
  shop_name: string;
  shop_handle: string;
  shop_type: string;
  button_text: string;
  language: string;
  human_presenter: string;
  ad_create_time: number;
  put_days: number;
  // Extended fields for popup
  collect_count: number;
  ad_cost_min: number;
  ad_cost_max: number;
  conversion_min: number;
  conversion_max: number;
  like_rate: number;
  audience_age_min: number;
  audience_age_max: number;
  audience_device: string;
  first_seen: number;
  last_seen: number;
  tiktok_post_url: string;
  landing_page: string;
  product_name: string;
  product_price: number;
  product_image: string;
  product_sold: number;
  product_id: string;
  ecom_platform: string;
}

export interface VideoFilters {
  country?: string[];
  language?: string[];
  ad_time?: number;
  audience_age?: number[];
  audience_gender?: number[];
  interest?: string;
}

export interface TagAnalytics {
  tag: string;
  count: number;
  avgViews: number;
  avgLikes: number;
  totalViews: number;
}

export interface CategoryAnalytics {
  category: string;
  count: number;
  avgViews: number;
  avgLikes: number;
  totalViews: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapVideo(item: any): VideoResult {
  const prod = item.product_info || item.products?.[0] || {};
  return {
    id: item.ad_id || item.id || "",
    title: item.desc || item.ai_analysis_main_hook || "",
    image: item.cover || "",
    cover_image: item.cover || "",
    video_url: item.video_url || "",
    hook: item.ai_analysis_main_hook || "",
    tags: item.ai_analysis_tags || [],
    play_count: item.play_count || 0,
    like_count: item.digg_count || 0,
    comment_count: item.comment_count || 0,
    share_count: item.share_count || 0,
    duration: item.duration || 0,
    hot_value: item.hot_value || 0,
    region: item.fetch_region?.[0] || item.region || "",
    shop_name: item.app_name || item.nickname || "",
    shop_handle: item.unique_id || "",
    shop_type: item.shop_type || "",
    button_text: item.button_text || "",
    language: item.ai_analysis_language || "",
    human_presenter: item.ai_analysis_human_presenter || "",
    ad_create_time: item.ad_create_time || 0,
    put_days: item.put_days || 0,
    // Extended fields
    collect_count: item.collect_count || 0,
    ad_cost_min: item.ad_cost?.min || 0,
    ad_cost_max: item.ad_cost?.max || 0,
    conversion_min: item.conversion?.min || 0,
    conversion_max: item.conversion?.max || 0,
    like_rate: item.digg_count && item.play_count ? (item.digg_count / item.play_count) : 0,
    audience_age_min: item.audience_age?.min || 0,
    audience_age_max: item.audience_age?.max || 0,
    audience_device: item.audience_device || "",
    first_seen: item.first_seen || item.ad_create_time || 0,
    last_seen: item.last_seen || 0,
    tiktok_post_url: item.tiktok_post_url || (item.ad_id ? `https://www.tiktok.com/@${item.unique_id || ""}/video/${item.ad_id}` : ""),
    landing_page: item.landing_page || item.product_link || "",
    product_name: prod.title || prod.name || "",
    product_price: prod.price_usd || prod.price || 0,
    product_image: prod.image || prod.cover || "",
    product_sold: prod.sales_volume || prod.sold || 0,
    product_id: prod.id || prod.product_id || "",
    ecom_platform: item.ecom_platform || "",
  };
}

function computeTagAnalytics(videos: VideoResult[]): TagAnalytics[] {
  const map = new Map<string, { count: number; totalViews: number; totalLikes: number }>();
  for (const v of videos) {
    for (const tag of v.tags) {
      const clean = tag.replace(/^#/, "").toLowerCase();
      if (!clean) continue;
      const entry = map.get(clean) || { count: 0, totalViews: 0, totalLikes: 0 };
      entry.count++;
      entry.totalViews += v.play_count;
      entry.totalLikes += v.like_count;
      map.set(clean, entry);
    }
  }
  return Array.from(map.entries())
    .map(([tag, d]) => ({
      tag,
      count: d.count,
      avgViews: Math.round(d.totalViews / d.count),
      avgLikes: Math.round(d.totalLikes / d.count),
      totalViews: d.totalViews,
    }))
    .filter((t) => t.count >= 3)
    .sort((a, b) => b.avgViews - a.avgViews);
}

function computeCategoryAnalytics(videos: VideoResult[]): CategoryAnalytics[] {
  const map = new Map<string, { count: number; totalViews: number; totalLikes: number }>();
  for (const v of videos) {
    const cat = v.shop_type || "Bilinmeyen";
    const entry = map.get(cat) || { count: 0, totalViews: 0, totalLikes: 0 };
    entry.count++;
    entry.totalViews += v.play_count;
    entry.totalLikes += v.like_count;
    map.set(cat, entry);
  }
  return Array.from(map.entries())
    .map(([category, d]) => ({
      category,
      count: d.count,
      avgViews: Math.round(d.totalViews / d.count),
      avgLikes: Math.round(d.totalLikes / d.count),
      totalViews: d.totalViews,
    }))
    .sort((a, b) => b.avgViews - a.avgViews);
}

// PiPiAds v3 video search doesn't support server-side pagination.
// Fetch 500 videos in one call, paginate client-side.
const FETCH_SIZE = 500;
const PAGE_SIZE = 20;

export function useVideoSearch() {
  const { token } = useAuth();
  const [allVideos, setAllVideos] = useState<VideoResult[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const videos = allVideos.slice(0, visibleCount);
  const hasMore = visibleCount < allVideos.length;

  // Analytics computed from all 500 videos
  const tagAnalytics = useMemo(() => computeTagAnalytics(allVideos), [allVideos]);
  const categoryAnalytics = useMemo(() => computeCategoryAnalytics(allVideos), [allVideos]);

  const search = useCallback(
    async (keyword: string, sortBy: number, filters: VideoFilters) => {
      if (!keyword.trim()) return;

      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError("");
      setAllVideos([]);
      setVisibleCount(PAGE_SIZE);

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
            page: 1,
            pageSize: FETCH_SIZE,
            searchMode: "video",
            sortBy,
            filters,
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
        const mapped: VideoResult[] = list.map(mapVideo);

        // Deduplicate by id
        const seen = new Set<string>();
        const unique = mapped.filter((v) => {
          if (seen.has(v.id)) return false;
          seen.add(v.id);
          return true;
        });

        setAllVideos(unique);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError((err as Error).message || "Bir hata olustu");
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, allVideos.length));
  }, [allVideos.length]);

  // Sentinel ref: IntersectionObserver that calls loadMore
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
    videos,
    allCount: allVideos.length,
    loading,
    error,
    hasMore,
    search,
    sentinelRef,
    tagAnalytics,
    categoryAnalytics,
  };
}
