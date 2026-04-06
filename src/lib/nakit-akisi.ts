import type { CashflowEntry } from "./csv-parsers";

export type TimeGroup = "daily" | "weekly" | "monthly";

export interface AggregatedPeriod {
  label: string;
  startDate: string;
  income: number;
  metaExpense: number;
  cogsExpense: number;
  personalExpense: number;
  totalExpense: number;
  net: number;
  isForecast?: boolean;
}

export interface CashflowSummary {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  metaTotal: number;
  cogsTotal: number;
}

/**
 * Generate all dates between start and end (inclusive).
 */
function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(start);
  const endDate = new Date(end);
  while (current <= endDate) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/**
 * Sum entries by date.
 */
function sumByDate(entries: CashflowEntry[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const e of entries) {
    map[e.date] = (map[e.date] || 0) + e.amount;
  }
  return map;
}

/**
 * Get week key (ISO week).
 */
function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week.toString().padStart(2, "0")}`;
}

/**
 * Get month key.
 */
function getMonthKey(dateStr: string): string {
  return dateStr.substring(0, 7); // YYYY-MM
}

const TR_MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

function formatPeriodLabel(key: string, group: TimeGroup): string {
  if (group === "daily") return key;
  if (group === "weekly") return key;
  // Monthly: YYYY-MM → "Oca 24"
  const [year, month] = key.split("-");
  const m = parseInt(month, 10) - 1;
  return `${TR_MONTHS[m]} ${year.slice(2)}`;
}

/**
 * Aggregate cashflow data by time period.
 */
export function aggregateCashflow(
  startDate: string,
  endDate: string,
  income: CashflowEntry[],
  metaExpense: CashflowEntry[],
  cogsExpense: CashflowEntry[],
  dailyPersonal: number,
  group: TimeGroup,
  todayStr?: string
): AggregatedPeriod[] {
  const dates = dateRange(startDate, endDate);
  const incomeByDate = sumByDate(income);
  const metaByDate = sumByDate(metaExpense);
  const cogsByDate = sumByDate(cogsExpense);
  const today = todayStr || new Date().toISOString().split("T")[0];

  // Group dates
  const groupKey = (d: string) => {
    if (group === "daily") return d;
    if (group === "weekly") return getWeekKey(d);
    return getMonthKey(d);
  };

  const periodMap = new Map<string, AggregatedPeriod>();

  for (const d of dates) {
    const key = groupKey(d);
    const isForecast = d > today;

    if (!periodMap.has(key)) {
      periodMap.set(key, {
        label: formatPeriodLabel(key, group),
        startDate: d,
        income: 0,
        metaExpense: 0,
        cogsExpense: 0,
        personalExpense: 0,
        totalExpense: 0,
        net: 0,
        isForecast,
      });
    }

    const period = periodMap.get(key)!;
    period.income += incomeByDate[d] || 0;
    period.metaExpense += Math.abs(metaByDate[d] || 0);
    period.cogsExpense += Math.abs(cogsByDate[d] || 0);
    period.personalExpense += dailyPersonal;
  }

  // Calculate totals
  for (const period of periodMap.values()) {
    period.totalExpense = period.metaExpense + period.cogsExpense + period.personalExpense;
    period.net = period.income - period.totalExpense;
  }

  return Array.from(periodMap.values());
}

/**
 * Calculate summary statistics.
 */
export function calculateSummary(periods: AggregatedPeriod[], forecastOnly?: boolean): CashflowSummary {
  const filtered = forecastOnly !== undefined
    ? periods.filter((p) => p.isForecast === forecastOnly)
    : periods;

  return {
    totalIncome: filtered.reduce((s, p) => s + p.income, 0),
    totalExpense: filtered.reduce((s, p) => s + p.totalExpense, 0),
    netProfit: filtered.reduce((s, p) => s + p.net, 0),
    metaTotal: filtered.reduce((s, p) => s + p.metaExpense, 0),
    cogsTotal: filtered.reduce((s, p) => s + p.cogsExpense, 0),
  };
}
