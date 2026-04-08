"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { CreatorProfile, SupplierProfile } from "@/lib/marketplace";

export default function DashboardProfilePage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<"creator" | "supplier" | null>(null);
  const [profile, setProfile] = useState<CreatorProfile | SupplierProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state for creator
  const [creatorForm, setCreatorForm] = useState({
    name: "",
    city: "",
    country: "",
    phone: "",
    instagram_url: "",
    youtube_url: "",
    linkedin_url: "",
    tiktok_url: "",
    x_url: "",
    categories: "",
    brands_worked_with: "",
    ugc_video_price: "",
    affiliate_commission_info: "",
    post_sharing_cost: "",
    package_details: "",
    media_kit_url: "",
    portfolio_urls: "",
  });

  // Form state for supplier
  const [supplierForm, setSupplierForm] = useState({
    company_name: "",
    contact_person: "",
    phone: "",
    website: "",
    city: "",
    category: "",
    specialty: "",
    brands_produced_for: "",
    marketplace_shopier: "",
    marketplace_trendyol: "",
    marketplace_n11: "",
    marketplace_hepsiburada: "",
    marketplace_amazon_tr: "",
    description: "",
  });

  useEffect(() => {
    if (loading) return;
    if (!user || (user.role !== "creator" && user.role !== "supplier")) {
      router.push("/");
      return;
    }

    async function fetchProfile() {
      try {
        const res = await fetch("/api/dashboard/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setRole(data.role);
        setProfile(data.profile);

        if (data.role === "creator") {
          const p = data.profile as CreatorProfile;
          setCreatorForm({
            name: p.name || "",
            city: p.city || "",
            country: p.country || "",
            phone: p.phone || "",
            instagram_url: p.instagram_url || "",
            youtube_url: p.youtube_url || "",
            linkedin_url: p.linkedin_url || "",
            tiktok_url: p.tiktok_url || "",
            x_url: p.x_url || "",
            categories: (p.categories || []).join(", "),
            brands_worked_with: (p.brands_worked_with || []).join(", "),
            ugc_video_price: p.ugc_video_price?.toString() || "",
            affiliate_commission_info: p.affiliate_commission_info || "",
            post_sharing_cost: p.post_sharing_cost?.toString() || "",
            package_details: p.package_details || "",
            media_kit_url: p.media_kit_url || "",
            portfolio_urls: (p.portfolio_urls || []).join(", "),
          });
        } else {
          const p = data.profile as SupplierProfile;
          setSupplierForm({
            company_name: p.company_name || "",
            contact_person: p.contact_person || "",
            phone: p.phone || "",
            website: p.website || "",
            city: p.city || "",
            category: p.category || "",
            specialty: p.specialty || "",
            brands_produced_for: (p.brands_produced_for || []).join(", "),
            marketplace_shopier: p.marketplace_shopier || "",
            marketplace_trendyol: p.marketplace_trendyol || "",
            marketplace_n11: p.marketplace_n11 || "",
            marketplace_hepsiburada: p.marketplace_hepsiburada || "",
            marketplace_amazon_tr: p.marketplace_amazon_tr || "",
            description: p.description || "",
          });
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        setLoadingProfile(false);
      }
    }

    fetchProfile();
  }, [user, token, loading, router]);

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    try {
      let body: Record<string, unknown>;

      if (role === "creator") {
        body = {
          name: creatorForm.name,
          city: creatorForm.city || null,
          country: creatorForm.country || null,
          phone: creatorForm.phone || null,
          instagram_url: creatorForm.instagram_url || null,
          youtube_url: creatorForm.youtube_url || null,
          linkedin_url: creatorForm.linkedin_url || null,
          tiktok_url: creatorForm.tiktok_url || null,
          x_url: creatorForm.x_url || null,
          categories: creatorForm.categories
            ? creatorForm.categories.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          brands_worked_with: creatorForm.brands_worked_with
            ? creatorForm.brands_worked_with.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          ugc_video_price: creatorForm.ugc_video_price
            ? Number(creatorForm.ugc_video_price)
            : null,
          affiliate_commission_info: creatorForm.affiliate_commission_info || null,
          post_sharing_cost: creatorForm.post_sharing_cost
            ? Number(creatorForm.post_sharing_cost)
            : null,
          package_details: creatorForm.package_details || null,
          media_kit_url: creatorForm.media_kit_url || null,
          portfolio_urls: creatorForm.portfolio_urls
            ? creatorForm.portfolio_urls.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
        };
      } else {
        body = {
          company_name: supplierForm.company_name,
          contact_person: supplierForm.contact_person || null,
          phone: supplierForm.phone || null,
          website: supplierForm.website || null,
          city: supplierForm.city || null,
          category: supplierForm.category || null,
          specialty: supplierForm.specialty || null,
          brands_produced_for: supplierForm.brands_produced_for
            ? supplierForm.brands_produced_for.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          marketplace_shopier: supplierForm.marketplace_shopier || null,
          marketplace_trendyol: supplierForm.marketplace_trendyol || null,
          marketplace_n11: supplierForm.marketplace_n11 || null,
          marketplace_hepsiburada: supplierForm.marketplace_hepsiburada || null,
          marketplace_amazon_tr: supplierForm.marketplace_amazon_tr || null,
          description: supplierForm.description || null,
        };
      }

      const res = await fetch("/api/dashboard/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setMessage({ type: "success", text: "Profil basariyla guncellendi." });
      } else {
        setMessage({ type: "error", text: "Guncelleme sirasinda hata olustu." });
      }
    } catch {
      setMessage({ type: "error", text: "Bir hata olustu." });
    } finally {
      setSaving(false);
    }
  }

  if (loading || loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <p className="text-text-muted">Profil bulunamadi.</p>
      </div>
    );
  }

  const inputClass =
    "w-full px-3 py-2 bg-bg-card border border-border-default rounded-[10px] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30";
  const labelClass = "block text-sm font-medium text-text-secondary mb-1";

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-text-muted hover:text-text-secondary transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-text-primary">Profili Duzenle</h1>
      </div>

      {message && (
        <div
          className={`px-4 py-3 rounded-[10px] text-sm ${
            message.type === "success"
              ? "bg-green-500/10 text-green-500 border border-green-500/20"
              : "bg-red-500/10 text-red-500 border border-red-500/20"
          }`}
        >
          {message.text}
        </div>
      )}

      {role === "creator" ? (
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Ad Soyad</label>
            <input
              className={inputClass}
              value={creatorForm.name}
              onChange={(e) => setCreatorForm({ ...creatorForm, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Sehir</label>
              <input
                className={inputClass}
                value={creatorForm.city}
                onChange={(e) => setCreatorForm({ ...creatorForm, city: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Ulke</label>
              <input
                className={inputClass}
                value={creatorForm.country}
                onChange={(e) => setCreatorForm({ ...creatorForm, country: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Telefon</label>
            <input
              className={inputClass}
              value={creatorForm.phone}
              onChange={(e) => setCreatorForm({ ...creatorForm, phone: e.target.value })}
            />
          </div>

          <h3 className="text-md font-semibold text-text-primary pt-2">Sosyal Medya</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Instagram</label>
              <input
                className={inputClass}
                value={creatorForm.instagram_url}
                onChange={(e) =>
                  setCreatorForm({ ...creatorForm, instagram_url: e.target.value })
                }
              />
            </div>
            <div>
              <label className={labelClass}>YouTube</label>
              <input
                className={inputClass}
                value={creatorForm.youtube_url}
                onChange={(e) =>
                  setCreatorForm({ ...creatorForm, youtube_url: e.target.value })
                }
              />
            </div>
            <div>
              <label className={labelClass}>TikTok</label>
              <input
                className={inputClass}
                value={creatorForm.tiktok_url}
                onChange={(e) =>
                  setCreatorForm({ ...creatorForm, tiktok_url: e.target.value })
                }
              />
            </div>
            <div>
              <label className={labelClass}>LinkedIn</label>
              <input
                className={inputClass}
                value={creatorForm.linkedin_url}
                onChange={(e) =>
                  setCreatorForm({ ...creatorForm, linkedin_url: e.target.value })
                }
              />
            </div>
            <div>
              <label className={labelClass}>X (Twitter)</label>
              <input
                className={inputClass}
                value={creatorForm.x_url}
                onChange={(e) => setCreatorForm({ ...creatorForm, x_url: e.target.value })}
              />
            </div>
          </div>

          <h3 className="text-md font-semibold text-text-primary pt-2">Kategoriler & Markalar</h3>
          <div>
            <label className={labelClass}>Kategoriler (virgul ile ayirin)</label>
            <input
              className={inputClass}
              value={creatorForm.categories}
              onChange={(e) =>
                setCreatorForm({ ...creatorForm, categories: e.target.value })
              }
              placeholder="Moda, Guzellik, Teknoloji"
            />
          </div>
          <div>
            <label className={labelClass}>Calisilan Markalar (virgul ile ayirin)</label>
            <input
              className={inputClass}
              value={creatorForm.brands_worked_with}
              onChange={(e) =>
                setCreatorForm({ ...creatorForm, brands_worked_with: e.target.value })
              }
            />
          </div>

          <h3 className="text-md font-semibold text-text-primary pt-2">Fiyatlandirma</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>UGC Video Fiyati (TL)</label>
              <input
                type="number"
                className={inputClass}
                value={creatorForm.ugc_video_price}
                onChange={(e) =>
                  setCreatorForm({ ...creatorForm, ugc_video_price: e.target.value })
                }
              />
            </div>
            <div>
              <label className={labelClass}>Post Paylasim Ucreti (TL)</label>
              <input
                type="number"
                className={inputClass}
                value={creatorForm.post_sharing_cost}
                onChange={(e) =>
                  setCreatorForm({ ...creatorForm, post_sharing_cost: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Affiliate Komisyon Bilgisi</label>
            <input
              className={inputClass}
              value={creatorForm.affiliate_commission_info}
              onChange={(e) =>
                setCreatorForm({
                  ...creatorForm,
                  affiliate_commission_info: e.target.value,
                })
              }
            />
          </div>
          <div>
            <label className={labelClass}>Paket Detaylari</label>
            <textarea
              className={inputClass + " min-h-[80px]"}
              value={creatorForm.package_details}
              onChange={(e) =>
                setCreatorForm({ ...creatorForm, package_details: e.target.value })
              }
            />
          </div>
          <div>
            <label className={labelClass}>Media Kit URL</label>
            <input
              className={inputClass}
              value={creatorForm.media_kit_url}
              onChange={(e) =>
                setCreatorForm({ ...creatorForm, media_kit_url: e.target.value })
              }
            />
          </div>
          <div>
            <label className={labelClass}>Portfolio URL&apos;leri (virgul ile ayirin)</label>
            <input
              className={inputClass}
              value={creatorForm.portfolio_urls}
              onChange={(e) =>
                setCreatorForm({ ...creatorForm, portfolio_urls: e.target.value })
              }
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Sirket Adi</label>
            <input
              className={inputClass}
              value={supplierForm.company_name}
              onChange={(e) =>
                setSupplierForm({ ...supplierForm, company_name: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Yetkili Kisi</label>
              <input
                className={inputClass}
                value={supplierForm.contact_person}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, contact_person: e.target.value })
                }
              />
            </div>
            <div>
              <label className={labelClass}>Telefon</label>
              <input
                className={inputClass}
                value={supplierForm.phone}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, phone: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Website</label>
              <input
                className={inputClass}
                value={supplierForm.website}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, website: e.target.value })
                }
              />
            </div>
            <div>
              <label className={labelClass}>Sehir</label>
              <input
                className={inputClass}
                value={supplierForm.city}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, city: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Kategori</label>
              <input
                className={inputClass}
                value={supplierForm.category}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, category: e.target.value })
                }
              />
            </div>
            <div>
              <label className={labelClass}>Uzmanlik</label>
              <input
                className={inputClass}
                value={supplierForm.specialty}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, specialty: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Uretim Yapilan Markalar (virgul ile ayirin)</label>
            <input
              className={inputClass}
              value={supplierForm.brands_produced_for}
              onChange={(e) =>
                setSupplierForm({ ...supplierForm, brands_produced_for: e.target.value })
              }
            />
          </div>

          <h3 className="text-md font-semibold text-text-primary pt-2">Pazaryeri Linkleri</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Shopier</label>
              <input
                className={inputClass}
                value={supplierForm.marketplace_shopier}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, marketplace_shopier: e.target.value })
                }
              />
            </div>
            <div>
              <label className={labelClass}>Trendyol</label>
              <input
                className={inputClass}
                value={supplierForm.marketplace_trendyol}
                onChange={(e) =>
                  setSupplierForm({
                    ...supplierForm,
                    marketplace_trendyol: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className={labelClass}>N11</label>
              <input
                className={inputClass}
                value={supplierForm.marketplace_n11}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, marketplace_n11: e.target.value })
                }
              />
            </div>
            <div>
              <label className={labelClass}>Hepsiburada</label>
              <input
                className={inputClass}
                value={supplierForm.marketplace_hepsiburada}
                onChange={(e) =>
                  setSupplierForm({
                    ...supplierForm,
                    marketplace_hepsiburada: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className={labelClass}>Amazon TR</label>
              <input
                className={inputClass}
                value={supplierForm.marketplace_amazon_tr}
                onChange={(e) =>
                  setSupplierForm({
                    ...supplierForm,
                    marketplace_amazon_tr: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Aciklama</label>
            <textarea
              className={inputClass + " min-h-[100px]"}
              value={supplierForm.description}
              onChange={(e) =>
                setSupplierForm({ ...supplierForm, description: e.target.value })
              }
            />
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-accent text-white rounded-[10px] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
        <Link
          href="/dashboard"
          className="px-6 py-2.5 bg-bg-card border border-border-default text-text-secondary rounded-[10px] text-sm font-medium hover:bg-bg-hover transition-colors"
        >
          Iptal
        </Link>
      </div>
    </div>
  );
}
