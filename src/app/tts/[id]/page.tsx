"use client";

import { useState, useEffect, use } from "react";
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
import { useProductVideos } from "@/hooks/useProductVideos";
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

    // 3. Fallback: search by ID or shop_id via PiPiAds API
    async function fetchProduct() {
      try {
        const token = localStorage.getItem("token");
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        // Try searching with the ID as keyword (works for PiPiAds IDs and TikTok shop IDs)
        const res = await fetch("/api/tiktok-shop", {
          method: "POST",
          headers,
          body: JSON.stringify({ keyword: id, searchMode: "product", page: 1, pageSize: 20, productSort: 4, sortType: "desc" }),
        });
        const data = await res.json();
        const list = data.result?.data || data.data?.list || data.list || [];

        // Match by PiPiAds id OR by TikTok shop_id
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let match = list.find((item: any) => String(item.id) === id || String(item.shop_id) === id);

        // If no exact match but we got results, use the first one (keyword search likely found it)
        if (!match && list.length > 0) {
          match = list[0];
        }

        if (match) {
          const p: TTSProduct = {
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
          setProduct(p);
          setMainImage(p.image_list?.[0] || p.image || "");
        }
      } catch { /* ignore */ }
      setProductLoading(false);
    }
    fetchProduct();
  }, [id, selectedProduct]);

  // Fetch videos
  const { videos, allVideos, loading: videosLoading, hookAnalysis, tagAnalysis, videoPage, totalVideoPages, goToVideoPage } = useProductVideos(product?.title);

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
        <Loader2 size={32} className="animate-spin text-[#667eea] mb-3" />
        <p className="text-gray-500 text-sm">Urun bilgileri yukleniyor...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-32">
        <p className="text-lg text-gray-500 mb-4">Urun bulunamadi</p>
        <button onClick={() => router.push("/tts")} className="text-[#667eea] hover:underline cursor-pointer">
          TikTok Shop&apos;a don
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back navigation */}
      <button onClick={() => { setSelectedProduct(null); router.push("/tts"); }} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 cursor-pointer">
        <ArrowLeft size={16} /> TikTok Shop / Urun Detayi
      </button>

      {/* ═══ SECTION 1: Product Header ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Images */}
          <div className="w-full md:w-72 flex-shrink-0">
            {mainImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mainImage} alt={product.title} className="w-full rounded-xl object-cover border border-gray-100 mb-3" />
            ) : (
              <div className="w-full aspect-square rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                <ShoppingBag size={48} className="text-gray-300" />
              </div>
            )}
            {product.image_list && product.image_list.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.image_list.map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i} src={img} alt={`${i + 1}`}
                    onClick={() => setMainImage(img)}
                    className={`w-14 h-14 rounded-lg object-cover cursor-pointer border-2 flex-shrink-0 ${mainImage === img ? "border-[#667eea]" : "border-gray-100"}`}
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
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center"><ShoppingBag size={18} className="text-gray-400" /></div>
              )}
              <div>
                <p className="font-semibold text-gray-900 text-sm">{product.shop_name || "Bilinmeyen Magaza"}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {product.region && <span>{FLAG[product.region.toUpperCase()] || ""} {product.region.toUpperCase()}</span>}
                  {product.seller_location && <span>· {product.seller_location}</span>}
                </div>
              </div>
            </div>

            <h1 className="text-xl font-bold text-gray-900 mb-3 leading-snug">{product.title}</h1>

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
              <div><p className="text-xs text-gray-500">Fiyat</p><p className="text-xl font-bold text-gray-900">${product.price_usd.toFixed(2)}</p></div>
              <div><p className="text-xs text-gray-500">Satislar</p><p className="text-xl font-bold text-blue-600">{formatCompact(product.sales_volume)}</p></div>
              <div><p className="text-xs text-gray-500">GMV</p><p className="text-xl font-bold text-emerald-600">{formatMoney(product.gmv_usd)}</p></div>
              <div><p className="text-xs text-gray-500">Puan</p><p className="text-xl font-bold text-amber-600 flex items-center gap-1"><Star size={16} className="fill-amber-400 text-amber-400" />{product.score > 0 ? product.score.toFixed(1) : "-"}</p></div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <button onClick={openSaveModal} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg gradient-accent text-white text-sm font-medium hover:opacity-90 cursor-pointer">
                <Save size={14} /> Klasore Kaydet
              </button>
              {product.landing_page && (
                <a href={product.landing_page} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200">
                  <ExternalLink size={14} /> TikTok Shop
                </a>
              )}
              <a href={`https://www.pipiads.com/tr/tiktok-shop-product/${product.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#667eea]/10 text-[#667eea] text-sm font-medium hover:bg-[#667eea]/20">
                <ExternalLink size={14} /> PiPiAds
              </a>
            </div>
          </div>
        </div>

        {/* Veri Analizi — inside the header card */}
        <div className="border-t border-gray-100 mt-6 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Veri Analizi</h3>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button onClick={() => setChartPeriod("7")} className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer ${chartPeriod === "7" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>7 Gun</button>
              <button onClick={() => setChartPeriod("30")} className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer ${chartPeriod === "30" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>30 Gun</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-xs text-gray-500 mb-1">Satislar</h4>
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
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-xs text-gray-500 mb-1">GMV</h4>
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
        <h2 className="text-lg font-bold text-gray-900 mb-4">Reklam Analizi</h2>
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
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          TikTok Reklamlari
          {allVideos.length > 0 && <span className="text-sm font-normal text-gray-400 ml-2">({allVideos.length})</span>}
        </h2>

        {videosLoading && (
          <div className="flex items-center gap-2 py-8 justify-center">
            <Loader2 size={20} className="animate-spin text-[#667eea]" />
            <span className="text-sm text-gray-500">Videolar yukleniyor...</span>
          </div>
        )}

        {!videosLoading && videos.length === 0 && (
          <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-gray-200">
            <Play size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Bu urun icin video bulunamadi</p>
          </div>
        )}

        {!videosLoading && videos.length > 0 && (
          <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {videos.map((video, i) => (
              <div key={video.id || i} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative aspect-[9/16] bg-gray-100">
                  {(video.cover_image || video.image) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={video.cover_image || video.image} alt={video.hook || video.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300"><Play size={32} /></div>
                  )}
                  {video.video_url && (
                    <a href={video.video_url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                      <div className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center"><Play size={18} className="text-gray-900 ml-0.5" /></div>
                    </a>
                  )}
                  {video.region && <div className="absolute top-2 left-2 text-sm drop-shadow">{FLAG[video.region.toUpperCase()] || ""}</div>}
                  {(video.hot_value || 0) > 0 && <div className="absolute top-2 right-2"><HotBadge value={video.hot_value || 0} /></div>}
                  {(video.duration || 0) > 0 && (
                    <div className="absolute bottom-2 left-2">
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/60 text-white flex items-center gap-1"><Clock size={10} />{formatDuration(video.duration || 0)}</span>
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-gray-900 line-clamp-2 mb-1">{video.hook || video.product_name || video.title || "-"}</p>
                  <p className="text-[10px] text-gray-400 mb-1 truncate">{video.shop_name || video.shop_handle || ""}</p>
                  <div className="flex items-center gap-3 text-[10px] text-gray-500">
                    <span>{"\u25B6\uFE0F"} {formatCompact(video.play_count)}</span>
                    <span>{"\u2764\uFE0F"} {formatCompact(video.like_count)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalVideoPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => goToVideoPage(videoPage - 1)}
                disabled={videoPage <= 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalVideoPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => goToVideoPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium cursor-pointer ${
                    p === videoPage
                      ? "bg-[#667eea] text-white"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => goToVideoPage(videoPage + 1)}
                disabled={videoPage >= totalVideoPages}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-30 cursor-pointer"
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
          <h2 className="text-lg font-bold text-gray-900 mb-4">Pazarlama Acilari</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hooks */}
            {hookAnalysis.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">En Cok Kullanilan Hook&apos;lar</h3>
                <div className="space-y-3">
                  {hookAnalysis.map((h, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-xs font-bold text-[#667eea] bg-[#667eea]/10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 leading-snug">&quot;{h.hook}&quot;</p>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Populer Etiketler</h3>
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

      {/* ═══ SAVE MODAL ═══ */}
      {showSave && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSave(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Klasore Kaydet</h3>
              <button onClick={() => setShowSave(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">&quot;{product.title}&quot;</p>
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
                <button onClick={async () => { if (!newFolderName.trim()) return; await createFolder(newFolderName.trim(), user?.userId); setFolders(p => [...p, newFolderName.trim()]); setSelectedFolder(newFolderName.trim()); setNewFolderName(""); }} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 cursor-pointer">Olustur</button>
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
