import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

function getAdminPayload(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const payload = verifyToken(authHeader.split(" ")[1]);
  if (!payload || payload.role !== "admin") return null;
  return payload;
}

export async function GET(request: NextRequest) {
  if (!getAdminPayload(request)) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
  }

  // Fetch pending creator profiles
  const { data: creators, error: creatorsErr } = await supabase
    .from("creator_profiles")
    .select("id, user_id, name, email, type, created_at, users(username)")
    .eq("status", "PENDING_APPROVAL")
    .order("created_at", { ascending: false });

  if (creatorsErr) {
    console.error("GET /api/admin/approvals creators error:", creatorsErr);
    return NextResponse.json({ error: "Veri yüklenemedi" }, { status: 500 });
  }

  // Fetch pending supplier profiles
  const { data: suppliers, error: suppliersErr } = await supabase
    .from("supplier_profiles")
    .select("id, user_id, company_name, email, type, created_at, users(username)")
    .eq("status", "PENDING_APPROVAL")
    .order("created_at", { ascending: false });

  if (suppliersErr) {
    console.error("GET /api/admin/approvals suppliers error:", suppliersErr);
    return NextResponse.json({ error: "Veri yüklenemedi" }, { status: 500 });
  }

  const combined = [
    ...(creators || []).map((c) => ({
      id: c.id,
      user_id: c.user_id,
      name: c.name,
      email: c.email,
      type: c.type,
      profile_type: "creator" as const,
      created_at: c.created_at,
    })),
    ...(suppliers || []).map((s) => ({
      id: s.id,
      user_id: s.user_id,
      name: s.company_name,
      email: s.email,
      type: s.type,
      profile_type: "supplier" as const,
      created_at: s.created_at,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ approvals: combined });
}

export async function PATCH(request: NextRequest) {
  if (!getAdminPayload(request)) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
  }

  const body = await request.json();
  const { id, profile_type, action } = body as {
    id: number;
    profile_type: "creator" | "supplier";
    action: "approve" | "reject";
  };

  if (!id || !profile_type || !action) {
    return NextResponse.json({ error: "id, profile_type ve action gerekli" }, { status: 400 });
  }

  const newStatus = action === "approve" ? "APPROVED" : "REJECTED";
  const table = profile_type === "creator" ? "creator_profiles" : "supplier_profiles";

  // Get user_id before updating
  const { data: profile, error: fetchErr } = await supabase
    .from(table)
    .select("user_id")
    .eq("id", id)
    .single();

  if (fetchErr || !profile) {
    return NextResponse.json({ error: "Profil bulunamadı" }, { status: 404 });
  }

  const { error: updateErr } = await supabase
    .from(table)
    .update({ status: newStatus })
    .eq("id", id);

  if (updateErr) {
    console.error("PATCH /api/admin/approvals update error:", updateErr);
    return NextResponse.json({ error: "Güncelleme hatası" }, { status: 500 });
  }

  // Insert notification
  const notifTitle = action === "approve" ? "Başvurunuz Onaylandı" : "Başvurunuz Reddedildi";
  const notifBody = action === "approve"
    ? "Hesabınız onaylandı! Artık giriş yapabilirsiniz."
    : "Başvurunuz reddedildi. Detay için destek ile iletişime geçin.";

  await supabase.from("notifications").insert({
    user_id: profile.user_id,
    title: notifTitle,
    body: notifBody,
    type: action === "approve" ? "approval" : "rejection",
  });

  return NextResponse.json({ success: true });
}
