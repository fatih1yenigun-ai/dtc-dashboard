import { supabase } from "./supabase";

export interface ToolSave {
  id: number;
  user_id: number;
  tool_type: string;
  name: string;
  data: Record<string, unknown>;
  created_at: string;
}

export async function saveToolData(
  userId: number,
  toolType: string,
  name: string,
  data: Record<string, unknown>
): Promise<number | null> {
  const { data: result, error } = await supabase
    .from("tool_saves")
    .insert({ user_id: userId, tool_type: toolType, name, data })
    .select("id")
    .single();

  if (error) {
    console.error("saveToolData error:", error);
    return null;
  }
  return result.id;
}

export async function loadToolSaves(
  userId: number,
  toolType: string
): Promise<ToolSave[]> {
  const { data, error } = await supabase
    .from("tool_saves")
    .select("*")
    .eq("user_id", userId)
    .eq("tool_type", toolType)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("loadToolSaves error:", error);
    return [];
  }
  return data || [];
}

export async function deleteToolSave(
  id: number,
  userId: number
): Promise<boolean> {
  const { error } = await supabase
    .from("tool_saves")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("deleteToolSave error:", error);
    return false;
  }
  return true;
}

export async function loadToolSaveById(
  id: number,
  userId: number
): Promise<ToolSave | null> {
  const { data, error } = await supabase
    .from("tool_saves")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("loadToolSaveById error:", error);
    return null;
  }
  return data;
}
