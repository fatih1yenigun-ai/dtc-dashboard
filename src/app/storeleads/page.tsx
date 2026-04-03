"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ArrowUpDown,
  Store,
  Bookmark,
  Check,
  FolderPlus,
} from "lucide-react";
import { loadFolders, createFolder, saveBrandsBulk, type BrandData } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

interface StoreData {
  id: number;
  domain: string;
  domain_url: string;
  name: string;
  platform: string;
  country: string;
  estimated_sales_usd: number | null;
  estimated_page_views: number | null;
  product_count: number | null;
  avg_price_usd: number | null;
  categories: string | null;
  instagram: string | null;
  instagram_url: string | null;
  facebook: string | null;
  tiktok: string | null;
  tiktok_url: string | null;
  tiktok_followers: number | null;
  store_reviews: number | null;
  theme: string | null;
  recent_product: string | null;
  sales_channels: string | null;
  favicon_url: string | null;
}

interface CategoryInfo {
  name: string;
  count: number;
  subs: { name: string; count: number }[];
}

interface FilterOptions {
  categories: CategoryInfo[];
  counts: { turkey: number; global: number; total: number };
}

function formatMoney(n: number | null): string {
  if (!n) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function formatNumber(n: number | null): string {
  if (!n) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

function extractTopCategory(categories: string | null): string {
  if (!categories) return "";
  const first = categories.split(":")[0];
  const parts = first.split("/").filter(Boolean);
  return parts[0] || "";
}

export default function StoreleadsPage() {
  const { user } = useAuth();
  const [stores, setStores] = useState<StoreData[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);

  // Filters
  const [region, setRegion] = useState<"turkey" | "global" | "all">("turkey");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [minSales, setMinSales] = useState("");
  const [minTraffic, setMinTraffic] = useState("");

  // Save to folder
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [folders, setFolders] = useState<string[]>([]);
  const [targetFolder, setTargetFolder] = useState("");
  const [newFolder, setNewFolder] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [sortBy, setSortBy] = useState("estimated_sales_usd");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);

  // Detail panel
  const [selectedStore, setSelectedStore] = useState<StoreData | null>(null);

  // Load filter options + folders on mount
  useEffect(() => {
    fetch("/api/storeleads")
      .then((r) => r.json())
      .then((data) => setFilterOptions(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    loadFolders(user.userId).then((f) => {
      setFolders(f);
      if (f.length > 0 && !targetFolder) setTargetFolder(f[0]);
    });
  }, [user]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === stores.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(stores.map((s) => s.id)));
    }
  };

  const handleSave = async () => {
    const folder = newFolder.trim() || targetFolder;
    if (!folder || selectedIds.size === 0) return;
    setSaving(true);
    setSaveMsg("");

    const brandsToSave: BrandData[] = stores
      .filter((s) => selectedIds.has(s.id))
      .map((s) => ({
        Marka: s.name || s.domain,
        brand: s.name || s.domain,
        "Web Sitesi": s.domain_url || `https://${s.domain}`,
        website: s.domain_url || `https://${s.domain}`,
        Kategori: extractTopCategory(s.categories),
        category: extractTopCategory(s.categories),
        "Alt Niş": s.categories || "",
        sub_niche: s.categories || "",
        insight: [
          s.estimated_sales_usd ? `$${formatMoney(s.estimated_sales_usd)}/ay` : "",
          s.estimated_page_views ? `${formatNumber(s.estimated_page_views)} trafik` : "",
          s.platform || "",
          s.instagram ? `IG: ${s.instagram}` : "",
        ].filter(Boolean).join(" | "),
        "Öne Çıkan Özellik": [
          s.estimated_sales_usd ? `Satis: ${formatMoney(s.estimated_sales_usd)}/ay` : "",
          s.estimated_page_views ? `Trafik: ${formatNumber(s.estimated_page_views)}` : "",
          s.platform || "",
        ].filter(Boolean).join(" | "),
        favicon_url: s.favicon_url || "",
        source: "storeleads",
      }));

    if (newFolder.trim()) {
      await createFolder(newFolder.trim(), user?.userId);
    }
    const added = await saveBrandsBulk(folder, brandsToSave, user?.userId);
    setSaveMsg(`${added} magaza '${folder}' klasorune kaydedildi`);
    setSelectedIds(new Set());
    setSaving(false);

    // Refresh folders
    if (user) {
      const f = await loadFolders(user.userId);
      setFolders(f);
    }

    setTimeout(() => setSaveMsg(""), 3000);
  };

  // Search function
  const doSearch = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const res = await fetch("/api/storeleads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            region,
            query: query || undefined,
            category: subCategory
              ? `${category}/${subCategory}`
              : category || undefined,
            minSales: minSales ? Number(minSales) : undefined,
            minTraffic: minTraffic ? Number(minTraffic) : undefined,
            sortBy,
            sortAsc,
            page: p,
            pageSize: 50,
          }),
        });
        const data = await res.json();
        setStores(data.stores || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 0);
        setPage(p);
      } catch {
        setStores([]);
      } finally {
        setLoading(false);
      }
    },
    [region, query, category, subCategory, minSales, minTraffic, sortBy, sortAsc]
  );

  // Search on filter change
  useEffect(() => {
    doSearch(1);
  }, [region, category, subCategory, sortBy, sortAsc]);

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(col);
      setSortAsc(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Storeleads</h1>
        <p className="text-gray-500 mt-1">
          E-ticaret magaza veritabani —{" "}
          {filterOptions
            ? `${filterOptions.counts.total.toLocaleString()} magaza`
            : "yukleniyor..."}
        </p>
      </div>

      {/* Region Toggle */}
      <div className="flex gap-2 mb-6">
        {(["turkey", "global", "all"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRegion(r)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              region === r
                ? "gradient-accent text-white shadow-md"
                : "bg-white border border-gray-200 text-gray-600 hover:border-[#667eea] hover:text-[#667eea]"
            }`}
          >
            {r === "turkey" && `Turkiye ${filterOptions ? `(${filterOptions.counts.turkey.toLocaleString()})` : ""}`}
            {r === "global" && `Global ${filterOptions ? `(${filterOptions.counts.global.toLocaleString()})` : ""}`}
            {r === "all" && `Tumu ${filterOptions ? `(${filterOptions.counts.total.toLocaleString()})` : ""}`}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        {/* Category selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setSubCategory("");
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30"
          >
            <option value="">Tum Kategoriler</option>
            {filterOptions?.categories.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.count.toLocaleString()})
              </option>
            ))}
          </select>

          <select
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            disabled={!category}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30 disabled:opacity-40"
          >
            <option value="">Tum Alt Kategoriler</option>
            {category &&
              filterOptions?.categories
                .find((c) => c.name === category)
                ?.subs.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name} ({s.count.toLocaleString()})
                  </option>
                ))}
          </select>
        </div>

        {/* Search + filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doSearch(1)}
                placeholder="Domain, isim veya urun ara..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30 focus:border-[#667eea]"
              />
            </div>
          </div>
          <input
            type="number"
            value={minSales}
            onChange={(e) => setMinSales(e.target.value)}
            placeholder="Min satis ($)"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30"
          />
          <button
            onClick={() => doSearch(1)}
            disabled={loading}
            className="gradient-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Ara
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {total.toLocaleString()} sonuc bulundu
          {totalPages > 1 && ` — Sayfa ${page}/${totalPages}`}
        </p>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-3 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === stores.length && stores.length > 0}
                    onChange={selectAll}
                    className="rounded border-gray-300 text-[#667eea] focus:ring-[#667eea]/30"
                  />
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Magaza</th>
                <th className="text-left px-3 py-3 font-medium text-gray-500">Platform</th>
                <th className="text-left px-3 py-3 font-medium text-gray-500">Kategori</th>
                <th
                  className="text-right px-3 py-3 font-medium text-gray-500 cursor-pointer hover:text-[#667eea] select-none"
                  onClick={() => handleSort("estimated_sales_usd")}
                >
                  <span className="inline-flex items-center gap-1">
                    Aylik Satis
                    <ArrowUpDown size={12} />
                  </span>
                </th>
                <th
                  className="text-right px-3 py-3 font-medium text-gray-500 cursor-pointer hover:text-[#667eea] select-none"
                  onClick={() => handleSort("estimated_page_views")}
                >
                  <span className="inline-flex items-center gap-1">
                    Trafik
                    <ArrowUpDown size={12} />
                  </span>
                </th>
                <th
                  className="text-right px-3 py-3 font-medium text-gray-500 cursor-pointer hover:text-[#667eea] select-none"
                  onClick={() => handleSort("product_count")}
                >
                  <span className="inline-flex items-center gap-1">
                    Urunler
                    <ArrowUpDown size={12} />
                  </span>
                </th>
                <th className="text-left px-3 py-3 font-medium text-gray-500">Sosyal</th>
              </tr>
            </thead>
            <tbody>
              {loading && stores.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Loader2 size={24} className="animate-spin mx-auto text-[#667eea]" />
                    <p className="text-gray-400 mt-2">Yukleniyor...</p>
                  </td>
                </tr>
              ) : stores.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    Sonuc bulunamadi. Filtreleri degistirin.
                  </td>
                </tr>
              ) : (
                stores.map((s) => (
                  <tr
                    key={s.id}
                    className={`border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors ${selectedIds.has(s.id) ? "bg-[#667eea]/5" : ""}`}
                    onClick={() => setSelectedStore(s)}
                  >
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(s.id)}
                        onChange={() => toggleSelect(s.id)}
                        className="rounded border-gray-300 text-[#667eea] focus:ring-[#667eea]/30"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {s.favicon_url ? (
                          <img
                            src={s.favicon_url}
                            alt=""
                            className="w-5 h-5 rounded-sm"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <Store size={16} className="text-gray-300" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900 truncate max-w-[200px]">
                            {s.name || s.domain}
                          </p>
                          <p className="text-xs text-gray-400">{s.domain}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          s.platform === "Shopify"
                            ? "bg-green-100 text-green-700"
                            : s.platform === "WooCommerce"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {s.platform || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-600 text-xs truncate max-w-[150px]">
                      {extractTopCategory(s.categories) || "—"}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-gray-900">
                      {formatMoney(s.estimated_sales_usd)}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-600">
                      {formatNumber(s.estimated_page_views)}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-600">
                      {s.product_count?.toLocaleString() || "—"}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1.5">
                        {s.instagram && (
                          <a
                            href={s.instagram_url || `https://instagram.com/${s.instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-pink-500 hover:text-pink-600 text-xs"
                            title={s.instagram}
                          >
                            IG
                          </a>
                        )}
                        {s.tiktok && (
                          <a
                            href={s.tiktok_url || `https://tiktok.com/${s.tiktok}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-gray-800 hover:text-black text-xs"
                            title={`${s.tiktok}${s.tiktok_followers ? ` (${formatNumber(s.tiktok_followers)})` : ""}`}
                          >
                            TT
                          </a>
                        )}
                        {s.facebook && (
                          <a
                            href={`https://facebook.com/${s.facebook}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 hover:text-blue-700 text-xs"
                            title={s.facebook}
                          >
                            FB
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Save bar — shows when items selected */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 border-t border-[#667eea]/20 bg-[#667eea]/5">
            <Bookmark size={16} className="text-[#667eea]" />
            <span className="text-sm font-medium text-[#667eea]">
              {selectedIds.size} secili
            </span>
            <select
              value={targetFolder}
              onChange={(e) => setTargetFolder(e.target.value)}
              className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea]/30"
            >
              {folders.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newFolder}
                onChange={(e) => setNewFolder(e.target.value)}
                placeholder="veya yeni klasor..."
                className="px-2 py-1 text-sm border border-gray-200 rounded-lg w-36 focus:outline-none focus:ring-2 focus:ring-[#667eea]/30"
              />
              {newFolder.trim() && (
                <FolderPlus size={14} className="text-[#667eea]" />
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="gradient-accent text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Bookmark size={14} />}
              Kaydet
            </button>
            {saveMsg && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <Check size={14} /> {saveMsg}
              </span>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <button
              disabled={page <= 1}
              onClick={() => doSearch(page - 1)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} /> Onceki
            </button>
            <span className="text-sm text-gray-500">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => doSearch(page + 1)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Sonraki <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Detail Panel (slide-over) */}
      {selectedStore && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setSelectedStore(null)}
          />
          <div className="relative w-full max-w-md bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="font-bold text-lg text-gray-900 truncate">
                {selectedStore.name || selectedStore.domain}
              </h2>
              <button
                onClick={() => setSelectedStore(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Domain link */}
              <a
                href={selectedStore.domain_url || `https://${selectedStore.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#667eea] hover:underline text-sm"
              >
                {selectedStore.domain} <ExternalLink size={13} />
              </a>

              {/* Key metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Aylik Satis</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatMoney(selectedStore.estimated_sales_usd)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Aylik Trafik</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatNumber(selectedStore.estimated_page_views)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Urun Sayisi</p>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedStore.product_count?.toLocaleString() || "—"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Ort. Fiyat</p>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedStore.avg_price_usd
                      ? `$${selectedStore.avg_price_usd.toFixed(2)}`
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Platform</span>
                  <span className="font-medium">{selectedStore.platform || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tema</span>
                  <span className="font-medium">{selectedStore.theme || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Yorumlar</span>
                  <span className="font-medium">
                    {selectedStore.store_reviews?.toLocaleString() || "—"}
                  </span>
                </div>
                {selectedStore.tiktok_followers && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">TikTok Takipci</span>
                    <span className="font-medium">
                      {formatNumber(selectedStore.tiktok_followers)}
                    </span>
                  </div>
                )}
              </div>

              {/* Categories */}
              {selectedStore.categories && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Kategoriler</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStore.categories
                      .split(":")
                      .map((c) => c.trim())
                      .filter(Boolean)
                      .map((c, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md"
                        >
                          {c
                            .split("/")
                            .filter(Boolean)
                            .pop()}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* Recent product */}
              {selectedStore.recent_product && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Son Urun</p>
                  <p className="text-sm text-gray-700">{selectedStore.recent_product}</p>
                </div>
              )}

              {/* Social links */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Sosyal Medya</p>
                <div className="flex flex-wrap gap-2">
                  {selectedStore.instagram && (
                    <a
                      href={
                        selectedStore.instagram_url ||
                        `https://instagram.com/${selectedStore.instagram}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100"
                    >
                      @{selectedStore.instagram}
                    </a>
                  )}
                  {selectedStore.tiktok && (
                    <a
                      href={
                        selectedStore.tiktok_url ||
                        `https://tiktok.com/${selectedStore.tiktok}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      {selectedStore.tiktok}
                    </a>
                  )}
                  {selectedStore.facebook && (
                    <a
                      href={`https://facebook.com/${selectedStore.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                    >
                      {selectedStore.facebook}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
