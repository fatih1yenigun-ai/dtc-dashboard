/**
 * Debug script to discover which sort_key values PiPiAds actually recognizes
 * for the TikTok Shop product endpoint.
 *
 * Usage: node scripts/debug-sort.mjs
 */

const PIPIADS_EMAIL = "burakyolive.06@gmail.com";
const PIPIADS_PASSWORD = "oylesine123";
const KEYWORD = "skincare";
const PAGE_SIZE = 5;

async function login() {
  const res = await fetch("https://www.pipiads.com/v1/api/member/login", {
    method: "PUT",
    headers: { "content-type": "application/json", device_id: "352039877" },
    body: JSON.stringify({
      email: PIPIADS_EMAIL,
      password: PIPIADS_PASSWORD,
      device_id: 352039877,
      uuid: "1c16840e-17fd-4dba-ad3a-773f218d131e",
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Login failed: " + JSON.stringify(data));
  return data.access_token;
}

function headers(token) {
  return {
    accept: "application/json",
    access_token: token,
    "content-type": "application/json",
    device_id: "352039877",
    origin: "https://www.pipiads.com",
    referer: "https://www.pipiads.com/",
    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    cookie: `uid=${token}`,
  };
}

// Test 1: Current approach — query params with sort_key (string)
async function testQueryParamSort(token, sortKey, sortType = "desc") {
  const params = new URLSearchParams({
    keyword: KEYWORD,
    sort_key: sortKey,
    sort_type: sortType,
    current_page: "1",
    page_size: String(PAGE_SIZE),
  });
  const url = `https://www.pipiads.com/v1/api/tiktok-shop/product?${params}`;
  const res = await fetch(url, { method: "POST", headers: headers(token) });
  return res.json();
}

// Test 2: POST body approach (like video endpoint uses)
async function testBodySort(token, sortValue, sortType = "desc") {
  const url = "https://www.pipiads.com/v1/api/tiktok-shop/product";
  const body = {
    keyword: KEYWORD,
    sort: sortValue,
    sort_type: sortType,
    current_page: 1,
    page_size: PAGE_SIZE,
  };
  const res = await fetch(url, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(body),
  });
  return res.json();
}

// Test 3: Query params with sort (numeric) instead of sort_key
async function testQueryParamNumericSort(token, sortValue, sortType = "desc") {
  const params = new URLSearchParams({
    keyword: KEYWORD,
    sort: String(sortValue),
    sort_type: sortType,
    current_page: "1",
    page_size: String(PAGE_SIZE),
  });
  const url = `https://www.pipiads.com/v1/api/tiktok-shop/product?${params}`;
  const res = await fetch(url, { method: "POST", headers: headers(token) });
  return res.json();
}

function extractIds(data) {
  const list = data?.result?.data || data?.data?.list || data?.data || [];
  return list.map((item) => item.id);
}

function extractSummary(data) {
  const list = data?.result?.data || data?.data?.list || data?.data || [];
  return list.slice(0, 3).map((item) => ({
    id: item.id,
    title: (item.title || "").substring(0, 50),
    sales: item.sales_volume,
    gmv: item.gmv_usd || item.gmv,
    found_time: item.found_time,
    play_count: item.play_count,
    video_count: item.video_count,
    person_count: item.person_count,
    ad_cost: item.ad_cost,
  }));
}

async function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log("=== PiPiAds Sort Key Discovery Tool ===\n");
  console.log("Logging in...");
  const token = await login();
  console.log("Logged in successfully.\n");

  // ---- Test Group 1: String sort_key values via query params ----
  console.log("════════════════════════════════════════");
  console.log("TEST GROUP 1: Query param sort_key (string)");
  console.log("════════════════════════════════════════\n");

  const stringSortKeys = [
    "found_time", "sales_volume", "gmv", "play_count",
    "ad_cost", "video_count", "person_count",
    // Alternatives
    "insert_time", "created_at", "sales", "revenue",
    "views", "ads", "influencer_count", "price",
    "time", "create_time", "update_time",
  ];

  const baselineIds = [];
  const resultMap = {};

  for (const key of stringSortKeys) {
    try {
      await delay(500); // Rate limit protection
      const data = await testQueryParamSort(token, key);
      const ids = extractIds(data);
      const summary = extractSummary(data);

      if (baselineIds.length === 0) baselineIds.push(...ids);
      const matchesBaseline = JSON.stringify(ids) === JSON.stringify(baselineIds);
      resultMap[key] = { ids, matchesBaseline };

      const status = matchesBaseline ? "⚠️  SAME as baseline (possibly ignored)" : "✅ DIFFERENT ordering (recognized!)";
      console.log(`sort_key="${key}" → ${status}`);
      if (!matchesBaseline) {
        console.log("  First 3:", summary);
      }
    } catch (err) {
      console.log(`sort_key="${key}" → ❌ ERROR: ${err.message}`);
    }
  }

  // ---- Test Group 2: Numeric sort via POST body ----
  console.log("\n════════════════════════════════════════");
  console.log("TEST GROUP 2: POST body with numeric sort");
  console.log("════════════════════════════════════════\n");

  const numericSorts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 99, 999];

  for (const num of numericSorts) {
    try {
      await delay(500);
      const data = await testBodySort(token, num);
      const ids = extractIds(data);
      const summary = extractSummary(data);
      const matchesBaseline = JSON.stringify(ids) === JSON.stringify(baselineIds);
      const status = matchesBaseline ? "⚠️  SAME as baseline" : "✅ DIFFERENT ordering";
      console.log(`sort=${num} (body) → ${status}`);
      if (!matchesBaseline && ids.length > 0) {
        console.log("  First 3:", summary);
      }
      if (ids.length === 0) {
        console.log("  ⚠️  No results returned — might be wrong endpoint format");
      }
    } catch (err) {
      console.log(`sort=${num} (body) → ❌ ERROR: ${err.message}`);
    }
  }

  // ---- Test Group 3: Numeric sort via query params ----
  console.log("\n════════════════════════════════════════");
  console.log("TEST GROUP 3: Query param sort (numeric)");
  console.log("════════════════════════════════════════\n");

  for (const num of numericSorts) {
    try {
      await delay(500);
      const data = await testQueryParamNumericSort(token, num);
      const ids = extractIds(data);
      const summary = extractSummary(data);
      const matchesBaseline = JSON.stringify(ids) === JSON.stringify(baselineIds);
      const status = matchesBaseline ? "⚠️  SAME as baseline" : "✅ DIFFERENT ordering";
      console.log(`sort=${num} (query) → ${status}`);
      if (!matchesBaseline && ids.length > 0) {
        console.log("  First 3:", summary);
      }
    } catch (err) {
      console.log(`sort=${num} (query) → ❌ ERROR: ${err.message}`);
    }
  }

  // ---- Test Group 4: asc vs desc for known keys ----
  console.log("\n════════════════════════════════════════");
  console.log("TEST GROUP 4: asc vs desc comparison");
  console.log("════════════════════════════════════════\n");

  const keysToTestDirection = ["found_time", "sales_volume", "gmv"];
  for (const key of keysToTestDirection) {
    try {
      await delay(500);
      const descData = await testQueryParamSort(token, key, "desc");
      await delay(500);
      const ascData = await testQueryParamSort(token, key, "asc");
      const descIds = extractIds(descData);
      const ascIds = extractIds(ascData);
      const same = JSON.stringify(descIds) === JSON.stringify(ascIds);
      console.log(`sort_key="${key}" asc vs desc → ${same ? "⚠️  IDENTICAL (sort_type ignored)" : "✅ DIFFERENT (sort_type works)"}`);
      if (!same) {
        console.log("  DESC first:", extractSummary(descData)[0]);
        console.log("  ASC first:", extractSummary(ascData)[0]);
      }
    } catch (err) {
      console.log(`sort_key="${key}" asc/desc → ❌ ERROR: ${err.message}`);
    }
  }

  console.log("\n=== Done ===");
}

main().catch(console.error);
