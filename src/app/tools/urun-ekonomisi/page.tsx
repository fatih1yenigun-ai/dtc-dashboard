"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { ArrowLeft, HelpCircle, Plus, Trash2, Calculator, Save, List } from "lucide-react";
import Link from "next/link";
import SegmentedButton from "@/components/tools/SegmentedButton";
import SaveModal from "@/components/tools/SaveModal";
import SavedListSlideOver, { type SavedItem } from "@/components/tools/SavedListSlideOver";
import { useAuth } from "@/context/AuthContext";
import { saveToolData, loadToolSaves, deleteToolSave, type ToolSave } from "@/lib/tool-saves";
import {
  calculateAll,
  CURRENCY_SYMBOLS,
  type BundleRow,
  type UrunEkonomisiInputs,
  type BundleResult,
} from "@/lib/urun-ekonomisi";

const CURRENCY_OPTIONS = [
  { value: "TL", label: "TL" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
];

function roasBg(roas: number, ebm: number): string {
  if (ebm <= 0 || roas < 1.5) return "rgba(232, 64, 64, 0.08)";
  if (roas < 2) return "rgba(240, 176, 64, 0.08)";
  if (roas >= 3) return "rgba(64, 200, 96, 0.08)";
  return "transparent";
}

export default function UrunEkonomisiPage() {
  const { user } = useAuth();

  // --- Inputs ---
  const [currency, setCurrency] = useState<"TL" | "USD" | "EUR">("TL");
  const [islemUcreti, setIslemUcreti] = useState(4);
  const [kdvEnabled, setKdvEnabled] = useState(false);
  const [kdvOrani, setKdvOrani] = useState(20);
  const [karHedefleri, setKarHedefleri] = useState([15, 20, 25, 30, 35]);
  const [bundles, setBundles] = useState<BundleRow[]>([
    { adet: 2, satisFiyati: 0, cogsOverride: 0 },
    { adet: 4, satisFiyati: 0, cogsOverride: 0 },
  ]);

  // --- Save/Load ---
  const [saveOpen, setSaveOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedItems, setSavedItems] = useState<ToolSave[]>([]);

  const loadSavedItems = useCallback(async () => {
    if (!user) return;
    const items = await loadToolSaves(user.userId, "urun-ekonomisi");
    setSavedItems(items);
  }, [user]);

  useEffect(() => {
    loadSavedItems();
  }, [loadSavedItems]);

  const handleSave = async (name: string) => {
    if (!user) return;
    setSaving(true);
    const data = { currency, islemUcreti, kdvEnabled, kdvOrani, karHedefleri, bundles };
    await saveToolData(user.userId, "urun-ekonomisi", name, data as unknown as Record<string, unknown>);
    setSaving(false);
    setSaveOpen(false);
    loadSavedItems();
  };

  const handleLoad = (item: SavedItem) => {
    const saved = savedItems.find((s) => s.id === item.id);
    if (!saved) return;
    const d = saved.data as Record<string, unknown>;
    setCurrency((d.currency as "TL" | "USD" | "EUR") || "TL");
    setIslemUcreti((d.islemUcreti as number) || 4);
    setKdvEnabled((d.kdvEnabled as boolean) || false);
    setKdvOrani((d.kdvOrani as number) || 20);
    setKarHedefleri((d.karHedefleri as number[]) || [15, 20, 25, 30, 35]);
    setBundles((d.bundles as BundleRow[]) || []);
    setSavedOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (!user) return;
    await deleteToolSave(id, user.userId);
    loadSavedItems();
  };

  // --- Calculations (real-time) ---
  const inputs: UrunEkonomisiInputs = useMemo(
    () => ({ islemUcreti, kdvEnabled, kdvOrani, karHedefleri, birimMaliyet: 0, bundles, currency }),
    [islemUcreti, kdvEnabled, kdvOrani, karHedefleri, bundles, currency]
  );

  const results: BundleResult[] = useMemo(() => {
    if (bundles.some((b) => !b.satisFiyati)) return [];
    return calculateAll(inputs);
  }, [inputs, bundles]);

  const sym = CURRENCY_SYMBOLS[currency];

  // --- Bundle helpers ---
  const updateBundle = (idx: number, patch: Partial<BundleRow>) => {
    setBundles((prev) => prev.map((b, i) => (i === idx ? { ...b, ...patch } : b)));
  };

  const addBundle = () => {
    if (bundles.length >= 6) return;
    const lastAdet = bundles[bundles.length - 1]?.adet || 1;
    setBundles((prev) => [...prev, { adet: lastAdet + 2, satisFiyati: 0, cogsOverride: 0 }]);
  };

  const removeBundle = (idx: number) => {
    if (bundles.length <= 2) return;
    setBundles((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/tools" className="text-text-muted hover:text-text-secondary transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-text-primary">Ürün Ekonomisi</h1>
              <Link
                href="/tools/urun-ekonomisi/ogren"
                className="text-text-muted hover:text-accent transition-colors"
                title="Öğren"
              >
                <HelpCircle size={18} />
              </Link>
            </div>
            <p className="text-text-secondary text-sm mt-0.5">Birim ekonomisini analiz et, EBM ve ROAS matrisini görselleştir</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSaveOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Save size={14} />
            Kaydet
          </button>
          <button
            onClick={() => setSavedOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-border-default text-text-secondary text-sm font-medium hover:bg-bg-hover transition-colors"
          >
            <List size={14} />
            Kayıtlar
          </button>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left panel — Inputs */}
        <div className="w-full lg:w-[360px] lg:min-w-[360px] space-y-5">
          {/* Global Settings */}
          <div className="bg-bg-card rounded-[14px] border border-border-default p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">Genel Ayarlar</h2>

            {/* Currency */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-text-secondary mb-2">Para Birimi</label>
              <SegmentedButton options={CURRENCY_OPTIONS} value={currency} onChange={(v) => setCurrency(v as "TL" | "USD" | "EUR")} />
            </div>

            {/* İşlem Ücreti */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-text-secondary mb-1.5">İşlem Ücreti %</label>
              <div className="relative">
                <input
                  type="number"
                  value={islemUcreti}
                  onChange={(e) => setIslemUcreti(Number(e.target.value))}
                  className="w-full py-2 px-3 pr-8 border border-border-default rounded-lg text-sm bg-bg-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">%</span>
              </div>
              <p className="text-[11px] text-text-muted mt-1">Ödeme işlemcisi komisyonu</p>
            </div>

            {/* KDV */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-text-secondary">KDV Dahil</label>
                <button
                  onClick={() => setKdvEnabled(!kdvEnabled)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${kdvEnabled ? "bg-accent" : "bg-bg-hover border border-border-default"}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${kdvEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
              {kdvEnabled && (
                <div className="relative">
                  <input
                    type="number"
                    value={kdvOrani}
                    onChange={(e) => setKdvOrani(Number(e.target.value))}
                    className="w-full py-2 px-3 pr-8 border border-border-default rounded-lg text-sm bg-bg-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">%</span>
                </div>
              )}
            </div>

            {/* Kâr Hedefleri */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">Kâr Yüzdeleri</label>
              <div className="flex gap-1.5">
                {karHedefleri.map((val, idx) => (
                  <div key={idx} className="relative flex-1">
                    <input
                      type="number"
                      value={val}
                      onChange={(e) => {
                        const next = [...karHedefleri];
                        next[idx] = Number(e.target.value);
                        setKarHedefleri(next);
                      }}
                      className="w-full py-2 px-2 pr-5 border border-border-default rounded-lg text-xs text-center bg-bg-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-text-muted text-[10px]">%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bundle rows */}
          <div className="bg-bg-card rounded-[14px] border border-border-default p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-1">Paket Satırları</h2>
            <p className="text-[11px] text-text-muted mb-3">Her paket için adet, satış fiyatı ve maliyeti girin</p>

            <div className="space-y-3">
              {bundles.map((bundle, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-bg-main border border-border-subtle">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-medium text-text-muted">Paket {idx + 1}</span>
                      {bundles.length > 2 && (
                        <button onClick={() => removeBundle(idx)} className="ml-auto text-text-muted hover:text-red-400 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-text-muted mb-1">Adet</label>
                        <input
                          type="number"
                          value={bundle.adet}
                          onChange={(e) => updateBundle(idx, { adet: Number(e.target.value) })}
                          className="w-full py-1.5 px-2 border border-border-default rounded-lg text-xs bg-bg-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-text-muted mb-1">Satış Fiyatı</label>
                        <input
                          type="number"
                          value={bundle.satisFiyati || ""}
                          onChange={(e) => updateBundle(idx, { satisFiyati: Number(e.target.value) })}
                          placeholder={sym}
                          className="w-full py-1.5 px-2 border border-border-default rounded-lg text-xs bg-bg-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-text-muted mb-1">COGS</label>
                        <input
                          type="number"
                          value={bundle.cogsOverride || ""}
                          onChange={(e) => updateBundle(idx, { cogsOverride: Number(e.target.value) })}
                          placeholder={sym}
                          className="w-full py-1.5 px-2 border border-border-default rounded-lg text-xs bg-bg-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </div>
                    </div>
                  </div>
              ))}
            </div>

            {bundles.length < 6 && (
              <button
                onClick={addBundle}
                className="mt-3 w-full py-2 rounded-lg border border-dashed border-border-default text-text-muted hover:text-text-secondary hover:border-text-muted text-xs font-medium transition-colors flex items-center justify-center gap-1"
              >
                <Plus size={13} /> Paket Ekle
              </button>
            )}

            <button
              onClick={() => {}} // matrix updates in real-time via useMemo
              className="mt-4 w-full py-2.5 rounded-full bg-accent text-white font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Calculator size={15} />
              Hesapla
            </button>
          </div>
        </div>

        {/* Right panel — Output Matrix */}
        <div className="flex-1 min-w-0">
          {results.length > 0 ? (
            <div className="bg-bg-card rounded-[14px] border border-border-default overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ fontVariantNumeric: "tabular-nums" }}>
                  <thead>
                    <tr className="border-b border-border-default">
                      <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary">Adet</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary">Satış Fiyatı</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary">COGS</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary bg-bg-hover">Başabaş</th>
                      {karHedefleri.map((k) => (
                        <th key={k} className="py-3 px-4 text-left text-xs font-medium text-text-secondary">{k}% kâr</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, rowIdx) => (
                      <tr key={rowIdx} className="border-b border-border-subtle last:border-b-0">
                        <td className="py-3 px-4 text-text-primary font-medium">{r.adet}</td>
                        <td className="py-3 px-4 text-text-primary">{r.satisFiyati}{sym}</td>
                        <td className="py-3 px-4 text-text-secondary">{r.cogsToplam}{sym}</td>
                        {/* Başabaş */}
                        <td
                          className="py-3 px-4 bg-bg-hover"
                          style={{
                            borderLeft: "0.5px solid var(--border-subtle)",
                            borderRight: "0.5px solid var(--border-subtle)",
                          }}
                        >
                          {r.basabasEbm > 0 ? (
                            <>
                              <div className="text-text-primary font-bold text-[15px]">EBM {r.basabasEbm}{sym}</div>
                              <div className="text-text-secondary text-xs">ROAS {r.basabasRoas}</div>
                            </>
                          ) : (
                            <div className="text-red-400 font-medium">—</div>
                          )}
                        </td>
                        {/* Kâr hedefleri */}
                        {r.hedefler.map((h) => (
                          <td
                            key={h.karYuzdesi}
                            className="py-3 px-4"
                            style={{
                              backgroundColor: roasBg(h.roas, h.ebm),
                              borderLeft: "0.5px solid var(--border-subtle)",
                            }}
                          >
                            {h.ebm > 0 ? (
                              <>
                                <div className="text-text-primary font-medium">EBM {h.ebm}{sym}</div>
                                <div className="text-text-secondary text-xs">ROAS {h.roas}</div>
                                <div className="text-[#40c860] text-xs font-medium mt-0.5">NET {h.net}{sym}</div>
                              </>
                            ) : (
                              <div className="text-red-400 font-medium">—</div>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-bg-card rounded-[14px] border border-border-default p-12 flex flex-col items-center justify-center text-center min-h-[300px]">
              <Calculator size={40} className="text-text-muted mb-3" />
              <p className="text-text-secondary text-sm">Birim maliyet ve paket satış fiyatlarını girin</p>
              <p className="text-text-muted text-xs mt-1">Matris otomatik hesaplanacak</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <SaveModal open={saveOpen} onClose={() => setSaveOpen(false)} onSave={handleSave} loading={saving} />
      <SavedListSlideOver
        open={savedOpen}
        onClose={() => setSavedOpen(false)}
        items={savedItems}
        onLoad={handleLoad}
        onDelete={handleDelete}
      />
    </div>
  );
}
