"use client";

import { useState } from "react";
import {
  Search,
  Loader2,
  ExternalLink,
  Download,
  Package,
  DollarSign,
  Star,
  TrendingUp,
  BarChart3,
  Calculator,
  ShoppingCart,
  Save,
  X,
  CheckSquare,
  Square,
} from "lucide-react";
import { useAmazon, type AmazonProduct } from "@/context/AmazonContext";
import { useAuth } from "@/context/AuthContext";
import { loadFolders, createFolder, saveBrandsBulk, type BrandData } from "@/lib/supabase";
import {
  estimateMonthlySales,
  estimateRevenue,
  salesTier,
  salesTierColor,
  getCategories,
} from "@/lib/bsr";

function toBrandDataAmazon(p: AmazonProduct): BrandData {
  return {
    Marka: p.brand || p.title.split(" ").slice(0, 3).join(" "),
    "Web Sitesi": p.url,
    Kategori: p.category,
    "AOV ($)": p.price,
    "Öne Çıkan Özellik": p.title,
    "Büyüme Yöntemi": "Amazon",
    Kaynak: "Amazon",
    BSR: p.bsr,
    "Aylik Satis": p.monthlySales,
    "Ciro ($)": p.monthlyRevenue,
    Puan: p.rating,
    "Yorum Sayisi": p.reviewCount,
    ASIN: p.asin,
    Prime: p.isPrime,
    Cover: p.image,
  } as BrandData;
}

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

type Tab = "product" | "brand" | "calculator";
type SortKey = "monthlyRevenue" | "monthlySales" | "bsr" | "price" | "reviewCount" | "rating";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "monthlyRevenue", label: "Aylik Gelir" },
  { value: "monthlySales", label: "Aylik Satis" },
  { value: "bsr", label: "BSR" },
  { value: "price", label: "Fiyat" },
  { value: "reviewCount", label: "Yorum" },
  { value: "rating", label: "Puan" },
];

function TierBadge({ tier }: { tier: string }) {
  if (tier === "-") return <span className="text-gray-400 text-xs">-</span>;
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${salesTierColor(tier)}`}>
      {tier}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub }: {
  icon: typeof Package;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={16} className="text-[#667eea]" />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function ProductRow({ product, rank }: { product: AmazonProduct; rank: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Rank */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-500">#{rank}</span>
        </div>

        {/* Image */}
        {product.image && (
          <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-50">
            <img src={product.image} alt="" className="w-full h-full object-contain" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{product.title}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {product.brand && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{product.brand}</span>
                )}
                {product.asin && (
                  <span className="text-[10px] text-gray-400 font-mono">{product.asin}</span>
                )}
                {product.isPrime && (
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Prime</span>
                )}
                <TierBadge tier={product.tier} />
              </div>
            </div>
            {product.url && (
              <a href={product.url} target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0 text-gray-400 hover:text-[#667eea] transition-colors">
                <ExternalLink size={16} />
              </a>
            )}
          </div>

          {/* Metrics row */}
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</p>
              <p className="text-[10px] text-gray-400">Fiyat</p>
            </div>
            {product.rating > 0 && (
              <div className="text-center">
                <p className="text-sm font-bold text-amber-600 flex items-center gap-0.5">
                  <Star size={12} fill="currentColor" /> {product.rating}
                </p>
                <p className="text-[10px] text-gray-400">{formatCompact(product.reviewCount)} yorum</p>
              </div>
            )}
            {product.bsr > 0 && (
              <div className="text-center">
                <p className="text-sm font-bold text-gray-700">#{formatCompact(product.bsr)}</p>
                <p className="text-[10px] text-gray-400">BSR</p>
              </div>
            )}
            {product.monthlySales > 0 && (
              <div className="text-center">
                <p className="text-sm font-bold text-emerald-600">{formatCompact(product.monthlySales)}</p>
                <p className="text-[10px] text-gray-400">Aylik Satis</p>
              </div>
            )}
            {product.monthlyRevenue > 0 && (
              <div className="text-center">
                <p className="text-sm font-bold text-[#667eea]">{formatMoney(product.monthlyRevenue)}</p>
                <p className="text-[10px] text-gray-400">Aylik Gelir</p>
              </div>
            )}
            {product.category && (
              <div className="text-center">
                <p className="text-xs text-gray-600 max-w-[120px] truncate">{product.category}</p>
                <p className="text-[10px] text-gray-400">Kategori</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BsrCalculator() {
  const [bsr, setBsr] = useState(1000);
  const [price, setPrice] = useState(25);
  const [category, setCategory] = useState("All Departments");

  const sales = estimateMonthlySales(bsr, category);
  const revenue = estimateRevenue(bsr, price, category);
  const tier = salesTier(sales);
  const categories = getCategories();

  const refBsrs = [1, 50, 100, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calculator size={18} className="text-[#667eea]" />
          BSR Hesaplayici
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Bir urunun BSR degerini girerek tahmini aylik satisi hesaplayin.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">BSR (Best Sellers Rank)</label>
            <input
              type="number"
              value={bsr}
              onChange={(e) => setBsr(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30 focus:border-[#667eea]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Urun Fiyati ($)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
              step="0.5"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30 focus:border-[#667eea]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30 focus:border-[#667eea]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Result cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={ShoppingCart} label="Aylik Satis" value={formatCompact(sales)} />
          <StatCard icon={DollarSign} label="Aylik Gelir" value={formatMoney(revenue)} />
          <StatCard icon={TrendingUp} label="Yillik Gelir" value={formatMoney(revenue * 12)} />
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={16} className="text-[#667eea]" />
              <span className="text-xs text-gray-500">Seviye</span>
            </div>
            <div className="mt-1">
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${salesTierColor(tier)}`}>
                {tier}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reference table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-1">BSR Referans Tablosu</h3>
        <p className="text-xs text-gray-500 mb-4">{category} - ${price.toFixed(0)} fiyat ile</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">BSR</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Aylik Satis</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Aylik Gelir</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Yillik Gelir</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-gray-500">Seviye</th>
              </tr>
            </thead>
            <tbody>
              {refBsrs.map((b) => {
                const s = estimateMonthlySales(b, category);
                const r = estimateRevenue(b, price, category);
                const t = salesTier(s);
                return (
                  <tr key={b} className={`border-b border-gray-100 ${b === bsr ? "bg-[#667eea]/5" : ""}`}>
                    <td className="py-2 px-3 font-mono text-gray-700">#{b.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-medium">{s.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-medium text-[#667eea]">{formatMoney(r)}</td>
                    <td className="py-2 px-3 text-right text-gray-600">{formatMoney(r * 12)}</td>
                    <td className="py-2 px-3 text-center"><TierBadge tier={t} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function downloadCSV(products: AmazonProduct[], keyword: string) {
  const headers = ["ASIN", "Urun Adi", "Marka", "Fiyat ($)", "Puan", "Yorum", "BSR", "Kategori", "Aylik Satis", "Aylik Gelir ($)", "Seviye", "Prime", "URL"];
  const rows = products.map((p) => [
    p.asin, `"${p.title.replace(/"/g, '""')}"`, p.brand, p.price, p.rating, p.reviewCount,
    p.bsr, `"${p.category}"`, p.monthlySales, p.monthlyRevenue, p.tier,
    p.isPrime ? "Evet" : "-", p.url,
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Amazon_${keyword.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AmazonPage() {
  const { keyword, results, loading, error, search, setKeyword } = useAmazon();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("product");
  const [localKeyword, setLocalKeyword] = useState("");
  const [maxItems, setMaxItems] = useState(30);
  const [sortKey, setSortKey] = useState<SortKey>("monthlyRevenue");

  // Selection
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  // Save modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedProducts.size === results.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(results.map((p) => p.asin || p.title)));
    }
  };

  async function openSaveModal() {
    setShowSaveModal(true);
    setSaveMsg("");
    try {
      const f = await loadFolders(user?.userId);
      setFolders(f);
      if (f.length > 0 && !selectedFolder) setSelectedFolder(f[0]);
    } catch { setFolders(["Genel"]); }
  }

  async function handleSave() {
    const folder = newFolderName.trim() || selectedFolder;
    if (!folder) return;
    try {
      if (newFolderName.trim()) await createFolder(newFolderName.trim(), user?.userId);
      const productsToSave = selectedProducts.size > 0
        ? results.filter((p) => selectedProducts.has(p.asin || p.title))
        : results;
      const brandData = productsToSave.map(toBrandDataAmazon);
      const added = await saveBrandsBulk(folder, brandData, user?.userId);
      setSaveMsg(`${added} urun kaydedildi!`);
      setTimeout(() => { setShowSaveModal(false); setSaveMsg(""); setSelectedProducts(new Set()); }, 1200);
    } catch { setSaveMsg("Hata olustu!"); }
  }

  const handleSearch = () => {
    if (!localKeyword.trim()) return;
    setKeyword(localKeyword);
    search(localKeyword, tab === "brand" ? "brand" : "product", maxItems);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  // Sort results
  const sortedResults = [...results].sort((a, b) => {
    if (sortKey === "bsr") return (a.bsr || 999999) - (b.bsr || 999999); // BSR: lower is better
    return (b[sortKey] || 0) - (a[sortKey] || 0);
  });

  // Summary stats
  const withPrice = results.filter((p) => p.price > 0);
  const withBsr = results.filter((p) => p.bsr > 0);
  const withRevenue = results.filter((p) => p.monthlyRevenue > 0);
  const avgPrice = withPrice.length > 0 ? withPrice.reduce((s, p) => s + p.price, 0) / withPrice.length : 0;
  const avgRevenue = withRevenue.length > 0 ? withRevenue.reduce((s, p) => s + p.monthlyRevenue, 0) / withRevenue.length : 0;
  const totalRevenue = withRevenue.reduce((s, p) => s + p.monthlyRevenue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Amazon Arastirma</h1>
        <p className="text-sm text-gray-500 mt-1">Amazon.com urun ve marka arastirmasi - BSR bazli satis tahmini</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: "product" as Tab, label: "Urun Arama", icon: Search },
          { key: "brand" as Tab, label: "Marka Arama", icon: Package },
          { key: "calculator" as Tab, label: "BSR Hesaplayici", icon: Calculator },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? "bg-white text-[#667eea] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Calculator tab */}
      {tab === "calculator" && <BsrCalculator />}

      {/* Search tabs (product + brand) */}
      {tab !== "calculator" && (
        <>
          {/* Search bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={localKeyword}
                  onChange={(e) => setLocalKeyword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    tab === "brand"
                      ? "Marka adi girin... (orn: Anker, COSRX, Stanley)"
                      : "Anahtar kelime girin... (orn: yoga mat, wireless earbuds)"
                  }
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30 focus:border-[#667eea]"
                />
              </div>
              <select
                value={maxItems}
                onChange={(e) => setMaxItems(parseInt(e.target.value))}
                className="px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30"
              >
                {[20, 30, 50].map((n) => (
                  <option key={n} value={n}>{n} sonuc</option>
                ))}
              </select>
              <button
                onClick={handleSearch}
                disabled={loading || !localKeyword.trim()}
                className="px-6 py-2.5 bg-[#667eea] text-white rounded-lg text-sm font-medium hover:bg-[#5a6fd6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                {tab === "brand" ? "Markayi Ara" : "Amazon'da Ara"}
              </button>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 shadow-sm text-center">
              <Loader2 size={32} className="animate-spin text-[#667eea] mx-auto mb-3" />
              <p className="text-sm text-gray-600">Amazon&apos;da aranıyor... (30-60 saniye surebilir)</p>
              <p className="text-xs text-gray-400 mt-1">Apify actor calisiyor</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Results */}
          {!loading && results.length > 0 && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatCard icon={Package} label="Toplam Urun" value={String(results.length)} />
                <StatCard icon={DollarSign} label="Ort. Fiyat" value={`$${avgPrice.toFixed(2)}`} />
                <StatCard icon={Star} label="BSR Verisi" value={`${withBsr.length}/${results.length}`} />
                <StatCard icon={TrendingUp} label="Ort. Aylik Gelir" value={formatMoney(avgRevenue)} />
                <StatCard icon={BarChart3} label="Toplam Pazar" value={formatMoney(totalRevenue)} sub="aylik tahmini" />
              </div>

              {/* Sort + export */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Sirala:</span>
                  <select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value as SortKey)}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#667eea]/30"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => downloadCSV(sortedResults, keyword)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download size={14} />
                  CSV Indir
                </button>
              </div>

              {/* Product list */}
              <div className="space-y-3">
                {sortedResults.map((product, i) => (
                  <ProductRow key={product.asin || i} product={product} rank={i + 1} />
                ))}
              </div>
            </>
          )}

          {/* Empty state */}
          {!loading && !error && results.length === 0 && keyword && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 shadow-sm text-center">
              <Package size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Sonuc bulunamadi</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
