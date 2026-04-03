/**
 * Sort Verification Script
 * Tests that PiPiAds product sort actually returns results in correct order.
 *
 * Usage: node scripts/verify-sort.mjs
 */

const PIPIADS_EMAIL = "burakyolive.06@gmail.com";
const PIPIADS_PASSWORD = "oylesine123";
const KEYWORD = "skincare";
const PAGE_SIZE = 10;

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

async function fetchProducts(token, sortKey, sortType = "desc") {
  const params = new URLSearchParams({
    keyword: KEYWORD, sort_key: sortKey, sort_type: sortType,
    current_page: "1", page_size: String(PAGE_SIZE),
  });
  const url = `https://www.pipiads.com/v1/api/tiktok-shop/product?${params}`;
  const res = await fetch(url, { method: "POST", headers: headers(token) });
  const data = await res.json();
  return data?.result?.data || [];
}

function isSorted(values, direction) {
  for (let i = 1; i < values.length; i++) {
    if (direction === "desc" && values[i] > values[i - 1]) return false;
    if (direction === "asc" && values[i] < values[i - 1]) return false;
  }
  return true;
}

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log("=== Sort Verification ===\n");
  const token = await login();

  const sortTests = [
    { key: "found_time", field: "found_time", label: "Son Zaman (desc)", type: "desc" },
    { key: "found_time", field: "found_time", label: "Ilk Zaman (asc)", type: "asc" },
    { key: "sales_volume", field: "sales_volume", label: "Satislar (desc)", type: "desc" },
    { key: "gmv", field: "gmv", fallback: "gmv_usd", label: "GMV (desc)", type: "desc" },
    { key: "play_count", field: "play_count", label: "Gosterimler (desc)", type: "desc" },
    { key: "video_count", field: "video_count", label: "Reklamlar (desc)", type: "desc" },
    { key: "person_count", field: "person_count", label: "Influencers (desc)", type: "desc" },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of sortTests) {
    await delay(600);
    try {
      const items = await fetchProducts(token, test.key, test.type);
      if (items.length < 2) {
        console.log(`⚠️  ${test.label}: Not enough results to verify`);
        continue;
      }
      const values = items.map(item => item[test.field] || (test.fallback ? item[test.fallback] : 0) || 0);
      const sorted = isSorted(values, test.type);

      if (sorted) {
        console.log(`✅ ${test.label}: Correctly sorted`);
        console.log(`   Values: [${values.slice(0, 5).join(", ")}${values.length > 5 ? ", ..." : ""}]`);
        passed++;
      } else {
        console.log(`❌ ${test.label}: NOT correctly sorted!`);
        console.log(`   Values: [${values.join(", ")}]`);
        failed++;
      }
    } catch (err) {
      console.log(`❌ ${test.label}: ERROR - ${err.message}`);
      failed++;
    }
  }

  console.log(`\n════════════════════════════════════════`);
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`════════════════════════════════════════\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
