"use client";

import { useState } from "react";
import { Search, Loader2, Users, ArrowUp, ArrowDown } from "lucide-react";
import FaycomLoader from "@/components/FaycomLoader";
import { useMetaAdvertiserSearch } from "@/hooks/useMetaAdvertiserSearch";
import { MetaAdsTabs } from "@/components/meta-ads/MetaAdsTabs";
import { AdvertiserCard } from "@/components/meta-ads/AdvertiserCard";

const ADV_SORT_OPTIONS = [
  { key: "advertiser_ad_count", label: "Reklam Sayisi" },
  { key: "ad_audience_reach", label: "Erisim / Gosterim" },
  { key: "ad_cost", label: "Reklam Harcamasi" },
  { key: "ad_started_at", label: "Baslangic Tarihi" },
  { key: "latest_actived_at", label: "Bitis Tarihi" },
  { key: "active_days", label: "Reklam Sureleri" },
  { key: "adset_count", label: "Adset" },
];

export default function MetaAdvertisersPage() {
  const { advertisers, loading, loadingMore, error, hasMore, search, resort, sentinelRef } = useMetaAdvertiserSearch();
  const [keyword, setKeyword] = useState("");
  const [sortKey, setSortKey] = useState("advertiser_ad_count");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSearch() {
    if (!keyword.trim()) return;
    setSortKey("advertiser_ad_count");
    setSortDir("desc");
    search(keyword.trim(), "advertiser_ad_count", "desc");
  }

  function handleSortChange(key: string) {
    setSortKey(key);
    resort(key, sortDir);
  }

  function handleDirChange(dir: "asc" | "desc") {
    setSortDir(dir);
    resort(sortKey, dir);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Meta Reklamcilar</h1>
        <p className="text-text-secondary mt-1">
          Reklamveren adi ile reklamverenleri kesfet, tiklayinca tum reklamlarini gor.
        </p>
      </div>

      <MetaAdsTabs active="reklamcilar" />

      {/* Search bar + Sort */}
      <div className="bg-bg-card rounded-xl shadow-sm border border-border-default p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-text-primary mb-1">Reklamveren Adi</label>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="ornegin: rhode, primally pure, glossier..."
                className="w-full pl-10 pr-4 py-2.5 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>
          </div>

          {/* Sort */}
          <div className="w-56">
            <label className="block text-sm font-medium text-text-primary mb-1">Siralama</label>
            <select
              value={sortKey}
              onChange={(e) => handleSortChange(e.target.value)}
              className="w-full py-2.5 px-3 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              {ADV_SORT_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Asc/Desc */}
          <div className="w-24">
            <label className="block text-sm font-medium text-text-primary mb-1">Sira</label>
            <div className="flex rounded-lg border border-border-default overflow-hidden">
              <button
                onClick={() => handleDirChange("desc")}
                className={`flex-1 py-2.5 flex items-center justify-center transition-colors ${sortDir === "desc" ? "bg-accent text-white" : "bg-bg-card text-text-secondary hover:bg-bg-main"}`}
              >
                <ArrowDown size={16} />
              </button>
              <button
                onClick={() => handleDirChange("asc")}
                className={`flex-1 py-2.5 flex items-center justify-center transition-colors ${sortDir === "asc" ? "bg-accent text-white" : "bg-bg-card text-text-secondary hover:bg-bg-main"}`}
              >
                <ArrowUp size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={loading || !keyword.trim()}
              className="gradient-accent text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Ara
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">{error}</div>
      )}

      {/* Loading (initial) */}
      {loading && advertisers.length === 0 && <FaycomLoader />}

      {/* Empty initial state */}
      {!loading && advertisers.length === 0 && !error && !keyword && (
        <div className="text-center py-16 text-text-muted">
          <Users size={48} className="mx-auto mb-3 opacity-40" />
          <p className="text-base">Aramak icin bir reklamveren adi girin.</p>
        </div>
      )}

      {/* No matches */}
      {!loading && advertisers.length === 0 && !error && keyword && (
        <div className="text-center py-16 text-text-muted">
          <p className="text-base">Bu anahtar kelime icin reklamveren bulunamadi.</p>
          <p className="text-sm mt-1">Farkli bir anahtar kelime dene.</p>
        </div>
      )}

      {/* Results */}
      {advertisers.length > 0 && (
        <>
          <p className="text-sm text-text-secondary mb-4">
            {advertisers.length} reklamveren bulundu{hasMore ? " (devam ediyor...)" : ""}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {advertisers.map((adv) => (
              <AdvertiserCard key={adv.id || adv.name} advertiser={adv} />
            ))}
          </div>

          {hasMore && !loadingMore && <div key={advertisers.length} ref={sentinelRef} className="py-8" />}
          {loadingMore && (
            <div className="py-8 flex justify-center">
              <div className="flex items-center gap-2 text-text-muted">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm">Daha fazla reklamveren yukleniyor...</span>
              </div>
            </div>
          )}
          {!hasMore && advertisers.length > 0 && (
            <p className="text-center text-sm text-text-muted py-8">Tum reklamverenler yuklendi.</p>
          )}
        </>
      )}
    </div>
  );
}
