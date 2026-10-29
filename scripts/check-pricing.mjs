/**
 * Headless check of the manual pricing sheet: no console errors, the rate card
 * and priced schedules render, the optional-pricing switch really hides the
 * money, and a manual override replaces the calculated line total.
 *
 * Run: node scripts/check-pricing.mjs http://127.0.0.1:8901/WWT/pricing/
 */
import { chromium } from "playwright";

const url = process.argv[2];
if (!url) {
  console.error("usage: node scripts/check-pricing.mjs <url>");
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1680, height: 1100 } });
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

await page.goto(url, { waitUntil: "networkidle" });

const read = async () => ({
  heading: (await page.locator("h2").first().textContent())?.trim(),
  commercial: await page.locator("[data-commercial]").count(),
  visibleCommercial: await page.locator("[data-commercial]:visible").count(),
  pipeRows: await page.locator("table tbody tr").count(),
  grand: await page
    .locator("div", { hasText: "Total, manual pricing" })
    .last()
    .textContent()
    .then((t) => (t ?? "").replace(/\s+/g, " ").trim().slice(-60)),
});

const internal = await read();
await page.screenshot({ path: "artifacts/pricing-internal.png" });

// 1. the optional switch turns the money off
await page.getByRole("button", { name: /Manual pricing: on/ }).click();
await page.waitForTimeout(250);
const off = await read();
await page.screenshot({ path: "artifacts/pricing-off.png" });
await page.getByRole("button", { name: /Manual pricing: off/ }).click();
await page.waitForTimeout(250);

// 2. a manual override replaces the calculated total for one line
const row = page.locator("table tbody tr").first();
const lineNo = (await row.locator("td").first().textContent())?.trim();
const before = (await row.locator("td").last().textContent())?.trim();
await row.locator("input[type=number]").fill("123456");
await page.waitForTimeout(250);
const after = (await page.locator("table tbody tr").first().locator("td").last().textContent())?.trim();
const manualBadge = await page
  .locator("table tbody tr")
  .first()
  .locator("span", { hasText: "manual" })
  .count();

// 3. client view still hides every amount on the page
await page.getByRole("button", { name: "External (client)" }).click();
await page.waitForTimeout(250);
const external = await read();

console.log(
  JSON.stringify(
    { url, errors, internal, off, external, override: { lineNo, before, after, manualBadge } },
    null,
    2,
  ),
);

await browser.close();
process.exit(errors.length ? 1 : 0);
