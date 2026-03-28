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
} from "lucide-react";
import {
  loadFolders,
  createFolder,
  deleteFolder,
  loadBrands,
  removeBrandsByName,
  moveBrands,
  type Folder,
  type Brand,
} from "@/lib/supabase";

export default function SavedPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolder, setActiveFolder] = useState<number | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<Set<number>>(new Set());
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchFolders = useCallback(async () => {
    try {
      const f = await loadFolders();
      setFolders(f);
      if (f.length > 0 && activeFolder === null) {
        setActiveFolder(f[0].id);
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
    if (!newFolderName.trim()) return;
    try {
      const f = await createFolder(newFolderName.trim());
      setFolders((prev) => [...prev, f]);
      setActiveFolder(f.id);
      setNewFolderName("");
    } catch {
      // ignore
    }
  }

  async function handleDeleteFolder() {
    if (activeFolder === null) return;
    if (!confirm("Bu klasoru ve icindeki tum markalari silmek istediginize emin misiniz?"))
      return;
    try {
      await deleteFolder(activeFolder);
      setFolders((prev) => prev.filter((f) => f.id !== activeFolder));
      setActiveFolder(folders.length > 1 ? folders[0].id : null);
    } catch {
      // ignore
    }
  }

  async function handleRemoveBrands() {
    if (activeFolder === null || selectedBrands.size === 0) return;
    const names = brands
      .filter((b) => selectedBrands.has(b.id))
      .map((b) => b.brand_name);
    try {
      await removeBrandsByName(activeFolder, names);
      await fetchBrands();
      setSelectedBrands(new Set());
    } catch {
      // ignore
    }
  }

  async function handleMoveBrands(targetFolderId: number) {
    const ids = Array.from(selectedBrands);
    try {
      await moveBrands(ids, targetFolderId);
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

  function exportCSV() {
    const rows = brands.map((b) =>
      [b.brand_name, b.website, b.category, b.aov, b.insight, b.meta_ads_url].join(",")
    );
    const csv =
      "Marka,Website,Kategori,AOV,Insight,Meta Ads\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const folderName = folders.find((f) => f.id === activeFolder)?.name ?? "export";
    a.download = `${folderName}.csv`;
    a.click();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Kaydedilenler</h1>
        <p className="text-gray-500 mt-1">Kayitli markalarinizi yonetin</p>
      </div>

      {/* Folder tabs + create */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFolder(f.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFolder === f.id
                  ? "bg-[#667eea] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <FolderOpen size={14} />
              {f.name}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
            placeholder="Yeni klasor adi..."
            className="flex-1 py-2 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30"
          />
          <button
            onClick={handleCreateFolder}
            className="flex items-center gap-1 px-4 py-2 bg-[#667eea] text-white rounded-lg text-sm font-medium hover:opacity-90"
          >
            <Plus size={14} />
            Olustur
          </button>
          {activeFolder && (
            <button
              onClick={handleDeleteFolder}
              className="flex items-center gap-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100"
            >
              <Trash2 size={14} />
              Sil
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      {brands.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-500">
            {selectedBrands.size} secili
          </span>
          <button
            onClick={handleRemoveBrands}
            disabled={selectedBrands.size === 0}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 disabled:opacity-50"
          >
            <Trash2 size={12} />
            Sil
          </button>
          <button
            onClick={() => setShowMoveModal(true)}
            disabled={selectedBrands.size === 0}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 disabled:opacity-50"
          >
            <ArrowRight size={12} />
            Tasi
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200"
          >
            <Download size={12} />
            CSV Indir
          </button>
        </div>
      )}

      {/* Brands Table */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Yukleniyor...</div>
      ) : brands.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FolderOpen size={48} className="mx-auto mb-3 opacity-50" />
          <p>Bu klasorde henuz marka yok</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-striped">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-3 px-4 text-left font-medium text-gray-500 w-10">
                    <input
                      type="checkbox"
                      checked={selectedBrands.size === brands.length && brands.length > 0}
                      onChange={() => {
                        if (selectedBrands.size === brands.length) {
                          setSelectedBrands(new Set());
                        } else {
                          setSelectedBrands(new Set(brands.map((b) => b.id)));
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500">
                    Marka
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500">
                    Website
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500">
                    Kategori
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500">
                    AOV
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500">
                    Insight
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500">
                    Meta Ads
                  </th>
                </tr>
              </thead>
              <tbody>
                {brands.map((brand) => (
                  <tr
                    key={brand.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedBrands.has(brand.id)}
                        onChange={() => toggleBrand(brand.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {brand.brand_name}
                    </td>
                    <td className="py-3 px-4">
                      <a
                        href={
                          brand.website.startsWith("http")
                            ? brand.website
                            : `https://${brand.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#2980B9] hover:underline flex items-center gap-1"
                      >
                        {brand.website}
                        <ExternalLink size={12} />
                      </a>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs bg-[#667eea]/10 text-[#667eea] px-2 py-0.5 rounded-full">
                        {brand.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#27AE60] font-medium">
                      {brand.aov}
                    </td>
                    <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                      {brand.insight}
                    </td>
                    <td className="py-3 px-4">
                      <a
                        href={brand.meta_ads_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Gor
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Move Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Klasore Tasi</h2>
              <button onClick={() => setShowMoveModal(false)}>
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-2">
              {folders
                .filter((f) => f.id !== activeFolder)
                .map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleMoveBrands(f.id)}
                    className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-50 hover:bg-[#667eea]/10 text-sm text-left transition-colors"
                  >
                    <FolderOpen size={16} className="text-[#667eea]" />
                    {f.name}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
