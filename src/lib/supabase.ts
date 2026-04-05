import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ---------- Types ----------
export interface ExpertCollection {
  id: number;
  name: string;
  category: string | null;
  user_id: number;
  created_at: string;
  username?: string;
  item_count?: number;
}

export interface ExpertArchiveItem {
  id: number;
  collection_id: number;
  user_id: number;
  brand_data: BrandData;
  expert_note: string;
  created_at: string;
}

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
export async function loadFolders(userId?: number): Promise<string[]> {
  let query = supabase
    .from("folders")
    .select("name")
    .order("created_at", { ascending: true });
  if (userId) query = query.eq("user_id", userId);
  const { data, error } = await query;
  if (error) {
    console.error("loadFolders error:", error);
    return ["Genel"];
  }
  const names = (data ?? []).map((r) => r.name);
  return names.length > 0 ? names : ["Genel"];
}

export async function createFolder(name: string, userId?: number): Promise<boolean> {
  // Check if exists
  let checkQuery = supabase.from("folders").select("name").eq("name", name);
  if (userId) checkQuery = checkQuery.eq("user_id", userId);
  const { data: existing } = await checkQuery;
  if (existing && existing.length > 0) return true;

  const row: Record<string, unknown> = { name };
  if (userId) row.user_id = userId;
  const { error } = await supabase.from("folders").insert(row);
  if (error) {
    console.error("createFolder error:", error);
    return false;
  }
  return true;
}

export async function deleteFolder(name: string, userId?: number): Promise<void> {
  if (userId) {
    await supabase.from("saved_brands").delete().eq("folder_name", name).eq("user_id", userId);
    await supabase.from("folders").delete().eq("name", name).eq("user_id", userId);
  } else {
    await supabase.from("saved_brands").delete().eq("folder_name", name);
    await supabase.from("folders").delete().eq("name", name);
  }
}

// ---------- Brands ----------
export async function loadBrands(folderName: string, userId?: number): Promise<SavedBrand[]> {
  let query = supabase
    .from("saved_brands")
    .select("id, folder_name, brand_data, created_at")
    .eq("folder_name", folderName)
    .order("created_at", { ascending: true });
  if (userId) query = query.eq("user_id", userId);
  const { data, error } = await query;
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
  brands: BrandData[],
  userId?: number
): Promise<number> {
  // Ensure folder exists
  await createFolder(folderName, userId);

  // Get existing brand names
  const existing = await loadBrands(folderName, userId);
  const existingNames = new Set(
    existing.map((b) =>
      (b.brand_data?.Marka || b.brand_data?.brand || "").toLowerCase()
    )
  );

  const rows: { folder_name: string; brand_data: Record<string, unknown>; user_id?: number }[] = [];
  for (const brand of brands) {
    const name = (brand.Marka || brand.brand || "").toLowerCase();
    if (name && !existingNames.has(name)) {
      const row: { folder_name: string; brand_data: Record<string, unknown>; user_id?: number } = {
        folder_name: folderName,
        brand_data: cleanBrandData(brand as Record<string, unknown>),
      };
      if (userId) row.user_id = userId;
      rows.push(row);
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
  targetFolder: string,
  userId?: number
): Promise<void> {
  await createFolder(targetFolder, userId);
  const { error } = await supabase
    .from("saved_brands")
    .update({ folder_name: targetFolder })
    .in("id", brandIds);
  if (error) console.error("moveBrands error:", error);
}

export async function getAllSavedCount(userId?: number): Promise<number> {
  let query = supabase
    .from("saved_brands")
    .select("id", { count: "exact", head: true });
  if (userId) query = query.eq("user_id", userId);
  const { count, error } = await query;
  if (error) return 0;
  return count ?? 0;
}

// ---------- Expert Collections ----------
export async function loadExpertCollections(userId: number): Promise<ExpertCollection[]> {
  const { data, error } = await supabase
    .from("expert_collections")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("loadExpertCollections error:", error);
    return [];
  }
  return data ?? [];
}

export async function createExpertCollection(
  name: string,
  category: string | null,
  userId: number
): Promise<boolean> {
  const { data: existing } = await supabase
    .from("expert_collections")
    .select("id")
    .eq("name", name)
    .eq("user_id", userId);
  if (existing && existing.length > 0) return true;

  const { error } = await supabase
    .from("expert_collections")
    .insert({ name, category, user_id: userId });
  if (error) {
    console.error("createExpertCollection error:", error);
    return false;
  }
  return true;
}

export async function deleteExpertCollection(collectionId: number, userId: number): Promise<void> {
  await supabase
    .from("expert_archive_items")
    .delete()
    .eq("collection_id", collectionId)
    .eq("user_id", userId);
  await supabase
    .from("expert_collections")
    .delete()
    .eq("id", collectionId)
    .eq("user_id", userId);
}

// ---------- Expert Archive Items ----------
export async function loadExpertArchiveItems(collectionId: number): Promise<ExpertArchiveItem[]> {
  const { data, error } = await supabase
    .from("expert_archive_items")
    .select("*")
    .eq("collection_id", collectionId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("loadExpertArchiveItems error:", error);
    return [];
  }
  return data ?? [];
}

export async function addExpertArchiveItem(
  collectionId: number,
  userId: number,
  brandData: BrandData,
  expertNote: string
): Promise<boolean> {
  const { error } = await supabase.from("expert_archive_items").insert({
    collection_id: collectionId,
    user_id: userId,
    brand_data: cleanBrandData(brandData as Record<string, unknown>),
    expert_note: expertNote,
  });
  if (error) {
    console.error("addExpertArchiveItem error:", error);
    return false;
  }
  return true;
}

export async function updateExpertArchiveItemNote(
  itemId: number,
  userId: number,
  note: string
): Promise<void> {
  const { error } = await supabase
    .from("expert_archive_items")
    .update({ expert_note: note })
    .eq("id", itemId)
    .eq("user_id", userId);
  if (error) console.error("updateExpertArchiveItemNote error:", error);
}

export async function removeExpertArchiveItem(itemId: number, userId: number): Promise<void> {
  const { error } = await supabase
    .from("expert_archive_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", userId);
  if (error) console.error("removeExpertArchiveItem error:", error);
}

// ---------- Public Expert Browse ----------
export async function loadAllExpertCollections(): Promise<ExpertCollection[]> {
  const { data, error } = await supabase
    .from("expert_collections")
    .select("*, users(username)")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("loadAllExpertCollections error:", error);
    return [];
  }

  // Get item counts per collection
  const collections: ExpertCollection[] = [];
  for (const row of data ?? []) {
    const { count } = await supabase
      .from("expert_archive_items")
      .select("id", { count: "exact", head: true })
      .eq("collection_id", row.id);
    collections.push({
      ...row,
      username: (row.users as { username: string } | null)?.username ?? "Bilinmiyor",
      item_count: count ?? 0,
    });
  }
  return collections;
}
