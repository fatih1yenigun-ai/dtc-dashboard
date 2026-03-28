import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ---------- Types ----------
export interface BrandData {
  Marka?: string;
  brand?: string;
  "Web Sitesi"?: string;
  website?: string;
  Kategori?: string;
  category?: string;
  "Alt Niş"?: string;
  sub_niche?: string;
  "AOV ($)"?: number;
  est_aov?: number;
  "Öne Çıkan Özellik"?: string;
  insight?: string;
  "Marka Hikayesi"?: string;
  history?: string;
  "Meta Ads"?: string;
  [key: string]: unknown;
}

export interface SavedBrand {
  id: number;
  folder_name: string;
  brand_data: BrandData;
  created_at: string;
}

// ---------- Folders ----------
export async function loadFolders(): Promise<string[]> {
  const { data, error } = await supabase
    .from("folders")
    .select("name")
    .order("created_at", { ascending: true });
  if (error) {
    console.error("loadFolders error:", error);
    return ["Genel"];
  }
  const names = (data ?? []).map((r) => r.name);
  return names.length > 0 ? names : ["Genel"];
}

export async function createFolder(name: string): Promise<boolean> {
  // Check if exists
  const { data: existing } = await supabase
    .from("folders")
    .select("name")
    .eq("name", name);
  if (existing && existing.length > 0) return true;

  const { error } = await supabase.from("folders").insert({ name });
  if (error) {
    console.error("createFolder error:", error);
    return false;
  }
  return true;
}

export async function deleteFolder(name: string): Promise<void> {
  await supabase.from("saved_brands").delete().eq("folder_name", name);
  await supabase.from("folders").delete().eq("name", name);
}

// ---------- Brands ----------
export async function loadBrands(folderName: string): Promise<SavedBrand[]> {
  const { data, error } = await supabase
    .from("saved_brands")
    .select("id, folder_name, brand_data, created_at")
    .eq("folder_name", folderName)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("loadBrands error:", error);
    return [];
  }
  return data ?? [];
}

function cleanValue(v: unknown): unknown {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && (isNaN(v) || !isFinite(v))) return null;
  return v;
}

function cleanBrandData(data: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (!k.startsWith("_")) {
      clean[k] = cleanValue(v);
    }
  }
  return clean;
}

export async function saveBrandsBulk(
  folderName: string,
  brands: BrandData[]
): Promise<number> {
  // Ensure folder exists
  await createFolder(folderName);

  // Get existing brand names
  const existing = await loadBrands(folderName);
  const existingNames = new Set(
    existing.map((b) =>
      (b.brand_data?.Marka || b.brand_data?.brand || "").toLowerCase()
    )
  );

  const rows: { folder_name: string; brand_data: Record<string, unknown> }[] = [];
  for (const brand of brands) {
    const name = (brand.Marka || brand.brand || "").toLowerCase();
    if (name && !existingNames.has(name)) {
      rows.push({
        folder_name: folderName,
        brand_data: cleanBrandData(brand as Record<string, unknown>),
      });
      existingNames.add(name);
    }
  }

  if (rows.length === 0) return 0;

  // Insert in batches of 50
  let added = 0;
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error } = await supabase.from("saved_brands").insert(batch);
    if (error) {
      console.error("saveBrandsBulk error:", error);
      return added;
    }
    added += batch.length;
  }
  return added;
}

export async function removeBrandsByIds(ids: number[]): Promise<void> {
  const { error } = await supabase
    .from("saved_brands")
    .delete()
    .in("id", ids);
  if (error) console.error("removeBrands error:", error);
}

export async function moveBrands(
  brandIds: number[],
  targetFolder: string
): Promise<void> {
  await createFolder(targetFolder);
  const { error } = await supabase
    .from("saved_brands")
    .update({ folder_name: targetFolder })
    .in("id", brandIds);
  if (error) console.error("moveBrands error:", error);
}

export async function getAllSavedCount(): Promise<number> {
  const { count, error } = await supabase
    .from("saved_brands")
    .select("id", { count: "exact", head: true });
  if (error) return 0;
  return count ?? 0;
}
