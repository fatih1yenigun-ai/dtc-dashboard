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
  // Food & Bev (2.0x)
  gida_icecek: 2.0,
  kahve_cay: 2.0,
  atistirmalik: 2.0,
  // Health supplements (1.8x)
  takviye_supplement: 1.8,
  protein_fitness_gida: 1.8,
  // Beauty (1.5x)
  cilt_bakim: 1.5,
  sac_bakim: 1.5,
  makyaj: 1.5,
  parfum_koku: 1.5,
  vucut_bakim: 1.5,
  erkek_bakim: 1.5,
  dis_agiz_bakim: 1.5,
  // Baby & Pet (1.4x)
  bebek_anne: 1.4,
  evcil_hayvan: 1.4,
  // Health (1.3x)
  saglik_wellness: 1.3,
  kadin_sagligi: 1.3,
  cinsel_saglik: 1.3,
  // Home scent (1.1x)
  mum_koku: 1.1,
  // Fashion & Home (1.0x)
  moda_kadin: 1.0,
  moda_erkek: 1.0,
  ic_giyim: 1.0,
  ayakkabi: 1.0,
  aksesuar_taki: 1.0,
  gozluk: 1.0,
  spor_giyim: 1.0,
  ev_tekstil: 1.0,
  battaniye_yorgan: 1.0,
  havlu_bornoz: 1.0,
  organizasyon: 1.0,
  hali_kilim: 1.0,
  genel: 1.0,
  // Kitchen & Cleaning (0.9x)
  mutfak: 0.9,
  temizlik: 0.9,
  // Outdoor & Travel (0.8x)
  outdoor: 0.8,
  seyahat: 0.8,
  // Tech (0.7x)
  teknoloji_aksesuar: 0.7,
  elektronik: 0.7,
  uyku_teknoloji: 0.7,
  // Luxury (0.5x)
  luks_moda: 0.5,
  luks_aksesuar: 0.5,
  luks_ev: 0.5,
  // Legacy keys (backward compat)
  food_bev: 2.0,
  beauty: 1.5,
  fashion: 1.0,
  electronics: 0.7,
  luxury: 0.5,
};

export const NICHE_LABELS: Record<string, string> = {
  gida_icecek: "Yiyecek & İçecek (2.0x)",
  kahve_cay: "Kahve & Çay (2.0x)",
  atistirmalik: "Atıştırmalık (2.0x)",
  takviye_supplement: "Takviye & Supplement (1.8x)",
  protein_fitness_gida: "Protein & Fitness (1.8x)",
  cilt_bakim: "Cilt Bakımı (1.5x)",
  sac_bakim: "Saç Bakımı (1.5x)",
  makyaj: "Makyaj (1.5x)",
  parfum_koku: "Parfüm & Koku (1.5x)",
  vucut_bakim: "Vücut Bakımı (1.5x)",
  erkek_bakim: "Erkek Bakım (1.5x)",
  dis_agiz_bakim: "Diş & Ağız (1.5x)",
  bebek_anne: "Bebek & Anne (1.4x)",
  evcil_hayvan: "Evcil Hayvan (1.4x)",
  saglik_wellness: "Sağlık & Wellness (1.3x)",
  kadin_sagligi: "Kadın Sağlığı (1.3x)",
  mum_koku: "Mum & Ev Kokusu (1.1x)",
  moda_kadin: "Kadın Moda (1.0x)",
  moda_erkek: "Erkek Moda (1.0x)",
  ic_giyim: "İç Giyim (1.0x)",
  ayakkabi: "Ayakkabı (1.0x)",
  aksesuar_taki: "Aksesuar & Takı (1.0x)",
  spor_giyim: "Spor Giyim (1.0x)",
  ev_tekstil: "Ev Tekstili (1.0x)",
  battaniye_yorgan: "Battaniye & Yorgan (1.0x)",
  organizasyon: "Ev Organizasyon (1.0x)",
  hali_kilim: "Halı & Kilim (1.0x)",
  genel: "Genel (1.0x)",
  mutfak: "Mutfak (0.9x)",
  temizlik: "Temizlik (0.9x)",
  outdoor: "Outdoor (0.8x)",
  seyahat: "Seyahat (0.8x)",
  teknoloji_aksesuar: "Tech Aksesuar (0.7x)",
  elektronik: "Elektronik (0.7x)",
  uyku_teknoloji: "Uyku Tech (0.7x)",
  luks_moda: "Lüks Moda (0.5x)",
  luks_aksesuar: "Lüks Aksesuar (0.5x)",
  luks_ev: "Lüks Ev (0.5x)",
  // Legacy
  food_bev: "Yiyecek & İçecek (2.0x)",
  beauty: "Güzellik (1.5x)",
  fashion: "Moda (1.0x)",
  electronics: "Elektronik (0.7x)",
  luxury: "Lüks (0.5x)",
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
