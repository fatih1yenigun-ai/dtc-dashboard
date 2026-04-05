"use client";

import { useState, useRef } from "react";
import {
  Search,
  Loader2,
  ExternalLink,
  Play,
  Save,
  X,
  ShoppingBag,
  Globe,
  Megaphone,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { loadFolders, createFolder, saveBrandsBulk, type BrandData } from "@/lib/supabase";
import { useMetaAdSearch, type MetaAd, type SortKey } from "@/hooks/useMetaAdSearch";
import { useAuth } from "@/context/AuthContext";

const FLAG: Record<string, string> = {
  US: "\u{1F1FA}\u{1F1F8}", UK: "\u{1F1EC}\u{1F1E7}", GB: "\u{1F1EC}\u{1F1E7}",
  DE: "\u{1F1E9}\u{1F1EA}", FR: "\u{1F1EB}\u{1F1F7}", TR: "\u{1F1F9}\u{1F1F7}",
  AU: "\u{1F1E6}\u{1F1FA}", KR: "\u{1F1F0}\u{1F1F7}", JP: "\u{1F1EF}\u{1F1F5}",
  CA: "\u{1F1E8}\u{1F1E6}", NL: "\u{1F1F3}\u{1F1F1}", SE: "\u{1F1F8}\u{1F1EA}",
  IT: "\u{1F1EE}\u{1F1F9}", ES: "\u{1F1EA}\u{1F1F8}", BR: "\u{1F1E7}\u{1F1F7}",
  IN: "\u{1F1EE}\u{1F1F3}", CN: "\u{1F1E8}\u{1F1F3}", ID: "\u{1F1EE}\u{1F1E9}",
  TH: "\u{1F1F9}\u{1F1ED}", VN: "\u{1F1FB}\u{1F1F3}", MY: "\u{1F1F2}\u{1F1FE}",
  PH: "\u{1F1F5}\u{1F1ED}", SG: "\u{1F1F8}\u{1F1EC}", MX: "\u{1F1F2}\u{1F1FD}",
  BE: "\u{1F1E7}\u{1F1EA}", AT: "\u{1F1E6}\u{1F1F9}", PL: "\u{1F1F5}\u{1F1F1}",
  RO: "\u{1F1F7}\u{1F1F4}", GR: "\u{1F1EC}\u{1F1F7}", HU: "\u{1F1ED}\u{1F1FA}",
  HR: "\u{1F1ED}\u{1F1F7}", PT: "\u{1F1F5}\u{1F1F9}", LU: "\u{1F1F1}\u{1F1FA}",
  DK: "\u{1F1E9}\u{1F1F0}", FI: "\u{1F1EB}\u{1F1EE}",
};

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

const PLATFORM_LABELS: Record<string, string> = {
  FACEBOOK: "FB",
  INSTAGRAM: "IG",
  AUDIENCE_NETWORK: "AN",
  MESSENGER: "MSG",
  THREADS: "THR",
};

function formatCompact(n: number | null | undefined): string {
  if (n === null || n === undefined) return "-";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatMoney(n: number | null | undefined): string {
  if (n === null || n === undefined) return "-";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function formatDate(ts: number): string {
  if (!ts) return "-";
  const d = new Date(ts * 1000);
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function toBrandData(ad: MetaAd): BrandData {
  return {
    Marka: ad.advertiserName,
    "Web Sitesi": ad.landingPages?.[0] || ad.storeLink || "",
    Kategori: ad.productCategoryName || "Meta Reklam",
    "Harcama ($)": ad.adCost,
    "Erisim": ad.adAudienceReach,
    "One Cikan Ozellik": ad.adContent?.substring(0, 200) || "",
    "Buyume Yontemi": "Meta Ads",
    Kaynak: "PiPiAds Meta",
    Cover: ad.thumbnail,
    Ulke: ad.country?.join(", "),
  } as BrandData;
}

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
  const [carouselIdx, setCarouselIdx] = useState(0);

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
    setCarouselIdx(0);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Meta Ad Library</h1>
        <p className="text-gray-500 mt-1">PiPiAds ile Facebook/Instagram reklamlarini kesfet</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Keyword */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Anahtar Kelime</label>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={localKeyword}
                onChange={(e) => setLocalKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="ornegin: skincare, led lamba, fitness..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30 focus:border-[#667eea]"
              />
            </div>
          </div>

          {/* Sort */}
          <div className="w-56">
            <label className="block text-sm font-medium text-gray-700 mb-1">Siralama</label>
            <select
              value={sortKey}
              onChange={(e) => handleSortChange(e.target.value as SortKey)}
              className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30"
            >
              {META_AD_SORT_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Asc/Desc */}
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">Sira</label>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => handleDirChange("desc")}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${sortDir === "desc" ? "bg-[#667eea] text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
              >
                Azalan
              </button>
              <button
                onClick={() => handleDirChange("asc")}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${sortDir === "asc" ? "bg-[#667eea] text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
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
          <Loader2 size={32} className="animate-spin text-[#667eea] mb-3" />
          <p className="text-gray-500 font-medium">PiPiAds&apos;ten reklamlar aliniyor...</p>
        </div>
      )}

      {/* Results */}
      {!loading && ads.length > 0 && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            {allCount} reklam yuklendi{hasMore ? " (devam ediyor...)" : ""}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ads.map((ad) => (
              <AdCard key={ad.id} ad={ad} onDetail={openDetail} onSave={openSaveModal} />
            ))}
          </div>

          {hasMore && !loadingMore && <div key={ads.length} ref={sentinelRef} className="py-8" />}
          {loadingMore && (
            <div className="py-8 flex justify-center">
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm">Daha fazla reklam yukleniyor...</span>
              </div>
            </div>
          )}
          {!hasMore && ads.length > 0 && (
            <p className="text-center text-sm text-gray-400 py-8">
              Tum reklamlar yuklendi ({allCount} reklam)
            </p>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && ads.length === 0 && !error && allCount === 0 && localKeyword && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">Sonuc bulunamadi</p>
          <p className="text-sm mt-1">Farkli bir anahtar kelime deneyin</p>
        </div>
      )}

      {/* ═══ AD DETAIL POPUP ═══ */}
      {detailAd && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-8" onClick={() => setDetailAd(null)}>
          <div className="bg-white rounded-xl w-full max-w-3xl mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {detailAd.advertiserProfilePic ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={detailAd.advertiserProfilePic} alt={detailAd.advertiserName} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center"><Megaphone size={18} className="text-gray-400" /></div>
                )}
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{detailAd.advertiserName || "Bilinmeyen"}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {detailAd.ecommercePlatform && (
                      <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[10px] font-medium">{detailAd.ecommercePlatform}</span>
                    )}
                    <span>{detailAd.adPlatform.map((p) => PLATFORM_LABELS[p] || p).join(" · ")}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setDetailAd(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={20} /></button>
            </div>

            <div className="flex flex-col md:flex-row">
              {/* Left: Creative */}
              <div className="md:w-1/2 p-5 border-r border-gray-100">
                {detailAd.mediaFormat === 1 && detailAd.videos.length > 0 ? (
                  <video
                    src={detailAd.videos[0].url}
                    poster={detailAd.videos[0].coverUrl}
                    controls
                    className="w-full rounded-lg bg-gray-100"
                  />
                ) : detailAd.mediaFormat === 3 && detailAd.cards.length > 0 ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={detailAd.cards[carouselIdx]?.url}
                      alt={`Card ${carouselIdx + 1}`}
                      className="w-full rounded-lg object-cover"
                    />
                    {detailAd.cards.length > 1 && (
                      <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2">
                        <button
                          onClick={() => setCarouselIdx(Math.max(0, carouselIdx - 1))}
                          disabled={carouselIdx === 0}
                          className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs bg-black/60 text-white px-2 py-0.5 rounded-full">
                          {carouselIdx + 1}/{detailAd.cards.length}
                        </span>
                        <button
                          onClick={() => setCarouselIdx(Math.min(detailAd.cards.length - 1, carouselIdx + 1))}
                          disabled={carouselIdx === detailAd.cards.length - 1}
                          className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ) : detailAd.images.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={detailAd.images[0].url} alt="Ad" className="w-full rounded-lg object-cover" />
                ) : detailAd.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={detailAd.thumbnail} alt="Ad" className="w-full rounded-lg object-cover" />
                ) : (
                  <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                    <ImageIcon size={48} className="text-gray-300" />
                  </div>
                )}

                {/* Ad text */}
                <div className="mt-4 max-h-40 overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{detailAd.adContent || "Reklam metni yok"}</p>
                </div>
              </div>

              {/* Right: Details */}
              <div className="md:w-1/2 p-5 space-y-4">
                {/* Country */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Ulke</p>
                  <div className="flex flex-wrap gap-1">
                    {detailAd.country.map((c) => (
                      <span key={c} className="text-sm">
                        {FLAG[c.toUpperCase()] || c} <span className="text-xs text-gray-500">{c}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Landing Page */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Acilis Sayfasi</p>
                  {detailAd.landingPages.map((lp, i) => (
                    <a key={i} href={lp} target="_blank" rel="noopener noreferrer" className="text-sm text-[#667eea] hover:underline flex items-center gap-1 mb-0.5">
                      <ExternalLink size={12} />
                      {lp.length > 60 ? lp.substring(0, 60) + "..." : lp}
                    </a>
                  ))}
                  {detailAd.landingPages.length === 0 && <span className="text-sm text-gray-400">-</span>}
                </div>

                {/* CTA */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">CTA</p>
                  <span className="text-sm bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg">{detailAd.buttonText || "-"}</span>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-emerald-50 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-emerald-600 mb-0.5">Harcama</p>
                    <p className="text-sm font-bold text-emerald-700">{formatMoney(detailAd.adCost)}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-blue-600 mb-0.5">Erisim</p>
                    <p className="text-sm font-bold text-blue-700">{formatCompact(detailAd.adAudienceReach)}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-purple-600 mb-0.5">Adset</p>
                    <p className="text-sm font-bold text-purple-700">{detailAd.adsetCount}</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-amber-600 mb-0.5">Gunler</p>
                    <p className="text-sm font-bold text-amber-700">{detailAd.activeDays}</p>
                  </div>
                  <div className="bg-cyan-50 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-cyan-600 mb-0.5">Platform</p>
                    <p className="text-sm font-bold text-cyan-700">{detailAd.adPlatform.map((p) => PLATFORM_LABELS[p] || p).join(", ")}</p>
                  </div>
                  <div className="bg-rose-50 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-rose-600 mb-0.5">Durum</p>
                    <p className="text-sm font-bold text-rose-700">{detailAd.adStatus === 2 ? "Aktif" : "Pasif"}</p>
                  </div>
                </div>

                {/* Product info */}
                {detailAd.productName && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">Urun Bilgisi</p>
                    <div className="flex items-center gap-3">
                      {detailAd.productImageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={detailAd.productImageUrl} alt={detailAd.productName} className="w-12 h-12 rounded-lg object-cover" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{detailAd.productName}</p>
                        <p className="text-xs text-gray-500">
                          ${detailAd.productPriceUsd.toFixed(2)} · {detailAd.productCategoryName}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Audience */}
                {detailAd.adAudience && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">Hedef Kitle</p>
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <span>Toplam: {formatCompact(detailAd.adAudience.totalReach)}</span>
                      <span>Cinsiyet: {detailAd.adAudience.genderAudience}</span>
                      <span>Yas: {detailAd.adAudience.ageMin}-{detailAd.adAudience.ageMax}+</span>
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Baslangic: {formatDate(detailAd.adStartedAt)}</span>
                  <span>Ilk Gorulme: {formatDate(detailAd.firstDiscoveredAt)}</span>
                  <span>Son Gorulme: {formatDate(detailAd.lastDiscoveredAt)}</span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    onClick={() => { setDetailAd(null); openSaveModal(detailAd); }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg gradient-accent text-white text-sm font-medium hover:opacity-90 cursor-pointer"
                  >
                    <Save size={14} /> Kaydet
                  </button>
                  {detailAd.advertiserAdsLibraryLink && (
                    <a
                      href={detailAd.advertiserAdsLibraryLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100"
                    >
                      <Globe size={14} /> Meta Ad Library
                    </a>
                  )}
                  {detailAd.advertiserLink && (
                    <a
                      href={detailAd.advertiserLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200"
                    >
                      <ExternalLink size={14} /> Facebook
                    </a>
                  )}
                  {detailAd.storeLink && (
                    <a
                      href={detailAd.storeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200"
                    >
                      <ShoppingBag size={14} /> Magaza
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ SAVE MODAL ═══ */}
      {showSaveModal && saveAd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Klasore Kaydet</h3>
              <button onClick={() => { setShowSaveModal(false); setSaveAd(null); }} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">&quot;{saveAd.advertiserName}&quot;</p>
            {folders.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Mevcut Klasor</label>
                <select value={selectedFolder} onChange={(e) => setSelectedFolder(e.target.value)} className="w-full py-2 px-3 border border-gray-200 rounded-lg text-sm">
                  {folders.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">veya Yeni Klasor</label>
              <div className="flex gap-2">
                <input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Yeni klasor adi..." className="flex-1 py-2 px-3 border border-gray-200 rounded-lg text-sm" />
                <button
                  onClick={async () => {
                    if (!newFolderName.trim()) return;
                    await createFolder(newFolderName.trim(), user?.userId);
                    setFolders((p) => [...p, newFolderName.trim()]);
                    setSelectedFolder(newFolderName.trim());
                    setNewFolderName("");
                  }}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 cursor-pointer"
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

/* ──────── Ad Card (PiPiAds style) ──────── */
function AdCard({ ad, onDetail, onSave }: {
  ad: MetaAd;
  onDetail: (ad: MetaAd) => void;
  onSave: (ad: MetaAd) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dateRange = formatDateRange(ad.adStartedAt, ad.activeDays);

  function handleVideoClick(e: React.MouseEvent) {
    e.stopPropagation(); // Don't open popup
    if (playing) {
      videoRef.current?.pause();
      setPlaying(false);
    } else {
      videoRef.current?.play();
      setPlaying(true);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      {/* Creative area — video plays inline, images/carousel open popup */}
      <div className="relative aspect-[4/5] bg-gray-100 flex-shrink-0">
        {ad.mediaFormat === 1 && ad.videos.length > 0 ? (
          /* Video: click plays inline */
          <div className="w-full h-full cursor-pointer" onClick={handleVideoClick}>
            {playing ? (
              <video
                ref={videoRef}
                src={ad.videos[0].url}
                poster={ad.videos[0].coverUrl || ad.thumbnail}
                className="w-full h-full object-cover"
                autoPlay
                loop
                playsInline
                onClick={handleVideoClick}
              />
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ad.videos[0].coverUrl || ad.thumbnail}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-14 h-14 rounded-full bg-black/30 flex items-center justify-center">
                    <Play size={24} className="text-white ml-1" fill="white" />
                  </div>
                </div>
              </>
            )}
            {ad.videos[0].duration > 0 && !playing && (
              <div className="absolute bottom-2 left-2">
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-black/70 text-white">
                  {formatDuration(ad.videos[0].duration)}
                </span>
              </div>
            )}
          </div>
        ) : ad.mediaFormat === 3 && ad.cards.length > 0 ? (
          /* Carousel: click opens popup */
          <div className="w-full h-full cursor-pointer" onClick={() => onDetail(ad)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ad.cards[0].url || ad.thumbnail}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute top-2 right-2">
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-black/70 text-white">
                1/{ad.cards.length}
              </span>
            </div>
          </div>
        ) : ad.images.length > 0 ? (
          /* Image: click opens popup */
          <div className="w-full h-full cursor-pointer" onClick={() => onDetail(ad)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ad.images[0].url || ad.thumbnail}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ) : ad.thumbnail ? (
          <div className="w-full h-full cursor-pointer" onClick={() => onDetail(ad)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ad.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 cursor-pointer" onClick={() => onDetail(ad)}>
            <ImageIcon size={48} />
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-2 left-2 pointer-events-none">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
            ad.adStatus === 2
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${ad.adStatus === 2 ? "bg-green-500" : "bg-red-500"}`} />
            {ad.adStatus === 2 ? "Aktif" : "Kaldirildi"}
          </span>
        </div>
      </div>

      {/* Info area — click opens popup */}
      <div className="p-3 flex flex-col flex-1 cursor-pointer" onClick={() => onDetail(ad)}>
        {/* Date range + Platform icons */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-gray-400">{dateRange}</span>
          <div className="flex items-center gap-1">
            {ad.adPlatform.map((p) => (
              <span key={p} className="text-[10px] bg-gray-100 text-gray-500 px-1 py-0.5 rounded">{PLATFORM_LABELS[p] || p}</span>
            ))}
          </div>
        </div>

        {/* Metrics row: Gunler, Erisim (Harcama), Adset */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="text-center">
            <p className="text-base font-bold text-gray-900">{ad.activeDays}</p>
            <p className="text-[10px] text-gray-400">Gunler</p>
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-gray-900">
              {formatCompact(ad.adAudienceReach)}
              {ad.adCost !== null && ad.adCost > 0 && (
                <span className="text-[10px] font-normal text-gray-400 ml-0.5">({formatMoney(ad.adCost)})</span>
              )}
            </p>
            <p className="text-[10px] text-gray-400">Erisim (Harcama)</p>
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-gray-900">{ad.adsetCount}</p>
            <p className="text-[10px] text-gray-400">Adset</p>
          </div>
        </div>

        {/* Ad text preview */}
        <p className="text-xs text-gray-700 line-clamp-2 mb-2 leading-snug min-h-[2rem]">
          {ad.adContent ? (ad.adContent.length > 100 ? ad.adContent.substring(0, 100) + "..." : ad.adContent) : ""}
        </p>

        <div className="flex-1" />

        {/* CTA button + Country flags */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {ad.country.slice(0, 3).map((c) => (
              <span key={c} className="text-sm" title={c}>{FLAG[c.toUpperCase()] || c}</span>
            ))}
            {ad.country.length > 3 && <span className="text-[10px] text-gray-400">+{ad.country.length - 3}</span>}
          </div>
          {ad.buttonText && (
            <span className="text-[11px] bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-medium">
              {ad.buttonText}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDateRange(startTs: number, activeDays: number): string {
  if (!startTs) return "";
  const start = new Date(startTs * 1000);
  const end = activeDays > 0 ? new Date(start.getTime() + activeDays * 86400000) : new Date();
  const fmt = (d: Date) => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")} ${d.getFullYear()}`;
  };
  return `${fmt(start)}-${fmt(end)}`;
}
