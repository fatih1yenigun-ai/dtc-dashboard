import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ---------- Types ----------
export interface Folder {
  id: number;
  name: string;
  created_at: string;
}

export interface Brand {
  id: number;
  folder_id: number;
  brand_name: string;
  website: string;
  category: string;
  aov: string;
  insight: string;
  meta_ads_url: string;
  created_at: string;
}

// ---------- Folders ----------
export async function loadFolders(): Promise<Folder[]> {
  const { data, error } = await supabase
    .from("folders")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createFolder(name: string): Promise<Folder> {
  const { data, error } = await supabase
    .from("folders")
    .insert({ name })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteFolder(id: number): Promise<void> {
  // Delete brands in folder first
  await supabase.from("brands").delete().eq("folder_id", id);
  const { error } = await supabase.from("folders").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Brands ----------
export async function loadBrands(folderId?: number): Promise<Brand[]> {
  let query = supabase.from("brands").select("*").order("created_at", { ascending: false });
  if (folderId !== undefined) {
    query = query.eq("folder_id", folderId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function saveBrandsBulk(
  folderId: number,
  brands: Omit<Brand, "id" | "folder_id" | "created_at">[]
): Promise<void> {
  const rows = brands.map((b) => ({ ...b, folder_id: folderId }));
  const { error } = await supabase.from("brands").insert(rows);
  if (error) throw error;
}

export async function removeBrandsByName(
  folderId: number,
  brandNames: string[]
): Promise<void> {
  const { error } = await supabase
    .from("brands")
    .delete()
    .eq("folder_id", folderId)
    .in("brand_name", brandNames);
  if (error) throw error;
}

export async function moveBrands(
  brandIds: number[],
  targetFolderId: number
): Promise<void> {
  const { error } = await supabase
    .from("brands")
    .update({ folder_id: targetFolderId })
    .in("id", brandIds);
  if (error) throw error;
}
