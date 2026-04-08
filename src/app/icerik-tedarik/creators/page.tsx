"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Star,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  Loader2,
  SearchX,
} from "lucide-react";
import {
  loadCreatorProfiles,
  type CreatorProfile,
  type CreatorFilters,
} from "@/lib/marketplace";

// --------------- constants ---------------

const CATEGORIES = [
  "Kozmetik",
  "Ev",
  "Spor",
  "Moda",
  "Teknoloji",
  "Yiyecek & İçecek",
  "Seyahat",
  "Oyun",
  "Finans",
  "Sağlık",
  "Ebeveynlik",
  "Otomotiv",
  "Diğer",
];

const TIERS: { value: string; label: string }[] = [
  { value: "micro", label: "Micro (<50K)" },
  { value: "mid", label: "Mid (50K-250K)" },
  { value: "macro", label: "Macro (250K-700K)" },
  { value: "mega", label: "Mega (700K+)" },
];

const SORT_OPTIONS: { value: CreatorFilters["sort"]; label: string }[] = [
  { value: "followers_desc", label: "Takipçi (Azalan)" },
  { value: "followers_asc", label: "Takipçi (Artan)" },
  { value: "reviews", label: "Yorum Sayısı" },
  { value: "newest", label: "En Yeni" },
];

const PAGE_SIZE = 20;

const TIER_COLORS: Record<string, string> = {
  micro: "bg-blue-500/15 text-blue-500",
  mid: "bg-green-500/15 text-green-500",
  macro: "bg-purple-500/15 text-purple-500",
  mega: "bg-red-500/15 text-red-500",
};

// --------------- helpers ---------------

function formatFollowers(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

// --------------- component ---------------

export default function CreatorsPage() {
  // filters
  const [type, setType] = useState<"ugc" | "influencer" | null>(null);
  const [source, setSource] = useState<"faycom" | "veritabani" | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [tier, setTier] = useState<string | null>(null);
  const [sort, setSort] = useState<CreatorFilters["sort"]>("followers_desc");
  const [page, setPage] = useState(1);

  // data
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchData = useCallback(async () => {
    setLoading(true);
    const filters: CreatorFilters = {
      page,
      pageSize: PAGE_SIZE,
      sort: sort ?? "followers_desc",
    };
    if (type) filters.type = type;
    if (source) filters.source = source;
    if (tier) filters.tier = tier;
    if (selectedCategories.length > 0) filters.categories = selectedCategories;

    const res = await loadCreatorProfiles(filters);
    setCreators(res.data);
    setTotal(res.total);
    setLoading(false);
  }, [type, source, tier, selectedCategories, sort, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [type, source, tier, selectedCategories, sort]);

  // category toggle
  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  // --------------- pill helper ---------------
  const pill = (
    active: boolean,
    onClick: () => void,
    label: string,
    size: "sm" | "md" = "md"
  ) => (
    <button
      onClick={onClick}
      className={`rounded-full font-medium transition-colors ${
        size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm"
      } ${
        active
          ? "bg-accent text-white"
          : "border border-border-default text-text-secondary hover:text-text-primary"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/icerik-tedarik"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Geri
        </Link>
        <h1 className="text-2xl font-bold text-text-primary">
          İçerik Üreticileri
        </h1>
        <p className="text-text-secondary mt-1">
          UGC ve influencer&apos;ları keşfet
        </p>
      </div>

      {/* Primary Toggle: Type */}
      <div className="flex flex-wrap gap-2 mb-3">
        {pill(type === null, () => setType(null), "Tümü")}
        {pill(type === "ugc", () => setType("ugc"), "UGC")}
        {pill(
          type === "influencer",
          () => setType("influencer"),
          "Influencer"
        )}
      </div>

      {/* Secondary Toggle: Source */}
      <div className="flex flex-wrap gap-2 mb-5">
        {pill(source === null, () => setSource(null), "Tümü", "sm")}
        {pill(
          source === "faycom",
          () => setSource("faycom"),
          "Faycom'a Özel",
          "sm"
        )}
        {pill(
          source === "veritabani",
          () => setSource("veritabani"),
          "Veritabanı",
          "sm"
        )}
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => toggleCategory(cat)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedCategories.includes(cat)
                ? "bg-accent text-white"
                : "border border-border-default text-text-secondary hover:text-text-primary"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tier filter (only when influencer selected) */}
      {type === "influencer" && (
        <div className="flex flex-wrap gap-2 mb-4">
          {pill(tier === null, () => setTier(null), "Tüm Tier", "sm")}
          {TIERS.map((t) =>
            pill(tier === t.value, () => setTier(t.value), t.label, "sm")
          )}
        </div>
      )}

      {/* Sort */}
      <div className="mb-6">
        <select
          value={sort ?? "followers_desc"}
          onChange={(e) =>
            setSort(e.target.value as CreatorFilters["sort"])
          }
          className="bg-bg-card border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-text-muted" />
        </div>
      ) : creators.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
          <SearchX size={48} className="mb-3 opacity-50" />
          <p className="text-lg font-medium">Sonuç bulunamadı</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {creators.map((c) => (
              <div
                key={c.id}
                className="bg-bg-card rounded-[14px] border border-border-default p-5 hover:-translate-y-0.5 transition-transform"
              >
                {/* Top row: avatar + name */}
                <div className="flex items-center gap-3 mb-3">
                  {c.avatar_url ? (
                    <Image
                      src={c.avatar_url}
                      alt={c.name}
                      width={44}
                      height={44}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-accent/20 text-accent flex items-center justify-center text-lg font-bold">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">
                      {c.name}
                    </p>
                    {c.city && (
                      <span className="flex items-center gap-1 text-xs text-text-muted">
                        <MapPin size={12} />
                        {c.city}
                      </span>
                    )}
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {/* Type badge */}
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      c.type === "ugc"
                        ? "bg-emerald-500/15 text-emerald-500"
                        : "bg-violet-500/15 text-violet-500"
                    }`}
                  >
                    {c.type === "ugc" ? "UGC" : "Influencer"}
                  </span>

                  {/* Tier badge */}
                  {c.tier && (
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        TIER_COLORS[c.tier] ?? ""
                      }`}
                    >
                      {c.tier.charAt(0).toUpperCase() + c.tier.slice(1)}
                    </span>
                  )}

                  {/* Source badge */}
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-text-muted/10 text-text-muted">
                    {c.source === "faycom" ? "Faycom'a Özel" : "Veritabanı"}
                  </span>
                </div>

                {/* Category */}
                {c.categories?.[0] && (
                  <p className="text-xs text-text-secondary mb-2">
                    {c.categories[0]}
                  </p>
                )}

                {/* Stats row */}
                <div className="flex items-center gap-4 text-xs text-text-muted mb-4">
                  <span className="flex items-center gap-1">
                    <Star size={13} className="text-amber-400" />
                    {c.avg_rating?.toFixed(1) ?? "0.0"} (
                    {c.review_count ?? 0})
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={13} />
                    {formatFollowers(c.follower_count)}
                  </span>
                </div>

                {/* CTA */}
                <Link
                  href={`/icerik-tedarik/creators/${c.id}`}
                  className="block w-full text-center text-sm font-medium py-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                >
                  Profili Gör
                </Link>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
              Önceki
            </button>
            <span className="text-sm text-text-muted">
              Sayfa {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Sonraki
              <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
