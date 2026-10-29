/**
 * Publishes the static export in out/ to the repository root, because the
 * GitHub Pages source for kazifier/WWT is "main / (root)".
 *
 * Run with: npm run build:pages   (GITHUB_PAGES=1 next build && this script)
 *
 * `.nojekyll` is mandatory: without it GitHub Pages runs Jekyll, which strips
 * every directory whose name starts with an underscore — including _next/ — and
 * the site would load with no CSS or JavaScript.
 */
import { cpSync, existsSync, readdirSync, rmSync, writeFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd());
const outDir = join(root, "out");

if (!existsSync(outDir)) {
  console.error("out/ not found — run `GITHUB_PAGES=1 next build` first.");
  process.exit(1);
}

/** Root entries the export owns; the rest of the repo (src, package.json…) stays. */
const OWNED = [
  "_next",
  "_not-found",
  "assistant",
  "basis",
  "calculations",
  "documents",
  "equipment",
  "estimate",
  "make-buy",
  "model",
  "mto",
  "procurement",
  "index.html",
  "index.txt",
  "404.html",
  "_not-found.html",
  "_not-found.txt",
  "assistant.html",
  "assistant.txt",
  "basis.html",
  "basis.txt",
  "calculations.html",
  "calculations.txt",
  "documents.html",
  "documents.txt",
  "equipment.html",
  "equipment.txt",
  "estimate.html",
  "estimate.txt",
  "make-buy.html",
  "make-buy.txt",
  "model.html",
  "model.txt",
  "mto.html",
  "mto.txt",
  "procurement.html",
  "procurement.txt",
  "__next.__PAGE__.txt",
  "__next._full.txt",
  "__next._tree.txt",
];

for (const entry of OWNED) {
  const target = join(root, entry);
  if (existsSync(target)) rmSync(target, { recursive: true, force: true });
}

let copied = 0;
for (const entry of readdirSync(outDir)) {
  const from = join(outDir, entry);
  const to = join(root, entry);
  cpSync(from, to, { recursive: true });
  copied += statSync(from).isDirectory() ? 1 : 1;
}

writeFileSync(join(root, ".nojekyll"), "");
console.log(`Published ${copied} entries from out/ to the repository root (.nojekyll written).`);
