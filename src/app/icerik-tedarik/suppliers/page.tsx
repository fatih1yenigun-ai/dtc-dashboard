"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  MapPin,
  Factory,
  Loader2,
  Package,
  Globe,
  ExternalLink,
} from "lucide-react";
import {
  loadSupplierProfiles,
  type SupplierProfile,
  type SupplierFilters,
} from "@/lib/marketplace";

const CATEGORIES = [
  "Kozmetik",
  "Tekstil",
  "Elektronik",
  "Gıda",
  "Ambalaj",
  "Ev",
  "Spor",
  "Moda",
  "Teknoloji",
  "Sağlık",
  "Diğer",
];

const CITIES = [
  "İstanbul",
  "Ankara",
  "İzmir",
  "Bursa",
  "Antalya",
  "Konya",
  "Gaziantep",
  "Adana",
  "Mersin",
  "Kayseri",
  "Denizli",
  "Diğer",
];

const PAGE_SIZE = 20;

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  // Filters
  const [sourceFilter, setSourceFilter] = useState<
    "all" | "faycom" | "veritabani"
  >("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [sortFilter, setSortFilter] = useState<"reviews" | "newest">("newest");

  const fetchData = useCallback(
    async (p: number, append = false) => {
      if (isLoadingRef.current && append) return;
      isLoadingRef.current = true;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const filters: SupplierFilters = {
          page: p,
          pageSize: PAGE_SIZE,
          sort: sortFilter,
        };
        if (sourceFilter !== "all") filters.source = sourceFilter;
        if (categoryFilter) filters.category = categoryFilter;
        if (cityFilter) filters.city = cityFilter;

        const result = await loadSupplierProfiles(filters);

        if (append) {
          setSuppliers((prev) => {
            const existingIds = new Set(prev.map((s) => s.id));
            return [...prev, ...result.data.filter((s) => !existingIds.has(s.id))];
          });
        } else {
          setSuppliers(result.data);
        }
        setTotal(result.total);
        setHasMore(p * PAGE_SIZE < result.total);
      } catch (err) {
        console.error("fetchData error:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isLoadingRef.current = false;
      }
    },
    [sourceFilter, categoryFilter, cityFilter, sortFilter]
  );

  // Reset on filter change
  useEffect(() => {
    setPage(1);
    setSuppliers([]);
    setHasMore(true);
    fetchData(1);
  }, [fetchData]);

  // Infinite scroll observer
  useEffect(() => {
    if (!observerRef.current || !hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingRef.current) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchData(nextPage, true);
        }
      },
      { rootMargin: "0px 0px 200px 0px" }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page, fetchData]);

  function getWebsiteDomain(url: string): string {
    try {
      const hostname = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
      return hostname.replace("www.", "");
    } catch {
      return url;
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/icerik-tedarik"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-3"
        >
          <ArrowLeft size={16} />
          Geri
        </Link>
        <h1 className="text-2xl font-bold text-text-primary">Tedarik</h1>
        <p className="text-text-secondary mt-1">
          Fason üreticileri keşfet
        </p>
      </div>

      {/* Source Toggle */}
      <div className="flex items-center gap-2 mb-4">
        {(
          [
            { value: "all", label: "Tümü" },
            { value: "faycom", label: "Faycom'a Özel" },
            { value: "veritabani", label: "Veritabanı" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSourceFilter(opt.value)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              sourceFilter === opt.value
                ? "bg-text-primary text-bg-main border-text-primary"
                : "bg-bg-card text-text-secondary border-border-default hover:border-text-muted"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-lg border border-border-default bg-bg-card text-text-primary"
        >
          <option value="">Tüm Kategoriler</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-lg border border-border-default bg-bg-card text-text-primary"
        >
          <option value="">Tüm Şehirler</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={sortFilter}
          onChange={(e) =>
            setSortFilter(e.target.value as "reviews" | "newest")
          }
          className="px-3 py-1.5 text-sm rounded-lg border border-border-default bg-bg-card text-text-primary"
        >
          <option value="reviews">Yorum Sayısı</option>
          <option value="newest">En Yeni</option>
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-text-muted" />
        </div>
      ) : suppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
          <Package size={40} className="mb-3 opacity-40" />
          <p className="text-sm">Sonuç bulunamadı</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-text-muted mb-3">
            {total} sonuç
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((s) => (
              <div
                key={s.id}
                className="bg-bg-card rounded-[14px] border border-border-default p-5 flex flex-col gap-3"
              >
                {/* Company name */}
                <h3 className="text-sm font-bold text-text-primary leading-snug">
                  {s.company_name}
                </h3>

                {/* Website - prominent clickable link */}
                {s.website && (
                  <a
                    href={s.website.startsWith("http") ? s.website : `https://${s.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors truncate"
                  >
                    <Globe size={13} className="shrink-0" />
                    {getWebsiteDomain(s.website)}
                    <ExternalLink size={11} className="shrink-0 opacity-60" />
                  </a>
                )}

                {/* City */}
                {s.city && (
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <MapPin size={13} className="shrink-0" />
                    {s.city}
                  </div>
                )}

                {/* Category + specialty */}
                {s.category && (
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <Factory size={13} className="shrink-0" />
                    {s.category}
                    {s.specialty && (
                      <span className="text-text-muted">
                        &rarr; {s.specialty}
                      </span>
                    )}
                  </div>
                )}

                {/* Marketplace links */}
                {(s.marketplace_shopier || s.marketplace_trendyol || s.marketplace_hepsiburada || s.marketplace_n11 || s.marketplace_amazon_tr) && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {s.marketplace_shopier && (
                      <a href={s.marketplace_shopier} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-accent transition-colors">
                        <ExternalLink size={11} />Shopier
                      </a>
                    )}
                    {s.marketplace_trendyol && (
                      <a href={s.marketplace_trendyol} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-accent transition-colors">
                        <ExternalLink size={11} />Trendyol
                      </a>
                    )}
                    {s.marketplace_hepsiburada && (
                      <a href={s.marketplace_hepsiburada} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-accent transition-colors">
                        <ExternalLink size={11} />Hepsiburada
                      </a>
                    )}
                    {s.marketplace_n11 && (
                      <a href={s.marketplace_n11} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-accent transition-colors">
                        <ExternalLink size={11} />N11
                      </a>
                    )}
                    {s.marketplace_amazon_tr && (
                      <a href={s.marketplace_amazon_tr} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-accent transition-colors">
                        <ExternalLink size={11} />Amazon
                      </a>
                    )}
                  </div>
                )}

                {/* Rating */}
                <div className="flex items-center gap-1 text-xs text-text-muted">
                  <Star size={13} className="text-yellow-500" />
                  <span>
                    {s.avg_rating
                      ? `${s.avg_rating} (${s.review_count})`
                      : "Henüz yorum yok"}
                  </span>
                </div>

                {/* CTA */}
                <Link
                  href={`/icerik-tedarik/suppliers/${s.id}`}
                  className="mt-auto pt-2 text-center text-sm font-medium px-4 py-2 rounded-lg border border-border-default hover:bg-bg-main transition-colors text-text-primary"
                >
                  Profili Gör
                </Link>
              </div>
            ))}
          </div>

          {/* Infinite scroll trigger */}
          <div ref={observerRef} className="h-10 mt-4">
            {loadingMore && (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={20} className="animate-spin text-text-muted" />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
