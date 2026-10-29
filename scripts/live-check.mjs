import { chromium } from "playwright";
const urls = [
  "https://site-b16180c53c55411c85bc6dfbf781064e.freebuff.page/model",
  "https://kazifier.github.io/WWT/model/",
];
const browser = await chromium.launch();
for (const url of urls) {
  const page = await browser.newPage();
  const problems = [];
  page.on("console", (m) => m.type() === "error" && problems.push(`console: ${m.text()}`));
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  let status = null;
  try {
    const r = await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
    status = r?.status();
    await page.waitForTimeout(4000);
  } catch (e) {
    problems.push(`goto: ${e.message}`);
  }
  const text = (await page.textContent("body").catch(() => "")) ?? "";
  const canvases = await page.locator("canvas").count();
  const heading = await page.locator("h1, h2, h3").first().textContent().catch(() => null);
  console.log(JSON.stringify({ url, status, canvases, heading, errorPage: text.includes("This page couldn"), problems }, null, 2));
  await page.screenshot({ path: `artifacts/live-${url.includes("freebuff") ? "sites" : "githubpages"}.png` }).catch(() => {});
  await page.close();
}
await browser.close();
