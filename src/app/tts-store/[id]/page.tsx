"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  ShoppingBag,
  Star,
  TrendingUp,
  Loader2,
  Package,
  Megaphone,
  BarChart3,
  Eye,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ─── Constants ─── */

const FLAG: Record<string, string> = {
  US: "\u{1F1FA}\u{1F1F8}", UK: "\u{1F1EC}\u{1F1E7}", GB: "\u{1F1EC}\u{1F1E7}",
  DE: "\u{1F1E9}\u{1F1EA}", FR: "\u{1F1EB}\u{1F1F7}", TR: "\u{1F1F9}\u{1F1F7}",
  AU: "\u{1F1E6}\u{1F1FA}", CA: "\u{1F1E8}\u{1F1E6}", ID: "\u{1F1EE}\u{1F1E9}",
  TH: "\u{1F1F9}\u{1F1ED}", VN: "\u{1F1FB}\u{1F1F3}", MY: "\u{1F1F2}\u{1F1FE}",
  PH: "\u{1F1F5}\u{1F1ED}", SG: "\u{1F1F8}\u{1F1EC}", MX: "\u{1F1F2}\u{1F1FD}",
  BR: "\u{1F1E7}\u{1F1F7}", JP: "\u{1F1EF}\u{1F1F5}", KR: "\u{1F1F0}\u{1F1F7}",
  SA: "\u{1F1F8}\u{1F1E6}", AE: "\u{1F1E6}\u{1F1EA}", IN: "\u{1F1EE}\u{1F1F3}",
};

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", UK: "United Kingdom", GB: "United Kingdom",
  DE: "Germany", FR: "France", TR: "Turkey",
  AU: "Australia", CA: "Canada", ID: "Indonesia",
  TH: "Thailand", VN: "Vietnam", MY: "Malaysia",
  PH: "Philippines", SG: "Singapore", MX: "Mexico",
  BR: "Brazil", JP: "Japan", KR: "South Korea",
  SA: "Saudi Arabia", AE: "UAE", IN: "India",
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

/* ─── Helpers ─── */

function formatCompact(n: number | null | undefined): string {
  if (n === null || n === undefined) return "-";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

function formatMoney(n: number | null | undefined): string {
  if (n === null || n === undefined) return "-";
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function formatDate(ts: number): string {
  if (!ts) return "-";
  return new Date(ts * 1000).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function storeImg(url: string | undefined): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `https://im.pipiads.com/${url}`;
}

/* ─── Types ─── */

interface StoreDetail {
  id: string;
  image: string;
  title: string;
  region: string[];
  score: number;
  avg_price: number;
  avg_price_usd: number;
  sales_volume: number;
  total_gmv: number;
  total_gmv_usd: number;
  product_count: number;
  product_ad_count: number;
  sales_ad_volume: number;
  play_count: number;
  like_count: number;
  share_count: number;
  comment_count: number;
  store_comments: number;
  min_cpm: number;
  max_cpm: number;
  found_time: number;
  last_found_time: number;
  ad_gmv: number;
  ad_gmv_usd: number;
  best_selling_goods: Array<{ product_id: string; image: string; sales_volume: number }>;
  day7?: { sales_volume?: number; total_gmv_usd?: number };
  day30?: { sales_volume?: number; total_gmv_usd?: number };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface StoreProduct { [key: string]: any; }

/* ─── Sub-components ─── */

function MetricCard({ label, value, sub, color, icon }: { label: string; value: string; sub?: string; color: string; icon?: React.ReactNode }) {
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
    orange: "bg-orange-50 text-orange-700 border-orange-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
  };
  return (
    <div className={`rounded-xl p-3 border ${colorMap[color] || colorMap.blue}`}>
      <div className="flex items-center gap-1.5 mb-1">{icon}<span className="text-xs font-medium opacity-80">{label}</span></div>
      <p className="text-lg font-bold">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}

/* ─── Page ─── */

export default function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [store, setStore] = useState<StoreDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Tabs
  const [activeTab, setActiveTab] = useState<"veriler" | "urunler">("veriler");

  // Products tab state
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSort, setProductSort] = useState(3);
  const [productSortType, setProductSortType] = useState<"asc" | "desc">("desc");
  const [productsFetched, setProductsFetched] = useState(false);

  /* ─── Fetch store detail ─── */
  useEffect(() => {
    async function fetchStore() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/tiktok-shop", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ keyword: id, searchMode: "storeDetail" }),
        });
        const data = await res.json();
        const detail: StoreDetail | null = data.result?.data || data.data?.data || null;
        if (detail) {
          setStore(detail);
        } else {
          setError("Magaza bilgisi bulunamadi.");
        }
      } catch {
        setError("Magaza bilgileri yuklenirken hata olustu.");
      }
      setLoading(false);
    }
    fetchStore();
  }, [id]);

  /* ─── Fetch products when Urunler tab is opened ─── */
  useEffect(() => {
    if (activeTab !== "urunler" || !store || productsFetched) return;

    async function fetchProducts() {
      setProductsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/tiktok-shop", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            keyword: "",
            searchMode: "product",
            page: 1,
            pageSize: 20,
            productSort,
            sortType: productSortType,
            shopId: id,
          }),
        });
        const data = await res.json();
        const list = data.result?.data || data.data?.list || data.list || [];
        setProducts(list);
        setProductsFetched(true);
      } catch {
        /* ignore */
      }
      setProductsLoading(false);
    }
    fetchProducts();
  }, [activeTab, store, productsFetched, productSort, productSortType]);

  /* ─── Re-fetch products on sort change ─── */
  function handleProductSortChange(val: string) {
    const opt = PRODUCT_SORT_OPTIONS.find((o) => (o.id || String(o.value)) === val);
    if (!opt) return;
    setProductSort(opt.value);
    setProductSortType(opt.defaultType as "asc" | "desc");
    setProductsFetched(false); // triggers refetch
  }

  /* ─── Derived data ─── */
  const regionCodes = store?.region || [];
  const regionDisplay = regionCodes.map((r) => {
    const code = r.toUpperCase();
    return `${FLAG[code] || ""} ${COUNTRY_NAMES[code] || code}`;
  }).join(", ") || "-";

  const adPercent = store && store.product_count > 0
    ? ((store.product_ad_count / store.product_count) * 100).toFixed(2)
    : "0";

  // Marketing strategy data
  const totalSales = store?.sales_volume || 0;
  const totalGmv = store?.total_gmv_usd || 0;
  const adSales = store?.sales_ad_volume || 0;
  const adGmv = store?.ad_gmv_usd || 0;
  const organicSales = totalSales - adSales;
  const organicGmv = totalGmv - adGmv;
  const adSalesPercent = totalSales > 0 ? ((adSales / totalSales) * 100).toFixed(2) : "0";
  const organicSalesPercent = totalSales > 0 ? ((organicSales / totalSales) * 100).toFixed(2) : "0";

  // Chart data
  const salesChartData = [
    { name: "Son 7 Gun", value: store?.day7?.sales_volume || 0 },
    { name: "Son 30 Gun", value: store?.day30?.sales_volume || 0 },
    { name: "Toplam", value: store?.sales_volume || 0 },
  ];
  const gmvChartData = [
    { name: "Son 7 Gun", value: store?.day7?.total_gmv_usd || 0 },
    { name: "Son 30 Gun", value: store?.day30?.total_gmv_usd || 0 },
    { name: "Toplam", value: store?.total_gmv_usd || 0 },
  ];

  /* ─── Loading / Error states ─── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 size={32} className="animate-spin text-[#667eea] mb-3" />
        <p className="text-gray-500 text-sm">Magaza bilgileri yukleniyor...</p>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="max-w-lg mx-auto py-16">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#667eea]/10 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag size={28} className="text-[#667eea]" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Magaza Bulunamadi</h2>
          <p className="text-sm text-gray-500 mb-6">{error || "Bu magaza PiPiAds veritabaninda bulunamadi."}</p>
          <button
            onClick={() => router.push("/reklam-tara")}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 cursor-pointer"
          >
            <ArrowLeft size={14} /> Reklam Tara&apos;ya Don
          </button>
        </div>
      </div>
    );
  }

  /* ─── Main render ─── */
  return (
    <div className="max-w-7xl mx-auto">
      {/* Back navigation */}
      <button
        onClick={() => router.push("/reklam-tara")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 cursor-pointer"
      >
        <ArrowLeft size={16} /> TikTok Magaza / Magaza Detayi
      </button>

      {/* ═══ HEADER CARD ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-5">
          {/* Store image */}
          <div className="flex-shrink-0">
            {store.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={storeImg(store.image)}
                alt={store.title}
                className="w-16 h-16 rounded-lg object-cover border border-gray-100"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                <ShoppingBag size={28} className="text-gray-300" />
              </div>
            )}
          </div>

          {/* Store info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-xl font-bold text-gray-900">{store.title}</h1>
              <span className="text-xs bg-[#667eea]/10 text-[#667eea] px-2 py-0.5 rounded-full font-medium">TikTok Shop</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Ulke/Bolge:</span>
                <span className="font-medium">{regionDisplay} ({regionCodes.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Ortalama fiyat:</span>
                <span className="font-medium">{formatMoney(store.avg_price_usd)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Puan:</span>
                <span className="font-medium flex items-center gap-1">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  {store.score > 0 ? store.score.toFixed(1) : "-"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Ilk gorulme:</span>
                <span className="font-medium">{formatDate(store.found_time)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mt-4">
              <a
                href={`https://www.pipiads.com/tr/tiktok-shop-store/${store.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#667eea]/10 text-[#667eea] text-sm font-medium hover:bg-[#667eea]/20"
              >
                <ExternalLink size={14} /> PiPiAds
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ METRICS CARDS ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard
          label="Toplam Satis"
          value={formatCompact(store.sales_volume)}
          color="green"
          icon={<ShoppingBag size={14} />}
        />
        <MetricCard
          label="Toplam GMV"
          value={formatMoney(store.total_gmv_usd)}
          color="orange"
          icon={<TrendingUp size={14} />}
        />
        <MetricCard
          label="Satistaki Urunler"
          value={String(store.product_count || 0)}
          color="blue"
          icon={<Package size={14} />}
        />
        <MetricCard
          label="Reklamli Urunler"
          value={`${store.product_ad_count || 0} (${adPercent}%)`}
          color="purple"
          icon={<Megaphone size={14} />}
        />
      </div>

      {/* ═══ TAB BUTTONS ═══ */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("veriler")}
          className={`px-5 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${
            activeTab === "veriler"
              ? "gradient-accent text-white shadow-sm"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <BarChart3 size={14} className="inline mr-1.5 -mt-0.5" />
          Veriler
        </button>
        <button
          onClick={() => setActiveTab("urunler")}
          className={`px-5 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${
            activeTab === "urunler"
              ? "gradient-accent text-white shadow-sm"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Package size={14} className="inline mr-1.5 -mt-0.5" />
          Urunler
        </button>
      </div>

      {/* ═══ VERILER TAB ═══ */}
      {activeTab === "veriler" && (
        <div className="space-y-6">
          {/* Marketing strategy card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Pazarlama Stratejisi</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Siparisler / GMV</span>
                <span className="text-sm font-bold text-gray-900">
                  {formatCompact(totalSales)} / {formatMoney(totalGmv)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-purple-50 rounded-lg">
                <span className="text-sm text-purple-700">= Reklamlar ve influencerlar</span>
                <span className="text-sm font-medium text-purple-700">
                  {formatCompact(adSales)} / {formatMoney(adGmv)} ({adSalesPercent}%)
                </span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-blue-700">+ Alisveris merkezi ve digerleri</span>
                <span className="text-sm font-medium text-blue-700">
                  {formatCompact(organicSales)} / {formatMoney(organicGmv)} ({organicSalesPercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h4 className="text-sm font-semibold text-gray-700 mb-1">Satislar</h4>
              <p className="text-xl font-bold text-blue-600 mb-3">{formatCompact(store.sales_volume)}</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={salesChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <Tooltip formatter={(value) => formatCompact(Number(value))} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h4 className="text-sm font-semibold text-gray-700 mb-1">GMV</h4>
              <p className="text-xl font-bold text-emerald-600 mb-3">{formatMoney(store.total_gmv_usd)}</p>
              <ResponsiveContainer width="100%" height={200}>
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

          {/* Additional metrics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Detayli Metrikler</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard label="Goruntulenme" value={formatCompact(store.play_count)} color="cyan" icon={<Eye size={14} />} />
              <MetricCard label="Begenme" value={formatCompact(store.like_count)} color="pink" />
              <MetricCard label="Paylasim" value={formatCompact(store.share_count)} color="purple" />
              <MetricCard label="Yorum" value={formatCompact(store.comment_count)} color="amber" />
              <MetricCard label="Magaza Yorumu" value={formatCompact(store.store_comments)} color="gray" />
              <MetricCard label="Reklam Satislar" value={formatCompact(store.sales_ad_volume)} color="rose" />
              <MetricCard label="Reklam GMV" value={formatMoney(store.ad_gmv_usd)} color="orange" />
              <MetricCard label="Son Gorulme" value={formatDate(store.last_found_time)} color="gray" />
            </div>
          </div>

          {/* Best selling goods */}
          {store.best_selling_goods && store.best_selling_goods.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">En Cok Satan Urunler</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {store.best_selling_goods.map((item, i) => (
                  <div
                    key={item.product_id || i}
                    onClick={() => {
                      try { sessionStorage.setItem(`tts_shop_name_${item.product_id}`, store?.title || ""); } catch {}
                      window.open(`/tts/${item.product_id}`, "_blank");
                    }}
                    className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow border border-gray-100"
                  >
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={storeImg(item.image)}
                        alt="product"
                        className="w-full aspect-square rounded-lg object-cover mb-2"
                      />
                    ) : (
                      <div className="w-full aspect-square rounded-lg bg-gray-200 flex items-center justify-center mb-2">
                        <Package size={24} className="text-gray-400" />
                      </div>
                    )}
                    <p className="text-xs font-medium text-gray-700">
                      {formatCompact(item.sales_volume)} satis
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ URUNLER TAB ═══ */}
      {activeTab === "urunler" && (
        <div>
          {/* Sort dropdown */}
          <div className="mb-4">
            <select
              value={productSort === 2 && productSortType === "asc" ? "found_time_asc" : String(productSort)}
              onChange={(e) => handleProductSortChange(e.target.value)}
              className="py-2.5 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30"
            >
              {PRODUCT_SORT_OPTIONS.map((opt) => (
                <option key={opt.id || opt.value} value={opt.id || opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Loading */}
          {productsLoading && (
            <div className="flex items-center gap-2 py-12 justify-center">
              <Loader2 size={20} className="animate-spin text-[#667eea]" />
              <span className="text-sm text-gray-500">Urunler yukleniyor...</span>
            </div>
          )}

          {/* Empty state */}
          {!productsLoading && products.length === 0 && (
            <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200">
              <Package size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Bu magaza icin urun bulunamadi</p>
            </div>
          )}

          {/* Product table */}
          {!productsLoading && products.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Urun</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Fiyat</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Satislar</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">GMV</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Video</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Gosterim</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Tarih</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p, i) => (
                      <tr
                        key={p.id || i}
                        onClick={() => {
                          try { sessionStorage.setItem(`tts_shop_name_${p.id}`, store?.title || ""); } catch {}
                          window.open(`/tts/${p.id}`, "_blank");
                        }}
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {p.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={storeImg(p.image)}
                                alt={p.title || ""}
                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <Package size={16} className="text-gray-300" />
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-900 line-clamp-2 max-w-xs">
                              {p.title || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-sm font-medium text-gray-700">
                          {p.price_usd ? `$${Number(p.price_usd).toFixed(2)}` : p.price ? `$${Number(p.price).toFixed(2)}` : "-"}
                        </td>
                        <td className="py-3 px-4 text-right text-sm font-bold text-blue-600">
                          {formatCompact(p.sales_volume)}
                        </td>
                        <td className="py-3 px-4 text-right text-sm font-bold text-emerald-600">
                          {formatMoney(p.gmv_usd || p.gmv)}
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-gray-600">
                          {formatCompact(p.video_count)}
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-gray-600">
                          {formatCompact(p.play_count)}
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-gray-500">
                          {formatDate(p.found_time)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
