export interface BundleRow {
  adet: number;
  satisFiyati: number;
  cogsOverride: number | null;
}

export interface UrunEkonomisiInputs {
  islemUcreti: number;
  kdvEnabled: boolean;
  kdvOrani: number;
  karHedefleri: number[];
  birimMaliyet: number;
  bundles: BundleRow[];
  currency: "TL" | "USD" | "EUR";
}

export interface HedefResult {
  karYuzdesi: number;
  ebm: number;
  roas: number;
  net: number;
}

export interface BundleResult {
  adet: number;
  satisFiyati: number;
  cogsToplam: number;
  brutKar: number;
  basabasEbm: number;
  basabasRoas: number;
  hedefler: HedefResult[];
}

export function calculateBundle(
  inputs: UrunEkonomisiInputs,
  bundle: BundleRow
): BundleResult {
  const { islemUcreti, kdvEnabled, kdvOrani, karHedefleri, birimMaliyet } = inputs;

  // Net price after transaction fee
  let netFiyat = bundle.satisFiyati * (1 - islemUcreti / 100);

  // If KDV included, extract it
  if (kdvEnabled) {
    netFiyat = netFiyat / (1 + kdvOrani / 100);
  }

  // COGS
  const cogsToplam = bundle.cogsOverride !== null
    ? bundle.cogsOverride
    : birimMaliyet * bundle.adet;

  // Gross profit
  const brutKar = netFiyat - cogsToplam;

  // Break-even
  const basabasEbm = brutKar;
  const basabasRoas = basabasEbm > 0
    ? Math.round((bundle.satisFiyati / basabasEbm) * 100) / 100
    : 0;

  // Profit targets
  const hedefler: HedefResult[] = karHedefleri.map((x) => {
    const hedefNet = bundle.satisFiyati * (x / 100);
    const ebm = brutKar - hedefNet;
    const roas = ebm > 0
      ? Math.round((bundle.satisFiyati / ebm) * 100) / 100
      : 0;
    return {
      karYuzdesi: x,
      ebm: Math.round(ebm),
      roas,
      net: Math.round(hedefNet),
    };
  });

  return {
    adet: bundle.adet,
    satisFiyati: bundle.satisFiyati,
    cogsToplam: Math.round(cogsToplam),
    brutKar: Math.round(brutKar),
    basabasEbm: Math.round(basabasEbm),
    basabasRoas,
    hedefler,
  };
}

export function calculateAll(inputs: UrunEkonomisiInputs): BundleResult[] {
  return inputs.bundles.map((b) => calculateBundle(inputs, b));
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  TL: "₺",
  USD: "$",
  EUR: "€",
};
