"use client";

import { useState, useMemo } from "react";
import { Calculator, DollarSign, TrendingUp, Target } from "lucide-react";
import {
  calcTQS,
  bounceScore,
  pagesScore,
  durationScore,
  tqsToConversion,
  estimateRevenue,
  NICHE_LABELS,
  getNicheConversionTable,
} from "@/lib/tqs";

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

const AOV_NICHE_LABELS: Record<string, string> = {
  fashion: "Moda",
  beauty: "Güzellik & Bakım",
  food_bev: "Yiyecek & İçecek",
  electronics: "Elektronik",
  luxury: "Lüks",
  home: "Ev & Yaşam",
  health: "Sağlık",
  pet: "Evcil Hayvan",
};

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState<"tqs" | "aov">("tqs");

  // ---- TQS State ----
  const [traffic, setTraffic] = useState(50000);
  const [bouncePct, setBouncePct] = useState(45);
  const [pagesPerVisit, setPagesPerVisit] = useState(3.5);
  const [sessionSeconds, setSessionSeconds] = useState(180);
  const [tqsAov, setTqsAov] = useState(55);
  const [tqsNiche, setTqsNiche] = useState("fashion");

  const tqs = useMemo(
    () => calcTQS(bouncePct, pagesPerVisit, sessionSeconds),
    [bouncePct, pagesPerVisit, sessionSeconds]
  );
  const bs = useMemo(() => bounceScore(bouncePct), [bouncePct]);
  const ps = useMemo(() => pagesScore(pagesPerVisit), [pagesPerVisit]);
  const ds = useMemo(() => durationScore(sessionSeconds), [sessionSeconds]);
  const convRate = useMemo(() => tqsToConversion(tqs, tqsNiche), [tqs, tqsNiche]);
  const monthlyRev = useMemo(() => estimateRevenue(traffic, tqsAov, convRate), [traffic, tqsAov, convRate]);
  const yearlyRev = monthlyRev * 12;
  const nicheTable = useMemo(() => getNicheConversionTable(tqsNiche), [tqsNiche]);

  function tqsColor(val: number): string {
    if (val >= 8) return "#27AE60";
    if (val >= 6) return "#667eea";
    if (val >= 4) return "#F39C12";
    return "#E74C3C";
  }

  // ---- AOV State ----
  const [aovNiche, setAovNiche] = useState("fashion");
  const [productPrice, setProductPrice] = useState(50);
  const [bundleSize, setBundleSize] = useState(1.5);
  const [upsellRate, setUpsellRate] = useState(15);

  const aovNicheData = NICHE_AOV[aovNiche];
  const estimatedAOV = useMemo(() => {
    const base = productPrice * bundleSize;
    const withUpsell = base * (1 + upsellRate / 100);
    return Math.round(withUpsell);
  }, [productPrice, bundleSize, upsellRate]);

  const positioning = useMemo(() => {
    if (estimatedAOV >= aovNicheData.high) return { label: "Premium", color: "#27AE60" };
    if (estimatedAOV >= aovNicheData.mid) return { label: "Orta-Üst", color: "#667eea" };
    if (estimatedAOV >= aovNicheData.low) return { label: "Orta", color: "#F39C12" };
    return { label: "Düşük", color: "#E74C3C" };
  }, [estimatedAOV, aovNicheData]);

  function formatMoney(n: number): string {
    return "$" + n.toLocaleString("en-US");
  }

  function formatMinSec(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}dk ${s}sn`;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Teknik Araçlar</h1>
        <p className="text-text-secondary mt-1">TQS ve AOV hesaplayıcıları</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("tqs")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "tqs"
              ? "bg-accent text-white shadow-md"
              : "bg-bg-card text-text-secondary border border-border-default hover:bg-bg-hover"
          }`}
        >
          <Calculator size={16} />
          TQS Hesaplayıcı
        </button>
        <button
          onClick={() => setActiveTab("aov")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "aov"
              ? "bg-accent text-white shadow-md"
              : "bg-bg-card text-text-secondary border border-border-default hover:bg-bg-hover"
          }`}
        >
          <DollarSign size={16} />
          AOV Tahminleyici
        </button>
      </div>

      {/* TQS Tab */}
      {activeTab === "tqs" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inputs */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-6">
              <h2 className="font-semibold text-text-primary mb-4">Metrikler</h2>

              <div className="mb-5">
                <label className="block text-sm font-medium text-text-primary mb-1">Aylık Trafik</label>
                <input
                  type="number"
                  value={traffic}
                  onChange={(e) => setTraffic(Number(e.target.value))}
                  className="w-full py-2 px-3 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              <div className="mb-5">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-text-primary">Bounce Rate</span>
                  <span className="text-accent font-semibold">{bouncePct}%</span>
                </div>
                <input type="range" min={5} max={95} value={bouncePct} onChange={(e) => setBouncePct(Number(e.target.value))} className="w-full accent-accent" />
                <div className="flex justify-between text-xs text-text-muted"><span>5%</span><span>95%</span></div>
              </div>

              <div className="mb-5">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-text-primary">Sayfa/Ziyaret</span>
                  <span className="text-accent font-semibold">{pagesPerVisit.toFixed(1)}</span>
                </div>
                <input type="range" min={1} max={15} step={0.5} value={pagesPerVisit} onChange={(e) => setPagesPerVisit(Number(e.target.value))} className="w-full accent-accent" />
                <div className="flex justify-between text-xs text-text-muted"><span>1</span><span>15</span></div>
              </div>

              <div className="mb-5">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-text-primary">Oturum Süresi</span>
                  <span className="text-accent font-semibold">{formatMinSec(sessionSeconds)}</span>
                </div>
                <input type="range" min={10} max={900} step={10} value={sessionSeconds} onChange={(e) => setSessionSeconds(Number(e.target.value))} className="w-full accent-accent" />
                <div className="flex justify-between text-xs text-text-muted"><span>10sn</span><span>15dk</span></div>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-text-primary mb-1">AOV ($)</label>
                <input
                  type="number"
                  value={tqsAov}
                  onChange={(e) => setTqsAov(Number(e.target.value))}
                  className="w-full py-2 px-3 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Niş</label>
                <select
                  value={tqsNiche}
                  onChange={(e) => setTqsNiche(e.target.value)}
                  className="w-full py-2 px-3 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                >
                  {Object.entries(NICHE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-6">
              <h2 className="font-semibold text-text-primary mb-4">TQS (Traffic Quality Score)</h2>
              <div className="flex items-center justify-center mb-6">
                <div className="w-32 h-32 rounded-full flex items-center justify-center border-8" style={{ borderColor: tqsColor(tqs) }}>
                  <div className="text-center">
                    <span className="text-3xl font-bold" style={{ color: tqsColor(tqs) }}>{tqs}</span>
                    <span className="text-text-muted text-sm block">/10</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[{ label: "Bounce Score", val: bs }, { label: "Pages Score", val: ps }, { label: "Duration Score", val: ds }].map((item) => (
                  <div key={item.label} className="text-center p-3 bg-bg-main rounded-lg">
                    <p className="text-xs text-text-secondary mb-1">{item.label}</p>
                    <p className="text-xl font-bold text-text-primary">{item.val}</p>
                    <div className="w-full bg-bg-hover rounded-full h-1.5 mt-2">
                      <div className="h-1.5 rounded-full" style={{ width: `${item.val * 10}%`, backgroundColor: tqsColor(item.val) }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-5">
                <p className="text-xs text-text-secondary mb-1">Dönüşüm Oranı</p>
                <p className="text-2xl font-bold text-accent">{convRate}%</p>
                <p className="text-xs text-text-muted mt-1">{NICHE_LABELS[tqsNiche]} nişi</p>
              </div>
              <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-5">
                <p className="text-xs text-text-secondary mb-1">Aylık Gelir Tahmini</p>
                <p className="text-2xl font-bold text-[#27AE60]">{formatMoney(monthlyRev)}</p>
                <p className="text-xs text-text-muted mt-1">{traffic.toLocaleString()} ziyaret x {convRate}% x ${tqsAov}</p>
              </div>
              <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-5">
                <p className="text-xs text-text-secondary mb-1">Yıllık Gelir Tahmini</p>
                <p className="text-2xl font-bold text-[#27AE60]">{formatMoney(yearlyRev)}</p>
                <p className="text-xs text-text-muted mt-1">Aylık x 12</p>
              </div>
            </div>

            <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-6">
              <h2 className="font-semibold text-text-primary mb-4">{NICHE_LABELS[tqsNiche]} - Dönüşüm Tablosu</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-default">
                      <th className="py-2 px-3 text-left text-text-secondary font-medium">TQS</th>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((t) => (
                        <th key={t} className={`py-2 px-3 text-center font-medium ${Math.round(tqs) === t ? "text-accent" : "text-text-secondary"}`}>{t}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 px-3 text-text-primary font-medium">Dönüşüm %</td>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((t) => (
                        <td key={t} className={`py-2 px-3 text-center ${Math.round(tqs) === t ? "bg-accent/10 text-accent font-bold rounded" : "text-text-secondary"}`}>{nicheTable[t]}%</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AOV Tab */}
      {activeTab === "aov" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="space-y-4">
            <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-6">
              <h2 className="font-semibold text-text-primary mb-4">Parametreler</h2>

              <div className="mb-5">
                <label className="block text-sm font-medium text-text-primary mb-1">Niş</label>
                <select
                  value={aovNiche}
                  onChange={(e) => setAovNiche(e.target.value)}
                  className="w-full py-2 px-3 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                >
                  {Object.entries(AOV_NICHE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-text-primary mb-1">Ürün Fiyatı ($)</label>
                <input
                  type="number"
                  value={productPrice}
                  onChange={(e) => setProductPrice(Number(e.target.value))}
                  className="w-full py-2 px-3 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              <div className="mb-5">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-text-primary">Ortalama Bundle Boyutu</span>
                  <span className="text-accent font-semibold">{bundleSize.toFixed(1)}x</span>
                </div>
                <input type="range" min={1} max={5} step={0.1} value={bundleSize} onChange={(e) => setBundleSize(Number(e.target.value))} className="w-full accent-accent" />
                <div className="flex justify-between text-xs text-text-muted"><span>1x</span><span>5x</span></div>
              </div>

              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-text-primary">Upsell / Cross-sell Oranı</span>
                  <span className="text-accent font-semibold">{upsellRate}%</span>
                </div>
                <input type="range" min={0} max={50} value={upsellRate} onChange={(e) => setUpsellRate(Number(e.target.value))} className="w-full accent-accent" />
                <div className="flex justify-between text-xs text-text-muted"><span>0%</span><span>50%</span></div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-6 text-center">
              <DollarSign size={32} className="mx-auto mb-2" style={{ color: positioning.color }} />
              <p className="text-xs text-text-secondary mb-1">Tahmini AOV</p>
              <p className="text-4xl font-bold" style={{ color: positioning.color }}>{formatMoney(estimatedAOV)}</p>
              <span
                className="inline-block mt-2 text-xs px-3 py-1 rounded-full font-medium"
                style={{ backgroundColor: positioning.color + "15", color: positioning.color }}
              >
                {positioning.label} Segment
              </span>
            </div>

            <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-6">
              <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Target size={16} className="text-accent" />
                {AOV_NICHE_LABELS[aovNiche]} Niş Karşılaştırması
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Düşük Segment", value: aovNicheData.low },
                  { label: "Orta Segment", value: aovNicheData.mid },
                  { label: "Premium Segment", value: aovNicheData.high },
                ].map((seg) => {
                  const pct = Math.min(100, (seg.value / aovNicheData.high) * 100);
                  const isMatch = estimatedAOV >= seg.value * 0.8 && estimatedAOV <= seg.value * 1.2;
                  return (
                    <div key={seg.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-text-secondary">{seg.label}</span>
                        <span className={`font-medium ${isMatch ? "text-accent" : "text-text-secondary"}`}>{formatMoney(seg.value)}</span>
                      </div>
                      <div className="w-full bg-bg-hover rounded-full h-2">
                        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: isMatch ? "#667eea" : "#d1d5db" }} />
                      </div>
                    </div>
                  );
                })}
                <div className="pt-2 border-t border-border-default">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary font-medium flex items-center gap-1">
                      <TrendingUp size={14} className="text-[#27AE60]" />
                      Senin AOV
                    </span>
                    <span className="text-[#27AE60] font-bold">{formatMoney(estimatedAOV)}</span>
                  </div>
                  <div className="w-full bg-bg-hover rounded-full h-2 mt-1">
                    <div className="h-2 rounded-full bg-[#27AE60] transition-all" style={{ width: `${Math.min(100, (estimatedAOV / aovNicheData.high) * 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-6">
              <h3 className="font-semibold text-text-primary mb-4">Tüm Niş AOV Aralıkları</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm table-striped">
                  <thead>
                    <tr className="border-b border-border-default">
                      <th className="py-2 px-3 text-left text-text-secondary font-medium">Niş</th>
                      <th className="py-2 px-3 text-right text-text-secondary font-medium">Düşük</th>
                      <th className="py-2 px-3 text-right text-text-secondary font-medium">Orta</th>
                      <th className="py-2 px-3 text-right text-text-secondary font-medium">Premium</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(NICHE_AOV).map(([key, val]) => (
                      <tr key={key} className={`border-b border-border-default ${key === aovNiche ? "bg-accent/5" : ""}`}>
                        <td className="py-2 px-3 font-medium text-text-primary">{AOV_NICHE_LABELS[key]}</td>
                        <td className="py-2 px-3 text-right text-text-secondary">{formatMoney(val.low)}</td>
                        <td className="py-2 px-3 text-right text-text-secondary">{formatMoney(val.mid)}</td>
                        <td className="py-2 px-3 text-right text-[#27AE60] font-medium">{formatMoney(val.high)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
