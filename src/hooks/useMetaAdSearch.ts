"use client";

import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

export interface MetaAd {
  id: string;
  adContent: string;
  adCost: number | null;
  adStartedAt: number;
  activeDays: number;
  adStatus: number;
  adPlatform: string[];
  adAudienceReach: number | null;
  adsetCount: number;
  buttonType: string;
  buttonText: string;
  landingPages: string[];
  country: string[];
  language: string;
  mediaFormat: number;
  sourceAdId: string;
  firstDiscoveredAt: number;
  lastDiscoveredAt: number;
  latestActivedAt: number;
  advertiserId: string;
  advertiserName: string;
  advertiserProfilePic: string;
  advertiserAdCount: number;
  advertiserAdCountry: string[];
  advertiserAdsLibraryLink: string;
  advertiserAdsetCount: number;
  ecommercePlatform: string;
  advertiserLikeCount: number;
  advertiserLink: string;
  storeName: string;
  storeLink: string;
  storeLogo: string;
  storeId: string;
  productName: string;
  productPrice: number;
  productPriceUsd: number;
  productAdCost: number;
  productAdCount: number;
  productCategoryName: string;
  productImageUrl: string;
  productCreationTime: number;
  videos: Array<{ duration: number; url: string; coverUrl: string }>;
  images: Array<{ url: string; width: number; height: number }>;
  cards: Array<{ url: string; coverUrl: string | null; mediaType: number }>;
  adAudience: {
    totalReach: number;
    genderAudience: string;
    ageMin: number;
    ageMax: number;
  } | null;
  thumbnail: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAd(item: any): MetaAd {
  const adv = item.advertiser || {};
  const store = item.store || {};
  const prod = item.products?.[0] || {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vids = (item.videos || []).map((v: any) => ({
    duration: v.duration || 0, url: v.url || "", coverUrl: v.cover_url || "",
  }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const imgs = (item.images || []).map((img: any) => ({
    url: img.url || "", width: img.width || 0, height: img.height || 0,
  }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cards = (item.cards || []).map((c: any) => ({
    url: c.url || "", coverUrl: c.cover_url || null, mediaType: c.media_type || 0,
  }));

  let thumbnail = "";
  if (vids.length > 0 && vids[0].coverUrl) thumbnail = vids[0].coverUrl;
  else if (imgs.length > 0 && imgs[0].url) thumbnail = imgs[0].url;
  else if (cards.length > 0 && cards[0].url) thumbnail = cards[0].url;
  else if (prod.image_url) thumbnail = prod.image_url;
  else if (adv.profile_picture_url) thumbnail = adv.profile_picture_url;

  const audience = item.ad_audience
    ? {
        totalReach: item.ad_audience.total_reach || 0,
        genderAudience: item.ad_audience.gender_audience || "All",
        ageMin: item.ad_audience.age_audience?.min || 0,
        ageMax: item.ad_audience.age_audience?.max || 0,
      }
    : null;

  return {
    id: item.id || "",
    adContent: item.ad_content || "",
    adCost: item.ad_cost ?? null,
    adStartedAt: item.ad_started_at || 0,
    activeDays: item.active_days || 0,
    adStatus: item.ad_status || 0,
    adPlatform: item.ad_platform || [],
    adAudienceReach: item.ad_audience_reach ?? null,
    adsetCount: item.adset_count || 0,
    buttonType: item.button_type || "",
    buttonText: item.button_text || "",
    landingPages: item.landing_pages || [],
    country: item.country || [],
    language: item.language || "",
    mediaFormat: item.media_format || 0,
    sourceAdId: item.source_ad_id || "",
    firstDiscoveredAt: item.first_discovered_at || 0,
    lastDiscoveredAt: item.last_discovered_at || 0,
    latestActivedAt: item.latest_actived_at || 0,
    advertiserId: adv.id || "",
    advertiserName: adv.name || "",
    advertiserProfilePic: adv.profile_picture_url || "",
    advertiserAdCount: adv.ad_count || 0,
    advertiserAdCountry: adv.ad_country || [],
    advertiserAdsLibraryLink: adv.ads_library_link || "",
    advertiserAdsetCount: adv.adset_count || 0,
    ecommercePlatform: adv.e_commerce_platform || "",
    advertiserLikeCount: adv.like_count || 0,
    advertiserLink: adv.source_advertiser_link || "",
    storeName: store.name || "",
    storeLink: store.source_store_link || "",
    storeLogo: store.logo_url || "",
    storeId: store.pipiads_biz_id || "",
    productName: prod.name || "",
    productPrice: prod.price || 0,
    productPriceUsd: prod.price_usd || 0,
    productAdCost: prod.ad_cost || 0,
    productAdCount: prod.ad_count || 0,
    productCategoryName: prod.category_name || "",
    productImageUrl: prod.image_url || "",
    productCreationTime: prod.creation_time || 0,
    videos: vids,
    images: imgs,
    cards,
    adAudience: audience,
    thumbnail,
  };
}

export type SortKey =
  | "default"
  | "ad_started_at"
  | "adset_count"
  | "ad_audience_reach"
  | "latest_actived_at"
  | "ad_cost"
  | "advertiser_ad_count"
  | "product_price_usd"
  | "product_ad_count"
  | "product_creation_time"
  | "active_days";

// Maps our sort keys to PiPiAds API order_by values (discovered via testing)
const ORDER_BY_MAP: Record<SortKey, string | undefined> = {
  default: undefined,
  ad_started_at: "ad_started_at",
  adset_count: "adset_count",
  ad_audience_reach: "ad_audience_reach",
  latest_actived_at: "latest_actived_at",
  ad_cost: "ad_cost",
  advertiser_ad_count: "advertiser_ad_count",
  product_price_usd: "product_price_usd",
  product_ad_count: "product_ad_count",
  product_creation_time: "product_creation_time",
  active_days: "active_days",
};

const PAGE_SIZE = 20;

export function useMetaAdSearch() {
  const { token } = useAuth();
  const [allAds, setAllAds] = useState<MetaAd[]>([]);
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
    orderBy: string | undefined;
    direction: "asc" | "desc";
    advertiserName?: string;
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

        const res = await fetch("/api/meta-ads", {
          method: "POST",
          headers,
          body: JSON.stringify({
            keyword: params.keyword,
            page: pageNum,
            perPage: PAGE_SIZE,
            orderBy: params.orderBy,
            direction: params.direction,
            advertiserName: params.advertiserName,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `API error ${res.status}`);
        }

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        const list = data.data?.data || [];
        const mapped: MetaAd[] = list.map(mapAd);

        // NOTE: no client-side advertiser filter — the server already narrows via
        // PiPiAds' `advertiser_name` field filter (with a loose fallback). Adding
        // a strict client filter on top of that caused legitimate saved-brand
        // profile pages to appear empty when name casing/whitespace drifted.

        if (append) {
          setAllAds((prev) => {
            const ids = new Set(prev.map((a) => a.id));
            const unique = mapped.filter((a) => !ids.has(a.id));
            return [...prev, ...unique];
          });
        } else {
          setAllAds(mapped);
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
    (
      keyword: string,
      sortKey: SortKey = "default",
      direction: "asc" | "desc" = "desc",
      options?: { advertiserName?: string }
    ) => {
      const advertiserName = options?.advertiserName?.trim();
      if (!keyword.trim() && !advertiserName) return;
      searchParamsRef.current = {
        keyword: advertiserName ? "" : keyword,
        orderBy: ORDER_BY_MAP[sortKey],
        direction,
        advertiserName,
      };
      setAllAds([]);
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

  // Server-side re-sort: triggers fresh API call with new order_by
  const resort = useCallback(
    (sortKey: SortKey, direction: "asc" | "desc") => {
      const params = searchParamsRef.current;
      if (!params) return;
      searchParamsRef.current = {
        ...params,
        orderBy: ORDER_BY_MAP[sortKey],
        direction,
      };
      setAllAds([]);
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
    ads: allAds,
    allCount: allAds.length,
    loading,
    loadingMore,
    error,
    hasMore,
    search,
    resort,
    sentinelRef,
  };
}
