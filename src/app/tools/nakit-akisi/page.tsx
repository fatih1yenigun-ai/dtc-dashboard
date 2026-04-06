"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft, HelpCircle, Save, List, Upload, Plus, Trash2, RefreshCw,
  DollarSign, TrendingDown, TrendingUp, BarChart3, ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import SegmentedButton from "@/components/tools/SegmentedButton";
import SaveModal from "@/components/tools/SaveModal";
import SavedListSlideOver, { type SavedItem } from "@/components/tools/SavedListSlideOver";
import { useAuth } from "@/context/AuthContext";
import { saveToolData, loadToolSaves, deleteToolSave, type ToolSave } from "@/lib/tool-saves";
import { parseCSV, getColumns, mapToCashflow, parsePayoutCSV, parseMetaAdsCSV, type CashflowEntry } from "@/lib/csv-parsers";
import { fetchExchangeRates, convertCurrency, type ExchangeRates } from "@/lib/exchange-rates";
import { aggregateCashflow, calculateSummary, type TimeGroup, type AggregatedPeriod } from "@/lib/nakit-akisi";
import { CURRENCY_SYMBOLS } from "@/lib/urun-ekonomisi";

const TIME_OPTIONS = [
  { value: "daily", label: "Günlük" },
  { value: "weekly", label: "Haftalık" },
  { value: "monthly", label: "Aylık" },
];

const CURRENCY_OPTIONS = [
  { value: "TL", label: "TL" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
];

interface ManualEntry {
  id: number;
  date: string;
  amount: number;
  currency: string;
}

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 3);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

let entryIdCounter = 0;

// ────────────────────────────
// CSV Upload + Manual Input Section Card
// ────────────────────────────
function InputSection({
  title,
  color,
  icon: Icon,
  csvEntries,
  onCsvEntries,
  manualEntries,
  onManualEntries,
  negate,
  manualOnly,
  dailyAmount,
  onDailyAmount,
  monthlyAmount,
  onMonthlyAmount,
  displayCurrency,
}: {
  title: string;
  color: string;
  icon: React.ElementType;
  csvEntries: CashflowEntry[];
  onCsvEntries: (entries: CashflowEntry[]) => void;
  manualEntries: ManualEntry[];
  onManualEntries: (entries: ManualEntry[]) => void;
  negate: boolean;
  manualOnly?: boolean;
  dailyAmount?: number;
  onDailyAmount?: (v: number) => void;
  monthlyAmount?: number;
  onMonthlyAmount?: (v: number) => void;
  displayCurrency: string;
}) {
  const [mode, setMode] = useState<"excel" | "manuel">(manualOnly ? "manuel" : "excel");
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [dateCol, setDateCol] = useState("");
  const [amountCol, setAmountCol] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const rows = await parseCSV(file);
    setCsvRows(rows);
    const cols = getColumns(rows);
    setColumns(cols);
    // Auto-detect common column names
    const dateGuess = cols.find((c) => /date|tarih|day|payout/i.test(c)) || cols[0] || "";
    const amountGuess = cols.find((c) => /amount|net|spent|tutar|maliyet|cost/i.test(c)) || cols[1] || "";
    setDateCol(dateGuess);
    setAmountCol(amountGuess);
  };

  const confirmMapping = () => {
    if (!dateCol || !amountCol) return;

    // Try smart parsers first for known formats
    const hasPayoutCols = columns.includes("Type") && columns.includes("Net");
    const hasMetaCols = columns.some((c) => /amount spent/i.test(c));

    let entries: CashflowEntry[];
    if (hasPayoutCols && !negate) {
      entries = parsePayoutCSV(csvRows);
    } else if (hasMetaCols && negate) {
      entries = parseMetaAdsCSV(csvRows);
    } else {
      entries = mapToCashflow(csvRows, dateCol, amountCol, negate);
    }

    onCsvEntries(entries);
    setCsvRows([]);
    setColumns([]);
  };

  const addManualEntry = () => {
    onManualEntries([
      ...manualEntries,
      { id: ++entryIdCounter, date: new Date().toISOString().split("T")[0], amount: 0, currency: displayCurrency },
    ]);
  };

  const sym = CURRENCY_SYMBOLS[displayCurrency] || displayCurrency;

  // Personal expense section — different UI
  if (manualOnly) {
    return (
      <div className="bg-bg-card rounded-[14px] border border-border-default p-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "18" }}>
            <Icon size={14} style={{ color }} />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        </div>
        <p className="text-[11px] text-text-muted mb-4">Opsiyonel — dahil etmek istemiyorsanız boş bırakın</p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-text-secondary mb-1">Günlük Gider</label>
            <div className="relative">
              <input
                type="number"
                value={dailyAmount || ""}
                onChange={(e) => onDailyAmount?.(Number(e.target.value))}
                placeholder="0"
                className="w-full py-2 px-3 pr-7 border border-border-default rounded-lg text-sm bg-bg-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted text-xs">{sym}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">Aylık Gider</label>
            <div className="relative">
              <input
                type="number"
                value={monthlyAmount || ""}
                onChange={(e) => onMonthlyAmount?.(Number(e.target.value))}
                placeholder="0"
                className="w-full py-2 px-3 pr-7 border border-border-default rounded-lg text-sm bg-bg-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted text-xs">{sym}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-card rounded-[14px] border border-border-default p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "18" }}>
            <Icon size={14} style={{ color }} />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        </div>
        <SegmentedButton
          size="sm"
          options={[{ value: "excel", label: "Excel" }, { value: "manuel", label: "Manuel" }]}
          value={mode}
          onChange={(v) => setMode(v as "excel" | "manuel")}
        />
      </div>

      {mode === "excel" ? (
        <div>
          {csvEntries.length > 0 ? (
            <div className="bg-bg-main rounded-lg p-3">
              <p className="text-xs text-text-secondary">{csvEntries.length} işlem yüklendi</p>
              <button onClick={() => onCsvEntries([])} className="text-[11px] text-red-400 hover:underline mt-1">
                Dosyayı Kaldır
              </button>
            </div>
          ) : columns.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-text-secondary">{csvRows.length} satır bulundu. Sütun eşleştirme:</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-text-muted mb-1">Tarih sütunu</label>
                  <select value={dateCol} onChange={(e) => setDateCol(e.target.value)} className="w-full py-1.5 px-2 border border-border-default rounded-lg text-xs bg-bg-input text-text-primary focus:outline-none">
                    {columns.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-text-muted mb-1">Tutar sütunu</label>
                  <select value={amountCol} onChange={(e) => setAmountCol(e.target.value)} className="w-full py-1.5 px-2 border border-border-default rounded-lg text-xs bg-bg-input text-text-primary focus:outline-none">
                    {columns.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={confirmMapping} className="w-full py-2 rounded-lg bg-accent text-white text-xs font-medium hover:opacity-90 transition-opacity">
                Onayla
              </button>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-border-default rounded-xl p-6 text-center cursor-pointer hover:border-accent/40 transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleFile(file);
              }}
            >
              <Upload size={20} className="mx-auto text-text-muted mb-2" />
              <p className="text-xs text-text-secondary">CSV dosyasını sürükleyin veya tıklayın</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }} />
            </div>
          )}
        </div>
      ) : (
        <div>
          {manualEntries.length > 0 && (
            <div className="space-y-1.5 mb-3 max-h-[200px] overflow-y-auto">
              {manualEntries.map((entry, idx) => (
                <div key={entry.id} className="flex items-center gap-1.5 text-xs">
                  <input
                    type="date"
                    value={entry.date}
                    onChange={(e) => {
                      const next = [...manualEntries];
                      next[idx] = { ...entry, date: e.target.value };
                      onManualEntries(next);
                    }}
                    className="py-1 px-2 border border-border-default rounded text-xs bg-bg-input text-text-primary focus:outline-none"
                  />
                  <input
                    type="number"
                    value={entry.amount || ""}
                    onChange={(e) => {
                      const next = [...manualEntries];
                      next[idx] = { ...entry, amount: Number(e.target.value) };
                      onManualEntries(next);
                    }}
                    placeholder="Tutar"
                    className="w-20 py-1 px-2 border border-border-default rounded text-xs bg-bg-input text-text-primary focus:outline-none"
                  />
                  <span className="text-text-muted">{sym}</span>
                  <button onClick={() => onManualEntries(manualEntries.filter((_, i) => i !== idx))} className="text-text-muted hover:text-red-400">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button onClick={addManualEntry} className="flex items-center gap-1 text-xs text-accent hover:underline">
            <Plus size={12} /> Ekle
          </button>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────
// Summary Metric Card
// ────────────────────────────
function MetricCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-bg-card rounded-[14px] border border-border-default p-4 flex-1 min-w-[140px]">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={13} style={{ color }} />
        <p className="text-[11px] text-text-muted">{label}</p>
      </div>
      <p className="text-lg font-bold text-text-primary" style={{ fontVariantNumeric: "tabular-nums" }}>{value}</p>
    </div>
  );
}

// ────────────────────────────
// Main Page
// ────────────────────────────
export default function NakitAkisiPage() {
  const { user } = useAuth();
  const defaultRange = getDefaultDateRange();

  // Date range
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);

  // Display settings
  const [displayCurrency, setDisplayCurrency] = useState<string>("TL");
  const [timeGroup, setTimeGroup] = useState<TimeGroup>("monthly");
  const [forecastMode, setForecastMode] = useState(false);

  // Exchange rates
  const [rates, setRates] = useState<ExchangeRates>({ USD: 1, EUR: 0.92, TRY: 38.5 });
  const [ratesLoading, setRatesLoading] = useState(false);

  const loadRates = useCallback(async () => {
    setRatesLoading(true);
    const r = await fetchExchangeRates();
    setRates(r);
    setRatesLoading(false);
  }, []);

  useEffect(() => { loadRates(); }, [loadRates]);

  // Data sources
  const [incomeCsv, setIncomeCsv] = useState<CashflowEntry[]>([]);
  const [incomeManual, setIncomeManual] = useState<ManualEntry[]>([]);
  const [metaCsv, setMetaCsv] = useState<CashflowEntry[]>([]);
  const [metaManual, setMetaManual] = useState<ManualEntry[]>([]);
  const [cogsCsv, setCogsCsv] = useState<CashflowEntry[]>([]);
  const [cogsManual, setCogsManual] = useState<ManualEntry[]>([]);
  const [dailyPersonal, setDailyPersonal] = useState(0);
  const [monthlyPersonal, setMonthlyPersonal] = useState(0);

  // Forecast inputs
  const [forecastMetaDaily, setForecastMetaDaily] = useState(0);
  const [forecastCogsDaily, setForecastCogsDaily] = useState(0);

  // Save/Load
  const [saveOpen, setSaveOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedItems, setSavedItems] = useState<ToolSave[]>([]);

  const loadSavedItems = useCallback(async () => {
    if (!user) return;
    const items = await loadToolSaves(user.userId, "nakit-akisi");
    setSavedItems(items);
  }, [user]);

  useEffect(() => { loadSavedItems(); }, [loadSavedItems]);

  const handleSave = async (name: string) => {
    if (!user) return;
    setSaving(true);
    const data = {
      startDate, endDate, displayCurrency, timeGroup, forecastMode, rates,
      incomeCsv, incomeManual, metaCsv, metaManual, cogsCsv, cogsManual,
      dailyPersonal, monthlyPersonal, forecastMetaDaily, forecastCogsDaily,
    };
    await saveToolData(user.userId, "nakit-akisi", name, data as unknown as Record<string, unknown>);
    setSaving(false);
    setSaveOpen(false);
    loadSavedItems();
  };

  const handleLoad = (item: SavedItem) => {
    const saved = savedItems.find((s) => s.id === item.id);
    if (!saved) return;
    const d = saved.data as Record<string, unknown>;
    setStartDate((d.startDate as string) || defaultRange.start);
    setEndDate((d.endDate as string) || defaultRange.end);
    setDisplayCurrency((d.displayCurrency as string) || "TL");
    setTimeGroup((d.timeGroup as TimeGroup) || "monthly");
    setForecastMode((d.forecastMode as boolean) || false);
    if (d.rates) setRates(d.rates as ExchangeRates);
    setIncomeCsv((d.incomeCsv as CashflowEntry[]) || []);
    setIncomeManual((d.incomeManual as ManualEntry[]) || []);
    setMetaCsv((d.metaCsv as CashflowEntry[]) || []);
    setMetaManual((d.metaManual as ManualEntry[]) || []);
    setCogsCsv((d.cogsCsv as CashflowEntry[]) || []);
    setCogsManual((d.cogsManual as ManualEntry[]) || []);
    setDailyPersonal((d.dailyPersonal as number) || 0);
    setMonthlyPersonal((d.monthlyPersonal as number) || 0);
    setForecastMetaDaily((d.forecastMetaDaily as number) || 0);
    setForecastCogsDaily((d.forecastCogsDaily as number) || 0);
    setSavedOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (!user) return;
    await deleteToolSave(id, user.userId);
    loadSavedItems();
  };

  // Merge all entries into CashflowEntry arrays
  const manualToEntries = (entries: ManualEntry[], neg: boolean): CashflowEntry[] =>
    entries.filter((e) => e.amount).map((e) => ({
      date: e.date,
      amount: neg ? -Math.abs(convertCurrency(e.amount, e.currency, displayCurrency, rates)) : Math.abs(convertCurrency(e.amount, e.currency, displayCurrency, rates)),
    }));

  const allIncome = useMemo(() => [...incomeCsv, ...manualToEntries(incomeManual, false)], [incomeCsv, incomeManual, displayCurrency, rates]);
  const allMeta = useMemo(() => [...metaCsv, ...manualToEntries(metaManual, true)], [metaCsv, metaManual, displayCurrency, rates]);
  const allCogs = useMemo(() => [...cogsCsv, ...manualToEntries(cogsManual, true)], [cogsCsv, cogsManual, displayCurrency, rates]);

  // Personal expense per day
  const dailyPersonalTotal = useMemo(() => {
    return dailyPersonal + (monthlyPersonal / 30);
  }, [dailyPersonal, monthlyPersonal]);

  // Effective date range (extend if forecast mode)
  const effectiveEnd = useMemo(() => {
    if (!forecastMode) return endDate;
    const d = new Date();
    d.setDate(d.getDate() + 30);
    const futureEnd = d.toISOString().split("T")[0];
    return futureEnd > endDate ? futureEnd : endDate;
  }, [endDate, forecastMode]);

  // Add forecast entries
  const forecastMeta = useMemo(() => {
    if (!forecastMode || !forecastMetaDaily) return allMeta;
    const today = new Date().toISOString().split("T")[0];
    const extra: CashflowEntry[] = [];
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    const end = new Date(effectiveEnd);
    while (d <= end) {
      extra.push({ date: d.toISOString().split("T")[0], amount: -forecastMetaDaily });
      d.setDate(d.getDate() + 1);
    }
    return [...allMeta, ...extra];
  }, [allMeta, forecastMode, forecastMetaDaily, effectiveEnd]);

  const forecastCogs = useMemo(() => {
    if (!forecastMode || !forecastCogsDaily) return allCogs;
    const today = new Date().toISOString().split("T")[0];
    const extra: CashflowEntry[] = [];
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    const end = new Date(effectiveEnd);
    while (d <= end) {
      extra.push({ date: d.toISOString().split("T")[0], amount: -forecastCogsDaily });
      d.setDate(d.getDate() + 1);
    }
    return [...allCogs, ...extra];
  }, [allCogs, forecastMode, forecastCogsDaily, effectiveEnd]);

  // Aggregate
  const periods = useMemo(() =>
    aggregateCashflow(startDate, effectiveEnd, allIncome, forecastMeta, forecastCogs, dailyPersonalTotal, timeGroup),
    [startDate, effectiveEnd, allIncome, forecastMeta, forecastCogs, dailyPersonalTotal, timeGroup]
  );

  const summary = useMemo(() => calculateSummary(periods), [periods]);

  const sym = CURRENCY_SYMBOLS[displayCurrency] || displayCurrency;

  const formatNum = (n: number) => {
    if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + "K";
    return Math.round(n).toLocaleString("tr-TR");
  };

  const hasData = allIncome.length > 0 || allMeta.length > 0 || allCogs.length > 0 || dailyPersonalTotal > 0;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/tools" className="text-text-muted hover:text-text-secondary transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-text-primary">Nakit Akışı</h1>
              <Link href="/tools/nakit-akisi/ogren" className="text-text-muted hover:text-accent transition-colors" title="Öğren">
                <HelpCircle size={18} />
              </Link>
            </div>
            <p className="text-text-secondary text-sm mt-0.5">Gelir ve giderlerini takip et, nakit akışını görselleştir</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setSaveOpen(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity">
            <Save size={14} /> Kaydet
          </button>
          <button onClick={() => setSavedOpen(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-border-default text-text-secondary text-sm font-medium hover:bg-bg-hover transition-colors">
            <List size={14} /> Kayıtlar
          </button>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="py-1.5 px-2 border border-border-default rounded-lg text-xs bg-bg-input text-text-primary focus:outline-none" />
          <span className="text-text-muted text-xs">—</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="py-1.5 px-2 border border-border-default rounded-lg text-xs bg-bg-input text-text-primary focus:outline-none" />
        </div>

        <SegmentedButton options={CURRENCY_OPTIONS} value={displayCurrency} onChange={setDisplayCurrency} size="sm" />

        {/* Forecast toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary">Tahmin Modu</span>
          <button
            onClick={() => setForecastMode(!forecastMode)}
            className={`relative w-9 h-[18px] rounded-full transition-colors ${forecastMode ? "bg-accent" : "bg-bg-hover border border-border-default"}`}
          >
            <div className={`absolute top-[2px] w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${forecastMode ? "translate-x-[18px]" : "translate-x-[2px]"}`} />
          </button>
        </div>

        {/* Exchange rates */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[10px] text-text-muted">USD/TRY:</span>
          <input type="number" value={rates.TRY} onChange={(e) => setRates({ ...rates, TRY: Number(e.target.value) })} className="w-16 py-1 px-1.5 border border-border-default rounded text-[11px] bg-bg-input text-text-primary focus:outline-none" step="0.1" />
          <span className="text-[10px] text-text-muted">EUR/USD:</span>
          <input type="number" value={rates.EUR} onChange={(e) => setRates({ ...rates, EUR: Number(e.target.value) })} className="w-14 py-1 px-1.5 border border-border-default rounded text-[11px] bg-bg-input text-text-primary focus:outline-none" step="0.01" />
          <button onClick={loadRates} disabled={ratesLoading} className="text-text-muted hover:text-accent transition-colors" title="Yenile">
            <RefreshCw size={13} className={ratesLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-bg-card rounded-[14px] border border-border-default p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">Nakit Akışı Grafiği</h2>
          <SegmentedButton options={TIME_OPTIONS} value={timeGroup} onChange={(v) => setTimeGroup(v as TimeGroup)} size="sm" />
        </div>

        {hasData ? (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={periods} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="label" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
              <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} tickFormatter={(v: number) => formatNum(v)} />
              <Tooltip
                contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: "var(--text-primary)", fontWeight: 600 }}
                formatter={(value: unknown, name: unknown) => [`${Math.round(Number(value)).toLocaleString("tr-TR")}${sym}`, String(name)]}
              />
              <ReferenceLine y={0} stroke="var(--text-muted)" strokeWidth={1.5} />
              {forecastMode && (
                <ReferenceLine
                  x={periods.find((p) => p.isForecast)?.label}
                  stroke="var(--accent)"
                  strokeDasharray="4 4"
                  label={{ value: "Bugün", fill: "var(--accent)", fontSize: 11 }}
                />
              )}
              <Bar dataKey="income" name="Gelir" fill="#40c860" radius={[4, 4, 0, 0]} opacity={0.85} />
              <Bar dataKey="totalExpense" name="Gider" fill="#e84040" radius={[4, 4, 0, 0]} opacity={0.85} />
              <Line
                type="monotone"
                dataKey="net"
                name="Net"
                stroke="#20d0f8"
                strokeWidth={2.5}
                dot={false}
                style={{ filter: "drop-shadow(0 0 6px rgba(32, 208, 248, 0.3))" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-text-muted text-sm">
            Veri girişi yapın — grafik otomatik oluşturulacak
          </div>
        )}
      </div>

      {/* Forecast inputs */}
      {forecastMode && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div className="bg-bg-card rounded-[14px] border border-border-default p-4">
            <label className="block text-xs text-text-secondary mb-1.5">Tahmini Günlük Meta Harcama</label>
            <div className="relative">
              <input type="number" value={forecastMetaDaily || ""} onChange={(e) => setForecastMetaDaily(Number(e.target.value))} placeholder="0" className="w-full py-2 px-3 pr-7 border border-border-default rounded-lg text-sm bg-bg-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30" />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted text-xs">{sym}</span>
            </div>
          </div>
          <div className="bg-bg-card rounded-[14px] border border-border-default p-4">
            <label className="block text-xs text-text-secondary mb-1.5">Tahmini Günlük COGS</label>
            <div className="relative">
              <input type="number" value={forecastCogsDaily || ""} onChange={(e) => setForecastCogsDaily(Number(e.target.value))} placeholder="0" className="w-full py-2 px-3 pr-7 border border-border-default rounded-lg text-sm bg-bg-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30" />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted text-xs">{sym}</span>
            </div>
          </div>
        </div>
      )}

      {/* 4 Input sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <InputSection
          title="Ödemeler"
          color="#40c860"
          icon={DollarSign}
          csvEntries={incomeCsv}
          onCsvEntries={setIncomeCsv}
          manualEntries={incomeManual}
          onManualEntries={setIncomeManual}
          negate={false}
          displayCurrency={displayCurrency}
        />
        <InputSection
          title="Meta Reklam Harcaması"
          color="#c09af0"
          icon={TrendingDown}
          csvEntries={metaCsv}
          onCsvEntries={setMetaCsv}
          manualEntries={metaManual}
          onManualEntries={setMetaManual}
          negate={true}
          displayCurrency={displayCurrency}
        />
        <InputSection
          title="Ürün Maliyeti (COGS)"
          color="#f0b040"
          icon={ShoppingCart}
          csvEntries={cogsCsv}
          onCsvEntries={setCogsCsv}
          manualEntries={cogsManual}
          onManualEntries={setCogsManual}
          negate={true}
          displayCurrency={displayCurrency}
        />
        <InputSection
          title="Kişisel Gider"
          color="#e84040"
          icon={TrendingDown}
          csvEntries={[]}
          onCsvEntries={() => {}}
          manualEntries={[]}
          onManualEntries={() => {}}
          negate={true}
          manualOnly
          dailyAmount={dailyPersonal}
          onDailyAmount={setDailyPersonal}
          monthlyAmount={monthlyPersonal}
          onMonthlyAmount={setMonthlyPersonal}
          displayCurrency={displayCurrency}
        />
      </div>

      {/* Summary stats */}
      <div className="flex flex-wrap gap-3 mb-6">
        <MetricCard label="Toplam Gelir" value={`${Math.round(summary.totalIncome).toLocaleString("tr-TR")}${sym}`} icon={TrendingUp} color="#40c860" />
        <MetricCard label="Toplam Gider" value={`${Math.round(summary.totalExpense).toLocaleString("tr-TR")}${sym}`} icon={TrendingDown} color="#e84040" />
        <MetricCard label="Net Kâr" value={`${Math.round(summary.netProfit).toLocaleString("tr-TR")}${sym}`} icon={BarChart3} color={summary.netProfit >= 0 ? "#40c860" : "#e84040"} />
        <MetricCard label="Meta Harcama" value={`${Math.round(summary.metaTotal).toLocaleString("tr-TR")}${sym}`} icon={TrendingDown} color="#c09af0" />
        <MetricCard label="COGS Toplam" value={`${Math.round(summary.cogsTotal).toLocaleString("tr-TR")}${sym}`} icon={ShoppingCart} color="#f0b040" />
      </div>

      {/* Modals */}
      <SaveModal open={saveOpen} onClose={() => setSaveOpen(false)} onSave={handleSave} loading={saving} title="Nakit Akışını Kaydet" placeholder="Akış adı" />
      <SavedListSlideOver open={savedOpen} onClose={() => setSavedOpen(false)} items={savedItems} onLoad={handleLoad} onDelete={handleDelete} />
    </div>
  );
}
