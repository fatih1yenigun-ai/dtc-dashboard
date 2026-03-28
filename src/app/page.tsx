"use client";

import { useState, useMemo, useEffect } from "react";
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
import { useResearch } from "@/context/ResearchContext";
import { useAuth } from "@/context/AuthContext";

interface BrandResult {
  brand_name: string;
  website: string;
  category: string;
  niche: string;
  aov: number;
  estimated_traffic: number;
  insight: string;
  marketing_angles: string;
  growth_method: string;
  history: string;
  founded: number;
  country: string;
  meta_ads_url: string;
  niche_summary?: string;
  niche_pros?: string;
  niche_cons?: string;
  tqs?: number;
  conversion?: number;
  estimated_revenue?: number;
}

type SortKey =
  | "brand_name"
  | "country"
  | "category"
  | "aov"
  | "estimated_traffic"
  | "tqs"
  | "conversion"
  | "estimated_revenue"
  | "founded";

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

function truncate(str: string, max: number): string {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "..." : str;
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

export default function HomePage() {
  // Auth
  const { user } = useAuth();

  // Context state (persistent across navigation)
  const { keyword, results, loading, nicheSummary, error, startResearch, setKeyword: setGlobalKeyword } = useResearch();

  // Local state
  const [localKeyword, setLocalKeyword] = useState("");
  const [count, setCount] = useState(50);
  const [country, setCountry] = useState("all");
  const [foundedAfter, setFoundedAfter] = useState("all");
  const [revenueRange, setRevenueRange] = useState("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [newFolderName, setNewFolderName] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("estimated_revenue");
  const [sortAsc, setSortAsc] = useState(false);
  const [detailBrand, setDetailBrand] = useState<BrandResult | null>(null);

  // Restore localKeyword from context or sessionStorage on mount
  useEffect(() => {
    if (keyword) {
      setLocalKeyword(keyword);
    } else if (results.length === 0 && typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("lastResearch");
        if (saved) {
          const data = JSON.parse(saved);
          setLocalKeyword(data.keyword || "");
        }
      } catch {
        // ignore
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync localKeyword when context keyword changes (e.g. restored from session)
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
        case "brand_name":
          va = a.brand_name.toLowerCase();
          vb = b.brand_name.toLowerCase();
          break;
        case "country":
          va = a.country || "";
          vb = b.country || "";
          break;
        case "category":
          va = a.category.toLowerCase();
          vb = b.category.toLowerCase();
          break;
        case "aov":
          va = a.aov;
          vb = b.aov;
          break;
        case "estimated_traffic":
          va = a.estimated_traffic;
          vb = b.estimated_traffic;
          break;
        case "tqs":
          va = a.tqs ?? 0;
          vb = b.tqs ?? 0;
          break;
        case "conversion":
          va = a.conversion ?? 0;
          vb = b.conversion ?? 0;
          break;
        case "estimated_revenue":
          va = a.estimated_revenue ?? 0;
          vb = b.estimated_revenue ?? 0;
          break;
        case "founded":
          va = a.founded ?? 0;
          vb = b.founded ?? 0;
          break;
      }
      if (typeof va === "string" && typeof vb === "string") {
        return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
    return sorted;
  }, [results, sortKey, sortAsc]);

  // Category distribution weighted by revenue (talep/demand)
  const categoryDist = useMemo(() => {
    const revenueByCategory: Record<string, number> = {};
    results.forEach((b) => {
      const cat = b.category || "Diger";
      revenueByCategory[cat] = (revenueByCategory[cat] || 0) + (b.estimated_revenue ?? 0);
    });
    const totalRevenue = Object.values(revenueByCategory).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(revenueByCategory)
      .map(([name, revenue]) => ({
        name,
        revenue,
        pct: Math.round((revenue / totalRevenue) * 100),
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [results]);

  const totalRevenue = useMemo(() => {
    return results.reduce((s, b) => s + (b.estimated_revenue ?? 0), 0);
  }, [results]);

  // Marketing angles frequency + avg AOV
  const angleStats = useMemo(() => {
    const angleData: Record<string, { count: number; totalAov: number }> = {};
    results.forEach((b) => {
      if (!b.marketing_angles) return;
      b.marketing_angles.split(",").forEach((angle) => {
        const a = angle.trim();
        if (!a) return;
        if (!angleData[a]) angleData[a] = { count: 0, totalAov: 0 };
        angleData[a].count += 1;
        angleData[a].totalAov += b.aov;
      });
    });
    const arr = Object.entries(angleData).map(([name, d]) => ({
      name,
      count: d.count,
      avgAov: Math.round(d.totalAov / d.count),
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
    startResearch(localKeyword, count, { country, foundedAfter, revenueRange });
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
      const b = results[i];
      return {
        Marka: b.brand_name,
        "Web Sitesi": `https://${b.website}`,
        Kategori: b.category,
        "\u00dclke": b.country,
        "AOV ($)": b.aov,
        "Ayl\u0131k Trafik": b.estimated_traffic,
        TQS: b.tqs,
        "D\u00f6n\u00fc\u015f\u00fcm %": b.conversion,
        "Ciro ($)": b.estimated_revenue,
        "B\u00fcy\u00fcme Y\u00f6ntemi": b.growth_method,
        "Pazarlama A\u00e7\u0131lar\u0131": b.marketing_angles,
        "\u00d6ne \u00c7\u0131kan \u00d6zellik": b.insight,
        "Marka Hikayesi": b.history,
        "Kurulu\u015f Y\u0131l\u0131": b.founded,
        Ni\u015f: b.niche,
        "Meta Ads": b.meta_ads_url,
      };
    });

    try {
      if (newFolderName.trim()) await createFolder(newFolderName.trim(), user?.userId);
      const added = await saveBrandsBulk(folder, brandsToSave, user?.userId);
      setSaveMsg(`${added} marka kaydedildi!`);
      setTimeout(() => {
        setShowSaveModal(false);
        setSaveMsg("");
      }, 1500);
    } catch {
      setSaveMsg("Hata olustu!");
    }
  }

  function exportCSV() {
    const headers = [
      "Marka", "Website", "Kategori", "Ulke", "AOV ($)",
      "Ciro ($)", "Buyume Yontemi", "Pazarlama Acilari",
      "Kurulus Yili", "Aylik Trafik", "TQS", "Donusum %",
      "One Cikan Ozellik", "Nis", "Marka Hikayesi", "Meta Ads",
    ];
    const rows = results.map((b) =>
      [
        b.brand_name,
        b.website,
        b.category,
        b.country,
        b.aov,
        b.estimated_revenue ?? 0,
        `"${(b.growth_method || "").replace(/"/g, '""')}"`,
        `"${(b.marketing_angles || "").replace(/"/g, '""')}"`,
        b.founded,
        b.estimated_traffic,
        b.tqs ?? 5.5,
        b.conversion ?? 0,
        `"${(b.insight || "").replace(/"/g, '""')}"`,
        b.niche,
        `"${(b.history || "").replace(/"/g, '""')}"`,
        b.meta_ads_url,
      ].join(",")
    );
    const csv = headers.join(",") + "\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dtc-research-${localKeyword}.csv`;
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
  }, [categoryDist]);

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: CHART_STYLE_TAG }} />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Canli Arastirma</h1>
        <p className="text-gray-500 mt-1">
          Anahtar kelime ile DTC markalari kesfet
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
                placeholder="ornegin: protein bar, cilt bakimi..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30 focus:border-[#667eea]"
              />
            </div>
          </div>

          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marka Sayisi
            </label>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
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
              Arastir
            </button>
          </div>
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Ulke</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="py-1.5 px-3 border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#667eea]/30 bg-gray-50"
            >
              <option value="all">Tumu</option>
              <option value="US">ABD</option>
              <option value="TR">Turkiye</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Kurulus Yili</label>
            <select
              value={foundedAfter}
              onChange={(e) => setFoundedAfter(e.target.value)}
              className="py-1.5 px-3 border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#667eea]/30 bg-gray-50"
            >
              <option value="all">Tumu</option>
              <option value="2024">2024+</option>
              <option value="2022">2022+</option>
              <option value="2020">2020+</option>
              <option value="2018">2018+</option>
              <option value="2015">2015+</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Gelir Araligi</label>
            <select
              value={revenueRange}
              onChange={(e) => setRevenueRange(e.target.value)}
              className="py-1.5 px-3 border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#667eea]/30 bg-gray-50"
            >
              <option value="all">Tumu</option>
              <option value="below-50k">$50K Altı</option>
              <option value="50k-300k">$50K - $300K</option>
              <option value="300k+">$300K+</option>
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

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={40} className="animate-spin text-[#667eea] mb-4" />
          <p className="text-gray-500">Markalar arastiriliyor...</p>
          <p className="text-gray-400 text-sm mt-1">
            Bu islem 15-30 saniye surebilir
          </p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && !loading && (
        <div>
          {/* Analysis Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Left: Donut chart - Category & Demand weighted by revenue */}
            <div
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              style={{ animation: "fadeSlideUp 0.6s ease-out forwards", animationDelay: "0.1s", opacity: 0 }}
            >
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Kategori &amp; Talep</h3>
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
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">Toplam</span>
                    <span className="text-sm font-bold text-gray-900">${formatNumber(totalRevenue)}</span>
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
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Pazarlama Acilari</h3>
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
                        <span className="text-[10px] font-medium text-gray-400">AOV</span>
                        ${angle.avgAov}
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
                Tumunu Sec
              </button>
              <span className="text-sm text-gray-400">
                {selected.size} secili
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
                CSV Indir
              </button>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto" style={{ scrollBehavior: "smooth" }}>
              <table className="w-full text-sm min-w-[1800px]">
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
                    {/* 2. Marka (clickable link) */}
                    <th
                      className="sticky left-10 z-10 bg-[#0D1B2A] px-3 py-3 text-left font-semibold cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("brand_name")}
                    >
                      Marka <SortIcon col="brand_name" />
                    </th>
                    {/* 3. Meta Ads */}
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Meta Ads</th>
                    {/* 4. Ciro */}
                    <th
                      className="px-3 py-3 text-right font-semibold cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("estimated_revenue")}
                    >
                      Ciro <SortIcon col="estimated_revenue" />
                    </th>
                    {/* 5. Buyume Yontemi */}
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Buyume Yontemi</th>
                    {/* 6. Pazarlama Acisi */}
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Pazarlama Acisi</th>
                    {/* 7. Kurulus */}
                    <th
                      className="px-3 py-3 text-center font-semibold cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("founded")}
                    >
                      Kurulus <SortIcon col="founded" />
                    </th>
                    {/* 8. AOV */}
                    <th
                      className="px-3 py-3 text-right font-semibold cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("aov")}
                    >
                      AOV <SortIcon col="aov" />
                    </th>
                    {/* 9. Kategori */}
                    <th
                      className="px-3 py-3 text-left font-semibold cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("category")}
                    >
                      Kategori <SortIcon col="category" />
                    </th>
                    {/* 10. One Cikan Ozellik */}
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">One Cikan Ozellik</th>
                    {/* 11. Trafik */}
                    <th
                      className="px-3 py-3 text-right font-semibold cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("estimated_traffic")}
                    >
                      Trafik <SortIcon col="estimated_traffic" />
                    </th>
                    {/* 12. TQS */}
                    <th
                      className="px-3 py-3 text-center font-semibold cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("tqs")}
                    >
                      TQS <SortIcon col="tqs" />
                    </th>
                    {/* 13. Donusum */}
                    <th
                      className="px-3 py-3 text-right font-semibold cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("conversion")}
                    >
                      Donusum <SortIcon col="conversion" />
                    </th>
                    {/* 14. Ulke */}
                    <th
                      className="px-3 py-3 text-center font-semibold cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("country")}
                    >
                      Ulke <SortIcon col="country" />
                    </th>
                    {/* 15. Detay */}
                    <th className="px-3 py-3 text-center font-semibold whitespace-nowrap">Detay</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedResults.map((brand, idx) => {
                    // Find original index for selection
                    const origIdx = results.indexOf(brand);
                    const websiteUrl = brand.website.startsWith("http")
                      ? brand.website
                      : `https://${brand.website}`;
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
                        {/* 2. Marka (clickable link to website) */}
                        <td className="sticky left-10 z-10 px-3 py-3 whitespace-nowrap" style={{ backgroundColor: "inherit" }}>
                          <a
                            href={websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="font-bold text-gray-900 hover:text-[#667eea] inline-flex items-center gap-1.5 transition-colors"
                          >
                            {brand.brand_name}
                            <ExternalLink size={12} className="text-gray-400" />
                          </a>
                        </td>
                        {/* 3. Meta Ads */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          {brand.meta_ads_url ? (
                            <a
                              href={
                                brand.meta_ads_url.startsWith("http")
                                  ? brand.meta_ads_url
                                  : `https://${brand.meta_ads_url}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-medium hover:bg-blue-100 transition-colors"
                            >
                              Gor <ExternalLink size={10} />
                            </a>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        {/* 4. Ciro */}
                        <td className="px-3 py-3 text-right font-bold text-[#27AE60] whitespace-nowrap">
                          ${formatNumber(brand.estimated_revenue ?? 0)}
                        </td>
                        {/* 5. Buyume Yontemi */}
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(brand.growth_method || "").split(",").filter(Boolean).map((g, gi) => (
                              <span
                                key={gi}
                                className="inline-block bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap"
                              >
                                {g.trim()}
                              </span>
                            ))}
                          </div>
                        </td>
                        {/* 6. Pazarlama Acisi */}
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(brand.marketing_angles || "").split(",").filter(Boolean).map((a, ai) => (
                              <span
                                key={ai}
                                className="inline-block bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap"
                              >
                                {a.trim()}
                              </span>
                            ))}
                          </div>
                        </td>
                        {/* 7. Kurulus */}
                        <td className="px-3 py-3 text-center text-gray-600 whitespace-nowrap">
                          {brand.founded || "-"}
                        </td>
                        {/* 8. AOV */}
                        <td className="px-3 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                          ${brand.aov}
                        </td>
                        {/* 9. Kategori */}
                        <td className="px-3 py-3">
                          <span className="inline-block bg-[#667eea]/10 text-[#667eea] px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
                            {brand.category}
                          </span>
                        </td>
                        {/* 10. One Cikan Ozellik */}
                        <td className="px-3 py-3 text-gray-600 max-w-[200px]">
                          <span title={brand.insight}>
                            {truncate(brand.insight, 60)}
                          </span>
                        </td>
                        {/* 11. Trafik */}
                        <td className="px-3 py-3 text-right font-medium text-[#2980B9] whitespace-nowrap">
                          {formatNumber(brand.estimated_traffic)}
                        </td>
                        {/* 12. TQS */}
                        <td className="px-3 py-3 text-center">
                          <span className="inline-block bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-semibold">
                            {brand.tqs}
                          </span>
                        </td>
                        {/* 13. Donusum */}
                        <td className="px-3 py-3 text-right font-medium text-gray-700 whitespace-nowrap">
                          %{brand.conversion}
                        </td>
                        {/* 14. Ulke */}
                        <td className="px-3 py-3 whitespace-nowrap text-center">
                          {brand.country ? (
                            <span className="text-sm">
                              {FLAG[brand.country.toUpperCase()] || ""} {brand.country.toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        {/* 15. Detay */}
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); setDetailBrand(brand); }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#667eea]/10 text-[#667eea] rounded-md text-xs font-medium hover:bg-[#667eea]/20 transition-colors"
                          >
                            <Eye size={12} />
                            Detayli Gor
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
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Nis Ozeti</h3>
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
      {detailBrand && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetailBrand(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-[#0D1B2A] text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">{detailBrand.brand_name}</h2>
                <a
                  href={detailBrand.website.startsWith("http") ? detailBrand.website : `https://${detailBrand.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#4facfe] text-sm hover:underline inline-flex items-center gap-1"
                >
                  {detailBrand.website} <ExternalLink size={12} />
                </a>
              </div>
              <button onClick={() => setDetailBrand(null)} className="text-gray-400 hover:text-white transition-colors">
                <X size={22} />
              </button>
            </div>

            {/* Content grid */}
            <div className="p-6 grid grid-cols-2 gap-4">
              {/* Revenue */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="text-xs text-emerald-600 font-medium mb-1">Tahmini Ciro</p>
                <p className="text-2xl font-bold text-[#27AE60]">${formatNumber(detailBrand.estimated_revenue ?? 0)}</p>
              </div>
              {/* Traffic */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-xs text-blue-600 font-medium mb-1">Aylik Trafik</p>
                <p className="text-2xl font-bold text-[#2980B9]">{formatNumber(detailBrand.estimated_traffic)}</p>
              </div>
              {/* AOV */}
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <p className="text-xs text-purple-600 font-medium mb-1">AOV</p>
                <p className="text-2xl font-bold text-purple-700">${detailBrand.aov}</p>
              </div>
              {/* TQS / Conversion */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs text-amber-600 font-medium mb-1">TQS / Donusum</p>
                <p className="text-2xl font-bold text-amber-700">{detailBrand.tqs} <span className="text-base font-medium text-gray-500">/ %{detailBrand.conversion}</span></p>
              </div>
              {/* Country & Founded */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-medium mb-1">Ulke & Kurulus</p>
                <p className="text-lg font-bold text-gray-800">
                  {FLAG[detailBrand.country?.toUpperCase()] || ""} {detailBrand.country?.toUpperCase() || "-"} <span className="text-gray-400 font-normal">|</span> {detailBrand.founded || "-"}
                </p>
              </div>
              {/* Category & Niche */}
              <div className="bg-[#667eea]/5 border border-[#667eea]/20 rounded-xl p-4">
                <p className="text-xs text-[#667eea] font-medium mb-1">Kategori / Nis</p>
                <p className="text-lg font-bold text-gray-800">{detailBrand.category} <span className="text-gray-400 font-normal">|</span> {detailBrand.niche}</p>
              </div>
            </div>

            {/* Text sections */}
            <div className="px-6 pb-6 space-y-4">
              {/* Insight */}
              {detailBrand.insight && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wide">One Cikan Ozellik</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{detailBrand.insight}</p>
                </div>
              )}
              {/* History */}
              {detailBrand.history && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wide">Marka Hikayesi</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{detailBrand.history}</p>
                </div>
              )}
              {/* Growth Method */}
              {detailBrand.growth_method && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wide">Buyume Yontemi</p>
                  <div className="flex flex-wrap gap-2">
                    {detailBrand.growth_method.split(",").filter(Boolean).map((g, i) => (
                      <span key={i} className="inline-block bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-medium">{g.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* Marketing Angles */}
              {detailBrand.marketing_angles && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wide">Pazarlama Acilari</p>
                  <div className="flex flex-wrap gap-2">
                    {detailBrand.marketing_angles.split(",").filter(Boolean).map((a, i) => (
                      <span key={i} className="inline-block bg-purple-100 text-purple-700 px-2.5 py-1 rounded-lg text-xs font-medium">{a.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* Meta Ads */}
              {detailBrand.meta_ads_url && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wide">Meta Ads</p>
                  <a
                    href={detailBrand.meta_ads_url.startsWith("http") ? detailBrand.meta_ads_url : `https://${detailBrand.meta_ads_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    Meta Reklam Kutuphanesi <ExternalLink size={12} />
                  </a>
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
              <h2 className="text-lg font-semibold">Klasore Kaydet</h2>
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
                    Klasor Sec
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
                    Yeni Klasor
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Klasor adi..."
                      className="flex-1 py-2 px-3 border border-gray-200 rounded-lg text-sm"
                    />
                    <button
                      onClick={handleCreateFolder}
                      className="px-4 py-2 bg-[#667eea] text-white rounded-lg text-sm"
                    >
                      Olustur
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowSaveModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm"
                  >
                    Iptal
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-[#27AE60] text-white rounded-lg text-sm"
                  >
                    {selected.size} Markayi Kaydet
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
