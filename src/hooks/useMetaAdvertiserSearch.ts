"use client";

import { useCallback, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export interface AdvertiserSummary {
  id: string;
  name: string;
  profilePic: string;
  adCount: number;
  adsetCount: number;
  adCountry: string[];
  likeCount: number;
  ecommercePlatform: string;
  adsLibraryLink: string;
  sourceLink: string;
  platforms: string[];
  sampleThumbs: string[];
  sampleCount: number;
}

/**
 * Paginated Meta advertiser search, powered by /api/meta-ads/advertisers which
 * groups the raw ads response into unique advertisers. Same shape as
 * useMetaAdSearch (search, resort, infinite scroll) so the page can reuse
 * patterns familiar from the ads grid.
 */
export function useMetaAdvertiserSearch() {
  const { token } = useAuth();
  const [advertisers, setAdvertisers] = useState<AdvertiserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const pageRef = useRef(1);
  const keywordRef = useRef<string>("");
  const orderByRef = useRef<string>("advertiser_ad_count");
  const directionRef = useRef<"asc" | "desc">("desc");
  const abortRef = useRef<AbortController | null>(null);
  const seenKeysRef = useRef<Set<string>>(new Set());

  const fetchPage = useCallback(
    async (pageNum: number, append: boolean) => {
      const keyword = keywordRef.current;
      if (!keyword.trim()) return;

      if (!append) {
        if (abortRef.current) abortRef.current.abort();
        setLoading(true);
        setError("");
        seenKeysRef.current = new Set();
      } else {
        setLoadingMore(true);
      }
      const controller = new AbortController();
      if (!append) abortRef.current = controller;

      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch("/api/meta-ads/advertisers", {
          method: "POST",
          headers,
          body: JSON.stringify({ keyword, page: pageNum, perPage: 60, orderBy: orderByRef.current, direction: directionRef.current }),
          signal: controller.signal,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `API error ${res.status}`);
        }
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        const next: AdvertiserSummary[] = data.advertisers || [];
        // Dedupe across pages (PiPiAds returns overlapping ads → same advertiser)
        const unique = next.filter((a) => {
          const key = a.id || a.name;
          if (!key || seenKeysRef.current.has(key)) return false;
          seenKeysRef.current.add(key);
          return true;
        });

        if (append) {
          setAdvertisers((prev) => [...prev, ...unique]);
        } else {
          setAdvertisers(unique);
        }
        setHasMore(Boolean(data.hasMore));
        pageRef.current = pageNum;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError((err as Error).message || "Bir hata olustu");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [token]
  );

  const search = useCallback(
    (keyword: string, orderBy: string = "advertiser_ad_count", direction: "asc" | "desc" = "desc") => {
      if (!keyword.trim()) return;
      keywordRef.current = keyword.trim();
      orderByRef.current = orderBy;
      directionRef.current = direction;
      setAdvertisers([]);
      setHasMore(false);
      pageRef.current = 1;
      fetchPage(1, false);
    },
    [fetchPage]
  );

  const resort = useCallback(
    (orderBy: string, direction: "asc" | "desc") => {
      const kw = keywordRef.current;
      if (!kw) return;
      orderByRef.current = orderBy;
      directionRef.current = direction;
      seenKeysRef.current = new Set();
      setAdvertisers([]);
      setHasMore(false);
      pageRef.current = 1;
      fetchPage(1, false);
    },
    [fetchPage]
  );

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;
    fetchPage(pageRef.current + 1, true);
  }, [fetchPage, hasMore, loadingMore, loading]);

  // Infinite scroll sentinel
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
        if (entries[0]?.isIntersecting) loadMoreRef.current();
      },
      { rootMargin: "300px" }
    );
    observerRef.current.observe(node);
  }, []);

  return {
    advertisers,
    loading,
    loadingMore,
    error,
    hasMore,
    search,
    resort,
    sentinelRef,
  };
}
