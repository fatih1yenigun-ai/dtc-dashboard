/**
 * Discover how sorting works on the v3 product endpoint (GET method).
 * v3 ignores sort_key in query params. Try alternatives.
 */

const PIPIADS_EMAIL = "burakyolive.06@gmail.com";
const PIPIADS_PASSWORD = "oylesine123";
const KEYWORD = "skincare";
const BASE = "https://www.pipiads.com/v3/api/tiktok-shop/product";

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

async function testSort(token, label, extraParams) {
  const params = new URLSearchParams({
    keyword: KEYWORD, current_page: "1", page_size: "5",
    ...extraParams,
  });
  const url = `${BASE}?${params}`;
  const res = await fetch(url, { method: "GET", headers: hdrs(token) });
  const data = await res.json();
  const items = data?.result?.data || [];
  const firstId = items[0]?.id || "none";
  const firstName = (items[0]?.title || "").substring(0, 50);
  console.log(`${label} → first: ${firstName} (id: ${firstId.substring(0, 10)}...)`);
  return firstId;
}

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log("=== v3 Sort Parameter Discovery ===\n");
  const token = await login();

  // Get baseline
  const baseline = await testSort(token, "BASELINE (no sort)", {});
  await delay(400);

  // Test sort param names
  const tests = [
    // sort_key variations
    { label: "sort_key=found_time", params: { sort_key: "found_time" } },
    { label: "sort_key=sales_volume", params: { sort_key: "sales_volume" } },
    { label: "sort=found_time", params: { sort: "found_time" } },
    { label: "sort=sales_volume", params: { sort: "sales_volume" } },
    { label: "sort=gmv", params: { sort: "gmv" } },

    // Numeric sort
    { label: "sort=1", params: { sort: "1" } },
    { label: "sort=2", params: { sort: "2" } },
    { label: "sort=3", params: { sort: "3" } },
    { label: "sort=4", params: { sort: "4" } },
    { label: "sort=5", params: { sort: "5" } },
    { label: "sort=6", params: { sort: "6" } },
    { label: "sort=7", params: { sort: "7" } },
    { label: "sort=8", params: { sort: "8" } },
    { label: "sort=9", params: { sort: "9" } },
    { label: "sort=10", params: { sort: "10" } },
    { label: "sort=99", params: { sort: "99" } },
    { label: "sort=999", params: { sort: "999" } },

    // order_by
    { label: "order_by=found_time", params: { order_by: "found_time" } },
    { label: "order_by=sales_volume", params: { order_by: "sales_volume" } },
    { label: "order=found_time", params: { order: "found_time" } },
    { label: "order=sales_volume", params: { order: "sales_volume" } },

    // sortBy
    { label: "sortBy=found_time", params: { sortBy: "found_time" } },
    { label: "sortBy=1", params: { sortBy: "1" } },

    // Combined
    { label: "sort=1 + sort_type=desc", params: { sort: "1", sort_type: "desc" } },
    { label: "sort=1 + sort_type=asc", params: { sort: "1", sort_type: "asc" } },
    { label: "sort=2 + sort_type=desc", params: { sort: "2", sort_type: "desc" } },
    { label: "sort=3 + sort_type=desc", params: { sort: "3", sort_type: "desc" } },

    // sort_key + sort_type
    { label: "sort_key=found_time + sort_type=desc", params: { sort_key: "found_time", sort_type: "desc" } },
    { label: "sort_key=found_time + sort_type=asc", params: { sort_key: "found_time", sort_type: "asc" } },
    { label: "sort_key=sales_volume + sort_type=desc", params: { sort_key: "sales_volume", sort_type: "desc" } },

    // sort + order
    { label: "sort=found_time + order=desc", params: { sort: "found_time", order: "desc" } },
    { label: "sort=sales_volume + order=desc", params: { sort: "sales_volume", order: "desc" } },
  ];

  const results = {};
  for (const t of tests) {
    await delay(350);
    const firstId = await testSort(token, t.label, t.params);
    const diff = firstId !== baseline;
    if (diff) console.log("  ⚡ DIFFERENT from baseline!");
    results[t.label] = { firstId, diff };
  }

  // Summary
  console.log("\n═══ SUMMARY ═══");
  const working = Object.entries(results).filter(([, v]) => v.diff);
  if (working.length > 0) {
    console.log("\nSort params that produce DIFFERENT results:");
    working.forEach(([label]) => console.log(`  ✅ ${label}`));
  } else {
    console.log("\n⚠️  No sort param changed the results. v3 may require a completely different approach.");
  }
}

main().catch(console.error);
