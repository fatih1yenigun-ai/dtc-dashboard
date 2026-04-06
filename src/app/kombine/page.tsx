"use client";

import { Layers, Globe, ShoppingBag, ShoppingCart, Store } from "lucide-react";

export default function KombinePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Kombine Aratici</h1>
        <p className="text-text-secondary mt-1">
          Tek bir anahtar kelime ile 4 kaynaktan macro analiz
        </p>
      </div>

      <div className="bg-bg-card rounded-xl border border-border-default p-12 text-center">
        <div className="flex justify-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <Store size={22} className="text-purple-600" />
          </div>
          <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
            <ShoppingBag size={22} className="text-pink-600" />
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
            <ShoppingCart size={22} className="text-orange-600" />
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <Globe size={22} className="text-blue-600" />
          </div>
        </div>

        <h2 className="text-lg font-semibold text-text-primary mb-2">Yakinda</h2>
        <p className="text-text-secondary max-w-md mx-auto text-sm leading-relaxed">
          Website, TikTok Shop, Amazon ve Meta verilerini tek bir anahtar kelime ile birlestirip,
          her kaynaktan en iyi markalari ve macro trendi gosterecek.
        </p>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-lg mx-auto">
          <div className="bg-bg-main rounded-lg p-3">
            <p className="text-xs text-text-muted">Website</p>
            <p className="text-sm font-medium text-text-secondary">Storeleads</p>
          </div>
          <div className="bg-bg-main rounded-lg p-3">
            <p className="text-xs text-text-muted">Video</p>
            <p className="text-sm font-medium text-text-secondary">TikTok Shop</p>
          </div>
          <div className="bg-bg-main rounded-lg p-3">
            <p className="text-xs text-text-muted">Marketplace</p>
            <p className="text-sm font-medium text-text-secondary">Amazon</p>
          </div>
          <div className="bg-bg-main rounded-lg p-3">
            <p className="text-xs text-text-muted">Ads</p>
            <p className="text-sm font-medium text-text-secondary">Meta</p>
          </div>
        </div>
      </div>
    </div>
  );
}
