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
  Bookmark,
  X,
  CheckSquare,
  Square,
  Globe,
  ArrowUp,
  ArrowDown,
  Minus,
  KeyRound,
} from "lucide-react";
import {
  useHacimler,
  type AmazonProduct,
  type KeywordVolume,
  type TopWebsite,
} from "@/context/HacimlerContext";
import { useAuth } from "@/context/AuthContext";
import { loadFolders, createFolder, saveBrandsBulk, type BrandData } from "@/lib/supabase";
import {
  estimateMonthlySales,
  estimateRevenue,
  salesTier,
  salesTierColor,
  getCategories,
} from "@/lib/bsr";

// ── Helpers ────────────────────────────────────────────────────────────────

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

// ── Types ──────────────────────────────────────────────────────────────────

type Tab = "amazon" | "keywords" | "websites";
type SortKey = "monthlyRevenue" | "monthlySales" | "bsr" | "price" | "reviewCount" | "rating";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "monthlyRevenue", label: "Aylik Gelir" },
  { value: "monthlySales", label: "Aylik Satis" },
  { value: "bsr", label: "BSR" },
  { value: "price", label: "Fiyat" },
  { value: "reviewCount", label: "Yorum" },
  { value: "rating", label: "Puan" },
];

// ── Shared Components ──────────────────────────────────────────────────────

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

// ── Amazon Product Row ─────────────────────────────────────────────────────

function ProductRow({ product, rank, selected, onToggle }: { product: AmazonProduct; rank: number; selected?: boolean; onToggle?: () => void }) {
  return (
    <div className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow ${selected ? "ring-2 ring-[#667eea] border-[#667eea]/30 bg-[#667eea]/5" : "border-gray-200"}`}>
      <div className="flex gap-4">
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          {onToggle && (
            <button onClick={onToggle} className="text-gray-400 hover:text-gray-600">
              {selected ? <CheckSquare size={16} className="text-[#667eea]" /> : <Square size={16} />}
            </button>
          )}
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-500">#{rank}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{product.title}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {product.brand && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{product.brand}</span>}
                {product.asin && <span className="text-[10px] text-gray-400 font-mono">{product.asin}</span>}
                {product.isPrime && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Prime</span>}
                <TierBadge tier={product.tier} />
              </div>
            </div>
            {product.url && (
              <a href={product.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 text-gray-400 hover:text-[#667eea] transition-colors">
                <ExternalLink size={16} />
              </a>
            )}
          </div>
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</p>
              <p className="text-[10px] text-gray-400">Fiyat</p>
            </div>
            {product.rating > 0 && (
              <div className="text-center">
                <p className="text-sm font-bold text-amber-600 flex items-center gap-0.5"><Star size={12} fill="currentColor" /> {product.rating}</p>
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

// ── Keyword Volume Card ────────────────────────────────────────────────────

function KeywordCard({ kw, maxVolume }: { kw: KeywordVolume; maxVolume: number }) {
  const barWidth = maxVolume > 0 ? Math.max(5, (kw.monthlyVolume / maxVolume) * 100) : 0;
  const TrendIcon = kw.trend === "up" ? ArrowUp : kw.trend === "down" ? ArrowDown : Minus;
  const trendColor = kw.trend === "up" ? "text-emerald-600" : kw.trend === "down" ? "text-red-500" : "text-gray-400";
  const difficultyColor = kw.difficulty >= 70 ? "bg-red-100 text-red-700" : kw.difficulty >= 40 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">{kw.keyword}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${difficultyColor}`}>
              Zorluk: {kw.difficulty}/100
            </span>
            <span className="text-[10px] text-gray-500">CPC: ${kw.cpc.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <TrendIcon size={14} className={trendColor} />
          <span className={`text-xs font-medium ${trendColor}`}>
            {kw.trend === "up" ? "Yukselis" : kw.trend === "down" ? "Dusus" : "Stabil"}
          </span>
        </div>
      </div>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#667eea] rounded-full transition-all" style={{ width: `${barWidth}%` }} />
          </div>
        </div>
        <span className="text-lg font-bold text-gray-900 flex-shrink-0">{formatCompact(kw.monthlyVolume)}</span>
      </div>
      <p className="text-[10px] text-gray-400 mt-1">aylik arama hacmi</p>
    </div>
  );
}

// ── Website Card ───────────────────────────────────────────────────────────

function WebsiteCard({ site }: { site: TopWebsite }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-[#667eea]/10 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-[#667eea]">#{site.rank}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-gray-900">{site.brandName}</h3>
            <a href={`https://${site.domain}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#667eea] transition-colors flex-shrink-0">
              <ExternalLink size={14} />
            </a>
          </div>
          <a href={`https://${site.domain}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
            {site.domain}
          </a>
          <div className="flex items-center gap-3 mt-2">
            <div>
              <p className="text-lg font-bold text-[#667eea]">{formatCompact(site.monthlyTraffic)}</p>
              <p className="text-[10px] text-gray-400">aylik trafik</p>
            </div>
            {site.category && (
              <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{site.category}</span>
            )}
          </div>
          {site.description && (
            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{site.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── BSR Calculator ─────────────────────────────────────────────────────────

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">BSR (Best Sellers Rank)</label>
            <input type="number" value={bsr} onChange={(e) => setBsr(Math.max(1, parseInt(e.target.value) || 1))} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30 focus:border-[#667eea]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Urun Fiyati ($)</label>
            <input type="number" value={price} onChange={(e) => setPrice(Math.max(0.01, parseFloat(e.target.value) || 0.01))} step="0.5" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30 focus:border-[#667eea]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Kategori</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30 focus:border-[#667eea]">
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={ShoppingCart} label="Aylik Satis" value={formatCompact(sales)} />
          <StatCard icon={DollarSign} label="Aylik Gelir" value={formatMoney(revenue)} />
          <StatCard icon={TrendingUp} label="Yillik Gelir" value={formatMoney(revenue * 12)} />
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1"><BarChart3 size={16} className="text-[#667eea]" /><span className="text-xs text-gray-500">Seviye</span></div>
            <div className="mt-1"><span className={`text-sm font-bold px-3 py-1 rounded-full ${salesTierColor(tier)}`}>{tier}</span></div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-1">BSR Referans Tablosu</h3>
        <p className="text-xs text-gray-500 mb-4">{category} - ${price.toFixed(0)} fiyat ile</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">BSR</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Aylik Satis</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Aylik Gelir</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Yillik Gelir</th>
              <th className="text-center py-2 px-3 text-xs font-medium text-gray-500">Seviye</th>
            </tr></thead>
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

// ── CSV Export ──────────────────────────────────────────────────────────────

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
  a.download = `Hacimler_${keyword.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function HacimlerPage() {
  const { keyword, amazonResults, keywordResults, websiteResults, loading, error, search, setKeyword } = useHacimler();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("amazon");
  const [localKeyword, setLocalKeyword] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("monthlyRevenue");

  // Selection
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  // Save modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  // BSR calculator toggle
  const [showBsr, setShowBsr] = useState(false);

  const hasResults = amazonResults.length > 0 || keywordResults.length > 0 || websiteResults.length > 0;

  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedProducts.size === amazonResults.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(amazonResults.map((p) => p.asin || p.title)));
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
        ? amazonResults.filter((p) => selectedProducts.has(p.asin || p.title))
        : amazonResults;
      const brandData = productsToSave.map(toBrandDataAmazon);
      const added = await saveBrandsBulk(folder, brandData, user?.userId);
      setSaveMsg(`${added} urun kaydedildi!`);
      setTimeout(() => { setShowSaveModal(false); setSaveMsg(""); setSelectedProducts(new Set()); }, 1200);
    } catch { setSaveMsg("Hata olustu!"); }
  }

  const handleSearch = () => {
    if (!localKeyword.trim()) return;
    setKeyword(localKeyword);
    search(localKeyword);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  // Amazon sort + stats
  const sortedAmazon = [...amazonResults].sort((a, b) => {
    if (sortKey === "bsr") return (a.bsr || 999999) - (b.bsr || 999999);
    return (b[sortKey] || 0) - (a[sortKey] || 0);
  });
  const withPrice = amazonResults.filter((p) => p.price > 0);
  const withBsr = amazonResults.filter((p) => p.bsr > 0);
  const withRevenue = amazonResults.filter((p) => p.monthlyRevenue > 0);
  const avgPrice = withPrice.length > 0 ? withPrice.reduce((s, p) => s + p.price, 0) / withPrice.length : 0;
  const avgRevenue = withRevenue.length > 0 ? withRevenue.reduce((s, p) => s + p.monthlyRevenue, 0) / withRevenue.length : 0;
  const totalRevenue = withRevenue.reduce((s, p) => s + p.monthlyRevenue, 0);
  const maxVolume = keywordResults.length > 0 ? Math.max(...keywordResults.map((k) => k.monthlyVolume)) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hacimler</h1>
        <p className="text-sm text-gray-500 mt-1">Bir anahtar kelime gir - Amazon, Google arama hacimleri ve top websiteleri gor</p>
      </div>

      {/* Search bar (shared across all tabs) */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={localKeyword}
              onChange={(e) => setLocalKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Anahtar kelime girin... (orn: yoga mat, wireless earbuds, skincare)"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30 focus:border-[#667eea]"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !localKeyword.trim()}
            className="px-6 py-2.5 bg-[#667eea] text-white rounded-lg text-sm font-medium hover:bg-[#5a6fd6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Ara
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 shadow-sm text-center">
          <Loader2 size={32} className="animate-spin text-[#667eea] mx-auto mb-3" />
          <p className="text-sm text-gray-600">Veriler analiz ediliyor... (15-30 saniye)</p>
          <p className="text-xs text-gray-400 mt-1">Amazon, Google Keywords ve Top Websiteler</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Tabs + Results */}
      {!loading && hasResults && (
        <>
          {/* Tab bar with result counts */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            {[
              { key: "amazon" as Tab, label: "Amazon", icon: ShoppingCart, count: amazonResults.length },
              { key: "keywords" as Tab, label: "Anahtar Kelimeler", icon: KeyRound, count: keywordResults.length },
              { key: "websites" as Tab, label: "Top Websiteler", icon: Globe, count: websiteResults.length },
            ].map(({ key, label, icon: Icon, count }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === key ? "bg-white text-[#667eea] shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon size={16} />
                {label}
                {count > 0 && <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{count}</span>}
              </button>
            ))}
          </div>

          {/* ── Amazon Tab ────────────────────────────────────── */}
          {tab === "amazon" && amazonResults.length > 0 && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatCard icon={Package} label="Toplam Urun" value={String(amazonResults.length)} />
                <StatCard icon={DollarSign} label="Ort. Fiyat" value={`$${avgPrice.toFixed(2)}`} />
                <StatCard icon={Star} label="BSR Verisi" value={`${withBsr.length}/${amazonResults.length}`} />
                <StatCard icon={TrendingUp} label="Ort. Aylik Gelir" value={formatMoney(avgRevenue)} />
                <StatCard icon={BarChart3} label="Toplam Pazar" value={formatMoney(totalRevenue)} sub="aylik tahmini" />
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <button onClick={toggleAll} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    {selectedProducts.size === amazonResults.length ? <CheckSquare size={14} className="text-[#667eea]" /> : <Square size={14} />}
                    {selectedProducts.size > 0 ? `${selectedProducts.size} secili` : "Tumunu Sec"}
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Sirala:</span>
                    <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#667eea]/30">
                      {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={openSaveModal} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#667eea] rounded-lg hover:bg-[#5a6fd6] transition-colors">
                    <Bookmark size={14} />
                    {selectedProducts.size > 0 ? `${selectedProducts.size} Urun Kaydet` : "Tumunu Kaydet"}
                  </button>
                  <button onClick={() => downloadCSV(sortedAmazon, keyword)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Download size={14} /> CSV
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {sortedAmazon.map((product, i) => (
                  <ProductRow key={product.asin || i} product={product} rank={i + 1} selected={selectedProducts.has(product.asin || product.title)} onToggle={() => toggleProduct(product.asin || product.title)} />
                ))}
              </div>

              {/* BSR Calculator collapsible */}
              <div className="border-t border-gray-200 pt-4">
                <button onClick={() => setShowBsr(!showBsr)} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#667eea] transition-colors">
                  <Calculator size={16} />
                  BSR Hesaplayici {showBsr ? "▲" : "▼"}
                </button>
                {showBsr && <div className="mt-4"><BsrCalculator /></div>}
              </div>
            </>
          )}

          {/* ── Keywords Tab ──────────────────────────────────── */}
          {tab === "keywords" && (
            <>
              {keywordResults.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <StatCard icon={KeyRound} label="Anahtar Kelime" value={String(keywordResults.length)} />
                    <StatCard icon={TrendingUp} label="Top Hacim" value={formatCompact(maxVolume)} sub="aylik arama" />
                    <StatCard icon={DollarSign} label="Ort. CPC" value={`$${(keywordResults.reduce((s, k) => s + k.cpc, 0) / keywordResults.length).toFixed(2)}`} />
                  </div>
                  <div className="space-y-3">
                    {keywordResults.map((kw, i) => (
                      <KeywordCard key={i} kw={kw} maxVolume={maxVolume} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-12 shadow-sm text-center">
                  <KeyRound size={40} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Anahtar kelime verisi bulunamadi</p>
                </div>
              )}
            </>
          )}

          {/* ── Websites Tab ─────────────────────────────────── */}
          {tab === "websites" && (
            <>
              {websiteResults.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <StatCard icon={Globe} label="Top Website" value={String(websiteResults.length)} />
                    <StatCard icon={TrendingUp} label="Top Trafik" value={formatCompact(Math.max(...websiteResults.map((w) => w.monthlyTraffic)))} sub="aylik ziyaret" />
                    <StatCard icon={BarChart3} label="Toplam Trafik" value={formatCompact(websiteResults.reduce((s, w) => s + w.monthlyTraffic, 0))} />
                  </div>
                  <div className="space-y-3">
                    {websiteResults.map((site, i) => (
                      <WebsiteCard key={i} site={site} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-12 shadow-sm text-center">
                  <Globe size={40} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Website verisi bulunamadi</p>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <ShoppingCart size={18} className="text-[#FF9900]" />
                Amazon Urunlerini Kaydet
              </h3>
              <button onClick={() => setShowSaveModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {selectedProducts.size > 0 ? `${selectedProducts.size} urun secildi` : `${amazonResults.length} urun kaydedilecek`}
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
              <input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Yeni klasor adi..." className="w-full py-2 px-3 border border-gray-200 rounded-lg text-sm" />
            </div>
            {saveMsg && <p className="text-sm text-green-600 mb-3">{saveMsg}</p>}
            <button onClick={handleSave} className="w-full bg-[#667eea] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#5a6fd6] transition-colors">Kaydet</button>
          </div>
        </div>
      )}
    </div>
  );
}
