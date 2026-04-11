"use client";

import { useState } from "react";
import {
  Search,
  Loader2,
  X,
} from "lucide-react";
import { loadFolders, createFolder, saveBrandsBulk } from "@/lib/supabase";
import { useMetaAdSearch, type MetaAd, type SortKey } from "@/hooks/useMetaAdSearch";
import { useAuth } from "@/context/AuthContext";
import { AdCard } from "@/components/meta-ads/AdCard";
import { AdDetailPopup } from "@/components/meta-ads/AdDetailPopup";
import { toBrandData } from "@/components/meta-ads/utils";

const META_AD_SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "default", label: "Default" },
  { key: "ad_started_at", label: "Olusturma Tarihi" },
  { key: "adset_count", label: "Adset" },
  { key: "ad_audience_reach", label: "Erisim" },
  { key: "latest_actived_at", label: "Son reklam zamani" },
  { key: "ad_cost", label: "Harcama (USD)" },
  { key: "advertiser_ad_count", label: "Magaza materyali sayisi" },
  { key: "product_price_usd", label: "Urun fiyati (USD)" },
  { key: "product_ad_count", label: "Urun Reklam Sayisi" },
  { key: "product_creation_time", label: "Urun Olusturma Zamani" },
  { key: "active_days", label: "Gunler" },
];

export default function MetaAdsPage() {
  const { user } = useAuth();
  const {
    ads, allCount, loading, loadingMore, error, hasMore, search, resort, sentinelRef,
  } = useMetaAdSearch();

  const [localKeyword, setLocalKeyword] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Detail popup
  const [detailAd, setDetailAd] = useState<MetaAd | null>(null);

  // Save modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveAd, setSaveAd] = useState<MetaAd | null>(null);
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  function handleSearch() {
    if (!localKeyword.trim()) return;
    setSortKey("default");
    setSortDir("desc");
    search(localKeyword.trim(), "default", "desc");
  }

  function handleSortChange(key: SortKey) {
    setSortKey(key);
    resort(key, sortDir);
  }

  function handleDirChange(dir: "asc" | "desc") {
    setSortDir(dir);
    resort(sortKey, dir);
  }

  async function openSaveModal(ad: MetaAd) {
    setSaveAd(ad);
    setShowSaveModal(true);
    setSaveMsg("");
    try {
      const f = await loadFolders(user?.userId);
      setFolders(f);
      if (f.length > 0 && !selectedFolder) setSelectedFolder(f[0]);
    } catch {
      setFolders(["Genel"]);
    }
  }

  async function handleSave() {
    if (!saveAd) return;
    const folder = newFolderName.trim() || selectedFolder;
    if (!folder) return;
    try {
      if (newFolderName.trim()) await createFolder(newFolderName.trim(), user?.userId);
      const added = await saveBrandsBulk(folder, [toBrandData(saveAd)], user?.userId);
      setSaveMsg(`${added} marka kaydedildi!`);
      setTimeout(() => {
        setShowSaveModal(false);
        setSaveMsg("");
        setSaveAd(null);
      }, 1200);
    } catch {
      setSaveMsg("Hata olustu!");
    }
  }

  function openDetail(ad: MetaAd) {
    setDetailAd(ad);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Meta Ad Library</h1>
        <p className="text-text-secondary mt-1">PiPiAds ile Facebook/Instagram reklamlarini kesfet</p>
      </div>

      {/* Search Bar */}
      <div className="bg-bg-card rounded-xl shadow-sm border border-border-default p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Keyword */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-text-primary mb-1">Anahtar Kelime</label>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={localKeyword}
                onChange={(e) => setLocalKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="ornegin: skincare, led lamba, fitness..."
                className="w-full pl-10 pr-4 py-2.5 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>
          </div>

          {/* Sort */}
          <div className="w-56">
            <label className="block text-sm font-medium text-text-primary mb-1">Siralama</label>
            <select
              value={sortKey}
              onChange={(e) => handleSortChange(e.target.value as SortKey)}
              className="w-full py-2.5 px-3 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              {META_AD_SORT_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Asc/Desc */}
          <div className="w-32">
            <label className="block text-sm font-medium text-text-primary mb-1">Sira</label>
            <div className="flex rounded-lg border border-border-default overflow-hidden">
              <button
                onClick={() => handleDirChange("desc")}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${sortDir === "desc" ? "bg-accent text-white" : "bg-bg-card text-text-secondary hover:bg-bg-main"}`}
              >
                Azalan
              </button>
              <button
                onClick={() => handleDirChange("asc")}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${sortDir === "asc" ? "bg-accent text-white" : "bg-bg-card text-text-secondary hover:bg-bg-main"}`}
              >
                Artan
              </button>
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={loading || !localKeyword.trim()}
              className="gradient-accent text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
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

      {/* Loading */}
      {loading && (
        <div className="py-16 flex flex-col items-center">
          <Loader2 size={32} className="animate-spin text-accent mb-3" />
          <p className="text-text-secondary font-medium">PiPiAds&apos;ten reklamlar aliniyor...</p>
        </div>
      )}

      {/* Results */}
      {!loading && ads.length > 0 && (
        <div>
          <p className="text-sm text-text-secondary mb-4">
            {allCount} reklam yuklendi{hasMore ? " (devam ediyor...)" : ""}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ads.map((ad) => (
              <AdCard key={ad.id} ad={ad} onDetail={openDetail} />
            ))}
          </div>

          {hasMore && !loadingMore && <div key={ads.length} ref={sentinelRef} className="py-8" />}
          {loadingMore && (
            <div className="py-8 flex justify-center">
              <div className="flex items-center gap-2 text-text-muted">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm">Daha fazla reklam yukleniyor...</span>
              </div>
            </div>
          )}
          {!hasMore && ads.length > 0 && (
            <p className="text-center text-sm text-text-muted py-8">
              Tum reklamlar yuklendi ({allCount} reklam)
            </p>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && ads.length === 0 && !error && allCount === 0 && localKeyword && (
        <div className="text-center py-16 text-text-muted">
          <p className="text-lg">Sonuc bulunamadi</p>
          <p className="text-sm mt-1">Farkli bir anahtar kelime deneyin</p>
        </div>
      )}

      {/* ═══ AD DETAIL POPUP ═══ */}
      {detailAd && (
        <AdDetailPopup
          ad={detailAd}
          onClose={() => setDetailAd(null)}
          onSave={openSaveModal}
        />
      )}

      {/* ═══ SAVE MODAL ═══ */}
      {showSaveModal && saveAd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-card rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text-primary">Klasore Kaydet</h3>
              <button onClick={() => { setShowSaveModal(false); setSaveAd(null); }} className="text-text-muted hover:text-text-secondary cursor-pointer"><X size={20} /></button>
            </div>
            <p className="text-sm text-text-secondary mb-4">&quot;{saveAd.advertiserName}&quot;</p>
            {folders.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-text-secondary mb-1">Mevcut Klasor</label>
                <select value={selectedFolder} onChange={(e) => setSelectedFolder(e.target.value)} className="w-full py-2 px-3 border border-border-default rounded-lg text-sm">
                  {folders.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-xs font-medium text-text-secondary mb-1">veya Yeni Klasor</label>
              <div className="flex gap-2">
                <input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Yeni klasor adi..." className="flex-1 py-2 px-3 border border-border-default rounded-lg text-sm" />
                <button
                  onClick={async () => {
                    if (!newFolderName.trim()) return;
                    await createFolder(newFolderName.trim(), user?.userId);
                    setFolders((p) => [...p, newFolderName.trim()]);
                    setSelectedFolder(newFolderName.trim());
                    setNewFolderName("");
                  }}
                  className="px-3 py-2 bg-bg-hover text-text-primary rounded-lg text-sm hover:bg-bg-hover cursor-pointer"
                >
                  Olustur
                </button>
              </div>
            </div>
            {saveMsg && <p className="text-sm text-green-600 mb-3">{saveMsg}</p>}
            <button onClick={handleSave} className="w-full gradient-accent text-white py-2.5 rounded-lg text-sm font-medium hover:opacity-90 cursor-pointer">Kaydet</button>
          </div>
        </div>
      )}
    </div>
  );
}
