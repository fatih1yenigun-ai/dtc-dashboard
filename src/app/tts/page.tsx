"use client";

import { useState, useMemo, useEffect } from "react";
import LoadingInsights from "@/components/LoadingInsights";
import {
  Search,
  Loader2,
  ExternalLink,
  Download,
  Save,
  ChevronUp,
  ChevronDown,
  CheckSquare,
  Square,
  Eye,
  X,
} from "lucide-react";
import { loadFolders, createFolder, saveBrandsBulk, type BrandData } from "@/lib/supabase";
import { useTikTokShop } from "@/context/TikTokShopContext";
import { useAuth } from "@/context/AuthContext";

interface TTSProduct {
  product_name: string;
  shop_name: string;
  product_url: string;
  product_price: number;
  estimated_gmv: number;
  total_views: number;
  total_videos: number;
  marketing_angle: string;
  category: string;
  creation_date: string;
  country: string;
  insight: string;
  niche_summary?: string;
  niche_pros?: string;
  niche_cons?: string;
}

type SortKey =
  | "product_name"
  | "estimated_gmv"
  | "product_price"
  | "total_views"
  | "total_videos"
  | "creation_date";

const FLAG: Record<string, string> = {
  US: "\u{1F1FA}\u{1F1F8}", UK: "\u{1F1EC}\u{1F1E7}", DE: "\u{1F1E9}\u{1F1EA}", FR: "\u{1F1EB}\u{1F1F7}",
  TR: "\u{1F1F9}\u{1F1F7}", AU: "\u{1F1E6}\u{1F1FA}", KR: "\u{1F1F0}\u{1F1F7}", JP: "\u{1F1EF}\u{1F1F5}",
  CA: "\u{1F1E8}\u{1F1E6}", NL: "\u{1F1F3}\u{1F1F1}", SE: "\u{1F1F8}\u{1F1EA}", DK: "\u{1F1E9}\u{1F1F0}",
  IT: "\u{1F1EE}\u{1F1F9}", ES: "\u{1F1EA}\u{1F1F8}", BR: "\u{1F1E7}\u{1F1F7}", IN: "\u{1F1EE}\u{1F1F3}",
  CN: "\u{1F1E8}\u{1F1F3}", IL: "\u{1F1EE}\u{1F1F1}",
};

function formatNumber(n: number): string {
  return n.toLocaleString("tr-TR");
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const CHART_STYLE_TAG = `
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes donutGrow {
  from { stroke-dasharray: 0 1000; }
}
@keyframes barGrow {
  from { width: 0%; }
}
`;

export default function TTSPage() {
  // Auth
  const { user } = useAuth();

  // Context state (persistent across navigation)
  const { keyword, results, loading, nicheSummary, error, startResearch, setKeyword: setGlobalKeyword } = useTikTokShop();

  // Local state
  const [localKeyword, setLocalKeyword] = useState("");
  const [count, setCount] = useState(20);
  const [country, setCountry] = useState("all");
  const [gmvRange, setGmvRange] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [newFolderName, setNewFolderName] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("estimated_gmv");
  const [sortAsc, setSortAsc] = useState(false);
  const [detailProduct, setDetailProduct] = useState<TTSProduct | null>(null);

  // Restore localKeyword from context or sessionStorage on mount
  useEffect(() => {
    if (keyword) {
      setLocalKeyword(keyword);
    } else if (results.length === 0 && typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("lastTTSResearch");
        if (saved) {
          const data = JSON.parse(saved);
          setLocalKeyword(data.keyword || "");
        }
      } catch {
        // ignore
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync localKeyword when context keyword changes
  useEffect(() => {
    if (keyword && keyword !== localKeyword) {
      setLocalKeyword(keyword);
    }
  }, [keyword]); // eslint-disable-line react-hooks/exhaustive-deps

  // Niche summary from context
  const nicheSummaryText = nicheSummary?.summary;
  const nichePros = nicheSummary?.pros;
  const nicheCons = nicheSummary?.cons;

  // Sorted results
  const sortedResults = useMemo(() => {
    const sorted = [...results];
    sorted.sort((a, b) => {
      let va: string | number = 0;
      let vb: string | number = 0;
      switch (sortKey) {
        case "product_name":
          va = a.product_name.toLowerCase();
          vb = b.product_name.toLowerCase();
          break;
        case "estimated_gmv":
          va = a.estimated_gmv;
          vb = b.estimated_gmv;
          break;
        case "product_price":
          va = a.product_price;
          vb = b.product_price;
          break;
        case "total_views":
          va = a.total_views;
          vb = b.total_views;
          break;
        case "total_videos":
          va = a.total_videos;
          vb = b.total_videos;
          break;
        case "creation_date":
          va = a.creation_date || "";
          vb = b.creation_date || "";
          break;
      }
      if (typeof va === "string" && typeof vb === "string") {
        return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
    return sorted;
  }, [results, sortKey, sortAsc]);

  // Category distribution weighted by GMV
  const categoryDist = useMemo(() => {
    const gmvByCategory: Record<string, number> = {};
    results.forEach((p) => {
      const cat = p.category || "Diger";
      gmvByCategory[cat] = (gmvByCategory[cat] || 0) + (p.estimated_gmv ?? 0);
    });
    const totalGmv = Object.values(gmvByCategory).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(gmvByCategory)
      .map(([name, gmv]) => ({
        name,
        gmv,
        pct: Math.round((gmv / totalGmv) * 100),
      }))
      .sort((a, b) => b.gmv - a.gmv);
  }, [results]);

  const totalGmv = useMemo(() => {
    return results.reduce((s, p) => s + (p.estimated_gmv ?? 0), 0);
  }, [results]);

  // Marketing angles frequency + avg product price
  const angleStats = useMemo(() => {
    const angleData: Record<string, { count: number; totalPrice: number }> = {};
    results.forEach((p) => {
      if (!p.marketing_angle) return;
      p.marketing_angle.split(",").forEach((angle) => {
        const a = angle.trim();
        if (!a) return;
        if (!angleData[a]) angleData[a] = { count: 0, totalPrice: 0 };
        angleData[a].count += 1;
        angleData[a].totalPrice += p.product_price;
      });
    });
    const arr = Object.entries(angleData).map(([name, d]) => ({
      name,
      count: d.count,
      avgPrice: Math.round(d.totalPrice / d.count),
    }));
    arr.sort((a, b) => b.count - a.count);
    return arr;
  }, [results]);

  const maxAngleCount = angleStats.length > 0 ? angleStats[0].count : 1;

  // Vibrant neon colors for donut chart
  const DONUT_COLORS = [
    "#667eea", "#764ba2", "#f093fb", "#4facfe", "#00f2fe",
    "#43e97b", "#fa709a", "#fee140", "#a18cd1", "#fbc2eb",
  ];

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronDown size={12} className="opacity-30 ml-1 inline" />;
    return sortAsc ? (
      <ChevronUp size={12} className="ml-1 inline text-[#667eea]" />
    ) : (
      <ChevronDown size={12} className="ml-1 inline text-[#667eea]" />
    );
  }

  function handleSearch() {
    if (!localKeyword.trim()) return;
    setSelected(new Set());
    startResearch(localKeyword, count, { country, gmvRange, dateRange });
  }

  function toggleSelect(idx: number) {
    const next = new Set(selected);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSelected(next);
  }

  function toggleAll() {
    if (selected.size === results.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(results.map((_, i) => i)));
    }
  }

  async function openSaveModal() {
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
    if (!folder || selected.size === 0) return;

    const brandsToSave: BrandData[] = Array.from(selected).map((i) => {
      const p = results[i];
      return {
        Marka: `${p.product_name} (${p.shop_name})`,
        "Web Sitesi": `https://www.tiktok.com/${p.product_url?.startsWith("@") ? p.product_url : "@" + (p.product_url || "").replace("@", "")}`,
        Kategori: p.category,
        "AOV ($)": p.product_price,
        "Aylık Trafik": p.total_views,
        "Ciro ($)": p.estimated_gmv,
        "Öne Çıkan Özellik": p.insight,
        "Büyüme Yöntemi": "TikTok Shop",
        "Pazarlama Açıları": p.marketing_angle,
        Kaynak: "TikTok Shop",
        "Video Sayısı": p.total_videos,
        "Oluşturulma Tarihi": p.creation_date,
        "Ülke": p.country,
      };
    });

    try {
      if (newFolderName.trim()) await createFolder(newFolderName.trim(), user?.userId);
      const added = await saveBrandsBulk(folder, brandsToSave, user?.userId);
      setSaveMsg(`${added} ürün kaydedildi!`);
      setTimeout(() => {
        setShowSaveModal(false);
        setSaveMsg("");
      }, 1500);
    } catch {
      setSaveMsg("Hata oluştu!");
    }
  }

  function exportCSV() {
    const headers = [
      "Ürün Adı", "Mağaza", "URL", "Fiyat ($)", "GMV ($)",
      "Görüntülenme", "Video Sayısı", "Pazarlama Açıları",
      "Kategori", "Tarih", "Ülke", "Insight",
    ];
    const rows = results.map((p) =>
      [
        `"${(p.product_name || "").replace(/"/g, '""')}"`,
        `"${(p.shop_name || "").replace(/"/g, '""')}"`,
        `https://www.tiktok.com/${p.product_url?.startsWith("@") ? p.product_url : "@" + (p.product_url || "").replace("@", "")}`,
        p.product_price,
        p.estimated_gmv,
        p.total_views,
        p.total_videos,
        `"${(p.marketing_angle || "").replace(/"/g, '""')}"`,
        `"${(p.category || "").replace(/"/g, '""')}"`,
        p.creation_date,
        p.country,
        `"${(p.insight || "").replace(/"/g, '""')}"`,
      ].join(",")
    );
    const csv = headers.join(",") + "\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tts-research-${localKeyword}.csv`;
    a.click();
  }

  // Build SVG donut chart data
  const donutSegments = useMemo(() => {
    let cumulative = 0;
    return categoryDist.map((cat, i) => {
      const pct = cat.pct || 0;
      const offset = cumulative;
      cumulative += pct;
      return {
        ...cat,
        color: DONUT_COLORS[i % DONUT_COLORS.length],
        dashArray: `${(pct / 100) * 283} ${283 - (pct / 100) * 283}`,
        dashOffset: -((offset / 100) * 283),
      };
    });
  }, [categoryDist]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: CHART_STYLE_TAG }} />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">TikTok Shop</h1>
        <p className="text-gray-500 mt-1">
          TikTok Shop&apos;ta trend ürünleri keşfet
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
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
                placeholder="örneğin: led lamba, cilt bakım, mutfak gadget..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30 focus:border-[#667eea]"
              />
            </div>
          </div>

          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ürün Sayısı
            </label>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
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
              Araştır
            </button>
          </div>
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Ülke</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="py-1.5 px-3 border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#667eea]/30 bg-gray-50"
            >
              <option value="all">Tümü</option>
              <option value="US">ABD</option>
              <option value="UK">İngiltere</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">GMV Aralığı</label>
            <select
              value={gmvRange}
              onChange={(e) => setGmvRange(e.target.value)}
              className="py-1.5 px-3 border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#667eea]/30 bg-gray-50"
            >
              <option value="all">Tümü</option>
              <option value="below-50k">$50K Altı</option>
              <option value="50k-300k">$50K - $300K</option>
              <option value="300k+">$300K+</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tarih</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="py-1.5 px-3 border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#667eea]/30 bg-gray-50"
            >
              <option value="all">Tümü</option>
              <option value="3m">Son 3 Ay</option>
              <option value="6m">Son 6 Ay</option>
              <option value="1y">Son 1 Yıl</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Loading with insights */}
      {loading && (
        <div className="py-8">
          <div className="flex flex-col items-center mb-6">
            <Loader2 size={32} className="animate-spin text-[#667eea] mb-3" />
            <p className="text-gray-500 font-medium">Ürünler araştırılıyor...</p>
            <p className="text-gray-400 text-xs mt-1">
              {results.length > 0 ? `${results.length} ürün bulundu, devam ediyor...` : "Bu işlem 15-30 saniye sürebilir"}
            </p>
          </div>
          <LoadingInsights />
        </div>
      )}

      {/* Results */}
      {results.length > 0 && !loading && (
        <div>
          {/* Analysis Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Left: Donut chart - Category & GMV */}
            <div
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              style={{ animation: "fadeSlideUp 0.6s ease-out forwards", animationDelay: "0.1s", opacity: 0 }}
            >
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Kategori &amp; GMV</h3>
              <div className="flex items-center gap-6">
                {/* SVG Donut */}
                <div className="relative w-36 h-36 flex-shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full" style={{ filter: "drop-shadow(0 0 8px rgba(102,126,234,0.3))" }}>
                    {donutSegments.map((seg, i) => (
                      <circle
                        key={seg.name}
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="10"
                        strokeDasharray={seg.dashArray}
                        strokeDashoffset={seg.dashOffset}
                        transform="rotate(-90 50 50)"
                        style={{
                          filter: `drop-shadow(0 0 4px ${seg.color}60)`,
                          animation: `donutGrow 1s ease-out forwards`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </svg>
                  {/* Center total */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">GMV</span>
                    <span className="text-sm font-bold text-gray-900">${formatCompact(totalGmv)}</span>
                  </div>
                </div>
                {/* Legend */}
                <div className="flex flex-col gap-1.5 text-xs">
                  {donutSegments.map((seg) => (
                    <div key={seg.name} className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: seg.color, boxShadow: `0 0 6px ${seg.color}80` }}
                      />
                      <span className="text-gray-700">{seg.name}</span>
                      <span className="text-gray-400">(%{seg.pct})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Marketing angles bar chart */}
            <div
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              style={{ animation: "fadeSlideUp 0.6s ease-out forwards", animationDelay: "0.25s", opacity: 0 }}
            >
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Pazarlama Açıları</h3>
              {angleStats.length === 0 ? (
                <p className="text-xs text-gray-400">Veri yok</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {angleStats.slice(0, 8).map((angle, i) => (
                    <div key={angle.name} className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-32 flex-shrink-0 truncate" title={angle.name}>
                        {angle.name}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden" style={{ filter: "drop-shadow(0 0 3px rgba(102,126,234,0.2))" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            background: "linear-gradient(90deg, #667eea, #4facfe)",
                            width: `${Math.max(10, (angle.count / maxAngleCount) * 100)}%`,
                            animation: `barGrow 0.8s ease-out forwards`,
                            animationDelay: `${0.3 + i * 0.08}s`,
                            boxShadow: "0 0 8px rgba(79,172,254,0.4)",
                          }}
                        />
                        <span className="absolute left-3 inset-y-0 flex items-center text-xs font-semibold text-white drop-shadow-sm">
                          {angle.count}x
                        </span>
                      </div>
                      <span
                        className="text-sm font-semibold text-white flex-shrink-0 px-2 py-0.5 rounded flex items-center gap-1"
                        style={{ backgroundColor: "#1e293b" }}
                      >
                        <span className="text-[10px] font-medium text-gray-400">Fiyat</span>
                        ${angle.avgPrice}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleAll}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                {selected.size === results.length ? (
                  <CheckSquare size={16} className="text-[#667eea]" />
                ) : (
                  <Square size={16} />
                )}
                Tümünü Seç
              </button>
              <span className="text-sm text-gray-400">
                {selected.size} seçili
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={openSaveModal}
                disabled={selected.size === 0}
                className="flex items-center gap-2 px-4 py-2 bg-[#27AE60] text-white rounded-lg text-sm font-medium hover:bg-[#219a52] transition-colors disabled:opacity-50"
              >
                <Save size={14} />
                Kaydet
              </button>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <Download size={14} />
                CSV İndir
              </button>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto" style={{ scrollBehavior: "smooth" }}>
              <table className="w-full text-sm min-w-[1400px]">
                <thead>
                  <tr className="bg-[#0D1B2A] text-white">
                    {/* 1. Checkbox */}
                    <th className="sticky left-0 z-10 bg-[#0D1B2A] px-3 py-3 text-left w-10">
                      <button onClick={toggleAll}>
                        {selected.size === results.length ? (
                          <CheckSquare size={16} className="text-[#667eea]" />
                        ) : (
                          <Square size={16} className="text-gray-400" />
                        )}
                      </button>
                    </th>
                    {/* 2. Urun Adi */}
                    <th
                      className="sticky left-10 z-10 bg-[#0D1B2A] px-3 py-3 text-left font-semibold cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("product_name")}
                    >
                      Ürün Adı <SortIcon col="product_name" />
                    </th>
                    {/* 3. GMV */}
                    <th
                      className="px-3 py-3 text-right font-semibold cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("estimated_gmv")}
                    >
                      GMV <SortIcon col="estimated_gmv" />
                    </th>
                    {/* 4. Fiyat */}
                    <th
                      className="px-3 py-3 text-right font-semibold cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("product_price")}
                    >
                      Fiyat <SortIcon col="product_price" />
                    </th>
                    {/* 5. Goruntulneme */}
                    <th
                      className="px-3 py-3 text-right font-semibold cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("total_views")}
                    >
                      Görüntülenme <SortIcon col="total_views" />
                    </th>
                    {/* 6. Video */}
                    <th
                      className="px-3 py-3 text-right font-semibold cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("total_videos")}
                    >
                      Video <SortIcon col="total_videos" />
                    </th>
                    {/* 7. Pazarlama Acisi */}
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Pazarlama Açısı</th>
                    {/* 8. Tarih */}
                    <th
                      className="px-3 py-3 text-center font-semibold cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("creation_date")}
                    >
                      Tarih <SortIcon col="creation_date" />
                    </th>
                    {/* 9. Ulke */}
                    <th className="px-3 py-3 text-center font-semibold whitespace-nowrap">Ülke</th>
                    {/* 10. Detay */}
                    <th className="px-3 py-3 text-center font-semibold whitespace-nowrap">Detay</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedResults.map((product, idx) => {
                    // Find original index for selection
                    const origIdx = results.indexOf(product);
                    const tiktokSearchUrl = `https://www.tiktok.com/${product.product_url?.startsWith("@") ? product.product_url : "@" + (product.product_url || "").replace("@", "")}`;
                    return (
                      <tr
                        key={idx}
                        onClick={() => toggleSelect(origIdx)}
                        className={`cursor-pointer border-t border-gray-100 transition-colors ${
                          selected.has(origIdx)
                            ? "bg-[#667eea]/5"
                            : idx % 2 === 0
                            ? "bg-white"
                            : "bg-gray-50"
                        } hover:bg-[#667eea]/10`}
                      >
                        {/* 1. Checkbox */}
                        <td className="sticky left-0 z-10 px-3 py-3" style={{ backgroundColor: "inherit" }}>
                          {selected.has(origIdx) ? (
                            <CheckSquare size={16} className="text-[#667eea]" />
                          ) : (
                            <Square size={16} className="text-gray-300" />
                          )}
                        </td>
                        {/* 2. Urun Adi + Shop name */}
                        <td className="sticky left-10 z-10 px-3 py-3 whitespace-nowrap" style={{ backgroundColor: "inherit" }}>
                          <a
                            href={tiktokSearchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="font-bold text-gray-900 hover:text-[#667eea] inline-flex items-center gap-1.5 transition-colors"
                          >
                            {product.product_name}
                            <ExternalLink size={12} className="text-gray-400" />
                          </a>
                          <p className="text-xs text-gray-400 mt-0.5">{product.shop_name}</p>
                        </td>
                        {/* 3. GMV */}
                        <td className="px-3 py-3 text-right font-bold text-[#27AE60] whitespace-nowrap">
                          ${formatNumber(product.estimated_gmv)}
                        </td>
                        {/* 4. Fiyat */}
                        <td className="px-3 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                          ${product.product_price}
                        </td>
                        {/* 5. Goruntulneme */}
                        <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                          {formatCompact(product.total_views)}
                        </td>
                        {/* 6. Video */}
                        <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                          {formatNumber(product.total_videos)}
                        </td>
                        {/* 7. Pazarlama Acisi */}
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(product.marketing_angle || "").split(",").filter(Boolean).map((a, ai) => (
                              <span
                                key={ai}
                                className="inline-block bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap"
                              >
                                {a.trim()}
                              </span>
                            ))}
                          </div>
                        </td>
                        {/* 8. Tarih */}
                        <td className="px-3 py-3 text-center text-gray-600 whitespace-nowrap">
                          {product.creation_date || "-"}
                        </td>
                        {/* 9. Ulke */}
                        <td className="px-3 py-3 whitespace-nowrap text-center">
                          {product.country ? (
                            <span className="text-sm">
                              {FLAG[product.country.toUpperCase()] || ""} {product.country.toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        {/* 10. Detay */}
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); setDetailProduct(product); }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#667eea]/10 text-[#667eea] rounded-md text-xs font-medium hover:bg-[#667eea]/20 transition-colors"
                          >
                            <Eye size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Nis Ozeti Section */}
          {nicheSummaryText && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Niş Özeti</h3>
              <p className="text-sm text-gray-700 mb-4 leading-relaxed">{nicheSummaryText}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {nichePros && nichePros.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-[#27AE60] mb-2">Avantajlar</h4>
                    <ul className="space-y-1">
                      {nichePros.map((pro, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-[#27AE60] mt-0.5 flex-shrink-0">&#x2022;</span>
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {nicheCons && nicheCons.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-[#E74C3C] mb-2">Dezavantajlar</h4>
                    <ul className="space-y-1">
                      {nicheCons.map((con, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-[#E74C3C] mt-0.5 flex-shrink-0">&#x2022;</span>
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {detailProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetailProduct(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-[#0D1B2A] text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">{detailProduct.product_name}</h2>
                <p className="text-gray-400 text-sm">{detailProduct.shop_name}</p>
                <a
                  href={`https://www.tiktok.com/${detailProduct.product_url?.startsWith("@") ? detailProduct.product_url : "@" + (detailProduct.product_url || "").replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-[#4facfe]/20 text-[#4facfe] rounded-lg text-sm font-medium hover:bg-[#4facfe]/30 transition-colors"
                >
                  TikTok Hesabı <ExternalLink size={12} />
                </a>
              </div>
              <button onClick={() => setDetailProduct(null)} className="text-gray-400 hover:text-white transition-colors">
                <X size={22} />
              </button>
            </div>

            {/* Content grid */}
            <div className="p-6 grid grid-cols-2 gap-4">
              {/* GMV */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="text-xs text-emerald-600 font-medium mb-1">Tahmini GMV</p>
                <p className="text-2xl font-bold text-[#27AE60]">${formatNumber(detailProduct.estimated_gmv)}</p>
              </div>
              {/* Views */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-xs text-blue-600 font-medium mb-1">Görüntülenme</p>
                <p className="text-2xl font-bold text-[#2980B9]">{formatCompact(detailProduct.total_views)}</p>
              </div>
              {/* Price */}
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <p className="text-xs text-purple-600 font-medium mb-1">Fiyat</p>
                <p className="text-2xl font-bold text-purple-700">${detailProduct.product_price}</p>
              </div>
              {/* Videos */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs text-amber-600 font-medium mb-1">Video Sayısı</p>
                <p className="text-2xl font-bold text-amber-700">{formatNumber(detailProduct.total_videos)}</p>
              </div>
              {/* Country & Date */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-medium mb-1">Ülke &amp; Tarih</p>
                <p className="text-lg font-bold text-gray-800">
                  {FLAG[detailProduct.country?.toUpperCase()] || ""} {detailProduct.country?.toUpperCase() || "-"} <span className="text-gray-400 font-normal">|</span> {detailProduct.creation_date || "-"}
                </p>
              </div>
              {/* Category */}
              <div className="bg-[#667eea]/5 border border-[#667eea]/20 rounded-xl p-4">
                <p className="text-xs text-[#667eea] font-medium mb-1">Kategori</p>
                <p className="text-lg font-bold text-gray-800">{detailProduct.category}</p>
              </div>
            </div>

            {/* Text sections */}
            <div className="px-6 pb-6 space-y-4">
              {/* Insight */}
              {detailProduct.insight && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wide">Öne Çıkan Özellik</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{detailProduct.insight}</p>
                </div>
              )}
              {/* Marketing Angles */}
              {detailProduct.marketing_angle && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wide">Pazarlama Açıları</p>
                  <div className="flex flex-wrap gap-2">
                    {detailProduct.marketing_angle.split(",").filter(Boolean).map((a, i) => (
                      <span key={i} className="inline-block bg-purple-100 text-purple-700 px-2.5 py-1 rounded-lg text-xs font-medium">{a.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Klasöre Kaydet</h2>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &#x2715;
              </button>
            </div>

            {saveMsg ? (
              <p
                className={`text-center font-medium py-4 ${
                  saveMsg.includes("Hata") ? "text-red-500" : "text-[#27AE60]"
                }`}
              >
                {saveMsg}
              </p>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Klasör Seç
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

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yeni Klasör
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Klasör adı..."
                      className="flex-1 py-2 px-3 border border-gray-200 rounded-lg text-sm"
                    />
                    <button
                      onClick={handleCreateFolder}
                      className="px-4 py-2 bg-[#667eea] text-white rounded-lg text-sm"
                    >
                      Oluştur
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowSaveModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-[#27AE60] text-white rounded-lg text-sm"
                  >
                    {selected.size} Ürünü Kaydet
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
