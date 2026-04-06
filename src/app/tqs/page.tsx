"use client";

import { useState, useMemo } from "react";
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

export default function TQSPage() {
  const [traffic, setTraffic] = useState(50000);
  const [bouncePct, setBouncePct] = useState(45);
  const [pagesPerVisit, setPagesPerVisit] = useState(3.5);
  const [sessionSeconds, setSessionSeconds] = useState(180);
  const [aov, setAov] = useState(55);
  const [niche, setNiche] = useState("fashion");

  const tqs = useMemo(
    () => calcTQS(bouncePct, pagesPerVisit, sessionSeconds),
    [bouncePct, pagesPerVisit, sessionSeconds]
  );

  const bs = useMemo(() => bounceScore(bouncePct), [bouncePct]);
  const ps = useMemo(() => pagesScore(pagesPerVisit), [pagesPerVisit]);
  const ds = useMemo(() => durationScore(sessionSeconds), [sessionSeconds]);

  const convRate = useMemo(
    () => tqsToConversion(tqs, niche),
    [tqs, niche]
  );

  const monthlyRev = useMemo(
    () => estimateRevenue(traffic, aov, convRate),
    [traffic, aov, convRate]
  );

  const yearlyRev = monthlyRev * 12;

  const nicheTable = useMemo(() => getNicheConversionTable(niche), [niche]);

  function tqsColor(val: number): string {
    if (val >= 8) return "#27AE60";
    if (val >= 6) return "#667eea";
    if (val >= 4) return "#F39C12";
    return "#E74C3C";
  }

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
        <h1 className="text-2xl font-bold text-text-primary">TQS Hesaplayıcı</h1>
        <p className="text-text-secondary mt-1">
          Trafik kalite puanını hesapla ve gelir tahminle
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inputs */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-6">
            <h2 className="font-semibold text-text-primary mb-4">Metrikler</h2>

            {/* Traffic */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-text-primary mb-1">
                Aylık Trafik
              </label>
              <input
                type="number"
                value={traffic}
                onChange={(e) => setTraffic(Number(e.target.value))}
                className="w-full py-2 px-3 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>

            {/* Bounce Rate */}
            <div className="mb-5">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-text-primary">Bounce Rate</span>
                <span className="text-accent font-semibold">{bouncePct}%</span>
              </div>
              <input
                type="range"
                min={5}
                max={95}
                value={bouncePct}
                onChange={(e) => setBouncePct(Number(e.target.value))}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-xs text-text-muted">
                <span>5%</span>
                <span>95%</span>
              </div>
            </div>

            {/* Pages per Visit */}
            <div className="mb-5">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-text-primary">Sayfa/Ziyaret</span>
                <span className="text-accent font-semibold">
                  {pagesPerVisit.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={15}
                step={0.5}
                value={pagesPerVisit}
                onChange={(e) => setPagesPerVisit(Number(e.target.value))}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-xs text-text-muted">
                <span>1</span>
                <span>15</span>
              </div>
            </div>

            {/* Session Duration */}
            <div className="mb-5">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-text-primary">Oturum Süresi</span>
                <span className="text-accent font-semibold">
                  {formatMinSec(sessionSeconds)}
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={900}
                step={10}
                value={sessionSeconds}
                onChange={(e) => setSessionSeconds(Number(e.target.value))}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-xs text-text-muted">
                <span>10sn</span>
                <span>15dk</span>
              </div>
            </div>

            {/* AOV */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-text-primary mb-1">
                AOV ($)
              </label>
              <input
                type="number"
                value={aov}
                onChange={(e) => setAov(Number(e.target.value))}
                className="w-full py-2 px-3 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>

            {/* Niche */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Niş
              </label>
              <select
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="w-full py-2 px-3 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                {Object.entries(NICHE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* TQS Gauge */}
          <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-6">
            <h2 className="font-semibold text-text-primary mb-4">
              TQS (Traffic Quality Score)
            </h2>

            <div className="flex items-center justify-center mb-6">
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center border-8"
                style={{ borderColor: tqsColor(tqs) }}
              >
                <div className="text-center">
                  <span
                    className="text-3xl font-bold"
                    style={{ color: tqsColor(tqs) }}
                  >
                    {tqs}
                  </span>
                  <span className="text-text-muted text-sm block">/10</span>
                </div>
              </div>
            </div>

            {/* Sub-scores */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-bg-main rounded-lg">
                <p className="text-xs text-text-secondary mb-1">Bounce Score</p>
                <p className="text-xl font-bold text-text-primary">{bs}</p>
                <div className="w-full bg-bg-hover rounded-full h-1.5 mt-2">
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${bs * 10}%`,
                      backgroundColor: tqsColor(bs),
                    }}
                  />
                </div>
              </div>
              <div className="text-center p-3 bg-bg-main rounded-lg">
                <p className="text-xs text-text-secondary mb-1">Pages Score</p>
                <p className="text-xl font-bold text-text-primary">{ps}</p>
                <div className="w-full bg-bg-hover rounded-full h-1.5 mt-2">
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${ps * 10}%`,
                      backgroundColor: tqsColor(ps),
                    }}
                  />
                </div>
              </div>
              <div className="text-center p-3 bg-bg-main rounded-lg">
                <p className="text-xs text-text-secondary mb-1">Duration Score</p>
                <p className="text-xl font-bold text-text-primary">{ds}</p>
                <div className="w-full bg-bg-hover rounded-full h-1.5 mt-2">
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${ds * 10}%`,
                      backgroundColor: tqsColor(ds),
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Estimates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-5">
              <p className="text-xs text-text-secondary mb-1">Dönüşüm Oranı</p>
              <p className="text-2xl font-bold text-accent">{convRate}%</p>
              <p className="text-xs text-text-muted mt-1">
                {NICHE_LABELS[niche]} nişi
              </p>
            </div>
            <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-5">
              <p className="text-xs text-text-secondary mb-1">Aylık Gelir Tahmini</p>
              <p className="text-2xl font-bold text-[#27AE60]">
                {formatMoney(monthlyRev)}
              </p>
              <p className="text-xs text-text-muted mt-1">
                {traffic.toLocaleString()} ziyaret x {convRate}% x ${aov}
              </p>
            </div>
            <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-5">
              <p className="text-xs text-text-secondary mb-1">Yıllık Gelir Tahmini</p>
              <p className="text-2xl font-bold text-[#27AE60]">
                {formatMoney(yearlyRev)}
              </p>
              <p className="text-xs text-text-muted mt-1">Aylık x 12</p>
            </div>
          </div>

          {/* Niche Conversion Table */}
          <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-6">
            <h2 className="font-semibold text-text-primary mb-4">
              {NICHE_LABELS[niche]} - Dönüşüm Tablosu
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-default">
                    <th className="py-2 px-3 text-left text-text-secondary font-medium">
                      TQS
                    </th>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((t) => (
                      <th
                        key={t}
                        className={`py-2 px-3 text-center font-medium ${
                          Math.round(tqs) === t
                            ? "text-accent"
                            : "text-text-secondary"
                        }`}
                      >
                        {t}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2 px-3 text-text-primary font-medium">
                      Dönüşüm %
                    </td>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((t) => (
                      <td
                        key={t}
                        className={`py-2 px-3 text-center ${
                          Math.round(tqs) === t
                            ? "bg-accent/10 text-accent font-bold rounded"
                            : "text-text-secondary"
                        }`}
                      >
                        {nicheTable[t]}%
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
