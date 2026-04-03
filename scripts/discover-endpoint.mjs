/**
 * Discover the correct PiPiAds API endpoint for TTS product search.
 * The video endpoint is: v3/api/search4/at/video/search-tiktok-shop
 * Try similar patterns for products.
 *
 * Usage: node scripts/discover-endpoint.mjs
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
    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    cookie: `uid=${token}`,
  };
}

async function tryEndpoint(token, label, url, body) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify(body),
    });
    const status = res.status;
    if (status === 404) {
      console.log(`  ❌ ${label} → 404`);
      return null;
    }
    if (status === 401) {
      console.log(`  ⚠️  ${label} → 401 (auth issue)`);
      return null;
    }
    const data = await res.json();
    const items = data?.result?.data || data?.data?.list || data?.data || [];
    const total = data?.result?.total || data?.data?.total || data?.total || "?";
    if (items.length > 0) {
      console.log(`  ✅ ${label} → ${status} | ${items.length} results | total=${total}`);
      console.log(`     First: ${(items[0].title || items[0].product_name || items[0].name || "").substring(0, 60)}`);
      console.log(`     Keys: ${Object.keys(items[0]).slice(0, 15).join(", ")}`);
      return { items, data };
    } else {
      const preview = JSON.stringify(data).substring(0, 200);
      console.log(`  ⚠️  ${label} → ${status} | 0 results | ${preview}`);
      return null;
    }
  } catch (err) {
    console.log(`  ❌ ${label} → ERROR: ${err.message}`);
    return null;
  }
}

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log("=== PiPiAds Endpoint Discovery ===\n");
  const token = await login();

  // Video search body format (known working)
  const videoStyleBody = {
    is_participle: false,
    search_type: 1,
    extend_keywords: [{ type: 1, keyword: KEYWORD }],
    sort: 999,
    sort_type: "desc",
    current_page: 1,
    page_size: 5,
  };

  // Simple product body format
  const simpleBody = {
    keyword: KEYWORD,
    sort_key: "found_time",
    sort_type: "desc",
    current_page: 1,
    page_size: 5,
  };

  // Combined body format
  const combinedBody = {
    ...videoStyleBody,
    keyword: KEYWORD,
    sort_key: "found_time",
  };

  const allEndpoints = [
    // v3 search4 patterns (matching video endpoint pattern)
    "https://www.pipiads.com/v3/api/search4/at/product/search-tiktok-shop",
    "https://www.pipiads.com/v3/api/search4/at/tiktok-shop/product",
    "https://www.pipiads.com/v3/api/search4/tiktok-shop/product",
    "https://www.pipiads.com/v3/api/tiktok-shop/product",
    "https://www.pipiads.com/v3/api/tiktok-shop/product/search",
    "https://www.pipiads.com/v3/api/search4/at/product/search",
    "https://www.pipiads.com/v3/api/search/product/tiktok-shop",
    "https://www.pipiads.com/v3/api/product/search-tiktok-shop",
    "https://www.pipiads.com/v3/api/search4/tt/product/search-tiktok-shop",
    "https://www.pipiads.com/v3/api/search4/at/goods/search-tiktok-shop",
    "https://www.pipiads.com/v3/api/search4/at/shop-product/search",
    "https://www.pipiads.com/v3/api/search4/tt/product/search",
    "https://www.pipiads.com/v3/api/search4/product/tiktok-shop",
    // v2
    "https://www.pipiads.com/v2/api/tiktok-shop/product",
    "https://www.pipiads.com/v2/api/tiktok-shop/product/search",
    "https://www.pipiads.com/v2/api/search/tiktok-shop/product",
    // v1 alternatives
    "https://www.pipiads.com/v1/api/tiktok-shop/product/search",
    "https://www.pipiads.com/v1/api/tiktok-shop/product/list",
    "https://www.pipiads.com/v1/api/search/tiktok-shop/product",
  ];

  console.log("── Testing with video-style body ──");
  for (const url of allEndpoints) {
    await delay(400);
    await tryEndpoint(token, url.replace("https://www.pipiads.com", ""), url, videoStyleBody);
  }

  console.log("\n── Testing with simple body ──");
  for (const url of allEndpoints) {
    await delay(400);
    await tryEndpoint(token, url.replace("https://www.pipiads.com", "") + " (simple)", url, simpleBody);
  }

  console.log("\n── v1 known endpoint with different body formats ──");
  const v1url = "https://www.pipiads.com/v1/api/tiktok-shop/product";
  await tryEndpoint(token, "v1 (video-style body)", v1url, { ...videoStyleBody, keyword: KEYWORD });
  await delay(400);
  await tryEndpoint(token, "v1 (combined body)", v1url, combinedBody);

  console.log("\n=== Done ===");
}

main().catch(console.error);
