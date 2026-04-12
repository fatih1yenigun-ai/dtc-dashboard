"use client";

import { useState, useEffect, useCallback } from "react";
import FaycomLoader from "@/components/FaycomLoader";
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
/* eslint-disable @next/next/no-img-element */
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
  const [folders, setFolders] = useState<string[]>([]);
  const [newFolder, setNewFolder] = useState("");
  const [saving, setSaving] = useState<number | null>(null); // store id being saved
  const [saveMsg, setSaveMsg] = useState("");
  const [saveDropdownId, setSaveDropdownId] = useState<number | null>(null);
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
    loadFolders(user.userId).then((f) => setFolders(f));
  }, [user]);

  const handleSaveToFolder = async (store: StoreData, folderName: string) => {
    setSaving(store.id);
    const brand: BrandData = {
      Marka: store.name || store.domain,
      brand: store.name || store.domain,
      "Web Sitesi": store.domain_url || `https://${store.domain}`,
      website: store.domain_url || `https://${store.domain}`,
      Kategori: extractTopCategory(store.categories),
      category: extractTopCategory(store.categories),
      "Alt Niş": store.categories || "",
      sub_niche: store.categories || "",
      "Öne Çıkan Özellik": [
        store.estimated_sales_usd ? `Satis: ${formatMoney(store.estimated_sales_usd)}/ay` : "",
        store.estimated_page_views ? `Trafik: ${formatNumber(store.estimated_page_views)}` : "",
        store.platform || "",
      ].filter(Boolean).join(" | "),
      favicon_url: store.favicon_url || "",
      source: "storeleads",
    };

    await saveBrandsBulk(folderName, [brand], user?.userId);
    setSaving(null);
    setSaveDropdownId(null);
    setSaveMsg(`'${store.name || store.domain}' kaydedildi`);
    setTimeout(() => setSaveMsg(""), 2000);
  };

  const handleCreateAndSave = async (store: StoreData) => {
    if (!newFolder.trim()) return;
    await createFolder(newFolder.trim(), user?.userId);
    const f = await loadFolders(user?.userId);
    setFolders(f);
    await handleSaveToFolder(store, newFolder.trim());
    setNewFolder("");
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
        <h1 className="text-2xl font-bold text-text-primary">Mağaza Keşif</h1>
        <p className="text-text-secondary mt-1">
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
                : "bg-bg-card border border-border-default text-text-secondary hover:border-accent hover:text-accent"
            }`}
          >
            {r === "turkey" && `Turkiye ${filterOptions ? `(${filterOptions.counts.turkey.toLocaleString()})` : ""}`}
            {r === "global" && `Global ${filterOptions ? `(${filterOptions.counts.global.toLocaleString()})` : ""}`}
            {r === "all" && `Tumu ${filterOptions ? `(${filterOptions.counts.total.toLocaleString()})` : ""}`}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-bg-card rounded-[14px] border border-border-default p-4 mb-6">
        {/* Category selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setSubCategory("");
            }}
            className="px-3 py-2 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
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
            className="px-3 py-2 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-40"
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
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doSearch(1)}
                placeholder="Domain, isim veya urun ara..."
                className="w-full pl-9 pr-4 py-2 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>
          </div>
          <input
            type="number"
            value={minSales}
            onChange={(e) => setMinSales(e.target.value)}
            placeholder="Min satis ($)"
            className="px-3 py-2 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
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
        <p className="text-sm text-text-secondary">
          {total.toLocaleString()} sonuc bulundu
          {totalPages > 1 && ` — Sayfa ${page}/${totalPages}`}
        </p>
      </div>

      {/* Results Table */}
      <div className="bg-bg-card rounded-[14px] border border-border-default overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default bg-bg-main/50">
                <th className="w-10 px-2 py-3"></th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Magaza</th>
                <th className="text-left px-3 py-3 font-medium text-text-secondary">Platform</th>
                <th className="text-left px-3 py-3 font-medium text-text-secondary">Kategori</th>
                <th
                  className="text-right px-3 py-3 font-medium text-text-secondary cursor-pointer hover:text-accent select-none"
                  onClick={() => handleSort("estimated_sales_usd")}
                >
                  <span className="inline-flex items-center gap-1">
                    Aylik Satis
                    <ArrowUpDown size={12} />
                  </span>
                </th>
                <th
                  className="text-right px-3 py-3 font-medium text-text-secondary cursor-pointer hover:text-accent select-none"
                  onClick={() => handleSort("estimated_page_views")}
                >
                  <span className="inline-flex items-center gap-1">
                    Trafik
                    <ArrowUpDown size={12} />
                  </span>
                </th>
                <th
                  className="text-right px-3 py-3 font-medium text-text-secondary cursor-pointer hover:text-accent select-none"
                  onClick={() => handleSort("product_count")}
                >
                  <span className="inline-flex items-center gap-1">
                    Urunler
                    <ArrowUpDown size={12} />
                  </span>
                </th>
                <th className="text-left px-3 py-3 font-medium text-text-secondary">Sosyal</th>
              </tr>
            </thead>
            <tbody>
              {loading && stores.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <FaycomLoader />
                  </td>
                </tr>
              ) : stores.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-text-muted">
                    Sonuc bulunamadi. Filtreleri degistirin.
                  </td>
                </tr>
              ) : (
                stores.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-border-default hover:bg-bg-hover/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedStore(s)}
                  >
                    <td className="px-2 py-3 relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSaveDropdownId(saveDropdownId === s.id ? null : s.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          saving === s.id
                            ? "text-accent"
                            : "text-text-muted hover:text-accent hover:bg-accent/10"
                        }`}
                        title="Kaydet"
                      >
                        {saving === s.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Bookmark size={16} />
                        )}
                      </button>
                      {saveDropdownId === s.id && (
                        <div className="absolute left-0 top-full z-50 mt-1 w-48 bg-bg-card border border-border-default rounded-xl shadow-lg py-1">
                          {folders.map((f) => (
                            <button
                              key={f}
                              onClick={() => handleSaveToFolder(s, f)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-bg-hover flex items-center gap-2"
                            >
                              <Bookmark size={13} className="text-text-muted" />
                              {f}
                            </button>
                          ))}
                          <div className="border-t border-border-default mt-1 pt-1 px-2 pb-1">
                            <div className="flex gap-1">
                              <input
                                type="text"
                                value={newFolder}
                                onChange={(e) => setNewFolder(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleCreateAndSave(s)}
                                placeholder="Yeni klasor..."
                                className="flex-1 px-2 py-1 text-xs border border-border-default rounded-lg focus:outline-none focus:ring-1 focus:ring-accent/30"
                              />
                              {newFolder.trim() && (
                                <button
                                  onClick={() => handleCreateAndSave(s)}
                                  className="p-1 text-accent hover:bg-accent/10 rounded"
                                >
                                  <FolderPlus size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
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
                          <Store size={16} className="text-text-muted" />
                        )}
                        <div>
                          <a
                            href={s.domain_url || `https://${s.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="font-medium text-text-primary hover:text-accent truncate max-w-[200px] block"
                          >
                            {s.name || s.domain}
                          </a>
                          <p className="text-xs text-text-muted">{s.domain}</p>
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
                            : "bg-bg-hover text-text-secondary"
                        }`}
                      >
                        {s.platform || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-text-secondary text-xs truncate max-w-[150px]">
                      {extractTopCategory(s.categories) || "—"}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-text-primary">
                      {formatMoney(s.estimated_sales_usd)}
                    </td>
                    <td className="px-3 py-3 text-right text-text-secondary">
                      {formatNumber(s.estimated_page_views)}
                    </td>
                    <td className="px-3 py-3 text-right text-text-secondary">
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
                            className="text-text-primary hover:text-black text-xs"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border-default">
            <button
              disabled={page <= 1}
              onClick={() => doSearch(page - 1)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-border-default hover:bg-bg-hover disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} /> Onceki
            </button>
            <span className="text-sm text-text-secondary">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => doSearch(page + 1)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-border-default hover:bg-bg-hover disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Sonraki <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Save toast */}
      {saveMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm animate-in fade-in">
          <Check size={15} className="text-green-400" />
          {saveMsg}
        </div>
      )}

      {/* Close dropdown on outside click */}
      {saveDropdownId !== null && (
        <div className="fixed inset-0 z-40" onClick={() => setSaveDropdownId(null)} />
      )}

      {/* Detail Panel (slide-over) */}
      {selectedStore && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setSelectedStore(null)}
          />
          <div className="relative w-full max-w-md bg-bg-card shadow-2xl overflow-y-auto animate-in slide-in-from-right">
            <div className="sticky top-0 bg-bg-card border-b border-border-default px-6 py-4 flex items-center justify-between">
              <h2 className="font-bold text-lg text-text-primary truncate">
                {selectedStore.name || selectedStore.domain}
              </h2>
              <button
                onClick={() => setSelectedStore(null)}
                className="text-text-muted hover:text-text-secondary p-1"
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
                className="inline-flex items-center gap-1.5 text-accent hover:underline text-sm"
              >
                {selectedStore.domain} <ExternalLink size={13} />
              </a>

              {/* Key metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-bg-main rounded-lg p-3">
                  <p className="text-xs text-text-secondary">Aylik Satis</p>
                  <p className="text-lg font-bold text-text-primary">
                    {formatMoney(selectedStore.estimated_sales_usd)}
                  </p>
                </div>
                <div className="bg-bg-main rounded-lg p-3">
                  <p className="text-xs text-text-secondary">Aylik Trafik</p>
                  <p className="text-lg font-bold text-text-primary">
                    {formatNumber(selectedStore.estimated_page_views)}
                  </p>
                </div>
                <div className="bg-bg-main rounded-lg p-3">
                  <p className="text-xs text-text-secondary">Urun Sayisi</p>
                  <p className="text-lg font-bold text-text-primary">
                    {selectedStore.product_count?.toLocaleString() || "—"}
                  </p>
                </div>
                <div className="bg-bg-main rounded-lg p-3">
                  <p className="text-xs text-text-secondary">Ort. Fiyat</p>
                  <p className="text-lg font-bold text-text-primary">
                    {selectedStore.avg_price_usd
                      ? `$${selectedStore.avg_price_usd.toFixed(2)}`
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Platform</span>
                  <span className="font-medium">{selectedStore.platform || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Tema</span>
                  <span className="font-medium">{selectedStore.theme || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Yorumlar</span>
                  <span className="font-medium">
                    {selectedStore.store_reviews?.toLocaleString() || "—"}
                  </span>
                </div>
                {selectedStore.tiktok_followers && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">TikTok Takipci</span>
                    <span className="font-medium">
                      {formatNumber(selectedStore.tiktok_followers)}
                    </span>
                  </div>
                )}
              </div>

              {/* Categories */}
              {selectedStore.categories && (
                <div>
                  <p className="text-xs text-text-secondary mb-2">Kategoriler</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStore.categories
                      .split(":")
                      .map((c) => c.trim())
                      .filter(Boolean)
                      .map((c, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 bg-bg-hover text-text-secondary rounded-md"
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
                  <p className="text-xs text-text-secondary mb-1">Son Urun</p>
                  <p className="text-sm text-text-primary">{selectedStore.recent_product}</p>
                </div>
              )}

              {/* Social links */}
              <div>
                <p className="text-xs text-text-secondary mb-2">Sosyal Medya</p>
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
                      className="text-xs px-3 py-1.5 bg-bg-hover text-text-primary rounded-lg hover:bg-bg-hover"
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
