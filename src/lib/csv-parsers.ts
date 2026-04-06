import Papa from "papaparse";

export interface CashflowEntry {
  date: string; // YYYY-MM-DD
  amount: number;
  currency?: string;
  label?: string;
}

/**
 * Generic CSV parser — returns raw rows as objects.
 */
export function parseCSV(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: "UTF-8",
      complete: (result) => resolve(result.data as Record<string, string>[]),
      error: (err) => reject(err),
    });
  });
}

/**
 * Get column names from the first parse.
 */
export function getColumns(rows: Record<string, string>[]): string[] {
  if (!rows.length) return [];
  return Object.keys(rows[0]);
}

/**
 * Map parsed rows to CashflowEntry using user-selected columns.
 */
export function mapToCashflow(
  rows: Record<string, string>[],
  dateColumn: string,
  amountColumn: string,
  negate: boolean = false
): CashflowEntry[] {
  return rows
    .map((row) => {
      const rawDate = row[dateColumn];
      const rawAmount = row[amountColumn];
      if (!rawDate || !rawAmount) return null;

      const date = normalizeDate(rawDate);
      if (!date) return null;

      let amount = parseFloat(rawAmount.replace(/[^0-9.\-]/g, ""));
      if (isNaN(amount)) return null;
      if (negate) amount = -Math.abs(amount);

      return { date, amount };
    })
    .filter(Boolean) as CashflowEntry[];
}

/**
 * Parse payment processor CSV (Shopify-like payout export).
 */
export function parsePayoutCSV(rows: Record<string, string>[]): CashflowEntry[] {
  return rows
    .map((row) => {
      const type = (row["Type"] || "").toLowerCase();
      if (type === "payout") return null; // skip bank transfer rows

      const dateStr = row["Payout Date"] || row["Available On"] || row["Transaction Date"];
      const date = normalizeDate(dateStr || "");
      if (!date) return null;

      const net = parseFloat((row["Net"] || "0").replace(/[^0-9.\-]/g, ""));
      if (isNaN(net)) return null;

      const amount = type === "refund" ? -Math.abs(net) : Math.abs(net);
      const currency = row["Currency"] || "USD";

      return { date, amount, currency, label: type };
    })
    .filter(Boolean) as CashflowEntry[];
}

/**
 * Parse Meta Ads Manager export CSV.
 */
export function parseMetaAdsCSV(rows: Record<string, string>[]): CashflowEntry[] {
  return rows
    .map((row) => {
      const dateStr = row["Day"] || row["Date Range"] || row["Date"] || "";
      const date = normalizeDate(dateStr);
      if (!date) return null;

      const spent = parseFloat((row["Amount spent"] || row["Amount Spent"] || "0").replace(/[^0-9.\-]/g, ""));
      if (isNaN(spent) || spent === 0) return null;

      return { date, amount: -Math.abs(spent) };
    })
    .filter(Boolean) as CashflowEntry[];
}

/**
 * Try to normalize various date formats to YYYY-MM-DD.
 */
function normalizeDate(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // MM/DD/YYYY or DD/MM/YYYY — try Date parse
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  // DD.MM.YYYY (Turkish format)
  const dotMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dotMatch) {
    return `${dotMatch[3]}-${dotMatch[2].padStart(2, "0")}-${dotMatch[1].padStart(2, "0")}`;
  }

  return null;
}
