import { NextRequest } from "next/server";
import { hashPassword } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      company_name, contact_person, email, password, type,
      phone, website, city, category, specialty,
      brands_produced_for,
      marketplace_shopier, marketplace_trendyol, marketplace_n11,
      marketplace_hepsiburada, marketplace_amazon_tr,
      description,
    } = body;

    // Validate required fields
    if (!company_name || !email || !password || !type) {
      return Response.json({ error: "Firma adı, e-posta, şifre ve tür zorunludur." }, { status: 400 });
    }
    if (!['uretici', 'toptanci'].includes(type)) {
      return Response.json({ error: "Geçersiz tür." }, { status: 400 });
    }

    // Check email uniqueness
    const { data: existing } = await supabase.from("users").select("id").eq("username", email).single();
    if (existing) {
      return Response.json({ error: "Bu e-posta adresi zaten kullanılıyor." }, { status: 409 });
    }

    // Create user
    const hash = await hashPassword(password);
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({ username: email, password_hash: hash, role: "supplier" })
      .select()
      .single();
    if (userError) throw userError;

    // Create supplier profile
    const { error: profileError } = await supabase.from("supplier_profiles").insert({
      user_id: user.id,
      company_name,
      contact_person: contact_person || null,
      email,
      type,
      phone: phone || null,
      website: website || null,
      city: city || null,
      category: category || null,
      specialty: specialty || null,
      brands_produced_for: brands_produced_for || [],
      marketplace_shopier: marketplace_shopier || null,
      marketplace_trendyol: marketplace_trendyol || null,
      marketplace_n11: marketplace_n11 || null,
      marketplace_hepsiburada: marketplace_hepsiburada || null,
      marketplace_amazon_tr: marketplace_amazon_tr || null,
      description: description || null,
      status: 'PENDING_APPROVAL',
    });
    if (profileError) throw profileError;

    return Response.json({ success: true, message: "Başvurunuz alındı. Admin onayı sonrası giriş yapabilirsiniz." });
  } catch (err: unknown) {
    console.error("Join supplier error:", err);
    const message = err instanceof Error ? err.message : "Bir hata oluştu.";
    return Response.json({ error: message }, { status: 500 });
  }
}
