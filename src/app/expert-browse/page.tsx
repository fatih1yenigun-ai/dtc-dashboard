"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Package,
  User,
  Eye,
  X,
  Filter,
} from "lucide-react";
import {
  loadAllExpertCollections,
  loadExpertArchiveItems,
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

export default function ExpertBrowsePage() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<ExpertCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedItems, setExpandedItems] = useState<ExpertArchiveItem[]>([]);
  const [expandedLoading, setExpandedLoading] = useState(false);

  // Filters
  const [filterExpert, setFilterExpert] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Detail modal
  const [detailItem, setDetailItem] = useState<ExpertArchiveItem | null>(null);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const c = await loadAllExpertCollections();
      setCollections(c);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  async function toggleCollection(collectionId: number) {
    if (expandedId === collectionId) {
      setExpandedId(null);
      setExpandedItems([]);
      return;
    }
    setExpandedId(collectionId);
    setExpandedLoading(true);
    try {
      const items = await loadExpertArchiveItems(collectionId);
      setExpandedItems(items);
    } catch {
      setExpandedItems([]);
    } finally {
      setExpandedLoading(false);
    }
  }

  // Get unique experts and categories for filters
  const experts = [...new Set(collections.map((c) => c.username).filter(Boolean))] as string[];
  const categories = [...new Set(collections.map((c) => c.category).filter(Boolean))] as string[];

  // Filtered collections
  const filtered = collections.filter((c) => {
    if (filterExpert && c.username !== filterExpert) return false;
    if (filterCategory && c.category !== filterCategory) return false;
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Uzman Arşivleri</h1>
        <p className="text-gray-500 mt-1">
          Uzmanların küratörlüğünde marka koleksiyonları
        </p>
      </div>

      {/* Filters */}
      {(experts.length > 1 || categories.length > 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <Filter size={16} className="text-gray-400" />
            {experts.length > 1 && (
              <select
                value={filterExpert}
                onChange={(e) => setFilterExpert(e.target.value)}
                className="py-1.5 px-3 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#667eea]/30"
              >
                <option value="">Tüm Uzmanlar</option>
                {experts.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            )}
            {categories.length > 0 && (
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="py-1.5 px-3 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#667eea]/30"
              >
                <option value="">Tüm Kategoriler</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
            {(filterExpert || filterCategory) && (
              <button
                onClick={() => { setFilterExpert(""); setFilterCategory(""); }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Temizle
              </button>
            )}
          </div>
        </div>
      )}

      {/* Collections */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Package size={48} className="mx-auto mb-3 opacity-50" />
          <p className="text-base">Henüz uzman arşivi yok</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((collection) => {
            const isExpanded = expandedId === collection.id;
            return (
              <div key={collection.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Collection header */}
                <button
                  onClick={() => toggleCollection(collection.id)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-amber-700">
                        {(collection.username || "?").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-gray-900">{collection.name}</span>
                        {collection.category && (
                          <span className="inline-block bg-[#667eea]/10 text-[#667eea] px-2 py-0.5 rounded-full text-[10px] font-medium">
                            {collection.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <User size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-500">{collection.username}</span>
                        <span className="text-xs text-gray-300">|</span>
                        <span className="text-xs text-gray-500">{collection.item_count ?? 0} marka</span>
                      </div>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown size={18} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={18} className="text-gray-400" />
                  )}
                </button>

                {/* Expanded items */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-6 py-4">
                    {expandedLoading ? (
                      <p className="text-sm text-gray-400 text-center py-4">Yükleniyor...</p>
                    ) : expandedItems.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">Bu koleksiyon boş</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {expandedItems.map((item) => {
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
                            <div key={item.id} className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                              {/* Name + source */}
                              <div className="flex items-start justify-between mb-1">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-sm font-bold text-gray-900 truncate">{name}</span>
                                  <SourceBadge source={source} />
                                </div>
                                {country && (
                                  <span className="text-sm flex-shrink-0 ml-1">
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
                                  className="text-xs text-blue-500 hover:underline inline-flex items-center gap-1 mb-2"
                                >
                                  {websiteClean} <ExternalLink size={10} />
                                </a>
                              )}

                              {/* Quick metrics */}
                              <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-2 text-xs">
                                <div>
                                  <span className="text-gray-500">Ciro: </span>
                                  <span className="font-semibold text-[#27AE60]">{formatRevenue(revenue)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">AOV: </span>
                                  <span className="font-semibold text-[#764ba2]">{aov != null ? `$${aov}` : "-"}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Trafik: </span>
                                  <span className="font-semibold text-[#2980B9]">{formatTraffic(traffic)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">TQS: </span>
                                  {tqs != null ? (
                                    <span className="inline-block bg-amber-100 text-amber-800 px-1 py-0.5 rounded text-[10px] font-semibold">
                                      {tqs}
                                    </span>
                                  ) : (
                                    <span className="text-gray-300">-</span>
                                  )}
                                </div>
                              </div>

                              {/* Category */}
                              {category && (
                                <span className="inline-block bg-[#667eea]/10 text-[#667eea] px-2 py-0.5 rounded-full text-[10px] font-medium mb-2">
                                  {category}
                                </span>
                              )}

                              {/* Expert note */}
                              {item.expert_note && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-2">
                                  <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-0.5">Uzman Notu</p>
                                  <p className="text-xs text-amber-900 leading-relaxed">{item.expert_note}</p>
                                </div>
                              )}

                              {/* Detail button */}
                              <button
                                onClick={() => setDetailItem(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#667eea]/10 text-[#667eea] rounded-lg text-[11px] font-medium hover:bg-[#667eea]/20 transition-colors"
                              >
                                <Eye size={11} />
                                Detay
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
