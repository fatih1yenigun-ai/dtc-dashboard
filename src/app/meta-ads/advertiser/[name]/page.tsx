"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FaycomLoader from "@/components/FaycomLoader";
import {
  ArrowLeft,
  Loader2,
  Megaphone,
  Globe,
  ExternalLink,
  Heart,
  Layers,
  Sparkles,
} from "lucide-react";
import { useMetaAdSearch, type MetaAd, type SortKey } from "@/hooks/useMetaAdSearch";
import { useAuth } from "@/context/AuthContext";
import { AdCard } from "@/components/meta-ads/AdCard";
import { AdDetailPopup } from "@/components/meta-ads/AdDetailPopup";
import { FLAG, formatCompact, toBrandData } from "@/components/meta-ads/utils";
import { loadFolders, createFolder, saveBrandsBulk } from "@/lib/supabase";
import { X } from "lucide-react";

const META_AD_SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "default", label: "Default" },
  { key: "ad_started_at", label: "Olusturma Tarihi" },
  { key: "adset_count", label: "Adset" },
  { key: "ad_audience_reach", label: "Erisim" },
  { key: "latest_actived_at", label: "Son reklam zamani" },
  { key: "ad_cost", label: "Harcama (USD)" },
  { key: "product_price_usd", label: "Urun fiyati (USD)" },
  { key: "product_ad_count", label: "Urun Reklam Sayisi" },
  { key: "active_days", label: "Gunler" },
];

export default function AdvertiserProfilePage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  // Next.js App Router already calls decodeURIComponent on dynamic route segments,
  // so `name` arrives already-decoded — do NOT decode again (would corrupt names
  // containing literal `%xx` sequences).
  const { name: advertiserName } = use(params);

  const router = useRouter();
  const { user } = useAuth();
  const {
    ads,
    allCount,
    loading,
    loadingMore,
    error,
    hasMore,
    search,
    resort,
    sentinelRef,
  } = useMetaAdSearch();

  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [detailAd, setDetailAd] = useState<MetaAd | null>(null);

  // Snapshot the advertiser header from the FIRST ad we ever see for this slug,
  // so re-sorting the grid (which fires a fresh page-1 fetch) doesn't make the
  // header card flicker between ads that have slightly different metadata.
  const [headerAd, setHeaderAd] = useState<MetaAd | null>(null);

  // Reset all per-advertiser state in render when the route slug changes — the
  // React "derived-state-from-props" pattern (https://react.dev/learn/you-might-not-need-an-effect#resetting-all-state-when-a-prop-changes).
  // Avoids the lint rule against setState-in-effect and prevents a wasted render.
  const [prevAdvertiser, setPrevAdvertiser] = useState(advertiserName);
  if (prevAdvertiser !== advertiserName) {
    setPrevAdvertiser(advertiserName);
    setHeaderAd(null);
    setSortKey("default");
    setSortDir("desc");
  }

  // First ad observed for this advertiser becomes the persistent header source.
  // Computed during render (not in an effect) per the same React guidance.
  if (!headerAd && ads.length > 0) {
    setHeaderAd(ads[0]);
  }

  // Save modal (mirrors /meta-ads page)
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveAd, setSaveAd] = useState<MetaAd | null>(null);
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  // Fire the advertiser-scoped search on mount / whenever the slug changes.
  // `search` is memoised inside the hook (depends only on `token`) so it's safe in deps.
  useEffect(() => {
    if (!advertiserName) return;
    search("", "default", "desc", { advertiserName });
  }, [advertiserName, search]);

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

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back navigation */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-4 cursor-pointer"
      >
        <ArrowLeft size={14} /> Meta Ad Library&apos;ye Don
      </button>

      {/* Loading state (initial) */}
      {loading && !headerAd && <FaycomLoader />}

      {/* Empty state — advertiser not found / no ads (only when we never saw any ads). */}
      {!loading && !headerAd && ads.length === 0 && !error && (
        <div className="max-w-lg mx-auto py-16">
          <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Megaphone size={28} className="text-accent" />
            </div>
            <h2 className="text-lg font-bold text-text-primary mb-2">Reklamveren Bulunamadi</h2>
            <p className="text-sm text-text-secondary mb-6">
              &quot;{advertiserName}&quot; icin veritabaninda reklam bulunamadi.
            </p>
            <button
              onClick={() => router.push("/meta-ads")}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-border-default text-text-secondary text-sm font-medium hover:bg-bg-hover cursor-pointer"
            >
              <ArrowLeft size={14} /> Meta Ad Library&apos;ye Don
            </button>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">{error}</div>
      )}

      {/* Profile header (rendered as soon as we have at least one ad) */}
      {headerAd && (
        <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start gap-5">
            {/* Avatar */}
            {headerAd.advertiserProfilePic ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={headerAd.advertiserProfilePic}
                alt={headerAd.advertiserName}
                className="w-20 h-20 rounded-full object-cover border border-border-default flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-bg-hover flex items-center justify-center flex-shrink-0">
                <Megaphone size={32} className="text-text-muted" />
              </div>
            )}

            {/* Info + actions */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-text-primary truncate">{headerAd.advertiserName || advertiserName}</h1>
                {headerAd.ecommercePlatform && (
                  <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[11px] font-medium">
                    {headerAd.ecommercePlatform}
                  </span>
                )}
              </div>

              {headerAd.advertiserAdCountry && headerAd.advertiserAdCountry.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 text-sm text-text-secondary mb-3">
                  <span className="text-xs text-text-muted mr-1">Hedef ulkeler:</span>
                  {headerAd.advertiserAdCountry.slice(0, 12).map((c) => (
                    <span key={c} className="text-base" title={c}>
                      {FLAG[c.toUpperCase()] || c}
                    </span>
                  ))}
                  {headerAd.advertiserAdCountry.length > 12 && (
                    <span className="text-xs text-text-muted">+{headerAd.advertiserAdCountry.length - 12}</span>
                  )}
                </div>
              )}

              {/* Stat chips */}
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="bg-bg-main rounded-lg px-3 py-2 flex items-center gap-2">
                  <Sparkles size={14} className="text-accent" />
                  <div>
                    <p className="text-[10px] text-text-muted leading-none mb-0.5">Toplam Reklam</p>
                    <p className="text-sm font-bold text-text-primary leading-none">{formatCompact(headerAd.advertiserAdCount)}</p>
                  </div>
                </div>
                <div className="bg-bg-main rounded-lg px-3 py-2 flex items-center gap-2">
                  <Layers size={14} className="text-accent" />
                  <div>
                    <p className="text-[10px] text-text-muted leading-none mb-0.5">Adset</p>
                    <p className="text-sm font-bold text-text-primary leading-none">{formatCompact(headerAd.advertiserAdsetCount)}</p>
                  </div>
                </div>
                <div className="bg-bg-main rounded-lg px-3 py-2 flex items-center gap-2">
                  <Heart size={14} className="text-accent" />
                  <div>
                    <p className="text-[10px] text-text-muted leading-none mb-0.5">Begeniler</p>
                    <p className="text-sm font-bold text-text-primary leading-none">{formatCompact(headerAd.advertiserLikeCount)}</p>
                  </div>
                </div>
              </div>

              {/* External actions */}
              <div className="flex flex-wrap gap-2">
                {headerAd.advertiserAdsLibraryLink && (
                  <a
                    href={headerAd.advertiserAdsLibraryLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100"
                  >
                    <Globe size={12} /> Meta Ad Library
                  </a>
                )}
                {headerAd.advertiserLink && (
                  <a
                    href={headerAd.advertiserLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-hover text-text-primary text-xs font-medium hover:bg-bg-main"
                  >
                    <ExternalLink size={12} /> Facebook
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sort controls + results */}
      {headerAd && (
        <>
          <div className="bg-bg-card rounded-xl shadow-sm border border-border-default p-4 mb-4 flex flex-wrap items-end gap-3">
            <div className="w-56">
              <label className="block text-xs font-medium text-text-primary mb-1">Siralama</label>
              <select
                value={sortKey}
                onChange={(e) => handleSortChange(e.target.value as SortKey)}
                className="w-full py-2 px-3 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                {META_AD_SORT_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="w-32">
              <label className="block text-xs font-medium text-text-primary mb-1">Sira</label>
              <div className="flex rounded-lg border border-border-default overflow-hidden">
                <button
                  onClick={() => handleDirChange("desc")}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${sortDir === "desc" ? "bg-accent text-white" : "bg-bg-card text-text-secondary hover:bg-bg-main"}`}
                >
                  Azalan
                </button>
                <button
                  onClick={() => handleDirChange("asc")}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${sortDir === "asc" ? "bg-accent text-white" : "bg-bg-card text-text-secondary hover:bg-bg-main"}`}
                >
                  Artan
                </button>
              </div>
            </div>
            <p className="text-xs text-text-secondary ml-auto">
              {allCount}
              {headerAd.advertiserAdCount > 0 ? ` / ${headerAd.advertiserAdCount}` : ""}{" "}
              reklam yuklendi{hasMore ? " (devam ediyor...)" : ""}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ads.map((ad) => (
              <AdCard key={ad.id} ad={ad} onDetail={setDetailAd} onOwnProfile />
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
        </>
      )}

      {/* Detail popup */}
      {detailAd && (
        <AdDetailPopup
          ad={detailAd}
          onClose={() => setDetailAd(null)}
          onSave={openSaveModal}
          onOwnProfile
        />
      )}

      {/* Save modal */}
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
