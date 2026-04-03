/**
 * Debug script to discover which time filter parameter gives "hepsi" (all time) results
 * vs dün (yesterday), son 7 gün (last 7 days), etc.
 *
 * Usage: node scripts/debug-time-filter.mjs
 */

const PIPIADS_EMAIL = "burakyolive.06@gmail.com";
const PIPIADS_PASSWORD = "oylesine123";
const KEYWORD = "skincare";

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

function headers(token) {
  return {
    accept: "application/json", access_token: token,
    "content-type": "application/json", device_id: "352039877",
    origin: "https://www.pipiads.com", referer: "https://www.pipiads.com/",
    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    cookie: `uid=${token}`,
  };
}

async function testQueryParam(token, label, extraParams) {
  const baseParams = {
    keyword: KEYWORD, sort_key: "found_time", sort_type: "desc",
    current_page: "1", page_size: "5", ...extraParams,
  };
  const params = new URLSearchParams(baseParams);
  const url = `https://www.pipiads.com/v1/api/tiktok-shop/product?${params}`;
  const res = await fetch(url, { method: "POST", headers: headers(token) });
  const data = await res.json();
  const list = data?.result?.data || [];
  const total = data?.result?.total || "?";
  console.log(`\n${label} → Total: ${total}`);
  list.slice(0, 3).forEach((item, i) => {
    const d = item.found_time ? new Date(item.found_time * 1000).toISOString().split("T")[0] : "?";
    console.log(`  ${i+1}. [${d}] ${(item.title||"").substring(0, 55)} | sales=${item.sales_volume} views=${item.play_count}`);
  });
  return { total, firstId: list[0]?.id };
}

async function testPostBody(token, label, body) {
  const url = "https://www.pipiads.com/v1/api/tiktok-shop/product";
  const fullBody = {
    keyword: KEYWORD, sort_key: "found_time", sort_type: "desc",
    current_page: 1, page_size: 5, ...body,
  };
  const res = await fetch(url, {
    method: "POST", headers: headers(token),
    body: JSON.stringify(fullBody),
  });
  const data = await res.json();
  const list = data?.result?.data || [];
  const total = data?.result?.total || "?";
  console.log(`\n${label} → Total: ${total}`);
  list.slice(0, 3).forEach((item, i) => {
    const d = item.found_time ? new Date(item.found_time * 1000).toISOString().split("T")[0] : "?";
    console.log(`  ${i+1}. [${d}] ${(item.title||"").substring(0, 55)} | sales=${item.sales_volume} views=${item.play_count}`);
  });
  return { total, firstId: list[0]?.id };
}

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log("=== PiPiAds Time Filter Discovery ===");
  const token = await login();

  // Baseline — no time params
  const baseline = await testQueryParam(token, "BASELINE (no time param))", {});
  await delay(600);

  // Query param: time variations
  const timeParams = [
    { label: "time=0 (all?)", params: { time: "0" } },
    { label: "time=-1", params: { time: "-1" } },
    { label: "time=1 (yesterday?)", params: { time: "1" } },
    { label: "time=7 (7 days?)", params: { time: "7" } },
    { label: "time=30 (30 days?)", params: { time: "30" } },
    { label: "time=90", params: { time: "90" } },
    { label: "time=365", params: { time: "365" } },
    { label: "ad_time=0", params: { ad_time: "0" } },
    { label: "ad_time=-1", params: { ad_time: "-1" } },
    { label: "ad_time=1", params: { ad_time: "1" } },
    { label: "ad_time=7", params: { ad_time: "7" } },
    { label: "ad_time=30", params: { ad_time: "30" } },
    { label: "date_range=all", params: { date_range: "all" } },
    { label: "date_range=0", params: { date_range: "0" } },
    { label: "filter_time=0", params: { filter_time: "0" } },
    { label: "filter_time=-1", params: { filter_time: "-1" } },
    { label: "product_time=0", params: { product_time: "0" } },
    { label: "found_day=0", params: { found_day: "0" } },
    { label: "found_day=-1", params: { found_day: "-1" } },
    { label: "day_range=0", params: { day_range: "0" } },
  ];

  for (const t of timeParams) {
    await delay(500);
    const result = await testQueryParam(token, `QP: ${t.label}`, t.params);
    const sameAsBaseline = result.firstId === baseline.firstId;
    if (!sameAsBaseline) console.log("  ⚡ DIFFERENT from baseline!");
  }

  // POST body: time variations
  console.log("\n--- POST body tests ---");
  const bodyTimeTests = [
    { label: "time: 0", body: { time: 0 } },
    { label: "time: -1", body: { time: -1 } },
    { label: "time: 7", body: { time: 7 } },
    { label: "time: 30", body: { time: 30 } },
    { label: "ad_time: 0", body: { ad_time: 0 } },
    { label: "ad_time: -1", body: { ad_time: -1 } },
    { label: "ad_time: 7", body: { ad_time: 7 } },
    { label: "found_day: 0", body: { found_day: 0 } },
    { label: "found_day: -1", body: { found_day: -1 } },
    { label: "date_range: 'all'", body: { date_range: "all" } },
  ];

  for (const t of bodyTimeTests) {
    await delay(500);
    const result = await testPostBody(token, `BODY: ${t.label}`, t.body);
    const sameAsBaseline = result.firstId === baseline.firstId;
    if (!sameAsBaseline) console.log("  ⚡ DIFFERENT from baseline!");
  }

  console.log("\n=== Done ===");
}

main().catch(console.error);
