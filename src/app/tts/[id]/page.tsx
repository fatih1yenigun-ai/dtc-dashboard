"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Save,
  ShoppingBag,
  Star,
  TrendingUp,
  Play,
  Eye,
  Share2,
  Clock,
  Users,
  MapPin,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTikTokShop, type TTSProduct } from "@/context/TikTokShopContext";
import { useAuth } from "@/context/AuthContext";
import { loadFolders, createFolder, saveBrandsBulk, type BrandData } from "@/lib/supabase";
import { useProductVideos, VIDEO_DETAIL_SORT_OPTIONS } from "@/hooks/useProductVideos";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const FLAG: Record<string, string> = {
  US: "\u{1F1FA}\u{1F1F8}", UK: "\u{1F1EC}\u{1F1E7}", GB: "\u{1F1EC}\u{1F1E7}",
  DE: "\u{1F1E9}\u{1F1EA}", FR: "\u{1F1EB}\u{1F1F7}", TR: "\u{1F1F9}\u{1F1F7}",
  AU: "\u{1F1E6}\u{1F1FA}", CA: "\u{1F1E8}\u{1F1E6}", ID: "\u{1F1EE}\u{1F1E9}",
  TH: "\u{1F1F9}\u{1F1ED}", VN: "\u{1F1FB}\u{1F1F3}", MY: "\u{1F1F2}\u{1F1FE}",
  PH: "\u{1F1F5}\u{1F1ED}", SG: "\u{1F1F8}\u{1F1EC}", MX: "\u{1F1F2}\u{1F1FD}",
};

const TAG_COLORS = [
  "bg-blue-100 text-blue-700", "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700", "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700", "bg-cyan-100 text-cyan-700",
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
  return `${m}:${String(s).padStart(2, "0")}`;
}

function HotBadge({ value }: { value: number }) {
  if (!value) return null;
  const colors = value >= 7 ? "bg-red-100 text-red-700" : value >= 4 ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700";
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${colors}`}>{"\uD83D\uDD25"} {value}/10</span>;
}

function MetricCard({ label, value, color, icon }: { label: string; value: string; color: string; icon?: React.ReactNode }) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-100",
    pink: "bg-pink-50 text-pink-700 border-pink-100",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
    gray: "bg-gray-50 text-gray-700 border-gray-100",
  };
  return (
    <div className={`rounded-xl p-3 border ${colorMap[color] || colorMap.blue}`}>
      <div className="flex items-center gap-1.5 mb-1">{icon}<span className="text-xs font-medium opacity-80">{label}</span></div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { selectedProduct, setSelectedProduct } = useTikTokShop();

  const [product, setProduct] = useState<TTSProduct | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  const [mainImage, setMainImage] = useState("");

  // Save modal state
  const [showSave, setShowSave] = useState(false);
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  // Chart period
  const [chartPeriod, setChartPeriod] = useState<"7" | "30">("30");

  // Video detail popup
  const [detailVideo, setDetailVideo] = useState<TTSProduct | null>(null);

  // Resolve product data
  useEffect(() => {
    // 1. From context
    if (selectedProduct && selectedProduct.id === id) {
      setProduct(selectedProduct);
      setMainImage(selectedProduct.image_list?.[0] || selectedProduct.image || "");
      setProductLoading(false);
      return;
    }

    // 2. From sessionStorage
    try {
      const cached = sessionStorage.getItem(`tts_product_${id}`);
      if (cached) {
        const parsed = JSON.parse(cached) as TTSProduct;
        setProduct(parsed);
        setMainImage(parsed.image_list?.[0] || parsed.image || "");
        setProductLoading(false);
        return;
      }
    } catch { /* ignore */ }

    // 3. Fallback: search by ID or shop name via PiPiAds API
    async function fetchProduct() {
      const token = localStorage.getItem("token");
      const apiHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async function searchProducts(keyword: string, shopId?: string): Promise<any[]> {
        const res = await fetch("/api/tiktok-shop", {
          method: "POST",
          headers: apiHeaders,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          body: JSON.stringify({ keyword, searchMode: "product", page: 1, pageSize: 20, productSort: 4, sortType: "desc", ...(shopId ? { shopId } : {}) } as any),
        });
        const data = await res.json();
        return data.result?.data || data.data?.list || data.list || [];
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function toProduct(match: any): TTSProduct {
        return {
          id: match.id || "", title: match.title || "", image: match.image || "",
          image_list: match.image_list || [], landing_page: match.landing_page || "",
          price_usd: match.price_usd || match.price || 0, sales_volume: match.sales_volume || 0,
          gmv_usd: match.gmv_usd || match.gmv || 0, score: match.score || 0,
          shop_name: match.shop_name || "", shop_image: match.shop_image || "", shop_id: match.shop_id || "",
          video_count: match.video_count || 0, play_count: match.play_count || 0,
          like_count: match.like_count || 0, share_count: match.share_count || 0, comment_count: match.comment_count || 0,
          region: match.region || "", person_count: match.person_count || 0,
          commission_rate: match.commission_rate || 0, seller_location: match.seller_location || "",
          found_time: match.found_time || 0, day7_gmv_usd: match.day7?.gmv_usd || 0, day7_sales: match.day7?.sales_volume || 0,
          day30_gmv_usd: match.day30?.gmv_usd || 0, day30_sales: match.day30?.sales_volume || 0, put_days: match.put_days || 0,
        };
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let match: any = null;
        let list: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any

        // Strategy 1: Search by ID as keyword
        list = await searchProducts(id);
        match = list.find((item: any) => String(item.id) === id); // eslint-disable-line @typescript-eslint/no-explicit-any

        // Strategy 2: Search store's products by shop_id filter (from store detail page)
        if (!match) {
          let storeId: string | null = null;
          try { storeId = sessionStorage.getItem(`tts_store_id_${id}`); } catch { /* ignore */ }
          if (storeId) {
            list = await searchProducts("", storeId);
            match = list.find((item: any) => String(item.id) === id); // eslint-disable-line @typescript-eslint/no-explicit-any
          }
        }

        // Strategy 3: Search by shop name (from video popup)
        if (!match) {
          let shopName: string | null = null;
          try { shopName = sessionStorage.getItem(`tts_shop_name_${id}`); } catch { /* ignore */ }
          if (shopName) {
            list = await searchProducts(shopName);
            match = list.find((item: any) => String(item.id) === id) || list[0]; // eslint-disable-line @typescript-eslint/no-explicit-any
          }
        }

        // Strategy 4: Use first result from initial search
        if (!match && list.length > 0) {
          match = list[0];
        }

        if (match) {
          const p = toProduct(match);
          setProduct(p);
          setMainImage(p.image_list?.[0] || p.image || "");
        }
      } catch { /* ignore */ }
      setProductLoading(false);
    }
    fetchProduct();
  }, [id, selectedProduct]);

  // Fetch videos
  const { videos, allVideos, loading: videosLoading, hookAnalysis, tagAnalysis, videoPage, totalVideoPages, goToVideoPage, changeSort: changeVideoSort, currentSort: videoSort, currentSortType: videoSortType } = useProductVideos(product?.title);

  // Save handlers
  async function openSaveModal() {
    setShowSave(true);
    setSaveMsg("");
    try {
      const f = await loadFolders(user?.userId);
      setFolders(f);
      if (f.length > 0 && !selectedFolder) setSelectedFolder(f[0]);
    } catch { setFolders(["Genel"]); }
  }

  async function handleSave() {
    if (!product) return;
    const folder = newFolderName.trim() || selectedFolder;
    if (!folder) return;
    try {
      if (newFolderName.trim()) await createFolder(newFolderName.trim(), user?.userId);
      const brandData: BrandData = {
        Marka: product.shop_name, "Web Sitesi": product.landing_page,
        Kategori: product.seller_location, "AOV ($)": product.price_usd,
        "Ciro ($)": product.gmv_usd, "\u00D6ne \u00C7\u0131kan \u00D6zellik": product.title,
        "\u00DClke": product.region,
      } as BrandData;
      await saveBrandsBulk(folder, [brandData], user?.userId);
      setSaveMsg("Kaydedildi!");
      setTimeout(() => { setShowSave(false); setSaveMsg(""); }, 1200);
    } catch { setSaveMsg("Hata olustu!"); }
  }

  // Chart data
  const salesChartData = [
    { name: "Son 7 Gun", value: product?.day7_sales || 0 },
    { name: "Son 30 Gun", value: product?.day30_sales || 0 },
  ];
  const gmvChartData = [
    { name: "Son 7 Gun", value: product?.day7_gmv_usd || 0 },
    { name: "Son 30 Gun", value: product?.day30_gmv_usd || 0 },
  ];

  // Loading state
  if (productLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 size={32} className="animate-spin text-accent mb-3" />
        <p className="text-text-secondary text-sm">Urun bilgileri yukleniyor...</p>
      </div>
    );
  }

  if (!product) {
    // Try to get video context from sessionStorage (when coming from video popup)
    let videoContext: { shopName?: string; shopHandle?: string; shopId?: string; tiktokShopUrl?: string } = {};
    try {
      const ctx = sessionStorage.getItem(`tts_video_context_${id}`);
      if (ctx) videoContext = JSON.parse(ctx);
    } catch { /* ignore */ }

    return (
      <div className="max-w-lg mx-auto py-16">
        <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag size={28} className="text-accent" />
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-2">
            {videoContext.shopName ? `${videoContext.shopName}` : "Urun Detayi"}
          </h2>
          {videoContext.shopHandle && (
            <p className="text-sm text-text-secondary mb-4">@{videoContext.shopHandle}</p>
          )}
          <p className="text-sm text-text-secondary mb-6">
            Bu urun PiPiAds veritabaninda bulunamadi. TikTok Shop&apos;tan dogrudan gorebilirsiniz.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {videoContext.tiktokShopUrl && (
              <a
                href={videoContext.tiktokShopUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg gradient-accent text-white text-sm font-medium hover:opacity-90"
              >
                <ExternalLink size={14} /> TikTok Shop&apos;ta Gor
              </a>
            )}
            {videoContext.shopHandle && (
              <a
                href={`https://www.tiktok.com/@${videoContext.shopHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-bg-hover text-text-primary text-sm font-medium hover:bg-bg-hover"
              >
                <ExternalLink size={14} /> TikTok Profili
              </a>
            )}
            <button
              onClick={() => router.push("/reklam-tara")}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-border-default text-text-secondary text-sm font-medium hover:bg-bg-hover cursor-pointer"
            >
              <ArrowLeft size={14} /> Reklam Tara&apos;ya Don
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back navigation */}
      <button onClick={() => { setSelectedProduct(null); router.push("/tts"); }} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-6 cursor-pointer">
        <ArrowLeft size={16} /> TikTok Shop / Urun Detayi
      </button>

      {/* ═══ SECTION 1: Product Header ═══ */}
      <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Images */}
          <div className="w-full md:w-72 flex-shrink-0">
            {mainImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mainImage} alt={product.title} className="w-full rounded-xl object-cover border border-border-default mb-3" />
            ) : (
              <div className="w-full aspect-square rounded-xl bg-bg-hover flex items-center justify-center mb-3">
                <ShoppingBag size={48} className="text-text-muted" />
              </div>
            )}
            {product.image_list && product.image_list.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.image_list.map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i} src={img} alt={`${i + 1}`}
                    onClick={() => setMainImage(img)}
                    className={`w-14 h-14 rounded-lg object-cover cursor-pointer border-2 flex-shrink-0 ${mainImage === img ? "border-accent" : "border-border-default"}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            {/* Shop info above title */}
            <div className="flex items-center gap-3 mb-3">
              {product.shop_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.shop_image} alt={product.shop_name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-bg-hover flex items-center justify-center"><ShoppingBag size={18} className="text-text-muted" /></div>
              )}
              <div>
                <p className="font-semibold text-text-primary text-sm">{product.shop_name || "Bilinmeyen Magaza"}</p>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  {product.region && <span>{FLAG[product.region.toUpperCase()] || ""} {product.region.toUpperCase()}</span>}
                  {product.seller_location && <span>· {product.seller_location}</span>}
                </div>
              </div>
            </div>

            <h1 className="text-xl font-bold text-text-primary mb-3 leading-snug">{product.title}</h1>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {product.commission_rate > 0 && (
                <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg font-medium">
                  %{(product.commission_rate * 100).toFixed(0)} Komisyon
                </span>
              )}
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div><p className="text-xs text-text-secondary">Fiyat</p><p className="text-xl font-bold text-text-primary">${product.price_usd.toFixed(2)}</p></div>
              <div><p className="text-xs text-text-secondary">Satislar</p><p className="text-xl font-bold text-blue-600">{formatCompact(product.sales_volume)}</p></div>
              <div><p className="text-xs text-text-secondary">GMV</p><p className="text-xl font-bold text-emerald-600">{formatMoney(product.gmv_usd)}</p></div>
              <div><p className="text-xs text-text-secondary">Puan</p><p className="text-xl font-bold text-amber-600 flex items-center gap-1"><Star size={16} className="fill-amber-400 text-amber-400" />{product.score > 0 ? product.score.toFixed(1) : "-"}</p></div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <button onClick={openSaveModal} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg gradient-accent text-white text-sm font-medium hover:opacity-90 cursor-pointer">
                <Save size={14} /> Klasore Kaydet
              </button>
              {product.landing_page && (
                <a href={product.landing_page} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-bg-hover text-text-primary text-sm font-medium hover:bg-bg-hover">
                  <ExternalLink size={14} /> TikTok Shop
                </a>
              )}
              <a href={`https://www.pipiads.com/tr/tiktok-shop-product/${product.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20">
                <ExternalLink size={14} /> PiPiAds
              </a>
            </div>
          </div>
        </div>

        {/* Veri Analizi — inside the header card */}
        <div className="border-t border-border-default mt-6 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">Veri Analizi</h3>
            <div className="flex bg-bg-hover rounded-lg p-0.5">
              <button onClick={() => setChartPeriod("7")} className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer ${chartPeriod === "7" ? "bg-bg-card text-text-primary shadow-sm" : "text-text-secondary"}`}>7 Gun</button>
              <button onClick={() => setChartPeriod("30")} className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer ${chartPeriod === "30" ? "bg-bg-card text-text-primary shadow-sm" : "text-text-secondary"}`}>30 Gun</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-bg-main rounded-xl p-4">
              <h4 className="text-xs text-text-secondary mb-1">Satislar</h4>
              <p className="text-xl font-bold text-blue-600 mb-3">{formatCompact(chartPeriod === "7" ? product.day7_sales : product.day30_sales)}</p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={salesChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <Tooltip formatter={(value) => formatCompact(Number(value))} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-bg-main rounded-xl p-4">
              <h4 className="text-xs text-text-secondary mb-1">GMV</h4>
              <p className="text-xl font-bold text-emerald-600 mb-3">{formatMoney(chartPeriod === "7" ? product.day7_gmv_usd : product.day30_gmv_usd)}</p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={gmvChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <Tooltip formatter={(value) => formatMoney(Number(value))} />
                  <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SECTION 3: Reklam Analizi ═══ */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-text-primary mb-4">Reklam Analizi</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <MetricCard label="Satislar" value={formatCompact(product.sales_volume)} color="blue" icon={<ShoppingBag size={14} />} />
          <MetricCard label="GMV" value={formatMoney(product.gmv_usd)} color="emerald" icon={<TrendingUp size={14} />} />
          <MetricCard label="Video Sayisi" value={formatCompact(product.video_count)} color="rose" icon={<Play size={14} />} />
          <MetricCard label="Goruntulenme" value={formatCompact(product.play_count)} color="cyan" icon={<Eye size={14} />} />
          <MetricCard label="Icerik Uretici" value={String(product.person_count || "-")} color="indigo" icon={<Users size={14} />} />
          <MetricCard label="Begenme" value={formatCompact(product.like_count)} color="pink" />
          <MetricCard label="Paylasim" value={formatCompact(product.share_count)} color="purple" icon={<Share2 size={14} />} />
          <MetricCard label="Yorum" value={formatCompact(product.comment_count)} color="amber" />
          <MetricCard label="Aktif Gun" value={product.put_days > 0 ? `${product.put_days} gun` : "-"} color="gray" icon={<Clock size={14} />} />
          <MetricCard label="Baslangic" value={product.found_time ? new Date(product.found_time * 1000).toLocaleDateString("tr-TR") : "-"} color="gray" icon={<MapPin size={14} />} />
        </div>
      </div>

      {/* ═══ SECTION 4: TikTok Reklamlari (Videos) ═══ */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary">
            TikTok Reklamlari
            {allVideos.length > 0 && <span className="text-sm font-normal text-text-muted ml-2">({allVideos.length})</span>}
          </h2>
          {allVideos.length > 0 && (
            <select
              value={`${videoSort}_${videoSortType}`}
              onChange={(e) => {
                const [s, t] = e.target.value.split("_");
                changeVideoSort(Number(s), t);
              }}
              className="py-1.5 px-3 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              {VIDEO_DETAIL_SORT_OPTIONS.map((opt) => (
                <option key={`${opt.sort}_${opt.type}`} value={`${opt.sort}_${opt.type}`}>{opt.label}</option>
              ))}
            </select>
          )}
        </div>

        {videosLoading && (
          <div className="flex items-center gap-2 py-8 justify-center">
            <Loader2 size={20} className="animate-spin text-accent" />
            <span className="text-sm text-text-secondary">Videolar yukleniyor...</span>
          </div>
        )}

        {!videosLoading && videos.length === 0 && (
          <div className="text-center py-8 text-text-muted bg-bg-card rounded-[14px] border border-border-default">
            <Play size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Bu urun icin video bulunamadi</p>
          </div>
        )}

        {!videosLoading && videos.length > 0 && (
          <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {videos.map((video, i) => (
              <ProductVideoCard key={video.id || i} video={video} onDetail={setDetailVideo} />
            ))}
          </div>

          {/* Pagination */}
          {totalVideoPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => goToVideoPage(videoPage - 1)}
                disabled={videoPage <= 1}
                className="px-3 py-1.5 rounded-lg border border-border-default text-sm text-text-secondary hover:bg-bg-hover disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalVideoPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => goToVideoPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium cursor-pointer ${
                    p === videoPage
                      ? "bg-accent text-white"
                      : "border border-border-default text-text-secondary hover:bg-bg-hover"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => goToVideoPage(videoPage + 1)}
                disabled={videoPage >= totalVideoPages}
                className="px-3 py-1.5 rounded-lg border border-border-default text-sm text-text-secondary hover:bg-bg-hover disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
          </>
        )}
      </div>

      {/* ═══ SECTION 6: Pazarlama Acilari (Marketing Angles) ═══ */}
      {(hookAnalysis.length > 0 || tagAnalysis.length > 0) && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-text-primary mb-4">Pazarlama Acilari</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hooks */}
            {hookAnalysis.length > 0 && (
              <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-3">En Cok Kullanilan Hook&apos;lar</h3>
                <div className="space-y-3">
                  {hookAnalysis.map((h, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-xs font-bold text-accent bg-accent/10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary leading-snug">&quot;{h.hook}&quot;</p>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-text-muted">
                          <span>{h.count} video</span>
                          <span>Ort. {formatCompact(h.avgPlays)} goruntulenme</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {tagAnalysis.length > 0 && (
              <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-3">Populer Etiketler</h3>
                <div className="flex flex-wrap gap-2">
                  {tagAnalysis.map((t, i) => (
                    <span key={t.tag} className={`text-xs px-2.5 py-1 rounded-full font-medium ${TAG_COLORS[i % TAG_COLORS.length]}`}>
                      {t.tag} <span className="opacity-60">({t.count})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ VIDEO DETAIL POPUP ═══ */}
      {detailVideo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDetailVideo(null)}>
          <div className="bg-white rounded-xl w-full max-w-5xl mx-4 shadow-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header with shop info */}
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
                {product?.shop_id && (
                  <button onClick={() => window.open(`/tts-store/${product.shop_id}`, "_blank")} className="ml-2 text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg hover:bg-blue-100 cursor-pointer flex items-center gap-1">
                    <ShoppingBag size={12} /> Magaza
                  </button>
                )}
              </div>
              <button onClick={() => setDetailVideo(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={20} /></button>
            </div>

            <div className="flex flex-col md:flex-row flex-1 min-h-0">
              {/* Left: Video */}
              <div className="md:w-[40%] bg-black flex flex-col flex-shrink-0">
                <div className="flex-1 flex items-center justify-center min-h-0">
                  {detailVideo.video_url ? (
                    <video src={detailVideo.video_url} poster={detailVideo.cover_image || detailVideo.image} controls autoPlay className="w-full h-full object-contain max-h-[75vh]" playsInline />
                  ) : (detailVideo.cover_image || detailVideo.image) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={detailVideo.cover_image || detailVideo.image} alt="" className="w-full h-full object-contain max-h-[75vh]" />
                  ) : (
                    <div className="py-32 text-gray-500"><Play size={48} /></div>
                  )}
                </div>
                <div className="bg-black/80 px-4 py-2 flex items-center gap-4 text-sm text-white/80 flex-shrink-0">
                  <span>{"\u2764\uFE0F"} {formatCompact(detailVideo.like_count)}</span>
                  <span>{"\uD83D\uDCAC"} {formatCompact(detailVideo.comment_count)}</span>
                  <span><Share2 size={12} className="inline" /> {formatCompact(detailVideo.share_count)}</span>
                </div>
              </div>

              {/* Right: Details */}
              <div className="md:w-[60%] overflow-y-auto p-5 space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Reklam Metni</p>
                  <p className="text-sm text-gray-800 leading-relaxed line-clamp-3">{detailVideo.hook || detailVideo.title || "-"}</p>
                </div>

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
                    <p className="text-base font-bold text-pink-700">{detailVideo.play_count > 0 ? ((detailVideo.like_count / detailVideo.play_count) * 100).toFixed(2) : "0.00"}%</p>
                    <p className="text-[10px] text-pink-500">Begeni Orani</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {detailVideo.region && (
                    <div className="flex items-center"><span className="text-gray-500 w-32 flex-shrink-0">Ulke/Bolge:</span><span className="font-medium text-gray-800">{FLAG[detailVideo.region.toUpperCase()] || ""} {detailVideo.region}</span></div>
                  )}
                  {(detailVideo.ad_create_time || 0) > 0 && (
                    <div className="flex items-center"><span className="text-gray-500 w-32 flex-shrink-0">Olusturma Tarihi:</span><span className="font-medium text-gray-800">{new Date((detailVideo.ad_create_time || 0) * 1000).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" })}</span></div>
                  )}
                </div>

                {/* Product card — click closes popup (already on product page) */}
                {product && (
                  <div className="border border-gray-200 rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setDetailVideo(null)}>
                    {product.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image} alt={product.title} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{product.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-medium">TikTok Shop</span>
                        {product.price_usd > 0 && <span className="text-xs font-bold text-orange-600">${product.price_usd.toFixed(2)}</span>}
                        {product.sales_volume > 0 && <span className="text-xs text-red-500 font-medium">Satildi: {formatCompact(product.sales_volume)}</span>}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  {detailVideo.video_url && (
                    <a href={`https://www.tiktok.com/@${detailVideo.shop_handle || ""}/video/${detailVideo.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200">
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
      {showSave && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSave(false)}>
          <div className="bg-bg-card rounded-[14px] p-6 w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text-primary">Klasore Kaydet</h3>
              <button onClick={() => setShowSave(false)} className="text-text-muted hover:text-text-secondary cursor-pointer"><X size={20} /></button>
            </div>
            <p className="text-sm text-text-secondary mb-4">&quot;{product.title}&quot;</p>
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
                <button onClick={async () => { if (!newFolderName.trim()) return; await createFolder(newFolderName.trim(), user?.userId); setFolders(p => [...p, newFolderName.trim()]); setSelectedFolder(newFolderName.trim()); setNewFolderName(""); }} className="px-3 py-2 bg-bg-hover text-text-primary rounded-lg text-sm hover:bg-bg-hover cursor-pointer">Olustur</button>
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

/* ── Product Video Card (inline play + popup) ── */
function ProductVideoCard({ video, onDetail }: { video: TTSProduct; onDetail: (v: TTSProduct) => void }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  function handleVideoClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (playing) { videoRef.current?.pause(); setPlaying(false); }
    else { videoRef.current?.play(); setPlaying(true); }
  }

  return (
    <div className="bg-bg-card rounded-[14px] border border-border-default overflow-hidden hover:shadow-md transition-shadow">
      {/* Video area — click plays inline */}
      <div className="relative aspect-[9/16] bg-bg-hover">
        {video.video_url ? (
          <div className="w-full h-full cursor-pointer" onClick={handleVideoClick}>
            {playing ? (
              <video ref={videoRef} src={video.video_url} poster={video.cover_image || video.image} className="w-full h-full object-cover" autoPlay loop playsInline />
            ) : (
              <>
                {(video.cover_image || video.image) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={video.cover_image || video.image} alt={video.hook || video.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted"><Play size={32} /></div>
                )}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-11 h-11 rounded-full bg-black/30 flex items-center justify-center"><Play size={18} className="text-white ml-0.5" fill="white" /></div>
                </div>
              </>
            )}
            {(video.duration || 0) > 0 && !playing && (
              <div className="absolute bottom-2 left-2"><span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/60 text-white flex items-center gap-1"><Clock size={10} />{formatDuration(video.duration || 0)}</span></div>
            )}
          </div>
        ) : (video.cover_image || video.image) ? (
          <div className="w-full h-full cursor-pointer" onClick={() => onDetail(video)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={video.cover_image || video.image} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted cursor-pointer" onClick={() => onDetail(video)}><Play size={32} /></div>
        )}
        {video.region && <div className="absolute top-2 left-2 text-sm drop-shadow pointer-events-none">{FLAG[video.region.toUpperCase()] || ""}</div>}
        {(video.hot_value || 0) > 0 && <div className="absolute top-2 right-2 pointer-events-none"><HotBadge value={video.hot_value || 0} /></div>}
      </div>
      {/* Info area — click opens popup */}
      <div className="p-2.5 cursor-pointer" onClick={() => onDetail(video)}>
        <p className="text-xs font-semibold text-text-primary line-clamp-2 mb-1">{video.hook || video.product_name || video.title || "-"}</p>
        <p className="text-[10px] text-text-muted mb-1 truncate">{video.shop_name || video.shop_handle || ""}</p>
        <div className="flex items-center gap-3 text-[10px] text-text-secondary">
          <span>{"\u25B6\uFE0F"} {formatCompact(video.play_count)}</span>
          <span>{"\u2764\uFE0F"} {formatCompact(video.like_count)}</span>
        </div>
      </div>
    </div>
  );
}
