"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  ExternalLink,
  X,
  Edit3,
  Check,
  FolderPlus,
  Package,
  CheckSquare,
  Square,
  Eye,
} from "lucide-react";
import {
  loadExpertCollections,
  createExpertCollection,
  deleteExpertCollection,
  loadExpertArchiveItems,
  addExpertArchiveItem,
  updateExpertArchiveItemNote,
  removeExpertArchiveItem,
  loadFolders,
  loadBrands,
  type ExpertCollection,
  type ExpertArchiveItem,
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
  getBrandTraffic,
  getBrandTQS,
  getBrandRevenue,
  getBrandCountry,
  getBrandConversion,
  getBrandSource,
  SourceBadge,
} from "@/lib/brand-utils";

export default function ExpertArchivePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [collections, setCollections] = useState<ExpertCollection[]>([]);
  const [activeCollection, setActiveCollection] = useState<ExpertCollection | null>(null);
  const [items, setItems] = useState<ExpertArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);

  // New collection form
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");

  // Add brands modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [savedFolders, setSavedFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [folderBrands, setFolderBrands] = useState<SavedBrand[]>([]);
  const [selectedBrandIds, setSelectedBrandIds] = useState<Set<number>>(new Set());
  const [addNote, setAddNote] = useState("");
  const [addingBrands, setAddingBrands] = useState(false);

  // Inline note editing
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editNoteValue, setEditNoteValue] = useState("");

  // Detail modal
  const [detailItem, setDetailItem] = useState<ExpertArchiveItem | null>(null);

  // Redirect non-expert/admin
  useEffect(() => {
    if (user && user.role !== "expert" && user.role !== "admin") {
      router.push("/");
    }
  }, [user, router]);

  const fetchCollections = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const c = await loadExpertCollections(user.userId);
      setCollections(c);
      if (c.length > 0 && !activeCollection) {
        setActiveCollection(c[0]);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user, activeCollection]);

  const fetchItems = useCallback(async () => {
    if (!activeCollection) {
      setItems([]);
      return;
    }
    setItemsLoading(true);
    try {
      const i = await loadExpertArchiveItems(activeCollection.id);
      setItems(i);
    } catch {
      // ignore
    } finally {
      setItemsLoading(false);
    }
  }, [activeCollection]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function handleCreateCollection() {
    const name = newName.trim();
    if (!name || !user) return;
    const ok = await createExpertCollection(name, newCategory.trim() || null, user.userId);
    if (ok) {
      setNewName("");
      setNewCategory("");
      const c = await loadExpertCollections(user.userId);
      setCollections(c);
      setActiveCollection(c.find((x) => x.name === name) ?? c[c.length - 1]);
    }
  }

  async function handleDeleteCollection() {
    if (!activeCollection || !user) return;
    if (!confirm(`"${activeCollection.name}" koleksiyonunu ve içindeki tüm markaları silmek istediğinize emin misiniz?`)) return;
    await deleteExpertCollection(activeCollection.id, user.userId);
    const c = await loadExpertCollections(user.userId);
    setCollections(c);
    setActiveCollection(c.length > 0 ? c[0] : null);
  }

  async function handleRemoveItem(itemId: number) {
    if (!user) return;
    await removeExpertArchiveItem(itemId, user.userId);
    await fetchItems();
  }

  async function handleSaveNote(itemId: number) {
    if (!user) return;
    await updateExpertArchiveItemNote(itemId, user.userId, editNoteValue);
    setEditingNoteId(null);
    await fetchItems();
  }

  // Add brands modal handlers
  async function openAddModal() {
    if (!user) return;
    setShowAddModal(true);
    setSelectedBrandIds(new Set());
    setAddNote("");
    const folders = await loadFolders(user.userId);
    setSavedFolders(folders);
    if (folders.length > 0) {
      setSelectedFolder(folders[0]);
      const brands = await loadBrands(folders[0], user.userId);
      setFolderBrands(brands);
    }
  }

  async function handleFolderChange(folder: string) {
    if (!user) return;
    setSelectedFolder(folder);
    setSelectedBrandIds(new Set());
    const brands = await loadBrands(folder, user.userId);
    setFolderBrands(brands);
  }

  function toggleBrandSelection(id: number) {
    const next = new Set(selectedBrandIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedBrandIds(next);
  }

  async function handleAddSelectedBrands() {
    if (!activeCollection || !user || selectedBrandIds.size === 0) return;
    setAddingBrands(true);
    try {
      for (const brand of folderBrands) {
        if (selectedBrandIds.has(brand.id)) {
          await addExpertArchiveItem(activeCollection.id, user.userId, brand.brand_data, addNote);
        }
      }
      setShowAddModal(false);
      await fetchItems();
    } catch {
      // ignore
    } finally {
      setAddingBrands(false);
    }
  }

  if (!user || (user.role !== "expert" && user.role !== "admin")) {
    return null;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Uzman Arşivim</h1>
        <p className="text-gray-500 mt-1">
          Herkese açık koleksiyonlarınızı yönetin ve notlar ekleyin
        </p>
      </div>

      {/* Collection tabs + create */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {collections.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCollection(c)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeCollection?.id === c.id
                  ? "bg-[#667eea] text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Package size={14} />
              {c.name}
              {c.category && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeCollection?.id === c.id ? "bg-white/20" : "bg-gray-200"
                }`}>
                  {c.category}
                </span>
              )}
            </button>
          ))}
          {collections.length === 0 && !loading && (
            <span className="text-sm text-gray-400">
              Henüz koleksiyon yok. Aşağıdan oluşturun.
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateCollection()}
            placeholder="Koleksiyon adı..."
            className="flex-1 py-2 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30"
          />
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateCollection()}
            placeholder="Kategori (opsiyonel)"
            className="w-40 py-2 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30"
          />
          <button
            onClick={handleCreateCollection}
            className="flex items-center gap-1 px-4 py-2 bg-[#667eea] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <FolderPlus size={14} />
            Oluştur
          </button>
          {activeCollection && (
            <button
              onClick={handleDeleteCollection}
              className="flex items-center gap-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
            >
              <Trash2 size={14} />
              Sil
            </button>
          )}
        </div>
      </div>

      {/* Actions bar */}
      {activeCollection && (
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-700">
            {items.length} marka
          </span>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#667eea] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={14} />
            Marka Ekle
          </button>
        </div>
      )}

      {/* Items */}
      {itemsLoading ? (
        <div className="text-center py-10 text-gray-400">Yükleniyor...</div>
      ) : items.length === 0 && activeCollection ? (
        <div className="text-center py-16 text-gray-400">
          <Package size={48} className="mx-auto mb-3 opacity-50" />
          <p className="text-base">Bu koleksiyonda henüz marka yok</p>
          <p className="text-sm mt-1">Kaydedilenlerden marka ekleyin</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const brand = { brand_data: item.brand_data } as SavedBrand;
            const name = getBrandName(brand);
            const website = getBrandWebsite(brand);
            const country = getBrandCountry(brand);
            const category = getBrandCategory(brand);
            const aov = getBrandAov(brand);
            const revenue = getBrandRevenue(brand);
            const traffic = getBrandTraffic(brand);
            const tqs = getBrandTQS(brand);
            const conversion = getBrandConversion(brand);
            const insight = getBrandInsight(brand);
            const websiteClean = website.replace(/^https?:\/\//, "");
            const source = getBrandSource(brand);
            const isEditingNote = editingNoteId === item.id;

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                {/* Top: name + source + flag */}
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg font-bold text-gray-900 truncate">
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

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3">
                  <div>
                    <span className="text-sm text-gray-500">Ciro: </span>
                    <span className="text-base font-semibold text-[#27AE60]">
                      {formatRevenue(revenue)}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">AOV: </span>
                    <span className="text-base font-semibold text-[#764ba2]">
                      {aov != null ? `$${aov}` : "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Trafik: </span>
                    <span className="text-base font-semibold text-[#2980B9]">
                      {formatTraffic(traffic)}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">TQS: </span>
                    {tqs != null ? (
                      <span className="inline-block bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-xs font-semibold">
                        {tqs}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-300">-</span>
                    )}
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Dönüşüm:</span>
                    <span className="text-base font-semibold text-gray-700">
                      {conversion != null ? `%${conversion}` : "-"}
                    </span>
                  </div>
                </div>

                {/* Category */}
                {category && (
                  <div className="mb-2">
                    <span className="inline-block bg-[#667eea]/10 text-[#667eea] px-2 py-0.5 rounded-full text-xs font-medium">
                      {category}
                    </span>
                  </div>
                )}

                {/* Insight */}
                {insight && (
                  <p className="text-sm text-gray-500 italic line-clamp-2 mb-3">
                    &ldquo;{insight}&rdquo;
                  </p>
                )}

                {/* Expert Note */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Uzman Notu</span>
                    {!isEditingNote && (
                      <button
                        onClick={() => { setEditingNoteId(item.id); setEditNoteValue(item.expert_note); }}
                        className="text-amber-600 hover:text-amber-800"
                      >
                        <Edit3 size={12} />
                      </button>
                    )}
                  </div>
                  {isEditingNote ? (
                    <div className="flex gap-2">
                      <textarea
                        value={editNoteValue}
                        onChange={(e) => setEditNoteValue(e.target.value)}
                        className="flex-1 text-sm border border-amber-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-amber-400/30 resize-none"
                        rows={2}
                        autoFocus
                      />
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleSaveNote(item.id)}
                          className="text-green-600 hover:text-green-800 p-1"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditingNoteId(null)}
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-amber-900">
                      {item.expert_note || <span className="italic text-amber-400">Not eklenmemiş</span>}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setDetailItem(item)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#667eea]/10 text-[#667eea] rounded-lg text-xs font-medium hover:bg-[#667eea]/20 transition-colors"
                  >
                    <Eye size={12} />
                    Detay
                  </button>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors ml-auto"
                  >
                    <Trash2 size={12} />
                    Kaldır
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Brands Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#0D1B2A] text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Marka Ekle</h2>
                <p className="text-xs text-gray-400">Kaydedilenlerden seçin ve not ekleyin</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={22} />
              </button>
            </div>

            <div className="p-6">
              {/* Folder selector */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Klasör Seçin</label>
                <div className="flex flex-wrap gap-2">
                  {savedFolders.map((f) => (
                    <button
                      key={f}
                      onClick={() => handleFolderChange(f)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        selectedFolder === f
                          ? "bg-[#667eea] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand list */}
              <div className="mb-4 max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                {folderBrands.map((brand) => {
                  const isSelected = selectedBrandIds.has(brand.id);
                  return (
                    <button
                      key={brand.id}
                      onClick={() => toggleBrandSelection(brand.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                        isSelected ? "bg-[#667eea]/5" : ""
                      }`}
                    >
                      {isSelected ? (
                        <CheckSquare size={16} className="text-[#667eea] flex-shrink-0" />
                      ) : (
                        <Square size={16} className="text-gray-300 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-gray-900 truncate block">
                          {getBrandName(brand)}
                        </span>
                        <span className="text-xs text-gray-400">{getBrandCategory(brand)}</span>
                      </div>
                      <span className="text-xs text-[#27AE60] font-medium ml-auto">
                        {formatRevenue(getBrandRevenue(brand))}
                      </span>
                    </button>
                  );
                })}
                {folderBrands.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-6">Bu klasörde marka yok</p>
                )}
              </div>

              {/* Note */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Uzman Notu (tüm seçilenler için)</label>
                <textarea
                  value={addNote}
                  onChange={(e) => setAddNote(e.target.value)}
                  placeholder="Bu markalar hakkında notunuz..."
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30 resize-none"
                  rows={3}
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleAddSelectedBrands}
                disabled={selectedBrandIds.size === 0 || addingBrands}
                className="w-full py-3 bg-[#667eea] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {addingBrands ? "Ekleniyor..." : `${selectedBrandIds.size} Marka Ekle`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetailItem(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#0D1B2A] text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">{getBrandName({ brand_data: detailItem.brand_data } as SavedBrand)}</h2>
                {getBrandWebsite({ brand_data: detailItem.brand_data } as SavedBrand) && (
                  <a
                    href={(() => { const w = getBrandWebsite({ brand_data: detailItem.brand_data } as SavedBrand); return w.startsWith("http") ? w : `https://${w}`; })()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#4facfe] text-sm hover:underline inline-flex items-center gap-1"
                  >
                    {getBrandWebsite({ brand_data: detailItem.brand_data } as SavedBrand).replace(/^https?:\/\//, "")} <ExternalLink size={12} />
                  </a>
                )}
              </div>
              <button onClick={() => setDetailItem(null)} className="text-gray-400 hover:text-white transition-colors">
                <X size={22} />
              </button>
            </div>
            <div className="p-6">
              {/* Expert Note prominently */}
              {detailItem.expert_note && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                  <p className="text-xs text-amber-600 font-semibold mb-2 uppercase tracking-wide">Uzman Notu</p>
                  <p className="text-sm text-amber-900 leading-relaxed">{detailItem.expert_note}</p>
                </div>
              )}

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-xs text-emerald-600 font-medium mb-1">Tahmini Ciro</p>
                  <p className="text-2xl font-bold text-[#27AE60]">{formatRevenue(getBrandRevenue({ brand_data: detailItem.brand_data } as SavedBrand))}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-xs text-blue-600 font-medium mb-1">Aylık Trafik</p>
                  <p className="text-2xl font-bold text-[#2980B9]">{formatTraffic(getBrandTraffic({ brand_data: detailItem.brand_data } as SavedBrand))}</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <p className="text-xs text-purple-600 font-medium mb-1">AOV</p>
                  <p className="text-2xl font-bold text-purple-700">{getBrandAov({ brand_data: detailItem.brand_data } as SavedBrand) != null ? `$${getBrandAov({ brand_data: detailItem.brand_data } as SavedBrand)}` : "-"}</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-xs text-amber-600 font-medium mb-1">TQS / Dönüşüm</p>
                  <p className="text-2xl font-bold text-amber-700">
                    {getBrandTQS({ brand_data: detailItem.brand_data } as SavedBrand) ?? "-"}{" "}
                    <span className="text-base font-medium text-gray-500">
                      / {getBrandConversion({ brand_data: detailItem.brand_data } as SavedBrand) != null ? `%${getBrandConversion({ brand_data: detailItem.brand_data } as SavedBrand)}` : "-"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Insight */}
              {getBrandInsight({ brand_data: detailItem.brand_data } as SavedBrand) && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wide">Öne Çıkan Özellik</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{getBrandInsight({ brand_data: detailItem.brand_data } as SavedBrand)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
