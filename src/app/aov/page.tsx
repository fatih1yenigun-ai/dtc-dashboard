"use client";

import { useState, useMemo } from "react";
import { DollarSign, TrendingUp, Target } from "lucide-react";

const NICHE_AOV: Record<string, { low: number; mid: number; high: number }> = {
  fashion: { low: 35, mid: 65, high: 120 },
  beauty: { low: 25, mid: 50, high: 95 },
  food_bev: { low: 20, mid: 40, high: 75 },
  electronics: { low: 50, mid: 120, high: 350 },
  luxury: { low: 150, mid: 400, high: 1200 },
  home: { low: 40, mid: 80, high: 200 },
  health: { low: 30, mid: 55, high: 100 },
  pet: { low: 25, mid: 45, high: 80 },
};

const NICHE_LABELS: Record<string, string> = {
  fashion: "Moda",
  beauty: "Guzellik & Bakim",
  food_bev: "Yiyecek & Icecek",
  electronics: "Elektronik",
  luxury: "Luks",
  home: "Ev & Yasam",
  health: "Saglik",
  pet: "Evcil Hayvan",
};

export default function AOVPage() {
  const [niche, setNiche] = useState("fashion");
  const [productPrice, setProductPrice] = useState(50);
  const [bundleSize, setBundleSize] = useState(1.5);
  const [upsellRate, setUpsellRate] = useState(15);

  const nicheData = NICHE_AOV[niche];

  const estimatedAOV = useMemo(() => {
    const base = productPrice * bundleSize;
    const withUpsell = base * (1 + upsellRate / 100);
    return Math.round(withUpsell);
  }, [productPrice, bundleSize, upsellRate]);

  const positioning = useMemo(() => {
    if (estimatedAOV >= nicheData.high) return { label: "Premium", color: "#27AE60" };
    if (estimatedAOV >= nicheData.mid) return { label: "Orta-Ust", color: "#667eea" };
    if (estimatedAOV >= nicheData.low) return { label: "Orta", color: "#F39C12" };
    return { label: "Dusuk", color: "#E74C3C" };
  }, [estimatedAOV, nicheData]);

  function formatMoney(n: number): string {
    return "$" + n.toLocaleString("en-US");
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">AOV Tahminleyici</h1>
        <p className="text-gray-500 mt-1">
          Ortalama siparis degerini tahmin et ve konumlandir
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Parametreler</h2>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nis
              </label>
              <select
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="w-full py-2 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30"
              >
                {Object.entries(NICHE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Urun Fiyati ($)
              </label>
              <input
                type="number"
                value={productPrice}
                onChange={(e) => setProductPrice(Number(e.target.value))}
                className="w-full py-2 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/30"
              />
            </div>

            <div className="mb-5">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">
                  Ortalama Bundle Boyutu
                </span>
                <span className="text-[#667eea] font-semibold">
                  {bundleSize.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={0.1}
                value={bundleSize}
                onChange={(e) => setBundleSize(Number(e.target.value))}
                className="w-full accent-[#667eea]"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>1x</span>
                <span>5x</span>
              </div>
            </div>

            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">
                  Upsell / Cross-sell Orani
                </span>
                <span className="text-[#667eea] font-semibold">
                  {upsellRate}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                value={upsellRate}
                onChange={(e) => setUpsellRate(Number(e.target.value))}
                className="w-full accent-[#667eea]"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>0%</span>
                <span>50%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {/* Estimated AOV */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <DollarSign
              size={32}
              className="mx-auto mb-2"
              style={{ color: positioning.color }}
            />
            <p className="text-xs text-gray-500 mb-1">Tahmini AOV</p>
            <p
              className="text-4xl font-bold"
              style={{ color: positioning.color }}
            >
              {formatMoney(estimatedAOV)}
            </p>
            <span
              className="inline-block mt-2 text-xs px-3 py-1 rounded-full font-medium"
              style={{
                backgroundColor: positioning.color + "15",
                color: positioning.color,
              }}
            >
              {positioning.label} Segment
            </span>
          </div>

          {/* Niche Comparison */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target size={16} className="text-[#667eea]" />
              {NICHE_LABELS[niche]} Nis Karsilastirmasi
            </h3>

            <div className="space-y-3">
              {[
                { label: "Dusuk Segment", value: nicheData.low },
                { label: "Orta Segment", value: nicheData.mid },
                { label: "Premium Segment", value: nicheData.high },
              ].map((seg) => {
                const pct = Math.min(
                  100,
                  (seg.value / nicheData.high) * 100
                );
                const isMatch =
                  estimatedAOV >= seg.value * 0.8 &&
                  estimatedAOV <= seg.value * 1.2;
                return (
                  <div key={seg.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{seg.label}</span>
                      <span
                        className={`font-medium ${
                          isMatch ? "text-[#667eea]" : "text-gray-500"
                        }`}
                      >
                        {formatMoney(seg.value)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: isMatch ? "#667eea" : "#d1d5db",
                        }}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Your AOV marker */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium flex items-center gap-1">
                    <TrendingUp size={14} className="text-[#27AE60]" />
                    Senin AOV
                  </span>
                  <span className="text-[#27AE60] font-bold">
                    {formatMoney(estimatedAOV)}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
                  <div
                    className="h-2 rounded-full bg-[#27AE60] transition-all"
                    style={{
                      width: `${Math.min(100, (estimatedAOV / nicheData.high) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* All Niches Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Tum Nis AOV Araliklari
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-striped">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-2 px-3 text-left text-gray-500 font-medium">
                      Nis
                    </th>
                    <th className="py-2 px-3 text-right text-gray-500 font-medium">
                      Dusuk
                    </th>
                    <th className="py-2 px-3 text-right text-gray-500 font-medium">
                      Orta
                    </th>
                    <th className="py-2 px-3 text-right text-gray-500 font-medium">
                      Premium
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(NICHE_AOV).map(([key, val]) => (
                    <tr
                      key={key}
                      className={`border-b border-gray-100 ${
                        key === niche ? "bg-[#667eea]/5" : ""
                      }`}
                    >
                      <td className="py-2 px-3 font-medium text-gray-700">
                        {NICHE_LABELS[key]}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-600">
                        {formatMoney(val.low)}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-600">
                        {formatMoney(val.mid)}
                      </td>
                      <td className="py-2 px-3 text-right text-[#27AE60] font-medium">
                        {formatMoney(val.high)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
