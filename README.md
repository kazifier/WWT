# B047 — Waste Water Treatment System engineering dossier

Web dossier for the **500 m³/h Waste Water Treatment System** on the EPCC of the 70,000 BPD Diwanya
Refinery Expansion Project, prepared for **RAMSIS Engineering (Bahrain)** against:

| Document | Rev | Used for |
| --- | --- | --- |
| `2024B047-MR-0022` RFQ for WWT System | B | Scope, inlet characterisation, outlet limits, technical requirements |
| `B047-ABG-99-ME-BOD-0001` Mechanical Design Basis, Static | 1 | ASME VIII Div.1 / API 650 basis, shell thickness rule, supports |
| `B047-ABG-99-ME-BOD-0002` Mechanical Design Basis, Rotating | 0 | API 610/675/673/661/671/611/612, motor margins, NPSH rule |
| `B047-ABG-03-PR-LAY-0001` HAC Layout | 4 | Zone 0/1/2 boundaries (Note 17 governs the WWT areas) |
| `2024B047-ABG-DIW` Vendors List | R1 | Governing / non-governing status, ASME U-stamp rule |

## What the site contains

| Route | Content |
| --- | --- |
| `/` | Project overview, four discharge options, headline findings |
| `/basis` | Site data, code basis, inlet/outlet battery limits, HAC, 8 clarifications |
| `/calculations` | 18 calculation sheets with formula, substitution, result and pass/fail check |
| `/equipment` | Full equipment register — duty, material, code, zone, Ex rating, power, lead time |
| `/make-buy` | RAMSIS capability assessment and item-by-item make/buy decision with reasoning |
| `/mto` | Plate and section take-off, weld length, manhours, workshop cost build-up |
| `/procurement` | Governing vendors plus recommendations for every category the AVL omits |
| `/estimate` | Capex by line item, opex by driver, 20-year life-cycle cost |
| `/model` | Parametric 3D plant model with hazardous-area overlay |
| `/assistant` | Gemini assistant grounded in the dossier |
| `/documents` | Firebase-backed document vault and review comment trail |

All engineering numbers are computed in `src/lib/calc/` from the process assumptions. Nothing on the
equipment, MTO or estimate pages is typed in by hand, so changing a process input propagates through
the register, the take-off and the cost.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (server build, used by Freebuff Sites)
npx tsc --noEmit # type check
```

## Two deployments from one codebase

| Target | Build | Notes |
| --- | --- | --- |
| Freebuff Sites | `npm run build` | Server build packaged for Workers via OpenNext; `/api/ai/chat` stays dynamic. |
| GitHub Pages | `npm run build:pages` | Static export with `basePath` `/WWT` and `trailingSlash`, copied to the repository root by `scripts/publish-pages.mjs`. |

The GitHub Pages build needs one extra file that the script writes for you: `.nojekyll`. Without it
GitHub runs Jekyll, which drops every `_`-prefixed directory — including `_next/` — and the site loads
with no CSS or JavaScript. Pages source is **main / (root)**.

3D views are wrapped in `CanvasBoundary`, so a browser without WebGL shows a notice in the drawing area
instead of failing the whole page. Two checks are available:

```bash
node scripts/verify-model-page.mjs   # serves out/ under /WWT and drives /model in headless Chromium
node scripts/live-check.mjs          # same check against the two deployed URLs
```

## Configure Gemini

The assistant calls the Gemini REST API from a server route (`/api/ai/chat`), so the key never reaches
the browser.

1. Create an API key in Google AI Studio.
2. Set it as a **server-side** secret named `GEMINI_API_KEY` (no `NEXT_PUBLIC_` prefix).
3. Optionally set `GEMINI_MODEL` (default `gemini-2.5-flash`).
4. Restart the app.

Without the key the `/assistant` page shows a setup card and the rest of the site works normally.

## Configure Firebase

`src/lib/firebase.ts` uses the Firebase **web** SDK. The web config is public by design — access is
controlled by the rules in `firestore.rules` and `storage.rules`.

1. Create a Firebase project and add a Web app.
2. Enable **Firestore** and **Storage**.
3. Copy the SDK config into the environment (see `.env.example`):
   `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`,
   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`,
   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`.
4. Deploy the rules:
   ```bash
   firebase deploy --only firestore:rules,storage
   ```
5. Enable an auth provider (the rules require a signed-in user for all reads and writes).

### Collections

| Path | Purpose |
| --- | --- |
| `b047_documents` | File metadata, append-only for audit |
| `b047_comments` | Review comment trail |
| `b047_scenarios` | Saved option / override scenarios |

Files land in Storage at `projects/B047/<category>/<timestamp>-<name>`.

Without Firebase the document page falls back to browser storage so the UI stays usable — that
fallback is per-browser and is **not** a shared project record.

## Estimate basis

AACE Class 4, ±25 %, USD 4Q-2026. Every factor is a named constant in `src/lib/calc/cost.ts`
(labour rates, plate rates, freight, engineering, contingency, power price, membrane life, discount
rate). Challenge the constants, not the total.

## Notes on the source documents

- The vendor list PDF flattened from a multi-column table, so vendor-to-item attribution is marked
  `high` or `inferred` confidence in `src/data/vendors.ts`. Re-verify inferred rows against the native
  spreadsheet before issuing a purchase order.
- Eight contradictions were found between the issued documents (minimum ambient temperature, seismic
  basis, chloride/sulphate limits, missing silica data, the 132/133 kW motor threshold, and others).
  They are listed on `/basis` as CL-001 to CL-008.
