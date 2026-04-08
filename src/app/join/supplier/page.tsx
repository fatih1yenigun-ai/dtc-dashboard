"use client";

import { useState } from "react";
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  "Kozmetik", "Kişisel Bakım", "Ev & Yaşam", "Gıda & İçecek",
  "Moda & Tekstil", "Teknoloji & Elektronik", "Spor & Outdoor",
  "Sağlık & Medikal", "Otomotiv", "Diğer",
];

const TOTAL_STEPS = 4;

export default function JoinSupplierPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Step 1
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [type, setType] = useState<"uretici" | "toptanci">("uretici");

  // Step 2
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [specialty, setSpecialty] = useState("");

  // Step 3
  const [brandsProducedFor, setBrandsProducedFor] = useState("");
  const [shopier, setShopier] = useState("");
  const [trendyol, setTrendyol] = useState("");
  const [n11, setN11] = useState("");
  const [hepsiburada, setHepsiburada] = useState("");
  const [amazonTr, setAmazonTr] = useState("");

  // Step 4
  const [description, setDescription] = useState("");

  function canProceed(): boolean {
    if (step === 1) return !!(companyName && email && password && password.length >= 6);
    return true;
  }

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/join-supplier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName,
          contact_person: contactPerson || undefined,
          email,
          password,
          type,
          phone: phone || undefined,
          website: website || undefined,
          city: city || undefined,
          category: category || undefined,
          specialty: specialty || undefined,
          brands_produced_for: brandsProducedFor
            ? brandsProducedFor.split(",").map((b) => b.trim()).filter(Boolean)
            : [],
          marketplace_shopier: shopier || undefined,
          marketplace_trendyol: trendyol || undefined,
          marketplace_n11: n11 || undefined,
          marketplace_hepsiburada: hepsiburada || undefined,
          marketplace_amazon_tr: amazonTr || undefined,
          description: description || undefined,
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
          <h1 className="text-3xl font-black text-white tracking-tight">Tedarikçi Başvurusu</h1>
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
          {/* Step 1: Firma Bilgileri */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold text-lg mb-4">Firma Bilgileri</h2>
              <input
                type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Firma Adı *"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all text-sm"
              />
              <input
                type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Yetkili Kişi"
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
                    type="button" onClick={() => setType("uretici")}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                      type === "uretici" ? "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg" : "bg-white/5 text-text-muted hover:text-white border border-white/10"
                    }`}
                  >
                    Üretici
                  </button>
                  <button
                    type="button" onClick={() => setType("toptanci")}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                      type === "toptanci" ? "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg" : "bg-white/5 text-text-muted hover:text-white border border-white/10"
                    }`}
                  >
                    Toptancı
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: İletişim & Konum */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold text-lg mb-4">İletişim & Konum</h2>
              <input
                type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="Telefon"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all text-sm"
              />
              <input
                type="url" value={website} onChange={(e) => setWebsite(e.target.value)}
                placeholder="Website"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all text-sm"
              />
              <input
                type="text" value={city} onChange={(e) => setCity(e.target.value)}
                placeholder="Şehir (Fabrika/Üretim Yeri)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all text-sm"
              />
              <div>
                <p className="text-text-muted text-sm mb-2">Kategori</p>
                <select
                  value={category} onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all text-sm appearance-none"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                >
                  <option value="" className="bg-[#1a1a2e]">Seçiniz...</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#1a1a2e]">{cat}</option>
                  ))}
                </select>
              </div>
              <input
                type="text" value={specialty} onChange={(e) => setSpecialty(e.target.value)}
                placeholder="Uzmanlık Alanı (ör: Şampuan, Cilt Bakımı)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all text-sm"
              />
            </div>
          )}

          {/* Step 3: Referanslar & Pazar Yerleri */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold text-lg mb-4">Referanslar & Pazar Yerleri</h2>
              <div>
                <p className="text-text-muted text-sm mb-2">Üretim Yapılan Markalar</p>
                <input
                  type="text" value={brandsProducedFor} onChange={(e) => setBrandsProducedFor(e.target.value)}
                  placeholder="Virgülle ayırın: Marka A, Marka B..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all text-sm"
                />
              </div>
              <input
                type="url" value={shopier} onChange={(e) => setShopier(e.target.value)}
                placeholder="Shopier Mağaza Linki"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all text-sm"
              />
              <input
                type="url" value={trendyol} onChange={(e) => setTrendyol(e.target.value)}
                placeholder="Trendyol Mağaza Linki"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all text-sm"
              />
              <input
                type="url" value={n11} onChange={(e) => setN11(e.target.value)}
                placeholder="N11 Mağaza Linki"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all text-sm"
              />
              <input
                type="url" value={hepsiburada} onChange={(e) => setHepsiburada(e.target.value)}
                placeholder="HepsiBurada Mağaza Linki"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all text-sm"
              />
              <input
                type="url" value={amazonTr} onChange={(e) => setAmazonTr(e.target.value)}
                placeholder="Amazon TR Mağaza Linki"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all text-sm"
              />
            </div>
          )}

          {/* Step 4: Açıklama */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold text-lg mb-4">Firma Açıklaması</h2>
              <textarea
                value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Firmanız hakkında kısa bir açıklama yazın..."
                rows={6}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all text-sm resize-none"
              />
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
