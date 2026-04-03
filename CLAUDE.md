@AGENTS.md

## Verification Protocol

Before declaring any task complete, you MUST run verification checks and only report done when all pass:

### Required Checks (run every time)
1. **Type check:** `npx tsc --noEmit --skipLibCheck` — must pass with zero errors
2. **Build:** `npm run build` — must complete successfully

### Additional Checks (when applicable)
3. **Sort verification (if sort-related changes):** `node scripts/verify-sort.mjs` — confirms PiPiAds sort results are correctly ordered
4. **Full QA:** `node scripts/verify.mjs` — runs type-check + lint + build together

### Process
- Run the verification as a sub-agent after making changes
- If ANY check fails, fix the issue and re-run
- Only report completion to the user when all checks pass
- Include the verification results summary in your completion message

### Known PiPiAds API Behaviors
- GMV sort uses raw local currency values (mixed VND, IDR, THB, USD) — display shows gmv_usd but sort is by raw gmv
- PiPiAds website applies default filters (e.g., "7 gün içinde yüksek trafik") that our API calls don't — results will differ from PiPiAds website for this reason
- `ad_cost` field is not returned by the TTS product endpoint
