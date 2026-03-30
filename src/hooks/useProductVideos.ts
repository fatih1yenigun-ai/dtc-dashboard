"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { TTSProduct } from "@/context/TikTokShopContext";

export interface Influencer {
  handle: string;
  name: string;
  videoCount: number;
  totalPlays: number;
  totalLikes: number;
  totalShares: number;
  totalComments: number;
}

export interface HookAnalysis {
  hook: string;
  count: number;
  avgPlays: number;
}

export interface TagAnalysis {
  tag: string;
  count: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapVideoItem(item: any): TTSProduct {
  return {
    id: String(item.id || ""),
    title: String(item.desc || item.title || ""),
    image: String(item.cover || item.image || ""),
    image_list: [],
    landing_page: "",
    price_usd: 0,
    sales_volume: 0,
    gmv_usd: Number(item.estimated_gmv || 0),
    score: 0,
    shop_name: String(item.app_name || item.nickname || (item.author_info as Record<string, unknown>)?.nickname || ""),
    shop_image: "",
    shop_id: "",
    video_count: 0,
    play_count: Number(item.play_count || 0),
    like_count: Number(item.digg_count || item.like_count || 0),
    share_count: Number(item.share_count || 0),
    comment_count: Number(item.comment_count || 0),
    region: String(item.fetch_region?.[0] || item.region || ""),
    person_count: 0,
    commission_rate: 0,
    seller_location: "",
    found_time: 0,
    day7_gmv_usd: 0,
    day7_sales: 0,
    day30_gmv_usd: 0,
    day30_sales: 0,
    put_days: Number(item.put_days || 0),
    product_name: String(item.product_name || item.desc || ""),
    shop_handle: String(item.unique_id || (item.author_info as Record<string, unknown>)?.unique_id || ""),
    cover_image: String(item.cover || ""),
    video_url: String(item.video_url || ""),
    hook: String(item.ai_analysis_main_hook || ""),
    tags: Array.isArray(item.ai_analysis_tags) ? item.ai_analysis_tags as string[] : [],
    hot_value: Number(item.hot_value || 0),
    duration: Number(item.duration || 0),
    ad_create_time: Number(item.ad_create_time || 0),
  };
}

function deriveAnalytics(allVideos: TTSProduct[]) {
  const creatorMap = new Map<string, Influencer>();
  for (const v of allVideos) {
    const handle = v.shop_handle || v.shop_name || "unknown";
    const existing = creatorMap.get(handle);
    if (existing) {
      existing.videoCount++;
      existing.totalPlays += v.play_count;
      existing.totalLikes += v.like_count;
      existing.totalShares += v.share_count;
      existing.totalComments += v.comment_count;
    } else {
      creatorMap.set(handle, {
        handle, name: v.shop_name || handle, videoCount: 1,
        totalPlays: v.play_count, totalLikes: v.like_count,
        totalShares: v.share_count, totalComments: v.comment_count,
      });
    }
  }
  const influencers = Array.from(creatorMap.values()).sort((a, b) => b.totalPlays - a.totalPlays);

  const hookMap = new Map<string, { count: number; totalPlays: number }>();
  for (const v of allVideos) {
    const h = v.hook?.trim();
    if (!h) continue;
    const existing = hookMap.get(h);
    if (existing) { existing.count++; existing.totalPlays += v.play_count; }
    else hookMap.set(h, { count: 1, totalPlays: v.play_count });
  }
  const hookAnalysis = Array.from(hookMap.entries())
    .map(([hook, data]) => ({ hook, count: data.count, avgPlays: Math.round(data.totalPlays / data.count) }))
    .sort((a, b) => b.count - a.count).slice(0, 8);

  const tagMap = new Map<string, number>();
  for (const v of allVideos) {
    if (!v.tags) continue;
    for (const tag of v.tags) {
      const t = tag.trim();
      if (t) tagMap.set(t, (tagMap.get(t) || 0) + 1);
    }
  }
  const tagAnalysis = Array.from(tagMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  return { influencers, hookAnalysis, tagAnalysis };
}

const VIDEOS_PER_PAGE = 12;

export function useProductVideos(productTitle: string | undefined) {
  const [allVideos, setAllVideos] = useState<TTSProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [hookAnalysis, setHookAnalysis] = useState<HookAnalysis[]>([]);
  const [tagAnalysis, setTagAnalysis] = useState<TagAnalysis[]>([]);
  const [videoPage, setVideoPage] = useState(1);
  const fetched = useRef(false);

  const fetchAll = useCallback(async () => {
    if (!productTitle) return;
    setLoading(true);
    setError("");

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      // Fetch 50 videos sorted by popularity (sortBy: 4 = most viewed)
      const res = await fetch("/api/tiktok-shop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          keyword: productTitle,
          searchMode: "video",
          sortBy: 4, // Most viewed / Popularity
          page: 1,
          pageSize: 50,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Video arama hatasi");

      const rawList =
        json.result?.data || json.data?.result?.data || json.data?.data?.list ||
        json.data?.list || json.list || [];

      const mapped = rawList.map(mapVideoItem);

      setAllVideos(mapped);
      const analytics = deriveAnalytics(mapped);
      setInfluencers(analytics.influencers);
      setHookAnalysis(analytics.hookAnalysis);
      setTagAnalysis(analytics.tagAnalysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }, [productTitle]);

  useEffect(() => {
    if (!productTitle || fetched.current) return;
    fetched.current = true;
    fetchAll();
  }, [productTitle, fetchAll]);

  // Client-side pagination
  const totalPages = Math.max(1, Math.ceil(allVideos.length / VIDEOS_PER_PAGE));
  const videos = allVideos.slice((videoPage - 1) * VIDEOS_PER_PAGE, videoPage * VIDEOS_PER_PAGE);

  const goToVideoPage = useCallback((page: number) => {
    setVideoPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  return {
    videos,
    allVideos,
    loading,
    error,
    influencers,
    hookAnalysis,
    tagAnalysis,
    videoPage,
    totalVideoPages: totalPages,
    goToVideoPage,
  };
}
