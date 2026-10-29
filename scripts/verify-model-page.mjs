/**
 * Verification harness for the GitHub Pages export.
 *
 * Serves out/ under the /WWT prefix (exactly how a GitHub project site is
 * served) and drives /WWT/model/ in headless Chromium, failing on any console
 * error, uncaught exception or Next.js error page.
 *
 * Run: node scripts/verify-model-page.mjs
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, resolve } from "node:path";
import { chromium } from "playwright";

const ROOT = resolve(process.cwd(), "out");
const PREFIX = "/WWT";
const PORT = 8099;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

async function resolveFile(urlPath) {
  let p = decodeURIComponent(urlPath.split("?")[0]);
  if (p.startsWith(PREFIX)) p = p.slice(PREFIX.length);
  if (p === "" || p === "/") p = "/index.html";
  let file = join(ROOT, p);
  try {
    const s = await stat(file);
    if (s.isDirectory()) file = join(file, "index.html");
    await stat(file);
    return file;
  } catch {
    return null;
  }
}

const server = createServer(async (req, res) => {
  const file = await resolveFile(req.url ?? "/");
  if (!file) {
    res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
    res.end(await readFile(join(ROOT, "404.html"), "utf8").catch(() => "not found"));
    return;
  }
  const body = await readFile(file);
  res.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" });
  res.end(body);
});

await new Promise((r) => server.listen(PORT, r));

const browser = await chromium.launch();
const page = await browser.newPage();
const problems = [];
page.on("console", (m) => {
  if (m.type() === "error") problems.push(`console.error: ${m.text()}`);
});
page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
page.on("requestfailed", (r) => {
  // Next.js prefetches every nav link; those in-flight RSC fetches are aborted
  // when the page settles, which is not an error.
  const aborted = r.failure()?.errorText === "net::ERR_ABORTED";
  const prefetch = r.headers()["next-router-prefetch"] === "1" || r.url().includes("_rsc=");
  if (aborted && prefetch) return;
  problems.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`);
});

const url = `http://localhost:${PORT}${PREFIX}/model/`;
const resp = await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
const title = await page.title();
const bodyText = await page.textContent("body");
const canvases = await page.locator("canvas").count();
const notLoaded = bodyText?.includes("This page couldn") ?? false;

await page.waitForTimeout(4000);
await page.screenshot({ path: "artifacts/model-page.png", fullPage: false });

console.log(JSON.stringify({ url, status: resp?.status(), title, canvases, errorPage: notLoaded, problems }, null, 2));

await browser.close();
server.close();
process.exit(notLoaded || problems.length > 0 ? 1 : 0);
