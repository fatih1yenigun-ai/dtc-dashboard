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
  Eye,
  Link,
  Loader2,
} from "lucide-react";
import {
  loadFolders,
  createFolder,
  deleteFolder,
  loadBrands,
  removeBrandsByIds,
  moveBrands,
  saveBrandsBulk,
  type SavedBrand,
} from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import {
  FLAG,
  formatTraffic,
  formatRevenue,
  getBrandName,
  getBrandWebsite,
  getBrandCategory,
  getBrandAov,
  getBrandInsight,
  getBrandMetaAds,
  getBrandTraffic,
  getBrandTQS,
  getBrandRevenue,
  getBrandCountry,
  getBrandGrowth,
  getBrandFounded,
  getBrandConversion,
  getBrandMarketingAngles,
  getBrandSource,
  SourceBadge,
} from "@/lib/brand-utils";

type SortKey = "revenue" | "traffic" | "tqs" | "aov" | "founded";

export default function SavedPage() {
  const { user } = useAuth();
  const [folders, setFolders] = useState<string[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [brands, setBrands] = useState<SavedBrand[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<Set<number>>(new Set());
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [sortAsc, setSortAsc] = useState(false);
  const [detailBrand, setDetailBrand] = useState<SavedBrand | null>(null);
  const [quickAddUrl, setQuickAddUrl] = useState("");
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [quickAddMsg, setQuickAddMsg] = useState("");

  const fetchFolders = useCallback(async () => {
    try {
      const f = await loadFolders(user?.userId);
      setFolders(f);
      if (f.length > 0 && activeFolder === null) {
        setActiveFolder(f[0]);
      }
    } catch {
      // ignore
    }
  }, [activeFolder, user?.userId]);

  const fetchBrands = useCallback(async () => {
    if (activeFolder === null) {
      setBrands([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const b = await loadBrands(activeFolder, user?.userId);
      setBrands(b);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [activeFolder, user?.userId]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    fetchBrands();
    setSelectedBrands(new Set());
  }, [fetchBrands]);

  // Sorted brands
  const sortedBrands = useMemo(() => {
    const sorted = [...brands];
    sorted.sort((a, b) => {
      let va: number = 0;
      let vb: number = 0;
      switch (sortKey) {
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
      }
      return sortAsc ? va - vb : vb - va;
    });
    return sorted;
  }, [brands, sortKey, sortAsc]);

  async function handleCreateFolder() {
    const name = newFolderName.trim();
    if (!name) return;
    try {
      const ok = await createFolder(name, user?.userId);
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
      await deleteFolder(activeFolder, user?.userId);
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
      await moveBrands(ids, targetFolder, user?.userId);
      setShowMoveModal(false);
      setSelectedBrands(new Set());
      await fetchBrands();
    } catch {
      // ignore
    }
  }

  async function handleQuickAdd() {
    if (!quickAddUrl.trim() || !activeFolder) return;
    setQuickAddLoading(true);
    setQuickAddMsg("");
    try {
      // Extract domain from URL
      let domain = quickAddUrl.trim();
      domain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
      const brandName = domain.split(".")[0].charAt(0).toUpperCase() + domain.split(".")[0].slice(1);

      const brandData = {
        Marka: brandName,
        "Web Sitesi": `https://${domain}`,
        Kategori: "-",
        "AOV ($)": 0,
        "Öne Çıkan Özellik": "Manuel eklendi",
        "Meta Ads": `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=${encodeURIComponent(brandName)}`,
      };

      const added = await saveBrandsBulk(activeFolder, [brandData], user?.userId);
      if (added > 0) {
        setQuickAddMsg("Eklendi!");
        setQuickAddUrl("");
        await fetchBrands();
      } else {
        setQuickAddMsg("Zaten kayıtlı");
      }
      setTimeout(() => setQuickAddMsg(""), 2000);
    } catch {
      setQuickAddMsg("Hata oluştu");
      setTimeout(() => setQuickAddMsg(""), 2000);
    } finally {
      setQuickAddLoading(false);
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
      "Marka", "Web Sitesi", "Ülke", "Kategori", "AOV ($)",
      "Aylık Trafik", "TQS", "Dönüşüm %", "Ciro ($)",
      "Büyüme Yöntemi", "Pazarlama Açıları",
      "Öne Çıkan Özellik", "Marka Hikayesi", "Kuruluş Yılı",
      "Niş", "Meta Ads",
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
        escape((d["Pazarlama A\u00e7\u0131lar\u0131"] as string) || ""),
        escape(getBrandInsight(b)),
        escape((d["Marka Hikayesi"] as string) || ""),
        getBrandFounded(b) ?? "",
        escape((d["Ni\u015f"] as string) || (d?.Nis as string) || ""),
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

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Kaydedilenler</h1>
        <p className="text-text-secondary mt-1">
          Kayıtlı markalarınızı klasörler halinde yönetin
        </p>
      </div>

      {/* Folder tabs + create */}
      <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-4 mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {folders.map((name) => (
            <button
              key={name}
              onClick={() => setActiveFolder(name)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFolder === name
                  ? "bg-accent text-white shadow-sm"
                  : "bg-bg-hover text-text-secondary hover:bg-bg-hover"
              }`}
            >
              <FolderOpen size={14} />
              {name}
            </button>
          ))}
          {folders.length === 0 && (
            <span className="text-sm text-text-muted">
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
            className="flex-1 py-2 px-3 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          <button
            onClick={handleCreateFolder}
            className="flex items-center gap-1 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
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

      {/* Quick add by URL */}
      {activeFolder && (
        <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Link size={16} className="text-accent" />
            <span className="text-sm font-semibold text-text-primary">Hızlı Ekle</span>
            <span className="text-xs text-text-muted">— Link yapıştırarak marka ekle</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={quickAddUrl}
              onChange={(e) => setQuickAddUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
              placeholder="https://marka.com veya marka.com"
              className="flex-1 py-2.5 px-4 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
            <button
              onClick={handleQuickAdd}
              disabled={quickAddLoading || !quickAddUrl.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {quickAddLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Ekle
            </button>
            {quickAddMsg && (
              <span className={`flex items-center text-sm font-medium ${quickAddMsg.includes("Hata") ? "text-red-500" : "text-[#27AE60]"}`}>
                {quickAddMsg}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions bar */}
      {brands.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-text-primary">
              {brands.length} marka
            </span>
            {selectedBrands.size > 0 && (
              <span className="text-sm text-accent font-medium">
                ({selectedBrands.size} seçili)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Sort dropdown */}
            <select
              value={`${sortKey}-${sortAsc ? "asc" : "desc"}`}
              onChange={(e) => {
                const [key, dir] = e.target.value.split("-");
                setSortKey(key as SortKey);
                setSortAsc(dir === "asc");
              }}
              className="py-1.5 px-3 border border-border-default rounded-lg text-xs text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              <option value="revenue-desc">Ciro (Yüksek)</option>
              <option value="revenue-asc">Ciro (Düşük)</option>
              <option value="traffic-desc">Trafik (Yüksek)</option>
              <option value="traffic-asc">Trafik (Düşük)</option>
              <option value="aov-desc">AOV (Yüksek)</option>
              <option value="aov-asc">AOV (Düşük)</option>
              <option value="tqs-desc">TQS (Yüksek)</option>
              <option value="tqs-asc">TQS (Düşük)</option>
              <option value="founded-desc">Kuruluş (Yeni)</option>
              <option value="founded-asc">Kuruluş (Eski)</option>
            </select>

            <button
              onClick={toggleAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-hover text-text-secondary rounded-lg text-xs font-medium hover:bg-bg-hover transition-colors"
            >
              {selectedBrands.size === brands.length && brands.length > 0 ? (
                <CheckSquare size={13} className="text-accent" />
              ) : (
                <Square size={13} />
              )}
              Tümünü Seç
            </button>

            <button
              onClick={handleRemoveBrands}
              disabled={selectedBrands.size === 0}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 size={12} />
              Sil
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
              className="flex items-center gap-1 px-3 py-1.5 bg-bg-hover text-text-secondary rounded-lg text-xs font-medium hover:bg-bg-hover transition-colors"
            >
              <Download size={12} />
              CSV İndir
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-10 text-text-muted">Yükleniyor...</div>
      ) : brands.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <FolderOpen size={48} className="mx-auto mb-3 opacity-50" />
          <p className="text-base">Bu klasörde henüz marka yok</p>
        </div>
      ) : (
        /* Card Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedBrands.map((brand) => {
            const name = getBrandName(brand);
            const website = getBrandWebsite(brand);
            const country = getBrandCountry(brand);
            const category = getBrandCategory(brand);
            const aov = getBrandAov(brand);
            const revenue = getBrandRevenue(brand);
            const traffic = getBrandTraffic(brand);
            const tqs = getBrandTQS(brand);
            const conversion = getBrandConversion(brand);
            const growth = getBrandGrowth(brand);
            const founded = getBrandFounded(brand);
            const insight = getBrandInsight(brand);
            const metaAds = getBrandMetaAds(brand);
            const angles = getBrandMarketingAngles(brand);
            const isSelected = selectedBrands.has(brand.id);
            const websiteClean = website.replace(/^https?:\/\//, "");
            const source = getBrandSource(brand);

            return (
              <div
                key={brand.id}
                className={`bg-bg-card rounded-[14px] shadow-sm border p-5 hover:shadow-md transition-shadow ${
                  isSelected
                    ? "ring-2 ring-accent bg-accent/5 border-accent/30"
                    : "border-border-default"
                }`}
              >
                {/* Top: checkbox + name + source + flag */}
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={() => toggleBrand(brand.id)}
                      className="flex-shrink-0 text-text-muted hover:text-text-secondary"
                    >
                      {isSelected ? (
                        <CheckSquare size={18} className="text-accent" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                    <span className="text-lg font-bold text-text-primary truncate">
                      {name}
                    </span>
                    <SourceBadge source={source} />
                  </div>
                  {country && (
                    <span className="text-base flex-shrink-0 ml-2">
                      {FLAG[country.toUpperCase()] || country.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Website link */}
                {websiteClean && (
                  <a
                    href={website.startsWith("http") ? website : `https://${website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline inline-flex items-center gap-1 mb-3"
                  >
                    {websiteClean} <ExternalLink size={11} />
                  </a>
                )}

                {/* Metrics grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3">
                  <div>
                    <span className="text-sm text-text-secondary">Ciro: </span>
                    <span className="text-base font-semibold text-[#27AE60]">
                      {formatRevenue(revenue)}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-text-secondary">AOV: </span>
                    <span className="text-base font-semibold text-[#764ba2]">
                      {aov != null ? `$${aov}` : "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-text-secondary">Trafik: </span>
                    <span className="text-base font-semibold text-[#2980B9]">
                      {formatTraffic(traffic)}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-text-secondary">TQS: </span>
                    {tqs != null ? (
                      <span className="inline-block bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-xs font-semibold">
                        {tqs}
                      </span>
                    ) : (
                      <span className="text-sm text-text-muted">-</span>
                    )}
                  </div>
                  <div>
                    <span className="text-sm text-text-secondary">Dönüşüm:</span>
                    <span className="text-base font-semibold text-text-primary">
                      {conversion != null ? `%${conversion}` : "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-text-secondary">Kuruluş:</span>
                    <span className="text-base font-semibold text-text-primary">
                      {founded || "-"}
                    </span>
                  </div>
                </div>

                {/* Category tag */}
                {category && (
                  <div className="mb-2">
                    <span className="text-sm text-text-secondary">Kategori: </span>
                    <span className="inline-block bg-accent/10 text-accent px-2 py-0.5 rounded-full text-xs font-medium">
                      {category}
                    </span>
                  </div>
                )}

                {/* Growth tags */}
                {growth && (
                  <div className="mb-2">
                    <span className="text-sm text-text-secondary">Büyüme:</span>
                    <span className="inline">
                      {growth.split(",").filter(Boolean).slice(0, 3).map((g, gi) => (
                        <span
                          key={gi}
                          className="inline-block bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[11px] font-medium mr-1 mb-0.5"
                        >
                          {g.trim()}
                        </span>
                      ))}
                    </span>
                  </div>
                )}

                {/* Marketing angle */}
                {angles && (
                  <div className="mb-2">
                    <span className="text-sm text-text-secondary">Ana Açı:</span>
                    <span className="text-sm font-medium text-purple-700">
                      {angles.split(",")[0]?.trim() || "-"}
                    </span>
                  </div>
                )}

                {/* Insight */}
                {insight && (
                  <p className="text-sm text-text-secondary italic line-clamp-2 mb-3">
                    &ldquo;{insight}&rdquo;
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-border-default">
                  {metaAds && (
                    <a
                      href={metaAds.startsWith("http") ? metaAds : `https://${metaAds}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                    >
                      Meta Ads <ExternalLink size={10} />
                    </a>
                  )}
                  <button
                    onClick={() => setDetailBrand(brand)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-xs font-medium hover:bg-accent/20 transition-colors"
                  >
                    <Eye size={12} />
                    Detaylı Gör
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {detailBrand && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetailBrand(null)}>
          <div className="bg-bg-card rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-bg-sidebar text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">{getBrandName(detailBrand)}</h2>
                {getBrandWebsite(detailBrand) && (
                  <a
                    href={getBrandWebsite(detailBrand).startsWith("http") ? getBrandWebsite(detailBrand) : `https://${getBrandWebsite(detailBrand)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#4facfe] text-sm hover:underline inline-flex items-center gap-1"
                  >
                    {getBrandWebsite(detailBrand).replace(/^https?:\/\//, "")} <ExternalLink size={12} />
                  </a>
                )}
              </div>
              <button onClick={() => setDetailBrand(null)} className="text-text-muted hover:text-white transition-colors">
                <X size={22} />
              </button>
            </div>

            {/* Content grid */}
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="text-xs text-emerald-600 font-medium mb-1">Tahmini Ciro</p>
                <p className="text-2xl font-bold text-[#27AE60]">{formatRevenue(getBrandRevenue(detailBrand))}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-xs text-blue-600 font-medium mb-1">Aylık Trafik</p>
                <p className="text-2xl font-bold text-[#2980B9]">{formatTraffic(getBrandTraffic(detailBrand))}</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <p className="text-xs text-purple-600 font-medium mb-1">AOV</p>
                <p className="text-2xl font-bold text-purple-700">{getBrandAov(detailBrand) != null ? `$${getBrandAov(detailBrand)}` : "-"}</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs text-amber-600 font-medium mb-1">TQS / Dönüşüm</p>
                <p className="text-2xl font-bold text-amber-700">
                  {getBrandTQS(detailBrand) ?? "-"}{" "}
                  <span className="text-base font-medium text-text-secondary">
                    / {getBrandConversion(detailBrand) != null ? `%${getBrandConversion(detailBrand)}` : "-"}
                  </span>
                </p>
              </div>
              <div className="bg-bg-main border border-border-default rounded-xl p-4">
                <p className="text-xs text-text-secondary font-medium mb-1">Ülke & Kuruluş</p>
                <p className="text-lg font-bold text-text-primary">
                  {FLAG[getBrandCountry(detailBrand).toUpperCase()] || ""} {getBrandCountry(detailBrand).toUpperCase() || "-"}{" "}
                  <span className="text-text-muted font-normal">|</span> {getBrandFounded(detailBrand) || "-"}
                </p>
              </div>
              <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
                <p className="text-xs text-accent font-medium mb-1">Kategori</p>
                <p className="text-lg font-bold text-text-primary">{getBrandCategory(detailBrand) || "-"}</p>
              </div>
            </div>

            <div className="px-6 pb-6 space-y-4">
              {getBrandInsight(detailBrand) && (
                <div className="bg-bg-main rounded-xl p-4">
                  <p className="text-xs text-text-secondary font-semibold mb-2 uppercase tracking-wide">Öne Çıkan Özellik</p>
                  <p className="text-sm text-text-primary leading-relaxed">{getBrandInsight(detailBrand)}</p>
                </div>
              )}
              {getBrandGrowth(detailBrand) && (
                <div className="bg-bg-main rounded-xl p-4">
                  <p className="text-xs text-text-secondary font-semibold mb-2 uppercase tracking-wide">Büyüme Yöntemi</p>
                  <div className="flex flex-wrap gap-2">
                    {getBrandGrowth(detailBrand).split(",").filter(Boolean).map((g, i) => (
                      <span key={i} className="inline-block bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-medium">{g.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
              {getBrandMarketingAngles(detailBrand) && (
                <div className="bg-bg-main rounded-xl p-4">
                  <p className="text-xs text-text-secondary font-semibold mb-2 uppercase tracking-wide">Pazarlama Açıları</p>
                  <div className="flex flex-wrap gap-2">
                    {getBrandMarketingAngles(detailBrand).split(",").filter(Boolean).map((a, i) => (
                      <span key={i} className="inline-block bg-purple-100 text-purple-700 px-2.5 py-1 rounded-lg text-xs font-medium">{a.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
              {getBrandMetaAds(detailBrand) && (
                <div className="bg-bg-main rounded-xl p-4">
                  <p className="text-xs text-text-secondary font-semibold mb-2 uppercase tracking-wide">Meta Ads</p>
                  <a
                    href={getBrandMetaAds(detailBrand).startsWith("http") ? getBrandMetaAds(detailBrand) : `https://${getBrandMetaAds(detailBrand)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    Meta Reklam Kütüphanesi <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Move Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card rounded-[14px] p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">
                Klasöre Taşı
              </h2>
              <button
                onClick={() => setShowMoveModal(false)}
                className="text-text-muted hover:text-text-secondary transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-text-secondary mb-3">
              {selectedBrands.size} marka taşınacak
            </p>
            <div className="space-y-2">
              {folders
                .filter((f) => f !== activeFolder)
                .map((name) => (
                  <button
                    key={name}
                    onClick={() => handleMoveBrands(name)}
                    className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-bg-main hover:bg-accent/10 text-sm text-left transition-colors"
                  >
                    <FolderOpen size={16} className="text-accent" />
                    {name}
                  </button>
                ))}
              {folders.filter((f) => f !== activeFolder).length === 0 && (
                <p className="text-sm text-text-muted text-center py-4">
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
