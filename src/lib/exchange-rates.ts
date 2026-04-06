export interface ExchangeRates {
  USD: number;
  EUR: number;
  TRY: number;
}

const CACHE_KEY = "dtc_exchange_rates";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

interface CachedRates {
  rates: ExchangeRates;
  timestamp: number;
}

export async function fetchExchangeRates(): Promise<ExchangeRates> {
  // Check sessionStorage cache
  if (typeof window !== "undefined") {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: CachedRates = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL) {
          return parsed.rates;
        }
      }
    } catch {}
  }

  try {
    const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    const data = await res.json();
    const rates: ExchangeRates = {
      USD: 1,
      EUR: data.rates?.EUR || 0.92,
      TRY: data.rates?.TRY || 38.5,
    };

    // Cache
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ rates, timestamp: Date.now() }));
      } catch {}
    }

    return rates;
  } catch {
    // Fallback defaults
    return { USD: 1, EUR: 0.92, TRY: 38.5 };
  }
}

/**
 * Convert an amount from one currency to another using the provided rates.
 * Rates are assumed to be relative to USD.
 */
export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  rates: ExchangeRates
): number {
  if (from === to) return amount;
  const fromKey = from === "TL" ? "TRY" : from;
  const toKey = to === "TL" ? "TRY" : to;
  const fromRate = rates[fromKey as keyof ExchangeRates] || 1;
  const toRate = rates[toKey as keyof ExchangeRates] || 1;
  // Convert to USD first, then to target
  const inUSD = amount / fromRate;
  return inUSD * toRate;
}
