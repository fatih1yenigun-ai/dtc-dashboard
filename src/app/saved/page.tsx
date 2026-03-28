"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  FolderOpen,
  Plus,
  Trash2,
  Download,
  ArrowRight,
  ExternalLink,
  X,
  CheckSquare,
  Square,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  Table,
} from "lucide-react";
import {
  loadFolders,
  createFolder,
  deleteFolder,
  loadBrands,
  removeBrandsByIds,
  moveBrands,
  type SavedBrand,
} from "@/lib/supabase";

const FLAG: Record<string, string> = {
  US: "\u{1F1FA}\u{1F1F8}", UK: "\u{1F1EC}\u{1F1E7}", DE: "\u{1F1E9}\u{1F1EA}", FR: "\u{1F1EB}\u{1F1F7}",
  TR: "\u{1F1F9}\u{1F1F7}", AU: "\u{1F1E6}\u{1F1FA}", KR: "\u{1F1F0}\u{1F1F7}", JP: "\u{1F1EF}\u{1F1F5}",
  CA: "\u{1F1E8}\u{1F1E6}", NL: "\u{1F1F3}\u{1F1F1}", SE: "\u{1F1F8}\u{1F1EA}", DK: "\u{1F1E9}\u{1F1F0}",
  IT: "\u{1F1EE}\u{1F1F9}", ES: "\u{1F1EA}\u{1F1F8}", BR: "\u{1F1E7}\u{1F1F7}", IN: "\u{1F1EE}\u{1F1F3}",
  CN: "\u{1F1E8}\u{1F1F3}", IL: "\u{1F1EE}\u{1F1F1}",
};

const COLUMN_COLORS = [
  "#667eea", "#764ba2", "#f093fb", "#4facfe",
  "#00f2fe", "#43e97b", "#fa709a", "#fee140",
];

function formatNumber(n: number): string {
  return n.toLocaleString("tr-TR");
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function getBrandName(brand: SavedBrand): string {
  const d = brand.brand_data;
  return (d?.Marka as string) || (d?.brand as string) || "Bilinmeyen";
}

function getBrandWebsite(brand: SavedBrand): string {
  const d = brand.brand_data;
  return (d?.["Web Sitesi"] as string) || (d?.website as string) || "";
}

function getBrandCategory(brand: SavedBrand): string {
  const d = brand.brand_data;
  return (d?.Kategori as string) || (d?.category as string) || "";
}

function getBrandAov(brand: SavedBrand): number | null {
  const d = brand.brand_data;
  const aov = d?.["AOV ($)"] ?? d?.aov;
  if (aov == null) return null;
  return typeof aov === "number" ? aov : null;
}

function getBrandAovDisplay(brand: SavedBrand): string {
  const aov = getBrandAov(brand);
  return aov != null ? `$${aov}` : "-";
}

function getBrandInsight(brand: SavedBrand): string {
  const d = brand.brand_data;
  return (d?.["Öne Çıkan Özellik"] as string) || (d?.insight as string) || "";
}

function getBrandMetaAds(brand: SavedBrand): string {
  const d = brand.brand_data;
  return (d?.["Meta Ads"] as string) || (d?.meta_ads_url as string) || "";
}

function getBrandTraffic(brand: SavedBrand): number | null {
  return (brand.brand_data?.["Aylık Trafik"] as number) ?? null;
}

function getBrandTQS(brand: SavedBrand): number | null {
  return (brand.brand_data?.TQS as number) ?? null;
}

function getBrandRevenue(brand: SavedBrand): number | null {
  return (brand.brand_data?.["Tahmini Aylık Gelir ($)"] as number) ?? null;
}

function getBrandCountry(brand: SavedBrand): string {
  return (brand.brand_data?.["Ülke"] as string) || "";
}

function getBrandGrowth(brand: SavedBrand): string {
  return (brand.brand_data?.["Büyüme Yöntemi"] as string) || "";
}

function getBrandFounded(brand: SavedBrand): number | null {
  return (brand.brand_data?.["Kuruluş Yılı"] as number) ?? null;
}

function getBrandConversion(brand: SavedBrand): number | null {
  return (brand.brand_data?.["Dönüşüm %"] as number) ?? null;
}

function getBrandMarketingAngles(brand: SavedBrand): string[] {
  const raw = (brand.brand_data?.["Pazarlama Açıları"] as string) || "";
  if (!raw.trim()) return [];
  return raw.split(",").map((a) => a.trim()).filter(Boolean);
}

type SortKey = "revenue" | "traffic" | "tqs" | "aov" | "founded" | "name" | "conversion";
type ViewMode = "kanban" | "table";

// Kanban column type
interface KanbanColumn {
  angle: string;
  brands: SavedBrand[];
  totalRevenue: number;
  color: string;
}

export default function SavedPage() {
  const [folders, setFolders] = useState<string[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [brands, setBrands] = useState<SavedBrand[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<Set<number>>(new Set());
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [sortAsc, setSortAsc] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");

  const fetchFolders = useCallback(async () => {
    try {
      const f = await loadFolders();
      setFolders(f);
      if (f.length > 0 && activeFolder === null) {
        setActiveFolder(f[0]);
      }
    } catch {
      // ignore
    }
  }, [activeFolder]);

  const fetchBrands = useCallback(async () => {
    if (activeFolder === null) {
      setBrands([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const b = await loadBrands(activeFolder);
      setBrands(b);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [activeFolder]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    fetchBrands();
    setSelectedBrands(new Set());
  }, [fetchBrands]);

  // Sorted brands for table view
  const sortedBrands = useMemo(() => {
    const sorted = [...brands];
    sorted.sort((a, b) => {
      let va: number | string = 0;
      let vb: number | string = 0;
      switch (sortKey) {
        case "name":
          va = getBrandName(a).toLowerCase();
          vb = getBrandName(b).toLowerCase();
          break;
        case "revenue":
          va = getBrandRevenue(a) ?? 0;
          vb = getBrandRevenue(b) ?? 0;
          break;
        case "traffic":
          va = getBrandTraffic(a) ?? 0;
          vb = getBrandTraffic(b) ?? 0;
          break;
        case "tqs":
          va = getBrandTQS(a) ?? 0;
          vb = getBrandTQS(b) ?? 0;
          break;
        case "aov":
          va = getBrandAov(a) ?? 0;
          vb = getBrandAov(b) ?? 0;
          break;
        case "founded":
          va = getBrandFounded(a) ?? 0;
          vb = getBrandFounded(b) ?? 0;
          break;
        case "conversion":
          va = getBrandConversion(a) ?? 0;
          vb = getBrandConversion(b) ?? 0;
          break;
      }
      if (typeof va === "string" && typeof vb === "string") {
        return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
    return sorted;
  }, [brands, sortKey, sortAsc]);

  // Kanban columns grouped by marketing angle
  const kanbanColumns = useMemo((): KanbanColumn[] => {
    const angleMap = new Map<string, SavedBrand[]>();

    brands.forEach((brand) => {
      const angles = getBrandMarketingAngles(brand);
      if (angles.length === 0) {
        const existing = angleMap.get("Diğer") || [];
        existing.push(brand);
        angleMap.set("Diğer", existing);
      } else {
        angles.forEach((angle) => {
          const existing = angleMap.get(angle) || [];
          existing.push(brand);
          angleMap.set(angle, existing);
        });
      }
    });

    const columns: KanbanColumn[] = [];
    let colorIndex = 0;
    angleMap.forEach((columnBrands, angle) => {
      const totalRevenue = columnBrands.reduce((sum, b) => sum + (getBrandRevenue(b) ?? 0), 0);
      columns.push({
        angle,
        brands: columnBrands,
        totalRevenue,
        color: COLUMN_COLORS[colorIndex % COLUMN_COLORS.length],
      });
      colorIndex++;
    });

    // Sort columns by total revenue descending
    columns.sort((a, b) => b.totalRevenue - a.totalRevenue);

    return columns;
  }, [brands]);

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

  async function handleCreateFolder() {
    const name = newFolderName.trim();
    if (!name) return;
    try {
      const ok = await createFolder(name);
      if (ok) {
        setFolders((prev) => [...prev, name]);
        setActiveFolder(name);
        setNewFolderName("");
      }
    } catch {
      // ignore
    }
  }

  async function handleDeleteFolder() {
    if (activeFolder === null) return;
    if (
      !confirm(
        "Bu klasörü ve içindeki tüm markaları silmek istediğinize emin misiniz?"
      )
    )
      return;
    try {
      await deleteFolder(activeFolder);
      const remaining = folders.filter((f) => f !== activeFolder);
      setFolders(remaining);
      setActiveFolder(remaining.length > 0 ? remaining[0] : null);
    } catch {
      // ignore
    }
  }

  async function handleRemoveBrands() {
    if (selectedBrands.size === 0) return;
    try {
      await removeBrandsByIds(Array.from(selectedBrands));
      await fetchBrands();
      setSelectedBrands(new Set());
    } catch {
      // ignore
    }
  }

  async function handleMoveBrands(targetFolder: string) {
    const ids = Array.from(selectedBrands);
    try {
      await moveBrands(ids, targetFolder);
      setShowMoveModal(false);
      setSelectedBrands(new Set());
      await fetchBrands();
    } catch {
      // ignore
    }
  }

  function toggleBrand(id: number) {
    const next = new Set(selectedBrands);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedBrands(next);
  }

  function toggleAll() {
    if (selectedBrands.size === brands.length) {
      setSelectedBrands(new Set());
    } else {
      setSelectedBrands(new Set(brands.map((b) => b.id)));
    }
  }

  function exportCSV() {
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const header = [
      "Marka", "Web Sitesi", "Ulke", "Kategori", "AOV ($)",
      "Aylik Trafik", "TQS", "Donusum %", "Tahmini Aylik Gelir ($)",
      "Buyume Yontemi", "Pazarlama Acilari",
      "One Cikan Ozellik", "Marka Hikayesi", "Kurulus Yili",
      "Nis", "Meta Ads",
    ].join(",");
    const rows = brands.map((b) => {
      const d = b.brand_data || {};
      return [
        escape(getBrandName(b)),
        escape(getBrandWebsite(b)),
        escape(getBrandCountry(b)),
        escape(getBrandCategory(b)),
        getBrandAov(b) ?? "",
        getBrandTraffic(b) ?? "",
        getBrandTQS(b) ?? "",
        getBrandConversion(b) ?? "",
        getBrandRevenue(b) ?? "",
        escape(getBrandGrowth(b)),
        escape((d["Pazarlama Açıları"] as string) || ""),
        escape(getBrandInsight(b)),
        escape((d["Marka Hikayesi"] as string) || ""),
        getBrandFounded(b) ?? "",
        escape((d["Niş"] as string) || (d?.Nis as string) || ""),
        escape(getBrandMetaAds(b)),
      ].join(",");
    });
    const csv = "\uFEFF" + header + "\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeFolder ?? "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---- Kanban Card Component ----
  function BrandCard({ brand }: { brand: SavedBrand }) {
    const website = getBrandWebsite(brand);
    const country = getBrandCountry(brand);
    const category = getBrandCategory(brand);
    const aov = getBrandAov(brand);
    const revenue = getBrandRevenue(brand);
    const tqs = getBrandTQS(brand);
    const conversion = getBrandConversion(brand);
    const growth = getBrandGrowth(brand);
    const isSelected = selectedBrands.has(brand.id);

    return (
      <div
        className={`bg-white rounded-lg p-3 shadow-sm border mb-2 hover:shadow-md transition-shadow ${
          isSelected ? "border-[#667eea] ring-1 ring-[#667eea]/30" : "border-gray-100"
        }`}
      >
        <div className="flex items-start justify-between mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => toggleBrand(brand.id)}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              {isSelected ? (
                <CheckSquare size={14} className="text-[#667eea]" />
              ) : (
                <Square size={14} />
              )}
            </button>
            {website ? (
              <a
                href={website.startsWith("http") ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-sm text-gray-900 hover:text-[#667eea] truncate"
                title={getBrandName(brand)}
              >
                {getBrandName(brand)}
              </a>
            ) : (
              <span className="font-bold text-sm text-gray-900 truncate">
                {getBrandName(brand)}
              </span>
            )}
          </div>
          {country && (
            <span className="text-xs flex-shrink-0 ml-1">
              {FLAG[country.toUpperCase()] || country.toUpperCase()}
            </span>
          )}
        </div>

        {category && (
          <span className="inline-block text-[10px] bg-[#667eea]/10 text-[#667eea] px-1.5 py-0.5 rounded-full mb-2">
            {category}
          </span>
        )}

        <div className="flex items-center gap-3 text-[11px] text-gray-600 mb-1.5">
          {aov != null && (
            <span>
              <span className="text-gray-400">AOV:</span>{" "}
              <span className="font-semibold text-gray-800">${aov}</span>
            </span>
          )}
          {revenue != null && (
            <span>
              <span className="text-gray-400">Ciro:</span>{" "}
              <span className="font-semibold text-emerald-600">{formatCompact(revenue)}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-gray-600 mb-1.5">
          {tqs != null && (
            <span>
              <span className="text-gray-400">TQS:</span>{" "}
              <span className="font-semibold text-amber-700">{tqs}</span>
            </span>
          )}
          {conversion != null && (
            <span>
              <span className="text-gray-400">Conv:</span>{" "}
              <span className="font-semibold text-gray-800">{conversion}%</span>
            </span>
          )}
        </div>

        {growth && (
          <div className="flex flex-wrap gap-1 mt-1">
            {growth.split(",").filter(Boolean).slice(0, 3).map((g, gi) => (
              <span
                key={gi}
                className="inline-block bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] font-medium whitespace-nowrap"
              >
                {g.trim()}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Kaydedilenler</h1>
        <p className="text-gray-500 mt-1">
          Kayıtlı markalarınızı klasörler halinde yönetin
        </p>
      </div>

      {/* Folder tabs + create */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {folders.map((name) => (
            <button
              key={name}
              onClick={() => setActiveFolder(name)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFolder === name
                  ? "bg-[#667eea] text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <FolderOpen size={14} />
              {name}
            </button>
          ))}
          {folders.length === 0 && (
            <span className="text-sm text-gray-400">
              Henüz klasör yok. Aşağıdan oluşturun.
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
            placeholder="Yeni klasör adı..."
            className="flex-1 py-2 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30"
          />
          <button
            onClick={handleCreateFolder}
            className="flex items-center gap-1 px-4 py-2 bg-[#667eea] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={14} />
            Oluştur
          </button>
          {activeFolder && (
            <button
              onClick={handleDeleteFolder}
              className="flex items-center gap-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
            >
              <Trash2 size={14} />
              Klasörü Sil
            </button>
          )}
        </div>
      </div>

      {/* View toggle + Actions bar */}
      {brands.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {selectedBrands.size > 0
                ? `${selectedBrands.size} / ${brands.length} seçili`
                : `${brands.length} marka`}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRemoveBrands}
                disabled={selectedBrands.size === 0}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 size={12} />
                Seçilenleri Sil
              </button>
              <button
                onClick={() => setShowMoveModal(true)}
                disabled={selectedBrands.size === 0}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowRight size={12} />
                Taşı
              </button>
              <button
                onClick={exportCSV}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
              >
                <Download size={12} />
                CSV İndir
              </button>
            </div>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === "kanban"
                  ? "bg-white text-[#667eea] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <LayoutGrid size={13} />
              Kanban
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === "table"
                  ? "bg-white text-[#667eea] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Table size={13} />
              Tablo
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Yükleniyor...</div>
      ) : brands.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FolderOpen size={48} className="mx-auto mb-3 opacity-50" />
          <p className="text-base">Bu klasörde henüz marka yok</p>
        </div>
      ) : viewMode === "kanban" ? (
        /* ========== KANBAN VIEW ========== */
        <div className="flex overflow-x-auto gap-4 pb-4">
          {kanbanColumns.map((col) => {
            // Count unique brands
            const uniqueIds = new Set(col.brands.map((b) => b.id));
            return (
              <div
                key={col.angle}
                className="min-w-[280px] max-w-[300px] flex-shrink-0 flex flex-col"
              >
                {/* Column header */}
                <div
                  className="rounded-t-xl px-3 py-2.5 flex items-center justify-between"
                  style={{ backgroundColor: col.color + "18" }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: col.color }}
                    />
                    <span
                      className="text-sm font-semibold truncate"
                      style={{ color: col.color }}
                      title={col.angle}
                    >
                      {col.angle}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-medium text-gray-500 bg-white/80 px-1.5 py-0.5 rounded-full">
                      {uniqueIds.size}
                    </span>
                    {col.totalRevenue > 0 && (
                      <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                        {formatCompact(col.totalRevenue)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Column body */}
                <div className="bg-[#f1f5f9] rounded-b-xl p-2 flex-1 min-h-[200px] max-h-[70vh] overflow-y-auto">
                  {col.brands.map((brand) => (
                    <BrandCard key={`${col.angle}-${brand.id}`} brand={brand} />
                  ))}
                </div>
              </div>
            );
          })}

          {kanbanColumns.length === 0 && (
            <div className="w-full text-center py-12 text-gray-400">
              <p className="text-sm">Pazarlama açısı verisi bulunamadı</p>
            </div>
          )}
        </div>
      ) : (
        /* ========== TABLE VIEW ========== */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1400px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-3 px-4 text-left font-medium text-gray-500 w-10">
                    <button onClick={toggleAll} className="text-gray-400 hover:text-gray-600">
                      {selectedBrands.size === brands.length && brands.length > 0 ? (
                        <CheckSquare size={16} />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                  </th>
                  <th
                    className="py-3 px-4 text-left font-medium text-gray-500 cursor-pointer select-none whitespace-nowrap"
                    onClick={() => handleSort("name")}
                  >
                    Marka <SortIcon col="name" />
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500 whitespace-nowrap">
                    Web Sitesi
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500 whitespace-nowrap">
                    Ulke
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500 whitespace-nowrap">
                    Kategori
                  </th>
                  <th
                    className="py-3 px-4 text-right font-medium text-gray-500 cursor-pointer select-none whitespace-nowrap"
                    onClick={() => handleSort("aov")}
                  >
                    AOV <SortIcon col="aov" />
                  </th>
                  <th
                    className="py-3 px-4 text-right font-medium text-gray-500 cursor-pointer select-none whitespace-nowrap"
                    onClick={() => handleSort("traffic")}
                  >
                    Aylik Trafik <SortIcon col="traffic" />
                  </th>
                  <th
                    className="py-3 px-4 text-center font-medium text-gray-500 cursor-pointer select-none whitespace-nowrap"
                    onClick={() => handleSort("tqs")}
                  >
                    TQS <SortIcon col="tqs" />
                  </th>
                  <th
                    className="py-3 px-4 text-right font-medium text-gray-500 cursor-pointer select-none whitespace-nowrap"
                    onClick={() => handleSort("conversion")}
                  >
                    Donusum % <SortIcon col="conversion" />
                  </th>
                  <th
                    className="py-3 px-4 text-right font-medium text-gray-500 cursor-pointer select-none whitespace-nowrap"
                    onClick={() => handleSort("revenue")}
                  >
                    Tahmini Gelir <SortIcon col="revenue" />
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500 whitespace-nowrap">
                    Buyume Yontemi
                  </th>
                  <th
                    className="py-3 px-4 text-center font-medium text-gray-500 cursor-pointer select-none whitespace-nowrap"
                    onClick={() => handleSort("founded")}
                  >
                    Kurulus <SortIcon col="founded" />
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500 whitespace-nowrap">
                    One Cikan Ozellik
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedBrands.map((brand, idx) => {
                  const website = getBrandWebsite(brand);
                  const country = getBrandCountry(brand);
                  const category = getBrandCategory(brand);
                  const traffic = getBrandTraffic(brand);
                  const tqs = getBrandTQS(brand);
                  const conversion = getBrandConversion(brand);
                  const revenue = getBrandRevenue(brand);
                  const growth = getBrandGrowth(brand);
                  const founded = getBrandFounded(brand);
                  const insight = getBrandInsight(brand);

                  return (
                    <tr
                      key={brand.id}
                      className={`border-b border-gray-100 transition-colors ${
                        selectedBrands.has(brand.id)
                          ? "bg-[#667eea]/5"
                          : idx % 2 === 0
                          ? "bg-white"
                          : "bg-gray-50/50"
                      } hover:bg-[#667eea]/10`}
                    >
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleBrand(brand.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {selectedBrands.has(brand.id) ? (
                            <CheckSquare size={16} className="text-[#667eea]" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900 whitespace-nowrap">
                        {getBrandName(brand)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {website ? (
                          <a
                            href={
                              website.startsWith("http")
                                ? website
                                : `https://${website}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#2980B9] hover:underline flex items-center gap-1"
                          >
                            {website.replace(/^https?:\/\//, "")}
                            <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        {country ? (
                          <span className="text-sm">
                            {FLAG[country.toUpperCase()] || ""} {country.toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {category ? (
                          <span className="text-xs bg-[#667eea]/10 text-[#667eea] px-2 py-0.5 rounded-full">
                            {category}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900 whitespace-nowrap">
                        {getBrandAovDisplay(brand)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-[#2980B9] whitespace-nowrap">
                        {traffic != null ? formatNumber(traffic) : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {tqs != null ? (
                          <span className="inline-block bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-semibold">
                            {tqs}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-700 whitespace-nowrap">
                        {conversion != null ? `%${conversion}` : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#27AE60] whitespace-nowrap">
                        {revenue != null ? `$${formatNumber(revenue)}` : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="py-3 px-4">
                        {growth ? (
                          <div className="flex flex-wrap gap-1">
                            {growth.split(",").filter(Boolean).map((g, gi) => (
                              <span
                                key={gi}
                                className="inline-block bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap"
                              >
                                {g.trim()}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600 whitespace-nowrap">
                        {founded || <span className="text-gray-300">-</span>}
                      </td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs">
                        {insight ? (
                          <span title={insight} className="truncate block max-w-[200px]">
                            {insight.length > 60 ? insight.slice(0, 60) + "..." : insight}
                          </span>
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
      )}

      {/* Move Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Klasöre Taşı
              </h2>
              <button
                onClick={() => setShowMoveModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              {selectedBrands.size} marka taşınacak
            </p>
            <div className="space-y-2">
              {folders
                .filter((f) => f !== activeFolder)
                .map((name) => (
                  <button
                    key={name}
                    onClick={() => handleMoveBrands(name)}
                    className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-50 hover:bg-[#667eea]/10 text-sm text-left transition-colors"
                  >
                    <FolderOpen size={16} className="text-[#667eea]" />
                    {name}
                  </button>
                ))}
              {folders.filter((f) => f !== activeFolder).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  Taşınacak başka klasör yok
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
