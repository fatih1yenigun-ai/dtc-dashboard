"use client";

import { useState } from "react";
import { Search, Loader2, Users } from "lucide-react";
import { useMetaAdvertiserSearch } from "@/hooks/useMetaAdvertiserSearch";
import { MetaAdsTabs } from "@/components/meta-ads/MetaAdsTabs";
import { AdvertiserCard } from "@/components/meta-ads/AdvertiserCard";

export default function MetaAdvertisersPage() {
  const { advertisers, loading, loadingMore, error, hasMore, search, sentinelRef } = useMetaAdvertiserSearch();
  const [keyword, setKeyword] = useState("");

  function handleSearch() {
    if (!keyword.trim()) return;
    search(keyword.trim());
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Meta Reklamcilar</h1>
        <p className="text-text-secondary mt-1">
          Bir anahtar kelime ile PiPiAds&apos;ten reklamverenleri kesfet, tiklayinca o reklamverenin tum reklamlarini gor.
        </p>
      </div>

      <MetaAdsTabs active="reklamcilar" />

      {/* Search bar */}
      <div className="bg-bg-card rounded-xl shadow-sm border border-border-default p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-text-primary mb-1">Anahtar Kelime</label>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="ornegin: skincare, fitness, rhode, primally pure..."
                className="w-full pl-10 pr-4 py-2.5 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
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
      {loading && advertisers.length === 0 && (
        <div className="py-16 flex flex-col items-center">
          <Loader2 size={32} className="animate-spin text-accent mb-3" />
          <p className="text-text-secondary font-medium">Reklamverenler yukleniyor...</p>
        </div>
      )}

      {/* Empty initial state (no search yet) */}
      {!loading && advertisers.length === 0 && !error && !keyword && (
        <div className="text-center py-16 text-text-muted">
          <Users size={48} className="mx-auto mb-3 opacity-40" />
          <p className="text-base">Aramak icin bir anahtar kelime girin.</p>
          <p className="text-sm mt-1">
            Bulunan reklamverenlere tiklayarak <span className="text-accent font-medium">tum reklamlarini</span> goruntuleyebilirsin.
          </p>
        </div>
      )}

      {/* No matches for a search */}
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
