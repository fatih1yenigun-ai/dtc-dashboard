// ---------- Score Functions ----------

export function bounceScore(bouncePct: number): number {
  if (bouncePct <= 20) return 10;
  if (bouncePct <= 30) return 9;
  if (bouncePct <= 35) return 8;
  if (bouncePct <= 40) return 7;
  if (bouncePct <= 45) return 6;
  if (bouncePct <= 50) return 5;
  if (bouncePct <= 55) return 4;
  if (bouncePct <= 65) return 3;
  if (bouncePct <= 80) return 2;
  return 1;
}

export function durationScore(seconds: number): number {
  if (seconds >= 600) return 10;
  if (seconds >= 480) return 9;
  if (seconds >= 360) return 8;
  if (seconds >= 270) return 7;
  if (seconds >= 180) return 6;
  if (seconds >= 120) return 5;
  if (seconds >= 90) return 4;
  if (seconds >= 60) return 3;
  if (seconds >= 30) return 2;
  return 1;
}

export function pagesScore(pages: number): number {
  if (pages >= 10) return 10;
  if (pages >= 8) return 9;
  if (pages >= 6.5) return 8;
  if (pages >= 5) return 7;
  if (pages >= 4) return 6;
  if (pages >= 3) return 5;
  if (pages >= 2.5) return 4;
  if (pages >= 2) return 3;
  if (pages >= 1.5) return 2;
  return 1;
}

// ---------- TQS Calculation ----------

export function calcTQS(
  bouncePct: number,
  pagesPerVisit: number,
  sessionSeconds: number
): number {
  const bs = bounceScore(bouncePct);
  const ps = pagesScore(pagesPerVisit);
  const ds = durationScore(sessionSeconds);
  // Weighted average: bounce 40%, pages 30%, duration 30%
  const raw = bs * 0.4 + ps * 0.3 + ds * 0.3;
  return Math.round(raw * 10) / 10;
}

// ---------- Niche Multipliers ----------

export const NICHE_MULTIPLIERS: Record<string, number> = {
  food_bev: 2.0,
  beauty: 1.5,
  fashion: 1.0,
  electronics: 0.7,
  luxury: 0.5,
};

export const NICHE_LABELS: Record<string, string> = {
  food_bev: "Yiyecek & İçecek",
  beauty: "Güzellik & Bakım",
  fashion: "Moda",
  electronics: "Elektronik",
  luxury: "Lüks",
};

// ---------- Base Conversion Table ----------

export const BASE_CONVERSION: Record<number, number> = {
  1: 0.2,
  2: 0.3,
  3: 0.8,
  4: 1.4,
  5: 2.3,
  6: 2.8,
  7: 3.7,
  8: 4.5,
  9: 5.5,
  10: 7.5,
};

// ---------- Niche Conversion Tables ----------

export function getNicheConversionTable(
  niche: string
): Record<number, number> {
  const multiplier = NICHE_MULTIPLIERS[niche] ?? 1.0;
  const table: Record<number, number> = {};
  for (let tqs = 1; tqs <= 10; tqs++) {
    table[tqs] = Math.round(BASE_CONVERSION[tqs] * multiplier * 100) / 100;
  }
  return table;
}

// ---------- TQS → Conversion ----------

export function tqsToConversion(tqs: number, niche?: string): number {
  const multiplier = niche ? (NICHE_MULTIPLIERS[niche] ?? 1.0) : 1.0;

  // Interpolate between integer TQS values
  const lower = Math.floor(tqs);
  const upper = Math.ceil(tqs);
  const clampedLower = Math.max(1, Math.min(10, lower));
  const clampedUpper = Math.max(1, Math.min(10, upper));

  if (clampedLower === clampedUpper) {
    return Math.round(BASE_CONVERSION[clampedLower] * multiplier * 100) / 100;
  }

  const fraction = tqs - lower;
  const baseRate =
    BASE_CONVERSION[clampedLower] * (1 - fraction) +
    BASE_CONVERSION[clampedUpper] * fraction;
  return Math.round(baseRate * multiplier * 100) / 100;
}

// ---------- Revenue Estimation ----------

export function estimateRevenue(
  traffic: number,
  aov: number,
  conversionPct: number
): number {
  return Math.round(traffic * (conversionPct / 100) * aov);
}
