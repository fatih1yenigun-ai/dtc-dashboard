"use client";

import { useState } from "react";
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  "Kozmetik", "Ev", "Spor", "Moda", "Teknoloji",
  "Yiyecek & İçecek", "Seyahat", "Oyun", "Finans",
  "Sağlık", "Ebeveynlik", "Otomotiv", "Diğer",
];

const TOTAL_STEPS = 5;

export default function JoinCreatorPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Step 1
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [type, setType] = useState<"ugc" | "influencer">("ugc");

  // Step 2
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Türkiye");
  const [phone, setPhone] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [xUrl, setXUrl] = useState("");
  const [followerCount, setFollowerCount] = useState<number | "">("");

  // Step 3
  const [categories, setCategories] = useState<string[]>([]);
  const [brandsWorkedWith, setBrandsWorkedWith] = useState("");

  // Step 4
  const [ugcVideoPrice, setUgcVideoPrice] = useState<number | "">("");
  const [affiliateCommissionInfo, setAffiliateCommissionInfo] = useState("");
  const [postSharingCost, setPostSharingCost] = useState<number | "">("");
  const [packageDetails, setPackageDetails] = useState("");

  // Step 5
  const [mediaKitFile, setMediaKitFile] = useState<File | null>(null);
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);

  function toggleCategory(cat: string) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function canProceed(): boolean {
    if (step === 1) return !!(name && email && password && password.length >= 6);
    return true;
  }

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/join-creator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          type,
          city: city || undefined,
          country,
          phone: phone || undefined,
          instagram_url: instagramUrl || undefined,
          youtube_url: youtubeUrl || undefined,
          linkedin_url: linkedinUrl || undefined,
          tiktok_url: tiktokUrl || undefined,
          x_url: xUrl || undefined,
          follower_count: followerCount || undefined,
          categories,
          brands_worked_with: brandsWorkedWith
            ? brandsWorkedWith.split(",").map((b) => b.trim()).filter(Boolean)
            : [],
          ugc_video_price: ugcVideoPrice || undefined,
          affiliate_commission_info: affiliateCommissionInfo || undefined,
          post_sharing_cost: postSharingCost || undefined,
          package_details: packageDetails || undefined,
          media_kit_url: mediaKitFile ? mediaKitFile.name : undefined,
          portfolio_urls: portfolioFiles.map((f) => f.name),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bir hata oluştu");
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #1a0533 0%, #2d1b69 25%, #4c1d95 50%, #5b21b6 75%, #1e3a8a 100%)",
          }}
        />
        <div className="relative z-10 w-full max-w-md px-4 text-center">
          <CheckCircle2 size={64} className="text-green-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-3">Başvurunuz başarıyla alındı!</h2>
          <p className="text-text-muted mb-8">Admin onayı sonrası giriş yapabilirsiniz.</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-white font-semibold text-sm transition-all hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              boxShadow: "0 6px 30px rgba(102,126,234,0.4)",
            }}
          >
            Giriş Sayfası
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-auto">
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, #1a0533 0%, #2d1b69 25%, #4c1d95 50%, #5b21b6 75%, #1e3a8a 100%)",
        }}
      />

      <div className="relative z-10 w-full max-w-lg px-4 py-8" style={{ animation: "cardAppear 0.6s ease-out" }}>
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-text-muted tracking-[0.3em] text-xs uppercase mb-2">DTC Araştırma</p>
          <h1 className="text-3xl font-black text-white tracking-tight">İçerik Üretici Başvurusu</h1>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i + 1 === step ? "w-8 bg-gradient-to-r from-[#667eea] to-[#764ba2]" : i + 1 < step ? "w-4 bg-[#667eea]" : "w-4 bg-white/10"
              }`}
            />
          ))}
          <span className="text-text-muted text-xs ml-2">{step}/{TOTAL_STEPS}</span>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 backdrop-blur-xl"
          style={{
            background: "rgba(15, 15, 35, 0.75)",
            boxShadow: "0 0 60px rgba(102,126,234,0.15), 0 25px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Step 1: Temel Bilgiler */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold text-lg mb-4">Temel Bilgiler</h2>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Ad Soyad *"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all text-sm"
              />
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="E-posta *"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all text-sm"
              />
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifre (en az 6 karakter) *"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all text-sm"
                autoComplete="new-password"
              />
              <div>
                <p className="text-text-muted text-sm mb-2">Tür *</p>
                <div className="flex gap-3">
                  <button
                    type="button" onClick={() => setType("ugc")}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                      type === "ugc" ? "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg" : "bg-white/5 text-text-muted hover:text-white border border-white/10"
                    }`}
                  >
                    UGC
                  </button>
                  <button
                    type="button" onClick={() => setType("influencer")}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                      type === "influencer" ? "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg" : "bg-white/5 text-text-muted hover:text-white border border-white/10"
                    }`}
                  >
                    Influencer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: İletişim & Sosyal Medya */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold text-lg mb-4">İletişim & Sosyal Medya</h2>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text" value={city} onChange={(e) => setCity(e.target.value)}
                  placeholder="Şehir"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all text-sm"
                />
                <input
                  type="text" value={country} onChange={(e) => setCountry(e.target.value)}
                  placeholder="Ülke"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all text-sm"
                />
              </div>
              <input
                type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="Telefon"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all text-sm"
              />
              <input
                type="url" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="Instagram URL"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all text-sm"
              />
              <input
                type="url" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="YouTube URL"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all text-sm"
              />
              <input
                type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="LinkedIn URL"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all text-sm"
              />
              <input
                type="url" value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)}
                placeholder="TikTok URL"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all text-sm"
              />
              <input
                type="url" value={xUrl} onChange={(e) => setXUrl(e.target.value)}
                placeholder="X (Twitter) URL"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all text-sm"
              />
              {type === "influencer" && (
                <input
                  type="number" value={followerCount} onChange={(e) => setFollowerCount(e.target.value ? Number(e.target.value) : "")}
                  placeholder="Takipçi Sayısı"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all text-sm"
                />
              )}
            </div>
          )}

          {/* Step 3: Uzmanlık Alanları */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold text-lg mb-4">Uzmanlık Alanları</h2>
              <div>
                <p className="text-text-muted text-sm mb-3">Kategoriler</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat} type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                        categories.includes(cat)
                          ? "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg"
                          : "bg-white/5 text-text-muted hover:text-white border border-white/10"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-text-muted text-sm mb-2">Çalıştığı Markalar</p>
                <input
                  type="text" value={brandsWorkedWith} onChange={(e) => setBrandsWorkedWith(e.target.value)}
                  placeholder="Virgülle ayırın: Nike, Adidas, Zara..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all text-sm"
                />
              </div>
            </div>
          )}

          {/* Step 4: Fiyatlandırma */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold text-lg mb-4">Fiyatlandırma</h2>
              <div className="relative">
                <input
                  type="number" value={ugcVideoPrice} onChange={(e) => setUgcVideoPrice(e.target.value ? Number(e.target.value) : "")}
                  placeholder="UGC Video Fiyatı"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 pr-10 text-white placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all text-sm"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-sm">₺</span>
              </div>
              <textarea
                value={affiliateCommissionInfo} onChange={(e) => setAffiliateCommissionInfo(e.target.value)}
                placeholder="Affiliate Komisyon Bilgisi"
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all text-sm resize-none"
              />
              <div className="relative">
                <input
                  type="number" value={postSharingCost} onChange={(e) => setPostSharingCost(e.target.value ? Number(e.target.value) : "")}
                  placeholder="Post/Story Paylaşım Ücreti"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 pr-10 text-white placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all text-sm"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-sm">₺</span>
              </div>
              <textarea
                value={packageDetails} onChange={(e) => setPackageDetails(e.target.value)}
                placeholder="Paket Detayları (ör: 3 video paket: ortam çekimi + post)"
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all text-sm resize-none"
              />
            </div>
          )}

          {/* Step 5: Medya & Portfolyo */}
          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold text-lg mb-4">Medya & Portfolyo</h2>
              <div>
                <p className="text-text-muted text-sm mb-2">Medya Kit (PDF/PPT, maks 20MB)</p>
                <input
                  type="file"
                  accept=".pdf,.ppt,.pptx"
                  onChange={(e) => setMediaKitFile(e.target.files?.[0] || null)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-[#667eea]/20 file:text-[#667eea] hover:file:bg-[#667eea]/30"
                />
                {mediaKitFile && <p className="text-text-muted text-xs mt-1">{mediaKitFile.name}</p>}
              </div>
              <div>
                <p className="text-text-muted text-sm mb-2">Portfolyo (maks 3 dosya - video/resim)</p>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []).slice(0, 3);
                    setPortfolioFiles(files);
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-[#667eea]/20 file:text-[#667eea] hover:file:bg-[#667eea]/30"
                />
                {portfolioFiles.length > 0 && (
                  <div className="text-text-muted text-xs mt-1 space-y-0.5">
                    {portfolioFiles.map((f, i) => <p key={i}>{f.name}</p>)}
                  </div>
                )}
              </div>
              <p className="text-text-muted text-xs italic">
                Not: Dosya yükleme yakında aktif olacak. Şu an sadece dosya bilgisi kaydedilmektedir.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mt-4">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            {step > 1 ? (
              <button
                type="button" onClick={() => { setStep(step - 1); setError(""); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-text-muted hover:text-white text-sm transition-all bg-white/5 border border-white/10 hover:bg-white/10"
              >
                <ArrowLeft size={16} /> Geri
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-text-muted hover:text-white text-sm transition-all bg-white/5 border border-white/10 hover:bg-white/10"
              >
                <ArrowLeft size={16} /> Giriş
              </Link>
            )}

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={() => { setStep(step + 1); setError(""); }}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  boxShadow: "0 4px 20px rgba(102,126,234,0.4)",
                }}
              >
                İleri <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !canProceed()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  boxShadow: "0 4px 20px rgba(102,126,234,0.4)",
                }}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : "Başvuru Yap"}
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes cardAppear {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
