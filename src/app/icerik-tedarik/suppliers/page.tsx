"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  MapPin,
  Factory,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
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

  // Filters
  const [typeFilter, setTypeFilter] = useState<
    "all" | "uretici" | "toptanci"
  >("all");
  const [sourceFilter, setSourceFilter] = useState<
    "all" | "faycom" | "veritabani"
  >("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [sortFilter, setSortFilter] = useState<"reviews" | "newest">("newest");

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchData = useCallback(
    async (p: number) => {
      setLoading(true);
      const filters: SupplierFilters = {
        page: p,
        pageSize: PAGE_SIZE,
        sort: sortFilter,
      };
      if (typeFilter !== "all") filters.type = typeFilter;
      if (sourceFilter !== "all") filters.source = sourceFilter;
      if (categoryFilter) filters.category = categoryFilter;
      if (cityFilter) filters.city = cityFilter;

      const result = await loadSupplierProfiles(filters);
      setSuppliers(result.data);
      setTotal(result.total);
      setLoading(false);
    },
    [typeFilter, sourceFilter, categoryFilter, cityFilter, sortFilter]
  );

  useEffect(() => {
    setPage(1);
    fetchData(1);
  }, [fetchData]);

  function goToPage(p: number) {
    setPage(p);
    fetchData(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
          Üretici ve toptancıları keşfet
        </p>
      </div>

      {/* Type Toggle */}
      <div className="flex items-center gap-2 mb-4">
        {(
          [
            { value: "all", label: "Tümü" },
            { value: "uretici", label: "Üretici" },
            { value: "toptanci", label: "Toptancı" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            onClick={() => setTypeFilter(opt.value)}
            className={`px-4 py-1.5 text-sm rounded-full border transition-colors ${
              typeFilter === opt.value
                ? "bg-text-primary text-bg-main border-text-primary"
                : "bg-bg-card text-text-secondary border-border-default hover:border-text-muted"
            }`}
          >
            {opt.label}
          </button>
        ))}
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
        {/* Category */}
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

        {/* City */}
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

        {/* Sort */}
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
            {total} sonuç{totalPages > 1 && ` — Sayfa ${page}/${totalPages}`}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((s) => (
              <div
                key={s.id}
                className="bg-bg-card rounded-[14px] border border-border-default p-5 flex flex-col gap-3"
              >
                {/* Company name */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-text-primary leading-snug">
                    {s.company_name}
                  </h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Type badge */}
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        s.type === "uretici"
                          ? "bg-emerald-500/15 text-emerald-500"
                          : "bg-orange-500/15 text-orange-500"
                      }`}
                    >
                      {s.type === "uretici" ? "Üretici" : "Toptancı"}
                    </span>
                  </div>
                </div>

                {/* Source badge */}
                <span className="text-[11px] text-text-muted bg-bg-main px-2 py-0.5 rounded-full w-fit">
                  {s.source === "faycom" ? "Faycom'a Özel" : "Veritabanı"}
                </span>

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

                {/* Rating placeholder */}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 mt-6 border-t border-border-default">
              <button
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-border-default hover:bg-bg-card disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} /> Önceki
              </button>
              <span className="text-sm text-text-secondary">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => goToPage(page + 1)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-border-default hover:bg-bg-card disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Sonraki <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
