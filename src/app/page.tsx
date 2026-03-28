"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import { loadFolders, createFolder, saveBrandsBulk, type BrandData } from "@/lib/supabase";
import { tqsToConversion, estimateRevenue } from "@/lib/tqs";

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
  // Niche summary (only on first brand)
  niche_summary?: string;
  niche_pros?: string;
  niche_cons?: string;
  // Calculated:
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

export default function HomePage() {
  const [keyword, setKeyword] = useState("");
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BrandResult[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [newFolderName, setNewFolderName] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("estimated_revenue");
  const [sortAsc, setSortAsc] = useState(false);

  // Niche summary from first brand
  const nicheSummary = results.length > 0 ? results[0].niche_summary : undefined;
  const nichePros = results.length > 0 ? results[0].niche_pros : undefined;
  const nicheCons = results.length > 0 ? results[0].niche_cons : undefined;

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

  // Category distribution for pie chart
  const categoryDist = useMemo(() => {
    const counts: Record<string, number> = {};
    results.forEach((b) => {
      const cat = b.category || "Diger";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const total = results.length || 1;
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
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

  // Colors for pie chart
  const PIE_COLORS = [
    "#667eea", "#764ba2", "#27AE60", "#E67E22", "#2980B9",
    "#E74C3C", "#1ABC9C", "#9B59B6", "#F39C12", "#34495E",
    "#16A085", "#C0392B",
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

  async function handleSearch() {
    if (!keyword.trim()) return;
    setLoading(true);
    setResults([]);
    setSelected(new Set());
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, count }),
      });
      const data = await res.json();
      if (data.brands) {
        const enriched: BrandResult[] = data.brands.map((b: BrandResult) => {
          const tqs = 5.5;
          const conversion = tqsToConversion(tqs, b.niche);
          const rev = estimateRevenue(b.estimated_traffic, b.aov, conversion);
          return {
            ...b,
            tqs,
            conversion,
            estimated_revenue: rev,
          };
        });
        setResults(enriched);
      }
    } catch (err) {
      console.error("Research error:", err);
    } finally {
      setLoading(false);
    }
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
      const f = await loadFolders();
      setFolders(f);
      if (f.length > 0 && !selectedFolder) setSelectedFolder(f[0]);
    } catch {
      setFolders(["Genel"]);
    }
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    const name = newFolderName.trim();
    const ok = await createFolder(name);
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
        "Tahmini Ayl\u0131k Gelir ($)": b.estimated_revenue,
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
      if (newFolderName.trim()) await createFolder(newFolderName.trim());
      const added = await saveBrandsBulk(folder, brandsToSave);
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
      "Marka", "Website", "Ulke", "Kategori", "Nis", "AOV ($)",
      "Aylik Trafik", "TQS", "Donusum %", "Tahmini Aylik Gelir ($)",
      "Buyume Yontemi", "Pazarlama Acilari",
      "One Cikan Ozellik", "Marka Hikayesi", "Kurulus Yili", "Meta Ads",
    ];
    const rows = results.map((b) =>
      [
        b.brand_name,
        b.website,
        b.country,
        b.category,
        b.niche,
        b.aov,
        b.estimated_traffic,
        b.tqs ?? 5.5,
        b.conversion ?? 0,
        b.estimated_revenue ?? 0,
        `"${(b.growth_method || "").replace(/"/g, '""')}"`,
        `"${(b.marketing_angles || "").replace(/"/g, '""')}"`,
        `"${(b.insight || "").replace(/"/g, '""')}"`,
        `"${(b.history || "").replace(/"/g, '""')}"`,
        b.founded,
        b.meta_ads_url,
      ].join(",")
    );
    const csv = headers.join(",") + "\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dtc-research-${keyword}.csv`;
    a.click();
  }

  // Build CSS pie chart conic-gradient
  const pieGradient = useMemo(() => {
    let cumulative = 0;
    const stops: string[] = [];
    categoryDist.forEach((cat, i) => {
      const color = PIE_COLORS[i % PIE_COLORS.length];
      stops.push(`${color} ${cumulative}% ${cumulative + cat.pct}%`);
      cumulative += cat.pct;
    });
    return `conic-gradient(${stops.join(", ")})`;
  }, [categoryDist]);

  return (
    <div>
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
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
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
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={loading || !keyword.trim()}
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
      </div>

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
            {/* Left: Pie chart - Category distribution */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Kategori Dagilimi</h3>
              <div className="flex items-center gap-6">
                <div
                  className="w-32 h-32 rounded-full flex-shrink-0"
                  style={{ background: pieGradient }}
                />
                <div className="flex flex-col gap-1.5 text-xs">
                  {categoryDist.map((cat, i) => (
                    <div key={cat.name} className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-gray-700">{cat.name}</span>
                      <span className="text-gray-400">({cat.count} - %{cat.pct})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Marketing angles bar chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Pazarlama Acilari &amp; Talep</h3>
              {angleStats.length === 0 ? (
                <p className="text-xs text-gray-400">Veri yok</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {angleStats.slice(0, 8).map((angle) => (
                    <div key={angle.name} className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-32 flex-shrink-0 truncate" title={angle.name}>
                        {angle.name}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-5 relative overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#667eea] to-[#764ba2]"
                          style={{ width: `${Math.max(10, (angle.count / maxAngleCount) * 100)}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white mix-blend-difference">
                          {angle.count}x
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 flex-shrink-0 w-16 text-right">
                        Ort. ${angle.avgAov}
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[1600px]">
                <thead>
                  <tr className="bg-[#0D1B2A] text-white">
                    <th className="sticky left-0 z-10 bg-[#0D1B2A] px-3 py-3 text-left w-10">
                      <button onClick={toggleAll}>
                        {selected.size === results.length ? (
                          <CheckSquare size={16} className="text-[#667eea]" />
                        ) : (
                          <Square size={16} className="text-gray-400" />
                        )}
                      </button>
                    </th>
                    <th
                      className="sticky left-10 z-10 bg-[#0D1B2A] px-3 py-3 text-left font-semibold cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("brand_name")}
                    >
                      Marka <SortIcon col="brand_name" />
                    </th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Web Sitesi</th>
                    <th
                      className="px-3 py-3 text-left font-semibold cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("country")}
                    >
                      Ulke <SortIcon col="country" />
                    </th>
                    <th
                      className="px-3 py-3 text-left font-semibold cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("category")}
                    >
                      Kategori <SortIcon col="category" />
                    </th>
                    <th
                      className="px-3 py-3 text-right font-semibold cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("aov")}
                    >
                      AOV <SortIcon col="aov" />
                    </th>
                    <th
                      className="px-3 py-3 text-right font-semibold cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("estimated_traffic")}
                    >
                      Aylik Trafik <SortIcon col="estimated_traffic" />
                    </th>
                    <th
                      className="px-3 py-3 text-center font-semibold cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("tqs")}
                    >
                      TQS <SortIcon col="tqs" />
                    </th>
                    <th
                      className="px-3 py-3 text-right font-semibold cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("conversion")}
                    >
                      Donusum % <SortIcon col="conversion" />
                    </th>
                    <th
                      className="px-3 py-3 text-right font-semibold cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("estimated_revenue")}
                    >
                      Tahmini Gelir <SortIcon col="estimated_revenue" />
                    </th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Buyume Yontemi</th>
                    <th
                      className="px-3 py-3 text-center font-semibold cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("founded")}
                    >
                      Kurulus <SortIcon col="founded" />
                    </th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">One Cikan Ozellik</th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Pazarlama Acilari</th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Meta Ads</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedResults.map((brand, idx) => {
                    // Find original index for selection
                    const origIdx = results.indexOf(brand);
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
                        <td className="sticky left-0 z-10 px-3 py-3" style={{ backgroundColor: "inherit" }}>
                          {selected.has(origIdx) ? (
                            <CheckSquare size={16} className="text-[#667eea]" />
                          ) : (
                            <Square size={16} className="text-gray-300" />
                          )}
                        </td>
                        <td className="sticky left-10 z-10 px-3 py-3 font-bold text-gray-900 whitespace-nowrap" style={{ backgroundColor: "inherit" }}>
                          {brand.brand_name}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <a
                            href={
                              brand.website.startsWith("http")
                                ? brand.website
                                : `https://${brand.website}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[#2980B9] hover:underline inline-flex items-center gap-1"
                          >
                            {brand.website}
                            <ExternalLink size={12} />
                          </a>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-center">
                          {brand.country ? (
                            <span className="text-sm">
                              {FLAG[brand.country.toUpperCase()] || ""} {brand.country.toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-block bg-[#667eea]/10 text-[#667eea] px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
                            {brand.category}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                          ${brand.aov}
                        </td>
                        <td className="px-3 py-3 text-right font-medium text-[#2980B9] whitespace-nowrap">
                          {formatNumber(brand.estimated_traffic)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="inline-block bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-semibold">
                            {brand.tqs}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right font-medium text-gray-700 whitespace-nowrap">
                          %{brand.conversion}
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-[#27AE60] whitespace-nowrap">
                          ${formatNumber(brand.estimated_revenue ?? 0)}
                        </td>
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
                        <td className="px-3 py-3 text-center text-gray-600 whitespace-nowrap">
                          {brand.founded || "-"}
                        </td>
                        <td className="px-3 py-3 text-gray-600 max-w-[200px]">
                          <span title={brand.insight}>
                            {truncate(brand.insight, 60)}
                          </span>
                        </td>
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
                              className="text-blue-600 hover:underline text-xs inline-flex items-center gap-1"
                            >
                              Gor <ExternalLink size={10} />
                            </a>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Nis Ozeti Section */}
          {nicheSummary && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Nis Ozeti</h3>
              <p className="text-sm text-gray-700 mb-4 leading-relaxed">{nicheSummary}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {nichePros && (
                  <div>
                    <h4 className="text-sm font-semibold text-[#27AE60] mb-2">Avantajlar</h4>
                    <ul className="space-y-1">
                      {nichePros.split(",").map((pro, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-[#27AE60] mt-0.5 flex-shrink-0">&#x2022;</span>
                          {pro.trim()}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {nicheCons && (
                  <div>
                    <h4 className="text-sm font-semibold text-[#E74C3C] mb-2">Dezavantajlar</h4>
                    <ul className="space-y-1">
                      {nicheCons.split(",").map((con, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-[#E74C3C] mt-0.5 flex-shrink-0">&#x2022;</span>
                          {con.trim()}
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
