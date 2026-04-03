/**
 * Amazon BSR-to-Sales Estimator
 * Estimates monthly sales from Best Sellers Rank using logarithmic decay formulas.
 * Same methodology as JungleScout / Helium10.
 * When we switch to JungleScout API, this becomes redundant.
 */

// Category coefficients: [scale_factor, decay_exponent]
// Formula: monthly_sales = A * (BSR ^ -B)
const CATEGORY_COEFFICIENTS: Record<string, [number, number]> = {
  "All Departments":            [120000, 0.80],
  "Arts, Crafts & Sewing":      [30000,  0.75],
  "Automotive":                 [50000,  0.78],
  "Baby":                       [40000,  0.77],
  "Beauty & Personal Care":     [80000,  0.80],
  "Books":                      [150000, 0.82],
  "Cell Phones & Accessories":  [60000,  0.78],
  "Clothing, Shoes & Jewelry":  [100000, 0.82],
  "Electronics":                [80000,  0.80],
  "Garden & Outdoor":           [50000,  0.78],
  "Grocery & Gourmet Food":     [60000,  0.78],
  "Health & Household":         [80000,  0.80],
  "Home & Kitchen":             [100000, 0.82],
  "Industrial & Scientific":    [30000,  0.75],
  "Kitchen & Dining":           [70000,  0.80],
  "Musical Instruments":        [20000,  0.72],
  "Office Products":            [50000,  0.78],
  "Patio, Lawn & Garden":       [50000,  0.78],
  "Pet Supplies":               [60000,  0.78],
  "Software":                   [10000,  0.70],
  "Sports & Outdoors":          [70000,  0.80],
  "Tools & Home Improvement":   [60000,  0.78],
  "Toys & Games":               [80000,  0.80],
  "Video Games":                [30000,  0.75],
};

const DEFAULT_COEFFICIENTS: [number, number] = [80000, 0.80];

export function estimateMonthlySales(bsr: number, category = "All Departments"): number {
  if (!bsr || bsr < 1) return 0;

  let a: number, b: number;
  const coeffs = CATEGORY_COEFFICIENTS[category];
  if (coeffs) {
    [a, b] = coeffs;
  } else {
    // Partial match
    const match = Object.entries(CATEGORY_COEFFICIENTS).find(
      ([k]) => k.toLowerCase().includes(category.toLowerCase()) || category.toLowerCase().includes(k.toLowerCase())
    );
    if (match) {
      [a, b] = match[1];
    } else {
      [a, b] = DEFAULT_COEFFICIENTS;
    }
  }

  const sales = a * Math.pow(bsr, -b);
  return Math.max(1, Math.round(sales));
}

export function estimateRevenue(bsr: number, price: number, category = "All Departments"): number {
  if (!price || price <= 0) return 0;
  return Math.round(estimateMonthlySales(bsr, category) * price * 100) / 100;
}

export function salesTier(monthlySales: number): string {
  if (monthlySales >= 3000) return "Cok Yuksek";
  if (monthlySales >= 1000) return "Yuksek";
  if (monthlySales >= 300) return "Orta";
  if (monthlySales >= 50) return "Dusuk";
  return "Cok Dusuk";
}

export function salesTierColor(tier: string): string {
  switch (tier) {
    case "Cok Yuksek": return "bg-emerald-100 text-emerald-700";
    case "Yuksek": return "bg-cyan-100 text-cyan-700";
    case "Orta": return "bg-amber-100 text-amber-700";
    case "Dusuk": return "bg-orange-100 text-orange-700";
    case "Cok Dusuk": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-700";
  }
}

export function getCategories(): string[] {
  return Object.keys(CATEGORY_COEFFICIENTS).sort();
}
