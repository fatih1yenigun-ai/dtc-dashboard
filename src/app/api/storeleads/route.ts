import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      region = "turkey", // "turkey" | "global" | "all"
      category,
      platform,
      query,
      minSales,
      maxSales,
      minTraffic,
      sortBy = "estimated_sales_usd",
      sortAsc = false,
      page = 1,
      pageSize = 50,
    } = body;

    let q = supabase.from("storeleads_stores").select("*", { count: "exact" });

    // Region filter
    if (region === "turkey") {
      q = q.eq("country", "TR");
    } else if (region === "global") {
      q = q.neq("country", "TR");
    }

    // Category filter (LIKE search since categories are path-style)
    if (category) {
      q = q.ilike("categories", `%${category}%`);
    }

    // Platform filter
    if (platform) {
      q = q.ilike("platform", platform);
    }

    // Text search across domain, name, categories
    if (query) {
      q = q.or(
        `domain.ilike.%${query}%,name.ilike.%${query}%,categories.ilike.%${query}%,recent_product.ilike.%${query}%`
      );
    }

    // Sales filters
    if (minSales) {
      q = q.gte("estimated_sales_usd", minSales);
    }
    if (maxSales) {
      q = q.lte("estimated_sales_usd", maxSales);
    }

    // Traffic filter (using page views)
    if (minTraffic) {
      q = q.gte("estimated_page_views", minTraffic);
    }

    // Sort
    const nullsFirst = false;
    q = q.order(sortBy, { ascending: sortAsc, nullsFirst });

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    q = q.range(from, to);

    const { data, error, count } = await q;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      stores: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// GET endpoint for filter options (categories, platforms)
export async function GET() {
  try {
    // Get unique platforms
    const { data: platformData } = await supabase
      .from("storeleads_stores")
      .select("platform")
      .not("platform", "is", null)
      .limit(1000);

    const platforms = [
      ...new Set((platformData || []).map((r) => r.platform).filter(Boolean)),
    ].sort();

    // Get categories (sample to extract unique ones)
    const { data: catData } = await supabase
      .from("storeleads_stores")
      .select("categories")
      .not("categories", "is", null)
      .limit(5000);

    const catSet = new Set<string>();
    for (const row of catData || []) {
      if (!row.categories) continue;
      // Categories are path-style like "/Beauty & Fitness/Face & Body Care"
      // Split by : for multi-category entries
      for (const cat of row.categories.split(":")) {
        const parts = cat.split("/").filter(Boolean);
        // Add top-level categories
        if (parts[0]) catSet.add(parts[0]);
      }
    }
    const categories = [...catSet].sort();

    // Get total count by country
    const { count: trCount } = await supabase
      .from("storeleads_stores")
      .select("id", { count: "exact", head: true })
      .eq("country", "TR");

    const { count: totalCount } = await supabase
      .from("storeleads_stores")
      .select("id", { count: "exact", head: true });

    return NextResponse.json({
      platforms,
      categories,
      counts: {
        turkey: trCount || 0,
        global: (totalCount || 0) - (trCount || 0),
        total: totalCount || 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
