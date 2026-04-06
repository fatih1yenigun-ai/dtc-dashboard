"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ExternalLink,
  Package,
  Eye,
  X,
  FolderOpen,
  ArrowLeft,
} from "lucide-react";
import {
  loadExpertUsers,
  loadExpertCollectionsForUser,
  loadExpertArchiveItems,
  type ExpertUser,
  type ExpertCollection,
  type ExpertArchiveItem,
  type SavedBrand,
} from "@/lib/supabase";
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

export default function ExpertBrowsePage() {
  // View state: "experts" → "collections" → "items"
  const [view, setView] = useState<"experts" | "collections" | "items">("experts");

  // Expert users
  const [experts, setExperts] = useState<ExpertUser[]>([]);
  const [loadingExperts, setLoadingExperts] = useState(true);

  // Selected expert's collections
  const [selectedExpert, setSelectedExpert] = useState<ExpertUser | null>(null);
  const [collections, setCollections] = useState<ExpertCollection[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(false);

  // Selected collection's items
  const [selectedCollection, setSelectedCollection] = useState<ExpertCollection | null>(null);
  const [items, setItems] = useState<ExpertArchiveItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Detail modal
  const [detailItem, setDetailItem] = useState<ExpertArchiveItem | null>(null);

  // Load experts on mount
  const fetchExperts = useCallback(async () => {
    setLoadingExperts(true);
    try {
      const e = await loadExpertUsers();
      setExperts(e);
    } catch {
      // ignore
    } finally {
      setLoadingExperts(false);
    }
  }, []);

  useEffect(() => {
    fetchExperts();
  }, [fetchExperts]);

  async function handleSelectExpert(expert: ExpertUser) {
    setSelectedExpert(expert);
    setView("collections");
    setLoadingCollections(true);
    try {
      const c = await loadExpertCollectionsForUser(expert.id);
      setCollections(c);
    } catch {
      setCollections([]);
    } finally {
      setLoadingCollections(false);
    }
  }

  async function handleSelectCollection(collection: ExpertCollection) {
    setSelectedCollection(collection);
    setView("items");
    setLoadingItems(true);
    try {
      const i = await loadExpertArchiveItems(collection.id);
      setItems(i);
    } catch {
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  }

  function goBackToExperts() {
    setView("experts");
    setSelectedExpert(null);
    setCollections([]);
  }

  function goBackToCollections() {
    setView("collections");
    setSelectedCollection(null);
    setItems([]);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Uzman Arşivleri</h1>
        <p className="text-text-secondary mt-1">
          Uzmanların küratörlüğünde marka koleksiyonları
        </p>
      </div>

      {/* === VIEW: Expert Cards === */}
      {view === "experts" && (
        <>
          {loadingExperts ? (
            <div className="text-center py-10 text-text-muted">Yükleniyor...</div>
          ) : experts.length === 0 ? (
            <div className="text-center py-16 text-text-muted">
              <Package size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-base">Henüz uzman yok</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {experts.map((expert) => (
                <button
                  key={expert.id}
                  onClick={() => handleSelectExpert(expert)}
                  className="bg-bg-card rounded-2xl shadow-sm border border-border-default p-6 hover:shadow-lg hover:border-[#667eea]/30 transition-all text-center group"
                >
                  {/* Avatar */}
                  <div className="w-20 h-20 rounded-full mx-auto mb-4 overflow-hidden bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center group-hover:scale-105 transition-transform">
                    {expert.avatar_url ? (
                      <img
                        src={expert.avatar_url}
                        alt={expert.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-white">
                        {expert.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Name */}
                  <h3 className="text-base font-bold text-text-primary mb-1">
                    {expert.username}
                  </h3>
                  {/* Expertise */}
                  <p className="text-sm text-text-secondary mb-3 line-clamp-2">
                    {expert.expertise || "Uzman"}
                  </p>
                  {/* Collection count */}
                  <span className="inline-block bg-accent/10 text-accent px-3 py-1 rounded-full text-xs font-medium">
                    {expert.collection_count ?? 0} koleksiyon
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* === VIEW: Collections (Folders) === */}
      {view === "collections" && selectedExpert && (
        <>
          {/* Back button + expert info */}
          <button
            onClick={goBackToExperts}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            Tüm Uzmanlar
          </button>

          {/* Expert header card */}
          <div className="bg-bg-card rounded-2xl shadow-sm border border-border-default p-6 mb-6 flex items-center gap-5">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center flex-shrink-0">
              {selectedExpert.avatar_url ? (
                <img
                  src={selectedExpert.avatar_url}
                  alt={selectedExpert.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-white">
                  {selectedExpert.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">{selectedExpert.username}</h2>
              <p className="text-sm text-text-secondary">{selectedExpert.expertise || "Uzman"}</p>
            </div>
          </div>

          {/* Collection cards */}
          {loadingCollections ? (
            <div className="text-center py-10 text-text-muted">Yükleniyor...</div>
          ) : collections.length === 0 ? (
            <div className="text-center py-16 text-text-muted">
              <FolderOpen size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-base">Bu uzmanın henüz koleksiyonu yok</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => handleSelectCollection(collection)}
                  className="bg-bg-card rounded-xl shadow-sm border border-border-default p-5 hover:shadow-lg hover:border-[#667eea]/30 transition-all text-center group"
                >
                  {/* Folder icon */}
                  <div className="w-14 h-14 rounded-xl bg-amber-50 border border-amber-200 mx-auto mb-3 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FolderOpen size={28} className="text-amber-500" />
                  </div>
                  {/* Name */}
                  <h3 className="text-sm font-bold text-text-primary mb-1 truncate">
                    {collection.name}
                  </h3>
                  {/* Category */}
                  {collection.category && (
                    <span className="inline-block bg-accent/10 text-accent px-2 py-0.5 rounded-full text-[10px] font-medium mb-2">
                      {collection.category}
                    </span>
                  )}
                  {/* Item count */}
                  <p className="text-xs text-text-muted">
                    {collection.item_count ?? 0} marka
                  </p>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* === VIEW: Items in Collection === */}
      {view === "items" && selectedExpert && selectedCollection && (
        <>
          {/* Back button */}
          <button
            onClick={goBackToCollections}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            {selectedExpert.username} — Koleksiyonlar
          </button>

          {/* Collection header */}
          <div className="bg-bg-card rounded-xl shadow-sm border border-border-default p-4 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
              <FolderOpen size={20} className="text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">{selectedCollection.name}</h2>
              <div className="flex items-center gap-2">
                {selectedCollection.category && (
                  <span className="inline-block bg-accent/10 text-accent px-2 py-0.5 rounded-full text-[10px] font-medium">
                    {selectedCollection.category}
                  </span>
                )}
                <span className="text-xs text-text-muted">{items.length} marka</span>
              </div>
            </div>
          </div>

          {/* Items grid */}
          {loadingItems ? (
            <div className="text-center py-10 text-text-muted">Yükleniyor...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-text-muted">
              <Package size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-base">Bu koleksiyon boş</p>
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
                const websiteClean = website.replace(/^https?:\/\//, "");
                const source = getBrandSource(brand);

                return (
                  <div key={item.id} className="bg-bg-card rounded-xl shadow-sm border border-border-default p-5 hover:shadow-md transition-shadow">
                    {/* Name + source */}
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base font-bold text-text-primary truncate">{name}</span>
                        <SourceBadge source={source} />
                      </div>
                      {country && (
                        <span className="text-base flex-shrink-0 ml-2">
                          {FLAG[country.toUpperCase()] || country.toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Website */}
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

                    {/* Quick metrics */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3">
                      <div>
                        <span className="text-sm text-text-secondary">Ciro: </span>
                        <span className="text-base font-semibold text-[#27AE60]">{formatRevenue(revenue)}</span>
                      </div>
                      <div>
                        <span className="text-sm text-text-secondary">AOV: </span>
                        <span className="text-base font-semibold text-[#764ba2]">{aov != null ? `$${aov}` : "-"}</span>
                      </div>
                      <div>
                        <span className="text-sm text-text-secondary">Trafik: </span>
                        <span className="text-base font-semibold text-[#2980B9]">{formatTraffic(traffic)}</span>
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
                    </div>

                    {/* Category */}
                    {category && (
                      <div className="mb-2">
                        <span className="inline-block bg-accent/10 text-accent px-2 py-0.5 rounded-full text-xs font-medium">
                          {category}
                        </span>
                      </div>
                    )}

                    {/* Expert note */}
                    {item.expert_note && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                        <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-0.5">Uzman Notu</p>
                        <p className="text-sm text-amber-900 leading-relaxed">{item.expert_note}</p>
                      </div>
                    )}

                    {/* Insight */}
                    {getBrandInsight(brand) && (
                      <p className="text-sm text-text-secondary italic line-clamp-2 mb-3">
                        &ldquo;{getBrandInsight(brand)}&rdquo;
                      </p>
                    )}

                    {/* Detail button */}
                    <div className="pt-2 border-t border-border-default">
                      <button
                        onClick={() => setDetailItem(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-xs font-medium hover:bg-accent/20 transition-colors"
                      >
                        <Eye size={12} />
                        Detay
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {detailItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetailItem(null)}>
          <div className="bg-bg-card rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-bg-sidebar text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
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
              <button onClick={() => setDetailItem(null)} className="text-text-muted hover:text-white transition-colors">
                <X size={22} />
              </button>
            </div>
            <div className="p-6">
              {detailItem.expert_note && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                  <p className="text-xs text-amber-600 font-semibold mb-2 uppercase tracking-wide">Uzman Notu</p>
                  <p className="text-sm text-amber-900 leading-relaxed">{detailItem.expert_note}</p>
                </div>
              )}
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
                    <span className="text-base font-medium text-text-secondary">
                      / {getBrandConversion({ brand_data: detailItem.brand_data } as SavedBrand) != null ? `%${getBrandConversion({ brand_data: detailItem.brand_data } as SavedBrand)}` : "-"}
                    </span>
                  </p>
                </div>
              </div>
              {getBrandInsight({ brand_data: detailItem.brand_data } as SavedBrand) && (
                <div className="bg-bg-main rounded-xl p-4">
                  <p className="text-xs text-text-secondary font-semibold mb-2 uppercase tracking-wide">Öne Çıkan Özellik</p>
                  <p className="text-sm text-text-primary leading-relaxed">{getBrandInsight({ brand_data: detailItem.brand_data } as SavedBrand)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
