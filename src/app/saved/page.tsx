"use client";

import { useState, useEffect, useCallback } from "react";
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

function getBrandAov(brand: SavedBrand): string {
  const d = brand.brand_data;
  const aov = d?.["AOV ($)"] ?? d?.aov;
  if (aov == null) return "-";
  return typeof aov === "number" ? `$${aov}` : String(aov);
}

function getBrandInsight(brand: SavedBrand): string {
  const d = brand.brand_data;
  return (d?.["Öne Çıkan Özellik"] as string) || (d?.insight as string) || "";
}

function getBrandMetaAds(brand: SavedBrand): string {
  const d = brand.brand_data;
  return (d?.["Meta Ads"] as string) || (d?.meta_ads_url as string) || "";
}

export default function SavedPage() {
  const [folders, setFolders] = useState<string[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [brands, setBrands] = useState<SavedBrand[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<Set<number>>(new Set());
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [loading, setLoading] = useState(true);

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
    const header = "Marka,Web Sitesi,Kategori,AOV,Öne Çıkan Özellik,Meta Ads";
    const rows = brands.map((b) =>
      [
        escape(getBrandName(b)),
        escape(getBrandWebsite(b)),
        escape(getBrandCategory(b)),
        escape(getBrandAov(b)),
        escape(getBrandInsight(b)),
        escape(getBrandMetaAds(b)),
      ].join(",")
    );
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

      {/* Actions bar */}
      {brands.length > 0 && (
        <div className="flex items-center gap-3 mb-4">
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
      )}

      {/* Brands Table */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Yükleniyor...</div>
      ) : brands.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FolderOpen size={48} className="mx-auto mb-3 opacity-50" />
          <p className="text-base">Bu klasörde henüz marka yok</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
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
                  <th className="py-3 px-4 text-left font-medium text-gray-500">
                    Marka
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500">
                    Web Sitesi
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500">
                    Kategori
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500">
                    AOV
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500">
                    Öne Çıkan Özellik
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500">
                    Meta Ads
                  </th>
                </tr>
              </thead>
              <tbody>
                {brands.map((brand) => {
                  const website = getBrandWebsite(brand);
                  const metaAds = getBrandMetaAds(brand);
                  const category = getBrandCategory(brand);

                  return (
                    <tr
                      key={brand.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        selectedBrands.has(brand.id) ? "bg-[#667eea]/5" : ""
                      }`}
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
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {getBrandName(brand)}
                      </td>
                      <td className="py-3 px-4">
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
                            {website}
                            <ExternalLink size={12} />
                          </a>
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
                      <td className="py-3 px-4 text-[#27AE60] font-medium">
                        {getBrandAov(brand)}
                      </td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                        {getBrandInsight(brand) || (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {metaAds ? (
                          <a
                            href={
                              metaAds.startsWith("http")
                                ? metaAds
                                : `https://${metaAds}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-xs"
                          >
                            Gör
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
