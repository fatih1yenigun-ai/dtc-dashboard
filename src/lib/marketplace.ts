import { supabase } from "./supabase";

// ---------- Types ----------

export interface CreatorProfile {
  id: number;
  user_id: number | null;
  source: "faycom" | "veritabani";
  type: "ugc" | "influencer";
  tier: "micro" | "mid" | "macro" | "mega" | null;
  name: string;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  linkedin_url: string | null;
  tiktok_url: string | null;
  x_url: string | null;
  follower_count: number;
  categories: string[];
  brands_worked_with: string[];
  ugc_video_price: number | null;
  affiliate_commission_info: string | null;
  post_sharing_cost: number | null;
  package_details: string | null;
  media_kit_url: string | null;
  portfolio_urls: string[];
  avatar_url: string | null;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  profile_views: number;
  created_at: string;
  updated_at: string;
  avg_rating?: number;
  review_count?: number;
}

export interface SupplierProfile {
  id: number;
  user_id: number | null;
  source: "faycom" | "veritabani";
  company_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string;
  website: string | null;
  city: string | null;
  type: "uretici" | "toptanci";
  category: string | null;
  specialty: string | null;
  brands_produced_for: string[];
  marketplace_shopier: string | null;
  marketplace_trendyol: string | null;
  marketplace_n11: string | null;
  marketplace_hepsiburada: string | null;
  marketplace_amazon_tr: string | null;
  description: string | null;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  profile_views: number;
  created_at: string;
  updated_at: string;
  avg_rating?: number;
  review_count?: number;
}

export interface Review {
  id: number;
  reviewer_user_id: number;
  target_type: "creator" | "supplier";
  target_id: number;
  rating: number;
  text: string | null;
  is_expert: boolean;
  created_at: string;
  reviewer_username?: string;
}

export interface CreatorFilters {
  type?: "ugc" | "influencer";
  source?: "faycom" | "veritabani";
  tier?: string;
  categories?: string[];
  city?: string;
  sort?: "followers_desc" | "followers_asc" | "reviews" | "newest";
  page?: number;
  pageSize?: number;
}

export interface SupplierFilters {
  type?: "uretici" | "toptanci";
  source?: "faycom" | "veritabani";
  category?: string;
  city?: string;
  sort?: "reviews" | "newest";
  page?: number;
  pageSize?: number;
}

// ---------- Creator Profiles ----------

export async function loadCreatorProfiles(
  filters: CreatorFilters = {}
): Promise<{ data: CreatorProfile[]; total: number }> {
  try {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from("creator_profiles")
      .select("*", { count: "exact" })
      .eq("status", "APPROVED");

    if (filters.type) query = query.eq("type", filters.type);
    if (filters.source) query = query.eq("source", filters.source);
    if (filters.tier) query = query.eq("tier", filters.tier);
    if (filters.city) query = query.eq("city", filters.city);
    if (filters.categories && filters.categories.length > 0) {
      query = query.contains("categories", filters.categories);
    }

    switch (filters.sort) {
      case "followers_asc":
        query = query.order("follower_count", { ascending: true });
        break;
      case "reviews":
        query = query.order("profile_views", { ascending: false });
        break;
      case "newest":
        query = query.order("created_at", { ascending: false });
        break;
      case "followers_desc":
      default:
        query = query.order("follower_count", { ascending: false });
        break;
    }

    query = query.range(offset, offset + pageSize - 1);

    const { data, count, error } = await query;
    if (error) {
      console.error("loadCreatorProfiles error:", error);
      return { data: [], total: 0 };
    }
    return { data: (data as CreatorProfile[]) ?? [], total: count ?? 0 };
  } catch (err) {
    console.error("loadCreatorProfiles exception:", err);
    return { data: [], total: 0 };
  }
}

// ---------- Supplier Profiles ----------

export async function loadSupplierProfiles(
  filters: SupplierFilters = {}
): Promise<{ data: SupplierProfile[]; total: number }> {
  try {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from("supplier_profiles")
      .select("*", { count: "exact" })
      .eq("status", "APPROVED");

    if (filters.type) query = query.eq("type", filters.type);
    if (filters.source) query = query.eq("source", filters.source);
    if (filters.category) query = query.eq("category", filters.category);
    if (filters.city) query = query.eq("city", filters.city);

    switch (filters.sort) {
      case "reviews":
        query = query.order("profile_views", { ascending: false });
        break;
      case "newest":
        query = query.order("created_at", { ascending: false });
        break;
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    query = query.range(offset, offset + pageSize - 1);

    const { data, count, error } = await query;
    if (error) {
      console.error("loadSupplierProfiles error:", error);
      return { data: [], total: 0 };
    }
    return { data: (data as SupplierProfile[]) ?? [], total: count ?? 0 };
  } catch (err) {
    console.error("loadSupplierProfiles exception:", err);
    return { data: [], total: 0 };
  }
}

// ---------- Single Profile Loaders ----------

export async function loadCreatorProfile(
  id: number
): Promise<CreatorProfile | null> {
  try {
    const { data, error } = await supabase
      .from("creator_profiles")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      console.error("loadCreatorProfile error:", error);
      return null;
    }
    return data as CreatorProfile;
  } catch (err) {
    console.error("loadCreatorProfile exception:", err);
    return null;
  }
}

export async function loadSupplierProfile(
  id: number
): Promise<SupplierProfile | null> {
  try {
    const { data, error } = await supabase
      .from("supplier_profiles")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      console.error("loadSupplierProfile error:", error);
      return null;
    }
    return data as SupplierProfile;
  } catch (err) {
    console.error("loadSupplierProfile exception:", err);
    return null;
  }
}

// ---------- Profile Views ----------

export async function incrementProfileViews(
  targetType: "creator" | "supplier",
  targetId: number
): Promise<void> {
  try {
    const table =
      targetType === "creator" ? "creator_profiles" : "supplier_profiles";

    // Fetch current views then increment
    const { data, error: fetchError } = await supabase
      .from(table)
      .select("profile_views")
      .eq("id", targetId)
      .single();

    if (fetchError || !data) {
      console.error("incrementProfileViews fetch error:", fetchError);
      return;
    }

    const { error: updateError } = await supabase
      .from(table)
      .update({ profile_views: (data.profile_views ?? 0) + 1 })
      .eq("id", targetId);

    if (updateError) {
      console.error("incrementProfileViews update error:", updateError);
    }
  } catch (err) {
    console.error("incrementProfileViews exception:", err);
  }
}

// ---------- Reviews ----------

export async function loadReviews(
  targetType: "creator" | "supplier",
  targetId: number
): Promise<Review[]> {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .order("is_expert", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("loadReviews error:", error);
      return [];
    }
    return (data as Review[]) ?? [];
  } catch (err) {
    console.error("loadReviews exception:", err);
    return [];
  }
}

export async function loadReviewStats(
  targetType: "creator" | "supplier",
  targetId: number
): Promise<{ avg_rating: number; review_count: number }> {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("rating")
      .eq("target_type", targetType)
      .eq("target_id", targetId);

    if (error || !data || data.length === 0) {
      if (error) console.error("loadReviewStats error:", error);
      return { avg_rating: 0, review_count: 0 };
    }

    const sum = data.reduce((acc, r) => acc + (r.rating ?? 0), 0);
    return {
      avg_rating: Math.round((sum / data.length) * 10) / 10,
      review_count: data.length,
    };
  } catch (err) {
    console.error("loadReviewStats exception:", err);
    return { avg_rating: 0, review_count: 0 };
  }
}

// ---------- Create Profiles ----------

export async function createCreatorProfile(
  profile: Partial<CreatorProfile>
): Promise<CreatorProfile | null> {
  try {
    const { data, error } = await supabase
      .from("creator_profiles")
      .insert(profile)
      .select()
      .single();

    if (error) {
      console.error("createCreatorProfile error:", error);
      return null;
    }
    return data as CreatorProfile;
  } catch (err) {
    console.error("createCreatorProfile exception:", err);
    return null;
  }
}

export async function createSupplierProfile(
  profile: Partial<SupplierProfile>
): Promise<SupplierProfile | null> {
  try {
    const { data, error } = await supabase
      .from("supplier_profiles")
      .insert(profile)
      .select()
      .single();

    if (error) {
      console.error("createSupplierProfile error:", error);
      return null;
    }
    return data as SupplierProfile;
  } catch (err) {
    console.error("createSupplierProfile exception:", err);
    return null;
  }
}

// ---------- Update Profiles ----------

export async function updateCreatorProfile(
  id: number,
  updates: Partial<CreatorProfile>
): Promise<CreatorProfile | null> {
  try {
    const { data, error } = await supabase
      .from("creator_profiles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("updateCreatorProfile error:", error);
      return null;
    }
    return data as CreatorProfile;
  } catch (err) {
    console.error("updateCreatorProfile exception:", err);
    return null;
  }
}

export async function updateSupplierProfile(
  id: number,
  updates: Partial<SupplierProfile>
): Promise<SupplierProfile | null> {
  try {
    const { data, error } = await supabase
      .from("supplier_profiles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("updateSupplierProfile error:", error);
      return null;
    }
    return data as SupplierProfile;
  } catch (err) {
    console.error("updateSupplierProfile exception:", err);
    return null;
  }
}
