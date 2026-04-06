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
  KeyRound,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  useHacimler,
  type AmazonProduct,
  type KeywordVolume,
  type TopWebsite,
} from "@/context/HacimlerContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
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

import { getChartColors, getGlowMap } from "@/lib/chart-colors";

// ── Types ──────────────────────────────────────────────────────────────────

type Tab = "amazon" | "hacimler";
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
  if (tier === "-") return <span className="text-text-muted text-xs">-</span>;
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${salesTierColor(tier)}`}>{tier}</span>;
}

function StatCard({ icon: Icon, label, value, sub }: { icon: typeof Package; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-bg-card rounded-[14px] border border-border-default p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={16} className="text-accent" />
        <span className="text-xs text-text-secondary">{label}</span>
      </div>
      <p className="text-xl font-bold text-text-primary">{value}</p>
      {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Amazon Product Row ─────────────────────────────────────────────────────

function ProductRow({ product, rank, selected, onToggle }: { product: AmazonProduct; rank: number; selected?: boolean; onToggle?: () => void }) {
  return (
    <div className={`bg-bg-card rounded-[14px] border p-4 shadow-sm hover:shadow-md transition-shadow ${selected ? "ring-2 ring-accent border-accent/30 bg-accent/5" : "border-border-default"}`}>
      <div className="flex gap-4">
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          {onToggle && (
            <button onClick={onToggle} className="text-text-muted hover:text-text-secondary">
              {selected ? <CheckSquare size={16} className="text-accent" /> : <Square size={16} />}
            </button>
          )}
          <div className="w-8 h-8 rounded-full bg-bg-hover flex items-center justify-center">
            <span className="text-xs font-bold text-text-secondary">#{rank}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-text-primary line-clamp-2">{product.title}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {product.brand && <span className="text-xs text-text-secondary bg-bg-hover px-2 py-0.5 rounded">{product.brand}</span>}
                {product.asin && <span className="text-[10px] text-text-muted font-mono">{product.asin}</span>}
                {product.isPrime && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Prime</span>}
                <TierBadge tier={product.tier} />
              </div>
            </div>
            {product.url && (
              <a href={product.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 text-text-muted hover:text-accent transition-colors">
                <ExternalLink size={16} />
              </a>
            )}
          </div>
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <div className="text-center">
              <p className="text-lg font-bold text-text-primary">${product.price.toFixed(2)}</p>
              <p className="text-[10px] text-text-muted">Fiyat</p>
            </div>
            {product.rating > 0 && (
              <div className="text-center">
                <p className="text-sm font-bold text-amber-600 flex items-center gap-0.5"><Star size={12} fill="currentColor" /> {product.rating}</p>
                <p className="text-[10px] text-text-muted">{formatCompact(product.reviewCount)} yorum</p>
              </div>
            )}
            {product.bsr > 0 && (
              <div className="text-center">
                <p className="text-sm font-bold text-text-primary">#{formatCompact(product.bsr)}</p>
                <p className="text-[10px] text-text-muted">BSR</p>
              </div>
            )}
            {product.monthlySales > 0 && (
              <div className="text-center">
                <p className="text-sm font-bold text-emerald-600">{formatCompact(product.monthlySales)}</p>
                <p className="text-[10px] text-text-muted">Aylik Satis</p>
              </div>
            )}
            {product.monthlyRevenue > 0 && (
              <div className="text-center">
                <p className="text-sm font-bold text-accent">{formatMoney(product.monthlyRevenue)}</p>
                <p className="text-[10px] text-text-muted">Aylik Gelir</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Neon Tooltip ───────────────────────────────────────────────────────────

function NeonTooltip({ active, payload, theme }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }>; theme?: "dark" | "light" }) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: item } = payload[0];
  const glowMap = getGlowMap(theme || "dark");
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs"
      style={{
        background: theme === "light" ? "var(--bg-card)" : "rgba(10,10,20,0.95)",
        border: `1px solid ${item.color}66`,
        boxShadow: theme === "dark" ? `0 0 12px ${glowMap[item.color] || item.color + "40"}` : "0 2px 8px rgba(0,0,0,0.12)",
      }}
    >
      <p className="font-medium" style={{ color: item.color }}>{name}</p>
      <p className="font-bold" style={{ color: "var(--text-primary)" }}>{formatCompact(value)}</p>
    </div>
  );
}

// ── Neon Pie Chart wrapper ─────────────────────────────────────────────────

function NeonPieChart({ data, centerLabel, centerValue }: {
  data: Array<{ name: string; value: number; color: string }>;
  centerLabel: string;
  centerValue: string;
}) {
  const { theme } = useTheme();
  const glowMap = getGlowMap(theme);
  const isDark = theme === "dark";

  return (
    <div className="relative p-5">
      {/* Pie */}
      <div className="h-[300px] relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {isDark && (
              <defs>
                {data.map((entry, i) => (
                  <filter key={`glow-${i}`} id={`neon-glow-${i}-${entry.name.replace(/\s/g, "")}`}>
                    <feGaussianBlur stdDeviation="3" result="blur1" />
                    <feGaussianBlur stdDeviation="8" result="blur2" />
                    <feMerge>
                      <feMergeNode in="blur2" />
                      <feMergeNode in="blur1" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                ))}
              </defs>
            )}
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={115}
              paddingAngle={3}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
              stroke={isDark ? "rgba(10,10,20,0.8)" : "rgba(255,255,255,0.8)"}
              strokeWidth={2}
            >
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={isDark ? entry.color + "B3" : entry.color}
                  style={isDark ? {
                    filter: `drop-shadow(0 0 4px ${entry.color}) drop-shadow(0 0 14px ${glowMap[entry.color] || entry.color + "40"})`,
                  } : {
                    filter: "drop-shadow(0 3px 10px rgba(0,0,0,0.18))",
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<NeonTooltip theme={theme} />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="text-center">
            <p className="text-[32px] font-bold text-text-primary tabular-nums" style={isDark ? { textShadow: "0 0 20px rgba(102,126,234,0.5)" } : undefined}>{centerValue}</p>
            <p className="text-[11px] text-text-muted uppercase tracking-[0.06em] font-medium">{centerLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Hacimler Tab (Keywords + Websites side by side) ────────────────────────

function HacimlerTab({ keywords, websites }: { keywords: KeywordVolume[]; websites: TopWebsite[] }) {
  const { theme } = useTheme();
  const NEON_COLORS = getChartColors(theme);
  const GLOW_MAP = getGlowMap(theme);
  const isDark = theme === "dark";
  const totalVolume = keywords.reduce((s, k) => s + k.monthlyVolume, 0);
  const totalTraffic = websites.reduce((s, w) => s + w.monthlyTraffic, 0);

  const kwData = keywords.map((k, i) => ({
    name: k.keyword,
    value: k.monthlyVolume,
    color: NEON_COLORS[i % NEON_COLORS.length],
  }));

  const wsData = websites.map((w, i) => ({
    name: w.brandName,
    value: w.monthlyTraffic,
    domain: w.domain,
    color: NEON_COLORS[i % NEON_COLORS.length],
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── Left: Keywords ──────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <KeyRound size={18} className="text-accent" />
            Anahtar Kelimeler
          </h3>
          <p className="text-xs text-text-muted">Google aylik arama hacimleri</p>
        </div>

        {keywords.length > 0 ? (
          <>
            <NeonPieChart
              data={kwData}
              centerLabel="Toplam Hacim"
              centerValue={formatCompact(totalVolume)}
            />

            {/* Keyword list */}
            <div className="bg-bg-card rounded-[14px] border border-border-default p-4 shadow-sm space-y-2">
              {keywords.map((kw, i) => {
                const color = NEON_COLORS[i % NEON_COLORS.length];
                return (
                  <div key={i} className="flex items-center gap-2 text-sm group">
                    <div
                      className="w-6 h-2 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: color,
                        boxShadow: isDark ? `0 0 6px ${GLOW_MAP[color] || color + "40"}` : undefined,
                      }}
                    />
                    <span className="flex-1 text-text-primary truncate">{kw.keyword}</span>
                    <span className="font-bold text-text-primary">{formatCompact(kw.monthlyVolume)}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      kw.difficulty >= 70 ? "bg-red-100 text-red-700" : kw.difficulty >= 40 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {kw.difficulty}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-[#0a0a14] rounded-2xl">
            <KeyRound size={32} className="text-text-secondary mx-auto mb-2" />
            <p className="text-sm text-text-secondary">Veri bulunamadi</p>
          </div>
        )}
      </div>

      {/* ── Right: Brands ───────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <Globe size={18} className="text-accent" />
            Markalar
          </h3>
          <p className="text-xs text-text-muted">Trafik bazli pazar paylari</p>
        </div>

        {websites.length > 0 ? (
          <>
            <NeonPieChart
              data={wsData}
              centerLabel="Toplam Trafik"
              centerValue={formatCompact(totalTraffic)}
            />

            {/* Website list */}
            <div className="bg-bg-card rounded-[14px] border border-border-default p-4 shadow-sm space-y-2">
              {websites.map((ws, i) => {
                const color = NEON_COLORS[i % NEON_COLORS.length];
                return (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div
                      className="w-6 h-2 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: color,
                        boxShadow: isDark ? `0 0 6px ${GLOW_MAP[color] || color + "40"}` : undefined,
                      }}
                    />
                    <span className="flex-1 min-w-0">
                      <span className="font-medium text-text-primary">{ws.brandName}</span>
                      <a href={`https://${ws.domain}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline ml-1">
                        {ws.domain} <ExternalLink size={8} className="inline" />
                      </a>
                    </span>
                    <span className="font-bold text-text-primary flex-shrink-0">{formatCompact(ws.monthlyTraffic)}</span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-[#0a0a14] rounded-2xl">
            <Globe size={32} className="text-text-secondary mx-auto mb-2" />
            <p className="text-sm text-text-secondary">Veri bulunamadi</p>
          </div>
        )}
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
      <div className="bg-bg-card rounded-[14px] border border-border-default p-6 shadow-sm">
        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Calculator size={18} className="text-accent" />
          BSR Hesaplayici
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">BSR (Best Sellers Rank)</label>
            <input type="number" value={bsr} onChange={(e) => setBsr(Math.max(1, parseInt(e.target.value) || 1))} className="w-full px-3 py-2 rounded-lg border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Urun Fiyati ($)</label>
            <input type="number" value={price} onChange={(e) => setPrice(Math.max(0.01, parseFloat(e.target.value) || 0.01))} step="0.5" className="w-full px-3 py-2 rounded-lg border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Kategori</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={ShoppingCart} label="Aylik Satis" value={formatCompact(sales)} />
          <StatCard icon={DollarSign} label="Aylik Gelir" value={formatMoney(revenue)} />
          <StatCard icon={TrendingUp} label="Yillik Gelir" value={formatMoney(revenue * 12)} />
          <div className="bg-bg-card rounded-[14px] border border-border-default p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1"><BarChart3 size={16} className="text-accent" /><span className="text-xs text-text-secondary">Seviye</span></div>
            <div className="mt-1"><span className={`text-sm font-bold px-3 py-1 rounded-full ${salesTierColor(tier)}`}>{tier}</span></div>
          </div>
        </div>
      </div>
      <div className="bg-bg-card rounded-[14px] border border-border-default p-6 shadow-sm">
        <h3 className="font-semibold text-text-primary mb-1">BSR Referans Tablosu</h3>
        <p className="text-xs text-text-secondary mb-4">{category} - ${price.toFixed(0)} fiyat ile</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border-default">
              <th className="text-left py-2 px-3 text-xs font-medium text-text-secondary">BSR</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-text-secondary">Aylik Satis</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-text-secondary">Aylik Gelir</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-text-secondary">Yillik Gelir</th>
              <th className="text-center py-2 px-3 text-xs font-medium text-text-secondary">Seviye</th>
            </tr></thead>
            <tbody>
              {refBsrs.map((b) => {
                const s = estimateMonthlySales(b, category);
                const r = estimateRevenue(b, price, category);
                const t = salesTier(s);
                return (
                  <tr key={b} className={`border-b border-border-default ${b === bsr ? "bg-accent/5" : ""}`}>
                    <td className="py-2 px-3 font-mono text-text-primary">#{b.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-medium">{s.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-medium text-accent">{formatMoney(r)}</td>
                    <td className="py-2 px-3 text-right text-text-secondary">{formatMoney(r * 12)}</td>
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
  const [tab, setTab] = useState<Tab>("hacimler");
  const [localKeyword, setLocalKeyword] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("monthlyRevenue");
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [showBsr, setShowBsr] = useState(false);

  const hasResults = amazonResults.length > 0 || keywordResults.length > 0 || websiteResults.length > 0;

  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };
  const toggleAll = () => {
    if (selectedProducts.size === amazonResults.length) setSelectedProducts(new Set());
    else setSelectedProducts(new Set(amazonResults.map((p) => p.asin || p.title)));
  };

  async function openSaveModal() {
    setShowSaveModal(true); setSaveMsg("");
    try { const f = await loadFolders(user?.userId); setFolders(f); if (f.length > 0 && !selectedFolder) setSelectedFolder(f[0]); } catch { setFolders(["Genel"]); }
  }

  async function handleSave() {
    const folder = newFolderName.trim() || selectedFolder;
    if (!folder) return;
    try {
      if (newFolderName.trim()) await createFolder(newFolderName.trim(), user?.userId);
      const productsToSave = selectedProducts.size > 0 ? amazonResults.filter((p) => selectedProducts.has(p.asin || p.title)) : amazonResults;
      const added = await saveBrandsBulk(folder, productsToSave.map(toBrandDataAmazon), user?.userId);
      setSaveMsg(`${added} urun kaydedildi!`);
      setTimeout(() => { setShowSaveModal(false); setSaveMsg(""); setSelectedProducts(new Set()); }, 1200);
    } catch { setSaveMsg("Hata olustu!"); }
  }

  const handleSearch = () => { if (!localKeyword.trim()) return; setKeyword(localKeyword); search(localKeyword); };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") handleSearch(); };

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Hacimler</h1>
        <p className="text-sm text-text-secondary mt-1">Bir anahtar kelime gir - arama hacimleri, top markalar ve Amazon verileri</p>
      </div>

      {/* Search bar */}
      <div className="bg-bg-card rounded-[14px] border border-border-default p-4 shadow-sm">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input type="text" value={localKeyword} onChange={(e) => setLocalKeyword(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Anahtar kelime girin... (orn: yoga mat, wireless earbuds, skincare)"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
          </div>
          <button onClick={handleSearch} disabled={loading || !localKeyword.trim()}
            className="px-6 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Ara
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-bg-card rounded-[14px] border border-border-default p-12 shadow-sm text-center">
          <Loader2 size={32} className="animate-spin text-accent mx-auto mb-3" />
          <p className="text-sm text-text-secondary">Veriler analiz ediliyor... (15-30 saniye)</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!loading && hasResults && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 bg-bg-hover p-1 rounded-[14px] w-fit">
            {[
              { key: "hacimler" as Tab, label: "Hacimler & Markalar", icon: BarChart3, count: keywordResults.length + websiteResults.length },
              { key: "amazon" as Tab, label: "Amazon", icon: ShoppingCart, count: amazonResults.length },
            ].map(({ key, label, icon: Icon, count }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? "bg-bg-card text-accent shadow-sm" : "text-text-secondary hover:text-text-primary"}`}>
                <Icon size={16} /> {label}
                {count > 0 && <span className="text-[10px] bg-bg-hover text-text-secondary px-1.5 py-0.5 rounded-full">{count}</span>}
              </button>
            ))}
          </div>

          {/* ── Hacimler Tab (Keywords + Websites) ─────────── */}
          {tab === "hacimler" && <HacimlerTab keywords={keywordResults} websites={websiteResults} />}

          {/* ── Amazon Tab ────────────────────────────────── */}
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
                  <button onClick={toggleAll} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary bg-bg-card border border-border-default rounded-lg hover:bg-bg-hover transition-colors">
                    {selectedProducts.size === amazonResults.length ? <CheckSquare size={14} className="text-accent" /> : <Square size={14} />}
                    {selectedProducts.size > 0 ? `${selectedProducts.size} secili` : "Tumunu Sec"}
                  </button>
                  <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="px-3 py-1.5 rounded-lg border border-border-default text-xs">
                    {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={openSaveModal} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-accent rounded-lg hover:bg-accent/90 transition-colors">
                    <Bookmark size={14} /> {selectedProducts.size > 0 ? `${selectedProducts.size} Kaydet` : "Tumunu Kaydet"}
                  </button>
                  <button onClick={() => downloadCSV(sortedAmazon, keyword)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary bg-bg-card border border-border-default rounded-lg hover:bg-bg-hover transition-colors">
                    <Download size={14} /> CSV
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {sortedAmazon.map((product, i) => (
                  <ProductRow key={product.asin || i} product={product} rank={i + 1} selected={selectedProducts.has(product.asin || product.title)} onToggle={() => toggleProduct(product.asin || product.title)} />
                ))}
              </div>

              <div className="border-t border-border-default pt-4">
                <button onClick={() => setShowBsr(!showBsr)} className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-accent transition-colors">
                  <Calculator size={16} /> BSR Hesaplayici {showBsr ? "▲" : "▼"}
                </button>
                {showBsr && <div className="mt-4"><BsrCalculator /></div>}
              </div>
            </>
          )}
        </>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-card rounded-[14px] p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text-primary flex items-center gap-2"><ShoppingCart size={18} className="text-[#FF9900]" /> Amazon Urunlerini Kaydet</h3>
              <button onClick={() => setShowSaveModal(false)} className="text-text-muted hover:text-text-secondary"><X size={20} /></button>
            </div>
            <p className="text-sm text-text-secondary mb-4">{selectedProducts.size > 0 ? `${selectedProducts.size} urun secildi` : `${amazonResults.length} urun kaydedilecek`}</p>
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
              <input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Yeni klasor adi..." className="w-full py-2 px-3 border border-border-default rounded-lg text-sm" />
            </div>
            {saveMsg && <p className="text-sm text-green-600 mb-3">{saveMsg}</p>}
            <button onClick={handleSave} className="w-full bg-accent text-white py-2.5 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">Kaydet</button>
          </div>
        </div>
      )}
    </div>
  );
}
