/**
 * Debug script to discover which filter params PiPiAds uses for
 * "7 gün içinde yüksek trafik" (high traffic in 7 days) default filter.
 *
 * Usage: node scripts/debug-filters.mjs
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

async function testFilter(token, label, extraParams) {
  const baseParams = {
    keyword: KEYWORD,
    sort_key: "found_time",
    sort_type: "desc",
    current_page: "1",
    page_size: "5",
    ...extraParams,
  };
  const params = new URLSearchParams(baseParams);
  const url = `https://www.pipiads.com/v1/api/tiktok-shop/product?${params}`;
  const res = await fetch(url, { method: "POST", headers: headers(token) });
  const data = await res.json();
  const list = data?.result?.data || [];
  console.log(`\n${label}:`);
  console.log(`  Total: ${data?.result?.total || "?"}`);
  list.slice(0, 3).forEach((item, i) => {
    console.log(`  ${i+1}. ${(item.title || "").substring(0, 60)}`);
    console.log(`     sales=${item.sales_volume} gmv=${item.gmv_usd || item.gmv} views=${item.play_count} videos=${item.video_count} found=${new Date(item.found_time * 1000).toISOString().split('T')[0]}`);
  });
  return list;
}

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log("=== PiPiAds Filter Discovery ===");
  const token = await login();

  // Baseline — no filters
  await testFilter(token, "BASELINE (no filters)", {});
  await delay(600);

  // Test: hot_value filter
  await testFilter(token, "hot_value=1", { hot_value: "1" });
  await delay(600);
  await testFilter(token, "hot_value=7", { hot_value: "7" });
  await delay(600);

  // Test: day range filters
  await testFilter(token, "day=7 (last 7 days)", { day: "7" });
  await delay(600);
  await testFilter(token, "days=7", { days: "7" });
  await delay(600);

  // Test: time range (7 days ago to now)
  const now = Math.floor(Date.now() / 1000);
  const sevenDaysAgo = now - 7 * 86400;
  await testFilter(token, "found_time_start + found_time_end (7 days)", {
    found_time_start: String(sevenDaysAgo), found_time_end: String(now),
  });
  await delay(600);

  // Test: period filter
  await testFilter(token, "period=7", { period: "7" });
  await delay(600);
  await testFilter(token, "period=7d", { period: "7d" });
  await delay(600);

  // Test: min video/sales threshold
  await testFilter(token, "min_sales=100", { min_sales: "100" });
  await delay(600);
  await testFilter(token, "min_video_count=5", { min_video_count: "5" });
  await delay(600);

  // Test: search_type
  await testFilter(token, "search_type=1", { search_type: "1" });
  await delay(600);
  await testFilter(token, "search_type=2", { search_type: "2" });
  await delay(600);

  // Test: region filter
  await testFilter(token, "region=US", { region: "US" });
  await delay(600);

  // Test: trending/hot filters
  await testFilter(token, "is_hot=1", { is_hot: "1" });
  await delay(600);
  await testFilter(token, "trending=1", { trending: "1" });
  await delay(600);
  await testFilter(token, "is_trending=1", { is_trending: "1" });
  await delay(600);

  // Test: growth / performance filters
  await testFilter(token, "growth_rate=7", { growth_rate: "7" });
  await delay(600);
  await testFilter(token, "high_traffic=7", { high_traffic: "7" });
  await delay(600);

  // Test: sales_volume range
  await testFilter(token, "sales_volume_min=100", { sales_volume_min: "100" });
  await delay(600);

  console.log("\n=== Done ===");
}

main().catch(console.error);
