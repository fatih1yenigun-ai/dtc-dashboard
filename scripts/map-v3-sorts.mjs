/**
 * Map v3 numeric sort values to their meaning by checking if results are sorted.
 * PiPiAds sort options: Son zaman, Ilk zaman, Satislar, GMV, Gosterimler, Reklam harcamasi, Reklamlar, Influencers
 */

const PIPIADS_EMAIL = "burakyolive.06@gmail.com";
const PIPIADS_PASSWORD = "oylesine123";
const KEYWORD = "skincare";
const BASE = "https://www.pipiads.com/v3/api/tiktok-shop/product";

async function login() {
  const res = await fetch("https://www.pipiads.com/v1/api/member/login", {
    method: "PUT",
    headers: { "content-type": "application/json", device_id: "352039877" },
    body: JSON.stringify({ email: PIPIADS_EMAIL, password: PIPIADS_PASSWORD, device_id: 352039877, uuid: "1c16840e-17fd-4dba-ad3a-773f218d131e" }),
  });
  const data = await res.json();
  return data.access_token;
}

function hdrs(token) {
  return {
    accept: "application/json", access_token: token, "content-type": "application/json",
    device_id: "352039877", origin: "https://www.pipiads.com", referer: "https://www.pipiads.com/",
    "user-agent": "Mozilla/5.0", cookie: `uid=${token}`,
  };
}

async function fetchV3(token, sort, sortType = "desc") {
  const params = new URLSearchParams({
    keyword: KEYWORD, sort: String(sort), sort_type: sortType,
    current_page: "1", page_size: "10",
  });
  const res = await fetch(`${BASE}?${params}`, { method: "GET", headers: hdrs(token) });
  return res.json();
}

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log("=== Map v3 Sort Numbers to Meaning ===\n");
  const token = await login();

  for (let sortNum = 1; sortNum <= 8; sortNum++) {
    await delay(500);
    const data = await fetchV3(token, sortNum, "desc");
    const items = data?.result?.data || [];

    console.log(`\n═══ sort=${sortNum} (desc) ═══`);
    items.slice(0, 5).forEach((item, i) => {
      const d = item.found_time ? new Date(item.found_time * 1000).toISOString().split("T")[0] : "?";
      console.log(`  ${i+1}. [${d}] ${(item.title || "").substring(0, 45)}`);
      console.log(`     sales=${item.sales_volume} gmv_usd=${item.gmv_usd} gmv=${item.gmv} views=${item.play_count} videos=${item.video_count} influencers=${item.person_count}`);
    });

    // Check which field is sorted desc
    if (items.length >= 3) {
      const fields = ["found_time", "sales_volume", "gmv_usd", "gmv", "play_count", "video_count", "person_count"];
      for (const f of fields) {
        const vals = items.slice(0, 5).map(i => i[f] || 0);
        let sorted = true;
        for (let i = 1; i < vals.length; i++) {
          if (vals[i] > vals[i-1]) { sorted = false; break; }
        }
        if (sorted && vals[0] > 0) {
          console.log(`  📊 Sorted by: ${f} (desc) → [${vals.join(", ")}]`);
        }
      }
    }
  }

  console.log("\n=== Done ===");
}

main().catch(console.error);
