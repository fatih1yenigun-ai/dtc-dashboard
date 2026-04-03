/**
 * Discover the correct body format for v3/api/tiktok-shop/product
 * We know the endpoint exists (returns 400 not 404).
 *
 * Usage: node scripts/discover-v3-product.mjs
 */

const PIPIADS_EMAIL = "burakyolive.06@gmail.com";
const PIPIADS_PASSWORD = "oylesine123";
const KEYWORD = "skincare";
const URL = "https://www.pipiads.com/v3/api/tiktok-shop/product";

async function login() {
  const res = await fetch("https://www.pipiads.com/v1/api/member/login", {
    method: "PUT",
    headers: { "content-type": "application/json", device_id: "352039877" },
    body: JSON.stringify({
      email: PIPIADS_EMAIL, password: PIPIADS_PASSWORD,
      device_id: 352039877, uuid: "1c16840e-17fd-4dba-ad3a-773f218d131e",
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Login failed");
  return data.access_token;
}

function hdrs(token) {
  return {
    accept: "application/json", access_token: token,
    "content-type": "application/json", device_id: "352039877",
    origin: "https://www.pipiads.com", referer: "https://www.pipiads.com/",
    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    cookie: `uid=${token}`,
  };
}

async function test(token, label, body) {
  try {
    const res = await fetch(URL, {
      method: "POST", headers: hdrs(token), body: JSON.stringify(body),
    });
    const data = await res.json();
    const items = data?.result?.data || data?.data?.list || data?.data || [];
    const total = data?.result?.total || data?.data?.total || "?";
    if (items.length > 0) {
      console.log(`✅ ${label} → ${res.status} | ${items.length} items | total=${total}`);
      const first = items[0];
      console.log(`   First: ${(first.title || first.product_name || "").substring(0, 60)}`);
      console.log(`   Keys: ${Object.keys(first).join(", ")}`);
      return true;
    } else {
      const msg = data?.message || data?.msg || JSON.stringify(data).substring(0, 150);
      console.log(`❌ ${label} → ${res.status} | ${msg}`);
      return false;
    }
  } catch (err) {
    console.log(`❌ ${label} → ERROR: ${err.message}`);
    return false;
  }
}

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log("=== v3 Product Endpoint Body Format Discovery ===\n");
  const token = await login();

  // Body format variations to try
  const bodies = [
    // Minimal
    { label: "keyword only", body: { keyword: KEYWORD } },
    { label: "keyword + page", body: { keyword: KEYWORD, current_page: 1, page_size: 5 } },

    // v1-style with sort
    { label: "v1-style full", body: { keyword: KEYWORD, sort_key: "found_time", sort_type: "desc", current_page: 1, page_size: 5 } },

    // Video-style with extend_keywords
    { label: "extend_keywords type1", body: {
      extend_keywords: [{ type: 1, keyword: KEYWORD }],
      sort: 999, sort_type: "desc", current_page: 1, page_size: 5,
    }},
    { label: "extend_keywords + search_type", body: {
      search_type: 1,
      extend_keywords: [{ type: 1, keyword: KEYWORD }],
      sort: 999, sort_type: "desc", current_page: 1, page_size: 5,
    }},
    { label: "extend_keywords full (video clone)", body: {
      is_participle: false, search_type: 1,
      extend_keywords: [{ type: 1, keyword: KEYWORD }],
      sort: 999, sort_type: "desc", current_page: 1, page_size: 5,
    }},

    // Mixed: keyword + sort numeric
    { label: "keyword + sort=999", body: { keyword: KEYWORD, sort: 999, sort_type: "desc", current_page: 1, page_size: 5 } },
    { label: "keyword + sort=1", body: { keyword: KEYWORD, sort: 1, sort_type: "desc", current_page: 1, page_size: 5 } },

    // With search_type
    { label: "keyword + search_type=1", body: { keyword: KEYWORD, search_type: 1, current_page: 1, page_size: 5 } },
    { label: "keyword + search_type=2", body: { keyword: KEYWORD, search_type: 2, current_page: 1, page_size: 5 } },
    { label: "keyword + search_type=3", body: { keyword: KEYWORD, search_type: 3, current_page: 1, page_size: 5 } },

    // With query (alternative keyword param)
    { label: "query param", body: { query: KEYWORD, current_page: 1, page_size: 5 } },
    { label: "q param", body: { q: KEYWORD, current_page: 1, page_size: 5 } },
    { label: "search param", body: { search: KEYWORD, current_page: 1, page_size: 5 } },
    { label: "words param", body: { words: KEYWORD, current_page: 1, page_size: 5 } },
    { label: "product_name", body: { product_name: KEYWORD, current_page: 1, page_size: 5 } },

    // With participle
    { label: "keyword + is_participle", body: { keyword: KEYWORD, is_participle: false, current_page: 1, page_size: 5 } },
    { label: "keyword + is_participle true", body: { keyword: KEYWORD, is_participle: true, current_page: 1, page_size: 5 } },

    // Empty to see what error says
    { label: "empty body", body: {} },

    // With region filters
    { label: "keyword + fetch_region", body: { keyword: KEYWORD, fetch_region: ["US"], current_page: 1, page_size: 5 } },

    // Try GET method via query params
    { label: "keyword + sort_key in body", body: {
      keyword: KEYWORD, sort_key: "found_time", sort_type: "desc",
      current_page: 1, page_size: 5, is_participle: false, search_type: 1,
    }},
  ];

  for (const { label, body } of bodies) {
    await delay(400);
    const found = await test(token, label, body);
    if (found) {
      console.log("   🎯 FOUND WORKING FORMAT! Body:", JSON.stringify(body));
      console.log("");
    }
  }

  // Also try GET method
  console.log("\n── GET method tests ──");
  const getParams = new URLSearchParams({
    keyword: KEYWORD, sort_key: "found_time", sort_type: "desc",
    current_page: "1", page_size: "5",
  });
  try {
    const res = await fetch(`${URL}?${getParams}`, { method: "GET", headers: hdrs(token) });
    const data = await res.json();
    console.log(`GET with query params → ${res.status} | ${JSON.stringify(data).substring(0, 200)}`);
  } catch (err) {
    console.log(`GET → ERROR: ${err.message}`);
  }

  // Try POST with query params (like v1)
  await delay(400);
  try {
    const res = await fetch(`${URL}?${getParams}`, { method: "POST", headers: hdrs(token) });
    const data = await res.json();
    const items = data?.result?.data || [];
    if (items.length > 0) {
      console.log(`POST with query params → ✅ ${res.status} | ${items.length} items`);
      console.log(`   First: ${items[0].title?.substring(0, 60)}`);
      console.log(`   Keys: ${Object.keys(items[0]).join(", ")}`);
    } else {
      console.log(`POST with query params → ${res.status} | ${JSON.stringify(data).substring(0, 200)}`);
    }
  } catch (err) {
    console.log(`POST qp → ERROR: ${err.message}`);
  }

  console.log("\n=== Done ===");
}

main().catch(console.error);
