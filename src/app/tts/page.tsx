"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FaycomLoader from "@/components/FaycomLoader";
import {
  Search,
  Loader2,
  ExternalLink,
  Play,
  Bookmark,
  X,
  Clock,
  Share2,
  Eye,
  ShoppingBag,
} from "lucide-react";
import { loadFolders, createFolder, saveBrandsBulk, type BrandData } from "@/lib/supabase";
import { useTikTokShop } from "@/context/TikTokShopContext";
import { useAuth } from "@/context/AuthContext";
import { useVideoSearch, type VideoResult } from "@/hooks/useVideoSearch";
import { useProductSearch, type ProductResult } from "@/hooks/useProductSearch";

const FLAG: Record<string, string> = {
  US: "\u{1F1FA}\u{1F1F8}", UK: "\u{1F1EC}\u{1F1E7}", GB: "\u{1F1EC}\u{1F1E7}",
  DE: "\u{1F1E9}\u{1F1EA}", FR: "\u{1F1EB}\u{1F1F7}", TR: "\u{1F1F9}\u{1F1F7}",
  AU: "\u{1F1E6}\u{1F1FA}", KR: "\u{1F1F0}\u{1F1F7}", JP: "\u{1F1EF}\u{1F1F5}",
  CA: "\u{1F1E8}\u{1F1E6}", NL: "\u{1F1F3}\u{1F1F1}", SE: "\u{1F1F8}\u{1F1EA}",
  IT: "\u{1F1EE}\u{1F1F9}", ES: "\u{1F1EA}\u{1F1F8}", BR: "\u{1F1E7}\u{1F1F7}",
  IN: "\u{1F1EE}\u{1F1F3}", CN: "\u{1F1E8}\u{1F1F3}", ID: "\u{1F1EE}\u{1F1E9}",
  TH: "\u{1F1F9}\u{1F1ED}", VN: "\u{1F1FB}\u{1F1F3}", MY: "\u{1F1F2}\u{1F1FE}",
  PH: "\u{1F1F5}\u{1F1ED}", SG: "\u{1F1F8}\u{1F1EC}", MX: "\u{1F1F2}\u{1F1FD}",
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

// v3 numeric sort codes: 2=found_time, 3=sales, 4=GMV, 5=views, 7=ads, 8=influencers
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

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatMoney(n: number): string {
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

function formatDateRange(adCreateTime: number, putDays: number): string {
  if (!adCreateTime) return "";
  const start = new Date(adCreateTime * 1000);
  const end = putDays > 0 ? new Date(start.getTime() + putDays * 86400000) : new Date();
  const fmt = (d: Date) => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")} ${d.getFullYear()}`;
  };
  return `${fmt(start)}-${fmt(end)}`;
}

function HotBadge({ value }: { value: number }) {
  if (!value) return null;
  const colors = value >= 7 ? "bg-red-100 text-red-700" : value >= 4 ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700";
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${colors}`}>{"\uD83D\uDD25"} {value}/10</span>;
}

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

type Mode = "product" | "video";

export default function TTSPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { setSelectedProduct } = useTikTokShop();

  // Product search
  const {
    products, allCount: productAllCount, loading: productLoading, loadingMore: productLoadingMore,
    error: productError, hasMore: productHasMore, search: productSearch, resort: productResort,
    sentinelRef: productSentinelRef,
  } = useProductSearch();

  // Video search
  const {
    videos: videoResults, allCount: videoAllCount, loading: videoLoading, error: videoError,
    hasMore: videoHasMore, search: videoSearch, sentinelRef: videoSentinelRef, tagAnalytics,
  } = useVideoSearch();

  const [localKeyword, setLocalKeyword] = useState("");
  const [mode, setMode] = useState<Mode>("product");
  const [productSort, setProductSort] = useState(2);
  const [productSortType, setProductSortType] = useState<"asc" | "desc">("desc");
  const [videoSortBy, setVideoSortBy] = useState(6);

  // Save modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveProduct, setSaveProduct] = useState<ProductResult | null>(null);
  const [saveVideo, setSaveVideo] = useState<VideoResult | null>(null);
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  const loading = mode === "product" ? productLoading : videoLoading;
  const error = mode === "product" ? productError : videoError;

  function handleSearch() {
    if (!localKeyword.trim()) return;
    if (mode === "product") {
      productSearch(localKeyword.trim(), productSort, productSortType);
    } else {
      videoSearch(localKeyword.trim(), videoSortBy, {});
    }
  }

  async function openSaveModal(product?: ProductResult, video?: VideoResult) {
    setSaveProduct(product || null);
    setSaveVideo(video || null);
    setShowSaveModal(true);
    setSaveMsg("");
    try {
      const f = await loadFolders(user?.userId);
      setFolders(f);
      if (f.length > 0 && !selectedFolder) setSelectedFolder(f[0]);
    } catch { setFolders(["Genel"]); }
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
      const brandData = saveProduct ? toBrandDataProduct(saveProduct) : saveVideo ? toBrandDataVideo(saveVideo) : null;
      if (!brandData) return;
      const added = await saveBrandsBulk(folder, [brandData], user?.userId);
      setSaveMsg(`${added} marka kaydedildi!`);
      setTimeout(() => { setShowSaveModal(false); setSaveMsg(""); setSaveProduct(null); setSaveVideo(null); }, 1200);
    } catch { setSaveMsg("Hata olustu!"); }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">TikTok Shop</h1>
        <p className="text-text-secondary mt-1">TikTok Shop&apos;ta trend urunleri kesfet</p>
      </div>

      {/* Search Bar */}
      <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Keyword */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-text-primary mb-1">Anahtar Kelime</label>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text" value={localKeyword}
                onChange={(e) => setLocalKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="ornegin: led lamba, cilt bakim, kitchen gadget..."
                className="w-full pl-10 pr-4 py-2.5 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="w-48">
            <label className="block text-sm font-medium text-text-primary mb-1">Arama Modu</label>
            <div className="flex rounded-lg border border-border-default overflow-hidden">
              <button onClick={() => setMode("product")} className={`flex-1 py-2.5 text-sm font-medium transition-colors ${mode === "product" ? "bg-accent text-white" : "bg-bg-card text-text-secondary hover:bg-bg-hover"}`}>
                Urunler
              </button>
              <button onClick={() => setMode("video")} className={`flex-1 py-2.5 text-sm font-medium transition-colors ${mode === "video" ? "bg-accent text-white" : "bg-bg-card text-text-secondary hover:bg-bg-hover"}`}>
                Videolar
              </button>
            </div>
          </div>

          {/* Sort */}
          <div className={mode === "product" ? "w-52" : "w-44"}>
            <label className="block text-sm font-medium text-text-primary mb-1">Siralama</label>
            {mode === "product" ? (
              <select
                value={productSort === 2 && productSortType === "asc" ? "found_time_asc" : String(productSort)}
                onChange={(e) => {
                  const val = e.target.value;
                  const opt = PRODUCT_SORT_OPTIONS.find((o) => (o.id || String(o.value)) === val);
                  if (!opt) return;
                  const newType = opt.defaultType as "asc" | "desc";
                  setProductSort(opt.value);
                  setProductSortType(newType);
                  productResort(opt.value, newType);
                }}
                className="w-full py-2.5 px-3 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                {PRODUCT_SORT_OPTIONS.map((opt) => (
                  <option key={opt.id || opt.value} value={opt.id || opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <select
                value={videoSortBy}
                onChange={(e) => setVideoSortBy(Number(e.target.value))}
                className="w-full py-2.5 px-3 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                {VIDEO_SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}
          </div>

          {/* Asc/Desc toggle (products only) */}
          {mode === "product" && (
            <div className="w-32">
              <label className="block text-sm font-medium text-text-primary mb-1">Sira</label>
              <div className="flex rounded-lg border border-border-default overflow-hidden">
                <button
                  onClick={() => { setProductSortType("desc"); productResort(productSort, "desc"); }}
                  className={`flex-1 py-2.5 text-xs font-medium transition-colors ${productSortType === "desc" ? "bg-accent text-white" : "bg-bg-card text-text-secondary hover:bg-bg-hover"}`}
                >
                  Azalan
                </button>
                <button
                  onClick={() => { setProductSortType("asc"); productResort(productSort, "asc"); }}
                  className={`flex-1 py-2.5 text-xs font-medium transition-colors ${productSortType === "asc" ? "bg-accent text-white" : "bg-bg-card text-text-secondary hover:bg-bg-hover"}`}
                >
                  Artan
                </button>
              </div>
            </div>
          )}

          <div className="flex items-end">
            <button onClick={handleSearch} disabled={loading || !localKeyword.trim()}
              className="gradient-accent text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Ara
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">{error}</div>}

      {/* Loading */}
      {loading && <FaycomLoader />}

      {/* ===== PRODUCT RESULTS ===== */}
      {mode === "product" && !productLoading && products.length > 0 && (
        <div>
          <p className="text-sm text-text-secondary mb-4">{productAllCount} urun yuklendi{productHasMore ? " (devam ediyor...)" : ""}</p>

          <ProductTable
            results={products}
            onSave={(p) => openSaveModal(p)}
            onDetail={(p) => {
              // Bridge to context for detail page
              setSelectedProduct({
                ...p, image_list: p.image_list || [], like_count: p.like_count || 0,
                share_count: p.share_count || 0, comment_count: p.comment_count || 0,
                person_count: p.person_count || 0, commission_rate: p.commission_rate || 0,
                found_time: p.found_time || 0, put_days: p.put_days || 0,
              });
              try { sessionStorage.setItem(`tts_product_${p.id}`, JSON.stringify(p)); } catch { /* ignore */ }
              router.push(`/tts/${p.id}`);
            }}
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
              <div className="flex items-center gap-2 text-text-muted">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm">Daha fazla urun yukleniyor...</span>
              </div>
            </div>
          )}
          {!productHasMore && products.length > 0 && <p className="text-center text-sm text-text-muted py-8">Tum urunler yuklendi ({productAllCount} urun)</p>}
        </div>
      )}

      {/* ===== VIDEO RESULTS ===== */}
      {mode === "video" && !videoLoading && (
        <>
          {/* Tag Analytics */}
          {videoAllCount > 0 && tagAnalytics.length > 0 && (
            <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-5 mb-6">
              <h3 className="text-sm font-semibold text-text-primary mb-1">Pazarlama Acilari &rarr; Goruntulenme</h3>
              <p className="text-[11px] text-text-muted mb-3">{videoAllCount} video analiz edildi</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 max-h-[320px] overflow-y-auto">
                {tagAnalytics.slice(0, 20).map((t, i) => {
                  const maxViews = tagAnalytics[0]?.avgViews || 1;
                  const pct = Math.round((t.avgViews / maxViews) * 100);
                  return (
                    <div key={t.tag} className="flex items-center gap-3">
                      <span className="text-xs text-text-muted w-5 text-right">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-medium text-text-primary truncate">#{t.tag}</span>
                          <span className="text-xs text-text-secondary ml-2 flex-shrink-0">{formatCompact(t.avgViews)} ort.</span>
                        </div>
                        <div className="h-1.5 bg-bg-hover rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-[#667eea] to-[#764ba2]" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex justify-between mt-0.5">
                          <span className="text-[10px] text-text-muted">{t.count} video</span>
                          <span className="text-[10px] text-text-muted">{formatCompact(t.totalViews)} toplam</span>
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
              <p className="text-sm text-text-secondary mb-4">{videoResults.length} / {videoAllCount} video gosteriliyor</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {videoResults.map((video) => (
                  <VideoCard key={video.id} video={video} onSave={() => openSaveModal(undefined, video)} />
                ))}
              </div>
              {videoHasMore && <div key={videoResults.length} ref={videoSentinelRef} className="py-8" />}
              {!videoHasMore && videoResults.length > 0 && (
                <p className="text-center text-sm text-text-muted py-8">Tum sonuclar yuklendi ({videoAllCount} video)</p>
              )}
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!loading && (
        (mode === "product" && products.length === 0 && !productError && productAllCount === 0 && localKeyword && !productLoading) ||
        (mode === "video" && videoResults.length === 0 && !videoError && videoAllCount === 0 && localKeyword && !videoLoading)
      ) && (
        <div className="text-center py-16 text-text-muted">
          <p className="text-lg">Sonuc bulunamadi</p>
          <p className="text-sm mt-1">Farkli bir anahtar kelime deneyin</p>
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (saveProduct || saveVideo) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-card rounded-[14px] p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text-primary">Klasore Kaydet</h3>
              <button onClick={() => { setShowSaveModal(false); setSaveProduct(null); setSaveVideo(null); }} className="text-text-muted hover:text-text-secondary"><X size={20} /></button>
            </div>
            <p className="text-sm text-text-secondary mb-4">&quot;{saveProduct?.title || saveProduct?.shop_name || saveVideo?.hook || saveVideo?.title || saveVideo?.shop_name}&quot;</p>
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
                <button onClick={handleCreateFolder} className="px-3 py-2 bg-bg-hover text-text-primary rounded-lg text-sm hover:bg-bg-hover">Olustur</button>
              </div>
            </div>
            {saveMsg && <p className="text-sm text-green-600 mb-3">{saveMsg}</p>}
            <button onClick={handleSave} className="w-full gradient-accent text-white py-2.5 rounded-lg text-sm font-medium hover:opacity-90">Kaydet</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Product Table ---- */
function ProductTable({ results, onSave, onDetail, sortNum, sortType, onSort }: {
  results: ProductResult[]; onSave: (p: ProductResult) => void; onDetail: (p: ProductResult) => void;
  sortNum: number; sortType: "asc" | "desc"; onSort: (num: number) => void;
}) {
  const arrow = (num: number) => sortNum === num ? (sortType === "desc" ? " \u2193" : " \u2191") : "";
  return (
    <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bg-main border-b border-border-default">
              <th className="text-left py-3 px-4 font-medium text-text-secondary w-12">#</th>
              <th className="text-left py-3 px-4 font-medium text-text-secondary">Urun</th>
              <th className="text-right py-3 px-4 font-medium text-text-secondary cursor-pointer hover:text-accent select-none" onClick={() => onSort(3)}>Satildi{arrow(3)}</th>
              <th className="text-right py-3 px-4 font-medium text-text-secondary cursor-pointer hover:text-accent select-none" onClick={() => onSort(4)}>GMV{arrow(4)}</th>
              <th className="text-right py-3 px-4 font-medium text-text-secondary cursor-pointer hover:text-accent select-none" onClick={() => onSort(7)}>Reklamlar{arrow(7)}</th>
              <th className="text-right py-3 px-4 font-medium text-text-secondary cursor-pointer hover:text-accent select-none" onClick={() => onSort(5)}>Gosterim / Harcama{arrow(5)}</th>
              <th className="text-right py-3 px-4 font-medium text-text-secondary cursor-pointer hover:text-accent select-none" onClick={() => onSort(8)}>Influencers{arrow(8)}</th>
              <th className="text-center py-3 px-4 font-medium text-text-secondary cursor-pointer hover:text-accent select-none" onClick={() => onSort(2)}>Reklam Tarihi{arrow(2)}</th>
              <th className="text-center py-3 px-4 font-medium text-text-secondary w-20">Eylem</th>
            </tr>
          </thead>
          <tbody>
            {results.map((p, i) => (
              <tr key={p.id || i} className="border-b border-border-default hover:bg-bg-hover/50 transition-colors">
                <td className="py-3 px-4 text-text-muted text-xs">{i + 1}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3 min-w-[280px]">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt={p.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-border-default" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-bg-hover flex items-center justify-center flex-shrink-0"><ShoppingBag size={16} className="text-text-muted" /></div>
                    )}
                    <div className="min-w-0">
                      <button onClick={() => onDetail(p)} className="text-sm font-medium text-text-primary hover:text-accent line-clamp-2 transition-colors text-left cursor-pointer" title={p.title}>
                        {p.title?.length > 60 ? p.title.substring(0, 60) + "..." : p.title || "Bilinmeyen"}
                      </button>
                      <div className="flex items-center gap-2 mt-1">
                        {p.region && <span className="text-sm">{FLAG[p.region?.toUpperCase()] || ""}</span>}
                        <span className="text-xs font-medium text-orange-600">${p.price_usd.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {p.seller_location && <span className="text-[10px] bg-bg-hover text-text-secondary px-1.5 py-0.5 rounded">{p.seller_location}</span>}
                        {p.commission_rate > 0 && <span className="text-[10px] text-text-muted">Komisyon: {p.commission_rate}%</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {p.shop_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.shop_image} alt={p.shop_name} className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
                        ) : <div className="w-4 h-4 rounded-full bg-bg-hover flex-shrink-0" />}
                        <span className="text-[11px] text-text-secondary truncate">{p.shop_name || "-"}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-right font-medium text-text-primary">{formatCompact(p.sales_volume)}</td>
                <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatMoney(p.gmv_usd)}</td>
                <td className="py-3 px-4 text-right text-text-secondary">{formatCompact(p.video_count)}</td>
                <td className="py-3 px-4 text-right">
                  <div className="text-text-primary">{formatCompact(p.play_count)}</div>
                </td>
                <td className="py-3 px-4 text-right text-text-secondary">{formatCompact(p.person_count)}</td>
                <td className="py-3 px-4 text-center text-xs text-text-secondary whitespace-nowrap">{formatDateRange(p.found_time, p.put_days) || "-"}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => onDetail(p)} className="p-1.5 rounded-lg border border-border-default hover:bg-bg-hover text-text-secondary hover:text-accent transition-colors" title="Detay"><Eye size={14} /></button>
                    <button onClick={() => onSave(p)} className="p-1.5 rounded-lg border border-accent/30 text-accent hover:bg-accent/5 transition-colors" title="Kaydet"><Bookmark size={14} /></button>
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

/* ---- Video Card ---- */
function VideoCard({ video, onSave }: { video: VideoResult; onSave: () => void }) {
  const dateRange = formatDateRange(video.ad_create_time, video.put_days);
  return (
    <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      <div className="relative aspect-[9/16] bg-bg-hover flex-shrink-0">
        {video.cover_image || video.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={video.cover_image || video.image} alt={video.hook || video.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted"><Play size={48} /></div>
        )}
        {video.video_url && (
          <a href={video.video_url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center"><Play size={24} className="text-text-primary ml-1" /></div>
          </a>
        )}
        {video.duration > 0 && (
          <div className="absolute bottom-2 left-2">
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/60 text-white flex items-center gap-1"><Clock size={10} />{formatDuration(video.duration)}</span>
          </div>
        )}
        {video.region && <div className="absolute top-2 left-2 text-lg drop-shadow">{FLAG[video.region.toUpperCase()] || video.region}</div>}
        {video.hot_value > 0 && <div className="absolute top-2 right-2"><HotBadge value={video.hot_value} /></div>}
      </div>
      <div className="p-3 flex flex-col flex-1">
        {dateRange && <p className="text-[10px] text-text-muted mb-1">{dateRange}</p>}
        <div className="grid grid-cols-3 gap-1 mb-2">
          <div className="text-center"><p className="text-sm font-bold text-text-primary">{formatCompact(video.play_count)}</p><p className="text-[10px] text-text-muted">Gosterim</p></div>
          <div className="text-center"><p className="text-sm font-bold text-text-primary">{video.put_days || 0}</p><p className="text-[10px] text-text-muted">Sure</p></div>
          <div className="text-center"><p className="text-sm font-bold text-text-primary">{formatCompact(video.like_count)}</p><p className="text-[10px] text-text-muted">Begen</p></div>
        </div>
        <p className="text-xs text-text-primary line-clamp-2 mb-1.5 leading-snug">{video.hook || video.title || ""}</p>
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
            <span className="text-xs font-medium text-text-primary truncate">{video.shop_name || "Bilinmeyen"}</span>
            {video.shop_handle && (
              <a href={`https://www.tiktok.com/@${video.shop_handle}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-accent hover:underline flex items-center gap-0.5 flex-shrink-0"><ExternalLink size={8} /></a>
            )}
          </div>
          {video.region && <span className="text-xs">{FLAG[video.region.toUpperCase()] || ""}</span>}
        </div>
        <div className="grid grid-cols-2 gap-x-3 text-[10px] text-text-muted mb-2">
          <span>{"\uD83D\uDCAC"} {formatCompact(video.comment_count)}</span>
          <span className="flex items-center gap-0.5"><Share2 size={9} /> {formatCompact(video.share_count)}</span>
        </div>
        <button onClick={onSave} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-accent/30 text-accent text-xs font-medium hover:bg-accent/5 transition-colors">
          <Bookmark size={12} />Kaydet
        </button>
      </div>
    </div>
  );
}
