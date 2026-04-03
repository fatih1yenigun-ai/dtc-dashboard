"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { MetaAd } from "@/hooks/useMetaAdSearch";

interface MetaAdsContextValue {
  selectedAd: MetaAd | null;
  setSelectedAd: (ad: MetaAd | null) => void;
}

const MetaAdsContext = createContext<MetaAdsContextValue>({
  selectedAd: null,
  setSelectedAd: () => {},
});

export function useMetaAds() {
  return useContext(MetaAdsContext);
}

export function MetaAdsProvider({ children }: { children: ReactNode }) {
  const [selectedAd, setSelectedAd] = useState<MetaAd | null>(null);

  return (
    <MetaAdsContext.Provider value={{ selectedAd, setSelectedAd }}>
      {children}
    </MetaAdsContext.Provider>
  );
}
