/**
 * Compare v1 POST vs v3 GET for TTS product search.
 * v3 uses GET method with query params.
 *
 * Usage: node scripts/compare-v1-v3.mjs
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

function hdrs(token) {
  return {
    accept: "application/json", access_token: token,
    "content-type": "application/json", device_id: "352039877",
    origin: "https://www.pipiads.com", referer: "https://www.pipiads.com/",
    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    cookie: `uid=${token}`,
  };
}

async function fetchV1(token, sortKey, sortType) {
  const params = new URLSearchParams({
    keyword: KEYWORD, sort_key: sortKey, sort_type: sortType,
    current_page: "1", page_size: "10",
  });
  const url = `https://www.pipiads.com/v1/api/tiktok-shop/product?${params}`;
  const res = await fetch(url, { method: "POST", headers: hdrs(token) });
  return res.json();
}

async function fetchV3(token, sortKey, sortType) {
  const params = new URLSearchParams({
    keyword: KEYWORD, sort_key: sortKey, sort_type: sortType,
    current_page: "1", page_size: "10",
  });
  const url = `https://www.pipiads.com/v3/api/tiktok-shop/product?${params}`;
  const res = await fetch(url, { method: "GET", headers: hdrs(token) });
  return res.json();
}

function printResults(label, data) {
  const items = data?.result?.data || [];
  const total = data?.result?.total || "?";
  console.log(`\n${label} (total: ${total}):`);
  items.slice(0, 5).forEach((item, i) => {
    const d = item.found_time ? new Date(item.found_time * 1000).toISOString().split("T")[0] : "?";
    console.log(`  ${i+1}. [${d}] ${(item.title || "").substring(0, 55)}`);
    console.log(`     sales=${item.sales_volume} gmv=${item.gmv_usd || item.gmv} views=${item.play_count} videos=${item.video_count} influencers=${item.person_count}`);
  });
  // Check if v3 has extra fields
  if (items[0]) {
    const keys = Object.keys(items[0]);
    console.log(`  Fields (${keys.length}): ${keys.join(", ")}`);
  }
}

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log("=== v1 vs v3 Product Endpoint Comparison ===\n");
  const token = await login();

  const sorts = [
    { key: "found_time", type: "desc", label: "Son Zaman (desc)" },
    { key: "sales_volume", type: "desc", label: "Satislar (desc)" },
    { key: "gmv", type: "desc", label: "GMV (desc)" },
  ];

  for (const sort of sorts) {
    console.log(`\n${"═".repeat(60)}`);
    console.log(`SORT: ${sort.label}`);
    console.log(`${"═".repeat(60)}`);

    const v1Data = await fetchV1(token, sort.key, sort.type);
    printResults("v1 (POST)", v1Data);

    await delay(600);

    const v3Data = await fetchV3(token, sort.key, sort.type);
    printResults("v3 (GET)", v3Data);

    // Compare
    const v1Ids = (v1Data?.result?.data || []).slice(0, 5).map(i => i.id);
    const v3Ids = (v3Data?.result?.data || []).slice(0, 5).map(i => i.id);
    const same = JSON.stringify(v1Ids) === JSON.stringify(v3Ids);
    console.log(`\n  → Results ${same ? "IDENTICAL ⚠️" : "DIFFERENT ✅"}`);

    await delay(600);
  }

  console.log("\n=== Done ===");
}

main().catch(console.error);
