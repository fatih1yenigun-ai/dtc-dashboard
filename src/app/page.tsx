"use client";

import { useState } from "react";
import {
  Search,
  Loader2,
  ExternalLink,
  Download,
  Save,
  CheckSquare,
  Square,
} from "lucide-react";
import { loadFolders, createFolder, saveBrandsBulk, type BrandData } from "@/lib/supabase";

interface BrandResult {
  brand_name: string;
  website: string;
  category: string;
  aov: string;
  insight: string;
  meta_ads_url: string;
}

export default function HomePage() {
  const [keyword, setKeyword] = useState("");
  const [count, setCount] = useState(10);
  const [niche, setNiche] = useState("fashion");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BrandResult[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [newFolderName, setNewFolderName] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const niches = [
    { value: "fashion", label: "Moda" },
    { value: "beauty", label: "Guzellik & Bakim" },
    { value: "food_bev", label: "Yiyecek & Icecek" },
    { value: "electronics", label: "Elektronik" },
    { value: "luxury", label: "Luks" },
    { value: "home", label: "Ev & Yasam" },
    { value: "health", label: "Saglik" },
    { value: "pet", label: "Evcil Hayvan" },
  ];

  async function handleSearch() {
    if (!keyword.trim()) return;
    setLoading(true);
    setResults([]);
    setSelected(new Set());
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, count, niche }),
      });
      const data = await res.json();
      if (data.brands) {
        setResults(data.brands);
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
      setFolders((prev) => prev.includes(name) ? prev : [...prev, name]);
      setSelectedFolder(name);
      setNewFolderName("");
    }
  }

  async function handleSave() {
    const folder = newFolderName.trim() || selectedFolder;
    if (!folder || selected.size === 0) return;

    // Convert BrandResult to BrandData format
    const brandsToSave: BrandData[] = Array.from(selected).map((i) => {
      const r = results[i];
      return {
        Marka: r.brand_name,
        "Web Sitesi": r.website,
        Kategori: r.category,
        "AOV ($)": parseFloat(r.aov) || 0,
        "Öne Çıkan Özellik": r.insight,
        "Meta Ads": r.meta_ads_url,
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
    const rows = results.map((b) =>
      [b.brand_name, b.website, b.category, b.aov, b.insight, b.meta_ads_url].join(",")
    );
    const csv =
      "Marka,Website,Kategori,AOV,Insight,Meta Ads\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dtc-research-${keyword}.csv`;
    a.click();
  }

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

          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nis
            </label>
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30"
            >
              {niches.map((n) => (
                <option key={n.value} value={n.value}>
                  {n.label}
                </option>
              ))}
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

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {results.map((brand, idx) => (
              <div
                key={idx}
                onClick={() => toggleSelect(idx)}
                className={`bg-white rounded-xl border p-5 cursor-pointer card-hover ${
                  selected.has(idx)
                    ? "border-[#667eea] ring-2 ring-[#667eea]/20"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {brand.brand_name}
                    </h3>
                    <a
                      href={
                        brand.website.startsWith("http")
                          ? brand.website
                          : `https://${brand.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm text-[#2980B9] hover:underline flex items-center gap-1"
                    >
                      {brand.website} <ExternalLink size={12} />
                    </a>
                  </div>
                  {selected.has(idx) ? (
                    <CheckSquare size={20} className="text-[#667eea]" />
                  ) : (
                    <Square size={20} className="text-gray-300" />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-[#667eea]/10 text-[#667eea] px-2 py-0.5 rounded-full font-medium">
                      {brand.category}
                    </span>
                    <span className="text-xs bg-[#27AE60]/10 text-[#27AE60] px-2 py-0.5 rounded-full font-medium">
                      AOV: {brand.aov}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {brand.insight}
                  </p>
                  <a
                    href={brand.meta_ads_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    Meta Ads <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Klasöre Kaydet</h2>
              <button onClick={() => setShowSaveModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>

            {saveMsg ? (
              <p className={`text-center font-medium py-4 ${saveMsg.includes("Hata") ? "text-red-500" : "text-[#27AE60]"}`}>
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
