"use client";

import { useState } from "react";
import { Search, Loader2, ExternalLink, Globe } from "lucide-react";

interface BrandInfo {
  brand_name: string;
  website: string;
  description: string;
  founded: string;
  category: string;
  estimated_revenue: string;
  target_audience: string;
  marketing_channels: string[];
  unique_selling_point: string;
  meta_ads_url: string;
}

export default function BrandsPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [brand, setBrand] = useState<BrandInfo | null>(null);
  const [error, setError] = useState("");

  async function handleScan() {
    if (!url.trim()) return;
    setLoading(true);
    setBrand(null);
    setError("");

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: `Analyze the DTC brand at ${url.trim()}`,
          count: 1,
          niche: "fashion",
        }),
      });
      const data = await res.json();
      if (data.brands && data.brands.length > 0) {
        const b = data.brands[0];
        setBrand({
          brand_name: b.brand_name,
          website: b.website,
          description: b.insight,
          founded: "N/A",
          category: b.category,
          estimated_revenue: "N/A",
          target_audience: "DTC tuketiciler",
          marketing_channels: ["Meta Ads", "Google Ads", "Email"],
          unique_selling_point: b.insight,
          meta_ads_url: b.meta_ads_url,
        });
      } else {
        setError("Marka bilgisi bulunamadi.");
      }
    } catch {
      setError("Tarama sirasinda hata olustu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Marka Tarayici</h1>
        <p className="text-gray-500 mt-1">
          Bir DTC markasini URL ile analiz et
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Globe
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              placeholder="ornegin: glossier.com, allbirds.com..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30 focus:border-[#667eea]"
            />
          </div>
          <button
            onClick={handleScan}
            disabled={loading || !url.trim()}
            className="gradient-accent text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
            Tara
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={40} className="animate-spin text-[#667eea] mb-4" />
          <p className="text-gray-500">Marka analiz ediliyor...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {/* Result */}
      {brand && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {brand.brand_name}
              </h2>
              <a
                href={
                  brand.website.startsWith("http")
                    ? brand.website
                    : `https://${brand.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2980B9] hover:underline flex items-center gap-1 text-sm"
              >
                {brand.website} <ExternalLink size={12} />
              </a>
            </div>
            <span className="text-xs bg-[#667eea]/10 text-[#667eea] px-3 py-1 rounded-full font-medium">
              {brand.category}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Aciklama
              </h3>
              <p className="text-gray-800 text-sm">{brand.description}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Benzersiz Deger Onerisi
              </h3>
              <p className="text-gray-800 text-sm">
                {brand.unique_selling_point}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Hedef Kitle
              </h3>
              <p className="text-gray-800 text-sm">{brand.target_audience}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Pazarlama Kanallari
              </h3>
              <div className="flex flex-wrap gap-1">
                {brand.marketing_channels.map((ch) => (
                  <span
                    key={ch}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                  >
                    {ch}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <a
              href={brand.meta_ads_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              Meta Reklam Kutuphanesi <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
