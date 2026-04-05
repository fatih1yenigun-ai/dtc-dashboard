"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Loader2,
  ExternalLink,
  Play,
  Bookmark,
  Save,
  X,
  Clock,
  Share2,
  Eye,
  ShoppingBag,
  Globe,
  Megaphone,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { loadFolders, createFolder, saveBrandsBulk, type BrandData } from "@/lib/supabase";
import { useTikTokShop } from "@/context/TikTokShopContext";
import { useAuth } from "@/context/AuthContext";
import { useProductSearch, type ProductResult } from "@/hooks/useProductSearch";
import { useVideoSearch, type VideoResult } from "@/hooks/useVideoSearch";
import { useMetaAdSearch, type MetaAd, type SortKey } from "@/hooks/useMetaAdSearch";

/* ═══ Constants ═══ */

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

const TAG_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-cyan-100 text-cyan-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
];

const PLATFORM_LABELS: Record<string, string> = {
  FACEBOOK: "FB",
  INSTAGRAM: "IG",
  AUDIENCE_NETWORK: "AN",
  MESSENGER: "MSG",
  THREADS: "THR",
};

const PRODUCT_SORT_OPTIONS = [
  { value: 2, label: "Son Zaman", defaultType: "desc" },
  { value: 2, label: "Ilk Zaman", defaultType: "asc", id: "found_time_asc" },
  { value: 3, label: "Satislar", defaultType: "desc" },
  { value: 4, label: "GMV", defaultType: "desc" },
  { value: 5, label: "Gosterimler", defaultType: "desc" },
  { value: 7, label: "Reklamlar", defaultType: "desc" },
  { value: 8, label: "Influencers", defaultType: "desc" },
];

const VIDEO_SORT_OPTIONS = [
  { value: 6, label: "Begeni" },
  { value: 999, label: "En Populer" },
  { value: 1, label: "En Yeni" },
  { value: 4, label: "En Cok Izlenen" },
];

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

/* ═══ Format Helpers ═══ */

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

function formatDuration(seconds: number): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDateRange(startTs: number, days: number): string {
  if (!startTs) return "";
  const start = new Date(startTs * 1000);
  const end = days > 0 ? new Date(start.getTime() + days * 86400000) : new Date();
  const fmt = (d: Date) => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")} ${d.getFullYear()}`;
  };
  return `${fmt(start)}-${fmt(end)}`;
}

function formatDate(ts: number): string {
  if (!ts) return "-";
  const d = new Date(ts * 1000);
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function HotBadge({ value }: { value: number }) {
  if (!value) return null;
  const colors = value >= 7 ? "bg-red-100 text-red-700" : value >= 4 ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700";
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${colors}`}>{"\uD83D\uDD25"} {value}/10</span>;
}

/* ═══ toBrandData converters ═══ */

function toBrandDataProduct(p: ProductResult): BrandData {
  return {
    Marka: p.shop_name, "Web Sitesi": p.landing_page, Kategori: p.seller_location,
    "AOV ($)": p.price_usd, "Ciro ($)": p.gmv_usd,
    "\u00D6ne \u00C7\u0131kan \u00D6zellik": p.title, "B\u00FCy\u00FCme Y\u00F6ntemi": "TikTok Shop",
    "Ayl\u0131k Trafik": p.play_count, Kaynak: "PiPiAds", "Video Say\u0131s\u0131": p.video_count,
    Sat\u0131slar: p.sales_volume, Cover: p.image, "\u00DClke": p.region,
    "PiPiAds Link": `https://www.pipiads.com/tr/tiktok-shop-product/${p.id}`,
  } as BrandData;
}

function toBrandDataVideo(v: VideoResult): BrandData {
  return {
    Marka: v.shop_name, "Web Sitesi": v.shop_handle ? `https://www.tiktok.com/@${v.shop_handle}` : "",
    Kategori: v.tags?.[0] || "", "One Cikan Ozellik": v.hook || "",
    "Buyume Yontemi": "TikTok Shop", "Pazarlama Acilari": v.tags?.join(", ") || "",
    Kaynak: "PiPiAds", Goruntulenme: v.play_count, Cover: v.cover_image || v.image,
  } as BrandData;
}

function toBrandDataAd(ad: MetaAd): BrandData {
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

/* ═══ Types ═══ */

type Mode = "tts_products" | "tts_shops" | "tts_videos" | "meta_ads";

/* ═══ Main Page ═══ */

export default function ReklamTaraPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { setSelectedProduct } = useTikTokShop();

  // Hooks
  const {
    products, allCount: productAllCount, loading: productLoading, loadingMore: productLoadingMore,
    error: productError, hasMore: productHasMore, search: productSearch, resort: productResort,
    sentinelRef: productSentinelRef,
  } = useProductSearch();

  const {
    videos: videoResults, allCount: videoAllCount, loading: videoLoading, error: videoError,
    hasMore: videoHasMore, search: videoSearch, sentinelRef: videoSentinelRef, tagAnalytics,
  } = useVideoSearch();

  const {
    ads, allCount: metaAllCount, loading: metaLoading, loadingMore: metaLoadingMore,
    error: metaError, hasMore: metaHasMore, search: metaSearch, resort: metaResort,
    sentinelRef: metaSentinelRef,
  } = useMetaAdSearch();

  // UI state
  const [mode, setMode] = useState<Mode>("tts_products");
  const [keyword, setKeyword] = useState("");

  // TTS Products sort state
  const [productSort, setProductSort] = useState(2);
  const [productSortType, setProductSortType] = useState<"asc" | "desc">("desc");

  // TTS Videos sort state
  const [videoSortBy, setVideoSortBy] = useState(6);

  // Meta Ads sort state
  const [metaSortKey, setMetaSortKey] = useState<SortKey>("default");
  const [metaSortDir, setMetaSortDir] = useState<"asc" | "desc">("desc");

  // Meta detail popup
  const [detailAd, setDetailAd] = useState<MetaAd | null>(null);
  const [carouselIdx, setCarouselIdx] = useState(0);

  // Video detail popup
  const [detailVideo, setDetailVideo] = useState<VideoResult | null>(null);

  // Save modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveProduct, setSaveProduct] = useState<ProductResult | null>(null);
  const [saveVideo, setSaveVideo] = useState<VideoResult | null>(null);
  const [saveMetaAd, setSaveMetaAd] = useState<MetaAd | null>(null);
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  // Derived
  const loading = mode === "tts_products" ? productLoading : mode === "tts_videos" ? videoLoading : metaLoading;
  const error = mode === "tts_products" ? productError : mode === "tts_videos" ? videoError : metaError;

  /* ── Search ── */

  function handleSearch() {
    if (!keyword.trim()) return;
    const q = keyword.trim();
    if (mode === "tts_products") {
      productSearch(q, productSort, productSortType);
    } else if (mode === "tts_videos") {
      videoSearch(q, videoSortBy, {});
    } else if (mode === "meta_ads") {
      metaSearch(q, metaSortKey, metaSortDir);
    }
  }

  /* ── Sort handlers ── */

  function handleProductSortChange(val: string) {
    const opt = PRODUCT_SORT_OPTIONS.find((o) => (o.id || String(o.value)) === val);
    if (!opt) return;
    const newType = opt.defaultType as "asc" | "desc";
    setProductSort(opt.value);
    setProductSortType(newType);
    productResort(opt.value, newType);
  }

  function handleVideoSortChange(val: number) {
    setVideoSortBy(val);
    if (keyword.trim()) {
      videoSearch(keyword.trim(), val, {});
    }
  }

  function handleMetaSortChange(key: SortKey) {
    setMetaSortKey(key);
    metaResort(key, metaSortDir);
  }

  function handleAscDesc(dir: "asc" | "desc") {
    if (mode === "tts_products") {
      setProductSortType(dir);
      productResort(productSort, dir);
    } else if (mode === "meta_ads") {
      setMetaSortDir(dir);
      metaResort(metaSortKey, dir);
    }
  }

  /* ── Save modal ── */

  async function openSaveModal(product?: ProductResult, video?: VideoResult, ad?: MetaAd) {
    setSaveProduct(product || null);
    setSaveVideo(video || null);
    setSaveMetaAd(ad || null);
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

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    const name = newFolderName.trim();
    const ok = await createFolder(name, user?.userId);
    if (ok) {
      setFolders((prev) => (prev.includes(name) ? prev : [...prev, name]));
      setSelectedFolder(name);
      setNewFolderName("");
    }
  }

  async function handleSave() {
    const folder = newFolderName.trim() || selectedFolder;
    if (!folder) return;
    try {
      if (newFolderName.trim()) await createFolder(newFolderName.trim(), user?.userId);
      const brandData = saveProduct
        ? toBrandDataProduct(saveProduct)
        : saveVideo
        ? toBrandDataVideo(saveVideo)
        : saveMetaAd
        ? toBrandDataAd(saveMetaAd)
        : null;
      if (!brandData) return;
      const added = await saveBrandsBulk(folder, [brandData], user?.userId);
      setSaveMsg(`${added} marka kaydedildi!`);
      setTimeout(() => {
        setShowSaveModal(false);
        setSaveMsg("");
        setSaveProduct(null);
        setSaveVideo(null);
        setSaveMetaAd(null);
      }, 1200);
    } catch {
      setSaveMsg("Hata olustu!");
    }
  }

  /* ── Meta detail ── */

  function openDetail(ad: MetaAd) {
    setDetailAd(ad);
    setCarouselIdx(0);
  }

  /* ── Product detail navigation (opens in new tab) ── */

  function goToProductDetail(p: ProductResult) {
    setSelectedProduct({
      ...p, image_list: p.image_list || [], like_count: p.like_count || 0,
      share_count: p.share_count || 0, comment_count: p.comment_count || 0,
      person_count: p.person_count || 0, commission_rate: p.commission_rate || 0,
      found_time: p.found_time || 0, put_days: p.put_days || 0,
    });
    try { sessionStorage.setItem(`tts_product_${p.id}`, JSON.stringify(p)); } catch { /* ignore */ }
    window.open(`/tts/${p.id}`, "_blank");
  }

  /* ── Video detail popup ── */

  function openVideoDetail(v: VideoResult) {
    setDetailVideo(v);
  }

  function goToProductFromVideo(productId: string) {
    if (!productId) return;
    window.open(`/tts/${productId}`, "_blank");
  }

  /* ── Derived sort direction for arrows ── */
  const currentDir = mode === "tts_products" ? productSortType : metaSortDir;
  const showAscDesc = mode !== "tts_videos" && mode !== "tts_shops";

  /* ── Current sort dropdown value ── */
  const sortDropdownValue =
    mode === "tts_products"
      ? (productSort === 2 && productSortType === "asc" ? "found_time_asc" : String(productSort))
      : mode === "tts_videos"
      ? String(videoSortBy)
      : metaSortKey;

  return (
    <div>
      {/* ═══ SEARCH BAR ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Reklam metni, acilis sayfasi URL'si, reklamveren adi, urun adiyla ara"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30 focus:border-[#667eea]"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !keyword.trim()}
            className="gradient-accent text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Ara
          </button>
        </div>
      </div>

      {/* ═══ MODE BUTTONS + SORT ═══ */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {/* Mode buttons */}
        <button
          onClick={() => setMode("tts_products")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            mode === "tts_products"
              ? "bg-[#667eea] text-white"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          Tiktok Urunler
        </button>
        <button
          disabled
          title="Yakinda"
          className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed"
        >
          Tiktok Magazalar
        </button>
        <button
          onClick={() => setMode("tts_videos")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            mode === "tts_videos"
              ? "bg-[#667eea] text-white"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          Tiktok Reklamlar
        </button>
        <button
          onClick={() => setMode("meta_ads")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            mode === "meta_ads"
              ? "bg-[#667eea] text-white"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          Meta Reklamlar
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Sort dropdown */}
        <select
          value={sortDropdownValue}
          onChange={(e) => {
            if (mode === "tts_products") handleProductSortChange(e.target.value);
            else if (mode === "tts_videos") handleVideoSortChange(Number(e.target.value));
            else if (mode === "meta_ads") handleMetaSortChange(e.target.value as SortKey);
          }}
          className="py-2 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30"
        >
          {mode === "tts_products" &&
            PRODUCT_SORT_OPTIONS.map((opt) => (
              <option key={opt.id || opt.value} value={opt.id || opt.value}>{opt.label}</option>
            ))
          }
          {mode === "tts_videos" &&
            VIDEO_SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))
          }
          {mode === "meta_ads" &&
            META_AD_SORT_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))
          }
          {mode === "tts_shops" && <option value="">-</option>}
        </select>

        {/* Asc/Desc arrows */}
        {showAscDesc && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleAscDesc("desc")}
              className={`p-1.5 rounded-lg transition-colors ${
                currentDir === "desc"
                  ? "bg-[#667eea] text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <ArrowDown size={16} />
            </button>
            <button
              onClick={() => handleAscDesc("asc")}
              className={`p-1.5 rounded-lg transition-colors ${
                currentDir === "asc"
                  ? "bg-[#667eea] text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <ArrowUp size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ═══ ERROR ═══ */}
      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">{error}</div>}

      {/* ═══ LOADING ═══ */}
      {loading && (
        <div className="py-16 flex flex-col items-center">
          <Loader2 size={32} className="animate-spin text-[#667eea] mb-3" />
          <p className="text-gray-500 font-medium">
            {mode === "tts_videos" ? "500 video yukleniyor..." : mode === "meta_ads" ? "PiPiAds'ten reklamlar aliniyor..." : "PiPiAds'ten urunler aliniyor..."}
          </p>
        </div>
      )}

      {/* ═══ TTS PRODUCT RESULTS ═══ */}
      {mode === "tts_products" && !productLoading && products.length > 0 && (
        <div>
          <p className="text-sm text-gray-500 mb-4">{productAllCount} urun yuklendi{productHasMore ? " (devam ediyor...)" : ""}</p>

          <ProductTable
            results={products}
            onSave={(p) => openSaveModal(p)}
            onDetail={(p) => goToProductDetail(p)}
            sortNum={productSort}
            sortType={productSortType}
            onSort={(num) => {
              const newType = num === productSort && productSortType === "desc" ? "asc" : "desc";
              setProductSort(num);
              setProductSortType(newType);
              productResort(num, newType);
            }}
          />

          {productHasMore && !productLoadingMore && <div key={products.length} ref={productSentinelRef} className="py-8" />}
          {productLoadingMore && (
            <div className="py-8 flex justify-center">
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm">Daha fazla urun yukleniyor...</span>
              </div>
            </div>
          )}
          {!productHasMore && products.length > 0 && <p className="text-center text-sm text-gray-400 py-8">Tum urunler yuklendi ({productAllCount} urun)</p>}
        </div>
      )}

      {/* ═══ TTS VIDEO RESULTS ═══ */}
      {mode === "tts_videos" && !videoLoading && (
        <>
          {/* Tag Analytics */}
          {videoAllCount > 0 && tagAnalytics.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Pazarlama Acilari &rarr; Goruntulenme</h3>
              <p className="text-[11px] text-gray-400 mb-3">{videoAllCount} video analiz edildi</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 max-h-[320px] overflow-y-auto">
                {tagAnalytics.slice(0, 20).map((t, i) => {
                  const maxViews = tagAnalytics[0]?.avgViews || 1;
                  const pct = Math.round((t.avgViews / maxViews) * 100);
                  return (
                    <div key={t.tag} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-5 text-right">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-medium text-gray-700 truncate">#{t.tag}</span>
                          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{formatCompact(t.avgViews)} ort.</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-[#667eea] to-[#764ba2]" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex justify-between mt-0.5">
                          <span className="text-[10px] text-gray-400">{t.count} video</span>
                          <span className="text-[10px] text-gray-400">{formatCompact(t.totalViews)} toplam</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Video Grid */}
          {videoResults.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-4">{videoResults.length} / {videoAllCount} video gosteriliyor</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {videoResults.map((video) => (
                  <VideoCard key={video.id} video={video} onSave={() => openSaveModal(undefined, video)} onDetail={openVideoDetail} />
                ))}
              </div>
              {videoHasMore && <div key={videoResults.length} ref={videoSentinelRef} className="py-8" />}
              {!videoHasMore && videoResults.length > 0 && (
                <p className="text-center text-sm text-gray-400 py-8">Tum sonuclar yuklendi ({videoAllCount} video)</p>
              )}
            </div>
          )}
        </>
      )}

      {/* ═══ META AD RESULTS ═══ */}
      {mode === "meta_ads" && !metaLoading && ads.length > 0 && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            {metaAllCount} reklam yuklendi{metaHasMore ? " (devam ediyor...)" : ""}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ads.map((ad) => (
              <MetaAdCard key={ad.id} ad={ad} onDetail={openDetail} onSave={(a) => openSaveModal(undefined, undefined, a)} />
            ))}
          </div>

          {metaHasMore && !metaLoadingMore && <div key={ads.length} ref={metaSentinelRef} className="py-8" />}
          {metaLoadingMore && (
            <div className="py-8 flex justify-center">
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm">Daha fazla reklam yukleniyor...</span>
              </div>
            </div>
          )}
          {!metaHasMore && ads.length > 0 && (
            <p className="text-center text-sm text-gray-400 py-8">
              Tum reklamlar yuklendi ({metaAllCount} reklam)
            </p>
          )}
        </div>
      )}

      {/* ═══ EMPTY STATES ═══ */}
      {!loading && keyword && (
        (mode === "tts_products" && products.length === 0 && !productError && productAllCount === 0 && !productLoading) ||
        (mode === "tts_videos" && videoResults.length === 0 && !videoError && videoAllCount === 0 && !videoLoading) ||
        (mode === "meta_ads" && ads.length === 0 && !metaError && metaAllCount === 0 && !metaLoading)
      ) && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">Sonuc bulunamadi</p>
          <p className="text-sm mt-1">Farkli bir anahtar kelime deneyin</p>
        </div>
      )}

      {/* ═══ META AD DETAIL POPUP ═══ */}
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
                    onClick={() => { setDetailAd(null); openSaveModal(undefined, undefined, detailAd); }}
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

      {/* ═══ VIDEO DETAIL POPUP ═══ */}
      {detailVideo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDetailVideo(null)}>
          <div className="bg-white rounded-xl w-full max-w-5xl mx-4 shadow-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-gray-600">{(detailVideo.shop_name || "?")[0]?.toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{detailVideo.shop_name || "Bilinmeyen"}</p>
                  {detailVideo.shop_handle && (
                    <a href={`https://www.tiktok.com/@${detailVideo.shop_handle}`} target="_blank" rel="noopener noreferrer" className="text-xs text-[#667eea] hover:underline">{detailVideo.shop_handle}</a>
                  )}
                </div>
              </div>
              <button onClick={() => setDetailVideo(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={20} /></button>
            </div>

            {/* Body */}
            <div className="flex flex-col md:flex-row flex-1 min-h-0">
              {/* Left: Video + engagement */}
              <div className="md:w-[40%] bg-black flex flex-col flex-shrink-0">
                <div className="flex-1 flex items-center justify-center min-h-0">
                  {detailVideo.video_url ? (
                    <video
                      src={detailVideo.video_url}
                      poster={detailVideo.cover_image || detailVideo.image}
                      controls
                      autoPlay
                      className="w-full h-full object-contain max-h-[75vh]"
                      playsInline
                    />
                  ) : (detailVideo.cover_image || detailVideo.image) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={detailVideo.cover_image || detailVideo.image} alt="" className="w-full h-full object-contain max-h-[75vh]" />
                  ) : (
                    <div className="py-32 text-gray-500"><Play size={48} /></div>
                  )}
                </div>
                {/* Engagement bar */}
                <div className="bg-black/80 px-4 py-2 flex items-center gap-4 text-sm text-white/80 flex-shrink-0">
                  <span>{"\u2764\uFE0F"} {formatCompact(detailVideo.like_count)}</span>
                  <span>{"\uD83D\uDCAC"} {formatCompact(detailVideo.comment_count)}</span>
                  <span><Share2 size={12} className="inline" /> {formatCompact(detailVideo.share_count)}</span>
                  <span><Bookmark size={12} className="inline" /> {formatCompact(detailVideo.collect_count)}</span>
                </div>
              </div>

              {/* Right: Details */}
              <div className="md:w-[60%] overflow-y-auto p-5 space-y-4">
                {/* Ad text */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Reklam Metni</p>
                  <p className="text-sm text-gray-800 leading-relaxed line-clamp-3">{detailVideo.title || detailVideo.hook || "-"}</p>
                  {detailVideo.button_text && (
                    <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg">{detailVideo.button_text}</span>
                  )}
                </div>

                {/* Row 1: Gosterim, Sure, Begeni Orani */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="border border-blue-100 rounded-lg p-2.5 text-center">
                    <p className="text-base font-bold text-blue-700">{formatCompact(detailVideo.play_count)}</p>
                    <p className="text-[10px] text-blue-500">Gosterim</p>
                  </div>
                  <div className="border border-purple-100 rounded-lg p-2.5 text-center">
                    <p className="text-base font-bold text-purple-700">{detailVideo.put_days || 0}</p>
                    <p className="text-[10px] text-purple-500">Sure</p>
                  </div>
                  <div className="border border-pink-100 rounded-lg p-2.5 text-center">
                    <p className="text-base font-bold text-pink-700">{(detailVideo.like_rate * 100).toFixed(2)}%</p>
                    <p className="text-[10px] text-pink-500">Begeni Orani</p>
                  </div>
                </div>

                {/* Row 2: Reklam maliyeti, Donusumler, Ecom */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="border border-emerald-100 rounded-lg p-2.5 text-center">
                    <p className="text-sm font-bold text-emerald-700">
                      {detailVideo.ad_cost_min > 0 || detailVideo.ad_cost_max > 0
                        ? `$${formatCompact(detailVideo.ad_cost_min)}-${formatCompact(detailVideo.ad_cost_max)}`
                        : "--"}
                    </p>
                    <p className="text-[10px] text-emerald-500">Reklam maliyeti</p>
                  </div>
                  <div className="border border-amber-100 rounded-lg p-2.5 text-center">
                    <p className="text-sm font-bold text-amber-700">
                      {detailVideo.conversion_min > 0 || detailVideo.conversion_max > 0
                        ? `${formatCompact(detailVideo.conversion_min)}-${formatCompact(detailVideo.conversion_max)}`
                        : "--"}
                    </p>
                    <p className="text-[10px] text-amber-500">Donusumler</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-2.5 text-center">
                    <p className="text-sm font-bold text-gray-700">{detailVideo.ecom_platform || "--"}</p>
                    <p className="text-[10px] text-gray-400">Ecom platformu</p>
                  </div>
                </div>

                {/* Info rows */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="text-gray-500 w-32 flex-shrink-0">Ulke/Bolge:</span>
                    <span className="font-medium text-gray-800">
                      {detailVideo.region ? `${FLAG[detailVideo.region.toUpperCase()] || ""} ${detailVideo.region}` : "-"}
                    </span>
                  </div>
                  {(detailVideo.audience_age_min > 0 || detailVideo.audience_age_max > 0) && (
                    <div className="flex items-center">
                      <span className="text-gray-500 w-32 flex-shrink-0">Hedef Kitle:</span>
                      <span className="font-medium text-gray-800">{detailVideo.audience_age_min}-{detailVideo.audience_age_max} {detailVideo.audience_device ? `| ${detailVideo.audience_device}` : ""}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <span className="text-gray-500 w-32 flex-shrink-0">Olusturma Tarihi:</span>
                    <span className="font-medium text-gray-800">{detailVideo.ad_create_time ? formatDate(detailVideo.ad_create_time) : "-"}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 w-32 flex-shrink-0">First / Last seen:</span>
                    <span className="font-medium text-gray-800">{detailVideo.first_seen ? formatDate(detailVideo.first_seen) : "-"} - {detailVideo.last_seen > 0 ? formatDate(detailVideo.last_seen) : "Aktif"}</span>
                  </div>
                </div>

                {/* Landing page link */}
                {detailVideo.landing_page && (
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-xs text-gray-500 w-24 flex-shrink-0">Son baglanti:</span>
                    <a href={detailVideo.landing_page} target="_blank" rel="noopener noreferrer" className="text-xs text-[#667eea] hover:underline truncate flex items-center gap-1">
                      <ExternalLink size={10} />{detailVideo.landing_page.length > 50 ? detailVideo.landing_page.substring(0, 50) + "..." : detailVideo.landing_page}
                    </a>
                  </div>
                )}

                {/* Product card */}
                {detailVideo.product_name && (
                  <div
                    className={`border border-gray-200 rounded-lg p-3 flex items-center gap-3 ${detailVideo.product_id ? "cursor-pointer hover:bg-gray-50 transition-colors" : ""}`}
                    onClick={() => detailVideo.product_id && goToProductFromVideo(detailVideo.product_id)}
                  >
                    {detailVideo.product_image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={detailVideo.product_image} alt={detailVideo.product_name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{detailVideo.product_name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded">TikTok Shop</span>
                        {detailVideo.product_price > 0 && <span className="text-xs font-bold text-orange-600">Fiyat: ${detailVideo.product_price.toFixed(2)}</span>}
                        {detailVideo.product_sold > 0 && <span className="text-xs text-red-500 font-medium">Satildi: {formatCompact(detailVideo.product_sold)}</span>}
                      </div>
                    </div>
                    {detailVideo.product_id && <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => { setDetailVideo(null); openSaveModal(undefined, detailVideo); }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg gradient-accent text-white text-sm font-medium hover:opacity-90 cursor-pointer"
                  >
                    <Save size={14} /> Kaydet
                  </button>
                  {detailVideo.tiktok_post_url && (
                    <a href={detailVideo.tiktok_post_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200">
                      <ExternalLink size={14} /> TikTok
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ SAVE MODAL ═══ */}
      {showSaveModal && (saveProduct || saveVideo || saveMetaAd) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Klasore Kaydet</h3>
              <button onClick={() => { setShowSaveModal(false); setSaveProduct(null); setSaveVideo(null); setSaveMetaAd(null); }} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              &quot;{saveProduct?.title || saveProduct?.shop_name || saveVideo?.hook || saveVideo?.title || saveVideo?.shop_name || saveMetaAd?.advertiserName || ""}&quot;
            </p>
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
                <button onClick={handleCreateFolder} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 cursor-pointer">Olustur</button>
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

/* ═══ Product Table ═══ */

function ProductTable({ results, onSave, onDetail, sortNum, sortType, onSort }: {
  results: ProductResult[]; onSave: (p: ProductResult) => void; onDetail: (p: ProductResult) => void;
  sortNum: number; sortType: "asc" | "desc"; onSort: (num: number) => void;
}) {
  const arrow = (num: number) => sortNum === num ? (sortType === "desc" ? " \u2193" : " \u2191") : "";
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-500 w-12">#</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Urun</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500 cursor-pointer hover:text-[#667eea] select-none" onClick={() => onSort(3)}>Satildi{arrow(3)}</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500 cursor-pointer hover:text-[#667eea] select-none" onClick={() => onSort(4)}>GMV{arrow(4)}</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500 cursor-pointer hover:text-[#667eea] select-none" onClick={() => onSort(7)}>Reklamlar{arrow(7)}</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500 cursor-pointer hover:text-[#667eea] select-none" onClick={() => onSort(5)}>Gosterim / Harcama{arrow(5)}</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500 cursor-pointer hover:text-[#667eea] select-none" onClick={() => onSort(8)}>Influencers{arrow(8)}</th>
              <th className="text-center py-3 px-4 font-medium text-gray-500 cursor-pointer hover:text-[#667eea] select-none" onClick={() => onSort(2)}>Reklam Tarihi{arrow(2)}</th>
              <th className="text-center py-3 px-4 font-medium text-gray-500 w-20">Eylem</th>
            </tr>
          </thead>
          <tbody>
            {results.map((p, i) => (
              <tr key={p.id || i} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                <td className="py-3 px-4 text-gray-400 text-xs">{i + 1}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3 min-w-[280px]">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt={p.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><ShoppingBag size={16} className="text-gray-300" /></div>
                    )}
                    <div className="min-w-0">
                      <button onClick={() => onDetail(p)} className="text-sm font-medium text-gray-900 hover:text-[#667eea] line-clamp-2 transition-colors text-left cursor-pointer" title={p.title}>
                        {p.title?.length > 60 ? p.title.substring(0, 60) + "..." : p.title || "Bilinmeyen"}
                      </button>
                      <div className="flex items-center gap-2 mt-1">
                        {p.region && <span className="text-sm">{FLAG[p.region?.toUpperCase()] || ""}</span>}
                        <span className="text-xs font-medium text-orange-600">${p.price_usd.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {p.seller_location && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{p.seller_location}</span>}
                        {p.commission_rate > 0 && <span className="text-[10px] text-gray-400">Komisyon: {p.commission_rate}%</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {p.shop_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.shop_image} alt={p.shop_name} className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
                        ) : <div className="w-4 h-4 rounded-full bg-gray-200 flex-shrink-0" />}
                        <span className="text-[11px] text-gray-500 truncate">{p.shop_name || "-"}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-right font-medium text-gray-700">{formatCompact(p.sales_volume)}</td>
                <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatMoney(p.gmv_usd)}</td>
                <td className="py-3 px-4 text-right text-gray-600">{formatCompact(p.video_count)}</td>
                <td className="py-3 px-4 text-right">
                  <div className="text-gray-700">{formatCompact(p.play_count)}</div>
                </td>
                <td className="py-3 px-4 text-right text-gray-600">{formatCompact(p.person_count)}</td>
                <td className="py-3 px-4 text-center text-xs text-gray-500 whitespace-nowrap">{formatDateRange(p.found_time, p.put_days) || "-"}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => onDetail(p)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-[#667eea] transition-colors" title="Detay"><Eye size={14} /></button>
                    <button onClick={() => onSave(p)} className="p-1.5 rounded-lg border border-[#667eea]/30 text-[#667eea] hover:bg-[#667eea]/5 transition-colors" title="Kaydet"><Bookmark size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══ Video Card (inline play + popup on card click) ═══ */

function VideoCard({ video, onSave, onDetail }: { video: VideoResult; onSave: () => void; onDetail: (v: VideoResult) => void }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dateRange = formatDateRange(video.ad_create_time, video.put_days);

  function handleVideoClick(e: React.MouseEvent) {
    e.stopPropagation();
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
      {/* Video area — click plays inline */}
      <div className="relative aspect-[9/16] bg-gray-100 flex-shrink-0">
        {video.video_url ? (
          <div className="w-full h-full cursor-pointer" onClick={handleVideoClick}>
            {playing ? (
              <video
                ref={videoRef}
                src={video.video_url}
                poster={video.cover_image || video.image}
                className="w-full h-full object-cover"
                autoPlay
                loop
                playsInline
              />
            ) : (
              <>
                {(video.cover_image || video.image) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={video.cover_image || video.image} alt={video.hook || video.title} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300"><Play size={48} /></div>
                )}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-14 h-14 rounded-full bg-black/30 flex items-center justify-center">
                    <Play size={24} className="text-white ml-1" fill="white" />
                  </div>
                </div>
              </>
            )}
            {video.duration > 0 && !playing && (
              <div className="absolute bottom-2 left-2">
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/60 text-white flex items-center gap-1"><Clock size={10} />{formatDuration(video.duration)}</span>
              </div>
            )}
          </div>
        ) : (video.cover_image || video.image) ? (
          <div className="w-full h-full cursor-pointer" onClick={() => onDetail(video)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={video.cover_image || video.image} alt={video.hook || video.title} className="w-full h-full object-cover" loading="lazy" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 cursor-pointer" onClick={() => onDetail(video)}><Play size={48} /></div>
        )}
        {video.region && <div className="absolute top-2 left-2 text-lg drop-shadow pointer-events-none">{FLAG[video.region.toUpperCase()] || video.region}</div>}
        {video.hot_value > 0 && <div className="absolute top-2 right-2 pointer-events-none"><HotBadge value={video.hot_value} /></div>}
      </div>
      {/* Info area — click opens popup */}
      <div className="p-3 flex flex-col flex-1 cursor-pointer" onClick={() => onDetail(video)}>
        {dateRange && <p className="text-[10px] text-gray-400 mb-1">{dateRange}</p>}
        <div className="grid grid-cols-3 gap-1 mb-2">
          <div className="text-center"><p className="text-sm font-bold text-gray-900">{formatCompact(video.play_count)}</p><p className="text-[10px] text-gray-400">Gosterim</p></div>
          <div className="text-center"><p className="text-sm font-bold text-gray-900">{video.put_days || 0}</p><p className="text-[10px] text-gray-400">Sure</p></div>
          <div className="text-center"><p className="text-sm font-bold text-gray-900">{formatCompact(video.like_count)}</p><p className="text-[10px] text-gray-400">Begen</p></div>
        </div>
        <p className="text-xs text-gray-700 line-clamp-2 mb-1.5 leading-snug">{video.hook || video.title || ""}</p>
        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {video.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${TAG_COLORS[i % TAG_COLORS.length]}`}>{tag}</span>
            ))}
          </div>
        )}
        <div className="flex-1" />
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-medium text-gray-700 truncate">{video.shop_name || "Bilinmeyen"}</span>
          </div>
          {video.region && <span className="text-xs">{FLAG[video.region.toUpperCase()] || ""}</span>}
        </div>
        <div className="grid grid-cols-2 gap-x-3 text-[10px] text-gray-400 mb-2">
          <span>{"\uD83D\uDCAC"} {formatCompact(video.comment_count)}</span>
          <span className="flex items-center gap-0.5"><Share2 size={9} /> {formatCompact(video.share_count)}</span>
        </div>
      </div>
    </div>
  );
}

/* ═══ Meta Ad Card ═══ */

function MetaAdCard({ ad, onDetail, onSave }: {
  ad: MetaAd;
  onDetail: (ad: MetaAd) => void;
  onSave: (ad: MetaAd) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dateRange = formatDateRange(ad.adStartedAt, ad.activeDays);

  function handleVideoClick(e: React.MouseEvent) {
    e.stopPropagation();
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
      {/* Creative area */}
      <div className="relative aspect-[4/5] bg-gray-100 flex-shrink-0">
        {ad.mediaFormat === 1 && ad.videos.length > 0 ? (
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

      {/* Info area */}
      <div className="p-3 flex flex-col flex-1 cursor-pointer" onClick={() => onDetail(ad)}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-gray-400">{dateRange}</span>
          <div className="flex items-center gap-1">
            {ad.adPlatform.map((p) => (
              <span key={p} className="text-[10px] bg-gray-100 text-gray-500 px-1 py-0.5 rounded">{PLATFORM_LABELS[p] || p}</span>
            ))}
          </div>
        </div>

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

        <p className="text-xs text-gray-700 line-clamp-2 mb-2 leading-snug min-h-[2rem]">
          {ad.adContent ? (ad.adContent.length > 100 ? ad.adContent.substring(0, 100) + "..." : ad.adContent) : ""}
        </p>

        <div className="flex-1" />

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
