/**
 * QA Verification Script
 * Runs type-check, lint, and build to validate the project.
 *
 * Usage: node scripts/verify.mjs
 */

import { execSync } from "child_process";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const checks = [
  { name: "TypeScript type-check", cmd: "npx tsc --noEmit --skipLibCheck" },
  { name: "ESLint", cmd: "npx eslint src/ --quiet --max-warnings 0" },
  { name: "Next.js build", cmd: "npm run build" },
];

let passed = 0;
let failed = 0;
const results = [];

for (const check of checks) {
  process.stdout.write(`\n⏳ ${check.name}...`);
  try {
    execSync(check.cmd, { cwd: ROOT, stdio: "pipe", timeout: 120_000 });
    console.log(` ✅ PASS`);
    results.push({ name: check.name, status: "PASS" });
    passed++;
  } catch (err) {
    console.log(` ❌ FAIL`);
    const output = err.stdout?.toString() || err.stderr?.toString() || "";
    if (output) {
      // Show last 20 lines of error output
      const lines = output.trim().split("\n");
      console.log(lines.slice(-20).map((l) => `    ${l}`).join("\n"));
    }
    results.push({ name: check.name, status: "FAIL", output: output.slice(-500) });
    failed++;
  }
}

console.log("\n════════════════════════════════════════");
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
results.forEach((r) => console.log(`  ${r.status === "PASS" ? "✅" : "❌"} ${r.name}`));
console.log("════════════════════════════════════════\n");

process.exit(failed > 0 ? 1 : 0);
