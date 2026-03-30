"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Loader2,
  ExternalLink,
  Play,
  Save,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  Share2,
  Eye,
  Star,
  ShoppingBag,
} from "lucide-react";
import { loadFolders, createFolder, saveBrandsBulk, type BrandData } from "@/lib/supabase";
import { useTikTokShop, type TTSProduct, type SearchMode } from "@/context/TikTokShopContext";
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

const PRODUCT_SORT_OPTIONS = [
  { value: "gmv", label: "GMV" },
  { value: "sales_volume", label: "Satışlar" },
  { value: "video_count", label: "Video Sayısı" },
  { value: "price", label: "Fiyat" },
  { value: "play_count", label: "Görüntülenme" },
];

const VIDEO_SORT_OPTIONS = [
  { value: 999, label: "En Populer" },
  { value: 1, label: "En Yeni" },
  { value: 2, label: "En Cok Izlenen" },
  { value: 3, label: "En Cok Begenilen" },
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
  const colors =
    value >= 7
      ? "bg-red-100 text-red-700"
      : value >= 4
      ? "bg-orange-100 text-orange-700"
      : "bg-yellow-100 text-yellow-700";
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${colors}`}>
      {"\uD83D\uDD25"} {value}/10
    </span>
  );
}

function toBrandDataProduct(product: TTSProduct): BrandData {
  return {
    Marka: product.shop_name,
    "Web Sitesi": product.landing_page,
    Kategori: product.seller_location,
    "AOV ($)": product.price_usd,
    "Ciro ($)": product.gmv_usd,
    "\u00D6ne \u00C7\u0131kan \u00D6zellik": product.title,
    "B\u00FCy\u00FCme Y\u00F6ntemi": "TikTok Shop",
    "Ayl\u0131k Trafik": product.play_count,
    Kaynak: "PiPiAds",
    "Video Say\u0131s\u0131": product.video_count,
    Sat\u0131slar: product.sales_volume,
    Cover: product.image,
    "\u00DClke": product.region,
    "PiPiAds Link": `https://www.pipiads.com/tr/tiktok-shop-product/${product.id}`,
  } as BrandData;
}

function toBrandDataVideo(product: TTSProduct): BrandData {
  return {
    Marka: product.shop_name,
    "Web Sitesi": product.shop_handle
      ? `https://www.tiktok.com/@${product.shop_handle}`
      : "",
    Kategori: product.category || product.tags?.[0] || "",
    "\u00D6ne \u00C7\u0131kan \u00D6zellik": product.hook || "",
    "B\u00FCy\u00FCme Y\u00F6ntemi": "TikTok Shop",
    "Pazarlama A\u00E7\u0131lar\u0131": product.tags?.join(", ") || "",
    Kaynak: "PiPiAds",
    "G\u00F6r\u00FCnt\u00FClenme": product.play_count,
    Cover: product.cover_image || product.image,
  } as BrandData;
}

export default function TTSPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    keyword,
    results,
    loading,
    error,
    page,
    totalPages,
    pageSize,
    sortBy,
    sortKey,
    searchMode,
    search,
    setKeyword,
    goToPage,
    setPageSize,
    setSortBy,
    setSortKey,
    setSearchMode,
    setSelectedProduct,
  } = useTikTokShop();

  const [localKeyword, setLocalKeyword] = useState("");
  const [localMode, setLocalMode] = useState<SearchMode>("product");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveProduct, setSaveProduct] = useState<TTSProduct | null>(null);
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    if (keyword) setLocalKeyword(keyword);
  }, [keyword]);

  useEffect(() => {
    setLocalMode(searchMode);
  }, [searchMode]);

  function handleSearch() {
    if (!localKeyword.trim()) return;
    doSearch(sortKey);
  }

  function doSearch(sk: string) {
    if (!localKeyword.trim()) return;
    setKeyword(localKeyword);
    setSearchMode(localMode);
    if (localMode === "product") {
      search(localKeyword, "product", pageSize, 1, sortBy, sk);
    } else {
      search(localKeyword, "video", pageSize, 1, sortBy, sk);
    }
  }

  async function openSaveModal(product: TTSProduct) {
    setSaveProduct(product);
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
    if (!folder || !saveProduct) return;

    try {
      if (newFolderName.trim()) await createFolder(newFolderName.trim(), user?.userId);
      const brandData = searchMode === "product"
        ? toBrandDataProduct(saveProduct)
        : toBrandDataVideo(saveProduct);
      const added = await saveBrandsBulk(folder, [brandData], user?.userId);
      setSaveMsg(`${added} marka kaydedildi!`);
      setTimeout(() => {
        setShowSaveModal(false);
        setSaveMsg("");
        setSaveProduct(null);
      }, 1200);
    } catch {
      setSaveMsg("Hata olustu!");
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">TikTok Shop</h1>
        <p className="text-gray-500 mt-1">
          PiPiAds ile TikTok Shop&apos;ta trend urunleri kesfet
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Keyword */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Anahtar Kelime
            </label>
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={localKeyword}
                onChange={(e) => setLocalKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="ornegin: led lamba, cilt bakim, kitchen gadget..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30 focus:border-[#667eea]"
              />
            </div>
          </div>

          {/* Search Mode Toggle */}
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Arama Modu
            </label>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setLocalMode("product")}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  localMode === "product"
                    ? "bg-[#667eea] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                Urunler
              </button>
              <button
                onClick={() => setLocalMode("video")}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  localMode === "video"
                    ? "bg-[#667eea] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                Videolar
              </button>
            </div>
          </div>

          {/* Sort */}
          <div className="w-44">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Siralama
            </label>
            {localMode === "product" ? (
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30"
              >
                {PRODUCT_SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(Number(e.target.value))}
                className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30"
              >
                {VIDEO_SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Page Size */}
          <div className="w-24">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sayfa
            </label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={loading || !localKeyword.trim()}
              className="gradient-accent text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              Ara
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="py-16 flex flex-col items-center">
          <Loader2 size={32} className="animate-spin text-[#667eea] mb-3" />
          <p className="text-gray-500 font-medium">PiPiAds&apos;ten sonuclar aliniyor...</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && !loading && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {results.length} sonuc bulundu (Sayfa {page}/{totalPages})
            </p>
          </div>

          {searchMode === "product" ? (
            <ProductTable
              results={results}
              onSave={openSaveModal}
              onDetail={(p: TTSProduct) => {
                setSelectedProduct(p);
                try { sessionStorage.setItem(`tts_product_${p.id}`, JSON.stringify(p)); } catch { /* ignore */ }
                router.push(`/tts/${p.id}`);
              }}
              sortKey={sortKey}
              onSort={(key: string) => { setSortKey(key); doSearch(key); }}
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map((product, i) => (
                <VideoCard
                  key={i}
                  product={product}
                  onSave={() => openSaveModal(product)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              Onceki
            </button>
            <span className="text-sm text-gray-500">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Sonraki
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && results.length === 0 && !error && keyword && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">Sonuc bulunamadi</p>
          <p className="text-sm mt-1">Farkli bir anahtar kelime deneyin</p>
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && saveProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Klasore Kaydet</h3>
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setSaveProduct(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              &quot;{saveProduct.title || saveProduct.product_name || saveProduct.shop_name}&quot;
            </p>

            {/* Existing folders */}
            {folders.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Mevcut Klasor
                </label>
                <select
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  className="w-full py-2 px-3 border border-gray-200 rounded-lg text-sm"
                >
                  {folders.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* New folder */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                veya Yeni Klasor
              </label>
              <div className="flex gap-2">
                <input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Yeni klasor adi..."
                  className="flex-1 py-2 px-3 border border-gray-200 rounded-lg text-sm"
                />
                <button
                  onClick={handleCreateFolder}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                >
                  Olustur
                </button>
              </div>
            </div>

            {saveMsg && (
              <p className="text-sm text-green-600 mb-3">{saveMsg}</p>
            )}

            <button
              onClick={handleSave}
              className="w-full gradient-accent text-white py-2.5 rounded-lg text-sm font-medium hover:opacity-90"
            >
              Kaydet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Product Table Component ---- */
function ProductTable({
  results,
  onSave,
  onDetail,
  sortKey,
  onSort,
}: {
  results: TTSProduct[];
  onSave: (p: TTSProduct) => void;
  onDetail: (p: TTSProduct) => void;
  sortKey: string;
  onSort: (key: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-500 w-12">#</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Ürün</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Mağaza</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500 cursor-pointer hover:text-[#667eea] select-none" onClick={() => { onSort("sales_volume"); }}>Satışlar {sortKey === "sales_volume" ? "↓" : ""}</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500 cursor-pointer hover:text-[#667eea] select-none" onClick={() => { onSort("gmv"); }}>GMV {sortKey === "gmv" ? "↓" : ""}</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500 cursor-pointer hover:text-[#667eea] select-none" onClick={() => { onSort("price"); }}>Fiyat {sortKey === "price" ? "↓" : ""}</th>
              <th className="text-center py-3 px-4 font-medium text-gray-500">Puan</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500 cursor-pointer hover:text-[#667eea] select-none" onClick={() => { onSort("video_count"); }}>Video {sortKey === "video_count" ? "↓" : ""}</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500 cursor-pointer hover:text-[#667eea] select-none" onClick={() => { onSort("play_count"); }}>Görüntülenme {sortKey === "play_count" ? "↓" : ""}</th>
              <th className="text-center py-3 px-4 font-medium text-gray-500">Ülke</th>
              <th className="text-center py-3 px-4 font-medium text-gray-500 w-20">Detay</th>
              <th className="text-center py-3 px-4 font-medium text-gray-500 w-20">Kaydet</th>
            </tr>
          </thead>
          <tbody>
            {results.map((product, i) => (
              <tr
                key={product.id || i}
                className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
              >
                {/* Index */}
                <td className="py-3 px-4 text-gray-400 text-xs">{i + 1}</td>

                {/* Product: image + title */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3 min-w-[200px]">
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <ShoppingBag size={16} className="text-gray-300" />
                      </div>
                    )}
                    <button
                      onClick={() => onDetail(product)}
                      className="text-sm font-medium text-gray-900 hover:text-[#667eea] line-clamp-2 transition-colors text-left cursor-pointer"
                      title={product.title}
                    >
                      {product.title?.length > 60
                        ? product.title.substring(0, 60) + "..."
                        : product.title || "Bilinmeyen"}
                    </button>
                  </div>
                </td>

                {/* Shop */}
                <td className="py-3 px-4">
                  <a
                    href={`https://www.pipiads.com/tr/tiktok-shop-product/${product.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 min-w-[120px] hover:text-[#667eea] transition-colors"
                  >
                    {product.shop_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.shop_image}
                        alt={product.shop_name}
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex-shrink-0" />
                    )}
                    <span className="text-xs text-gray-600 truncate max-w-[100px]">
                      {product.shop_name || "-"}
                    </span>
                  </a>
                </td>

                {/* Sales */}
                <td className="py-3 px-4 text-right font-medium text-gray-700">
                  {formatCompact(product.sales_volume)}
                </td>

                {/* GMV */}
                <td className="py-3 px-4 text-right font-bold text-emerald-600">
                  {formatMoney(product.gmv_usd)}
                </td>

                {/* Price */}
                <td className="py-3 px-4 text-right text-gray-700">
                  ${product.price_usd.toFixed(2)}
                </td>

                {/* Score */}
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-0.5 text-xs">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    <span className="text-gray-700">{product.score > 0 ? product.score.toFixed(1) : "-"}</span>
                  </span>
                </td>

                {/* Video count */}
                <td className="py-3 px-4 text-right text-gray-600">
                  {formatCompact(product.video_count)}
                </td>

                {/* Play count */}
                <td className="py-3 px-4 text-right text-gray-600">
                  {formatCompact(product.play_count)}
                </td>

                {/* Region */}
                <td className="py-3 px-4 text-center text-lg">
                  {FLAG[product.region?.toUpperCase()] || product.region || "-"}
                </td>

                {/* Detail button */}
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => onDetail(product)}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-[#667eea] transition-colors"
                    title="Detay"
                  >
                    <Eye size={14} />
                  </button>
                </td>

                {/* Save button */}
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => onSave(product)}
                    className="p-1.5 rounded-lg border border-[#667eea]/30 text-[#667eea] hover:bg-[#667eea]/5 transition-colors"
                    title="Kaydet"
                  >
                    <Save size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---- Video Card Component (for video mode) ---- */
function VideoCard({
  product,
  onSave,
}: {
  product: TTSProduct;
  onSave: () => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      {/* Cover Image */}
      <div className="relative aspect-[9/16] bg-gray-100 flex-shrink-0">
        {(product.cover_image || product.image) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.cover_image || product.image}
            alt={product.hook || product.product_name || product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Play size={48} />
          </div>
        )}
        {/* Play overlay */}
        {product.video_url && (
          <a
            href={product.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
          >
            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
              <Play size={24} className="text-gray-900 ml-1" />
            </div>
          </a>
        )}
        {/* Top left: Region flag */}
        {product.region && (
          <div className="absolute top-2 left-2 text-lg drop-shadow">
            {FLAG[product.region.toUpperCase()] || product.region}
          </div>
        )}
        {/* Top right: Hot badge */}
        {(product.hot_value || 0) > 0 && (
          <div className="absolute top-2 right-2">
            <HotBadge value={product.hot_value || 0} />
          </div>
        )}
        {/* Bottom left: Duration badge */}
        {(product.duration || 0) > 0 && (
          <div className="absolute bottom-2 left-2">
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/60 text-white flex items-center gap-1">
              <Clock size={10} />
              {formatDuration(product.duration || 0)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1">
        {/* Hook / Product name */}
        <p className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1.5 leading-snug">
          {product.hook || product.product_name || product.title || "Bilinmeyen"}
        </p>

        {/* Shop info */}
        <div className="mb-2">
          <p className="text-xs text-gray-500 truncate">
            {product.shop_name || "Bilinmeyen"}
          </p>
          {product.shop_handle && (
            <a
              href={`https://www.tiktok.com/@${product.shop_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#667eea] hover:underline flex items-center gap-1 mt-0.5"
            >
              @{product.shop_handle}
              <ExternalLink size={10} />
            </a>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-gray-500 mb-2">
          <span>{"\u25B6\uFE0F"} {formatCompact(product.play_count)}</span>
          <span>{"\u2764\uFE0F"} {formatCompact(product.like_count)}</span>
          <span>{"\uD83D\uDCAC"} {formatCompact(product.comment_count)}</span>
          <span className="flex items-center gap-0.5"><Share2 size={10} /> {formatCompact(product.share_count)}</span>
        </div>

        {/* Tags as colorful pills */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {product.tags.slice(0, 4).map((tag, i) => (
              <span
                key={i}
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${TAG_COLORS[i % TAG_COLORS.length]}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Save button */}
        <button
          onClick={onSave}
          className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[#667eea]/30 text-[#667eea] text-xs font-medium hover:bg-[#667eea]/5 transition-colors"
        >
          <Save size={12} />
          Kaydet
        </button>
      </div>
    </div>
  );
}
