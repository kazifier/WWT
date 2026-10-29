/**
 * GitHub Pages build.
 *
 * `output: "export"` cannot contain a dynamic route handler, and /api/ai/chat is
 * exactly that: the Gemini proxy needs a server and a secret, so it cannot exist
 * on static hosting. For this build only, the API directory is moved out of the
 * app tree (Next never sees it), the static export is produced, the directory is
 * restored, and the result is published to the repository root.
 *
 * The Freebuff Sites deployment is unaffected — it keeps the server route.
 *
 * Run: npm run build:pages
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd());
const apiDir = join(root, "src", "app", "api");
const parkedDir = join(root, ".pages-build", "api");
const outDir = join(root, "out");

mkdirSync(join(root, ".pages-build"), { recursive: true });
if (existsSync(parkedDir)) rmSync(parkedDir, { recursive: true, force: true });

let parked = false;
function park() {
  if (!existsSync(apiDir)) return;
  renameSync(apiDir, parkedDir);
  parked = true;
}
function restore() {
  if (!parked) return;
  renameSync(parkedDir, apiDir);
  parked = false;
}

try {
  rmSync(outDir, { recursive: true, force: true });
  // Next's dev type cache still references the parked route, so it has to go too.
  rmSync(join(root, ".next"), { recursive: true, force: true });
  park();
  console.log("Building static export (server routes parked)…");
  execFileSync("npx", ["next", "build"], {
    stdio: "inherit",
    env: { ...process.env, GITHUB_PAGES: "1" },
  });
} finally {
  restore();
}

if (!existsSync(join(outDir, "index.html"))) {
  console.error("Build finished without out/index.html — nothing to publish.");
  process.exit(1);
}

execFileSync("node", ["scripts/publish-pages.mjs"], { stdio: "inherit" });
