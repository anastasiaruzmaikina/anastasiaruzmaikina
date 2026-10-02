# LabelCheck

Standalone AI-assisted alcohol-label comparison. Enter application values, upload label images, inspect comparisons, and record an agent's decision. Batch mode accepts up to 300 images with per-file application data. No COLA integration or AI-issued approval.

## Setup and run

Requires Node.js 22.13+ and pnpm 11.25+. No API keys or database.

```bash
corepack prepare pnpm@11.25.0 --activate
pnpm install --frozen-lockfile
node scripts/copy-ocr-assets.mjs
pnpm dev
```

Open the URL printed by the dev server. All OCR model/worker assets are served from `/ocr` on the application origin. Tesseract's optional fundraising postinstall script is intentionally unapproved and unnecessary.

```bash
node --test tests/verify.test.mjs
pnpm exec tsc --noEmit
pnpm build
pnpm start
```

React 19 + TypeScript + Vinext/Vite; deployment targets Cloudflare Workers. For other hosting, adapt the deployment configuration. The built app also runs using the included local Worker preview (`pnpm start`).

## Try it

1. Click **Matching text**, then **Verify label**. Text checks match; physical typography always requires human review.
2. Try **Wrong ABV** (40%/80 proof versus 45%) and **Warning error** (altered wording and title-case heading).
3. Use **Batch review**, import application JSON, upload the matching filenames, and **Verify queue**.
4. Review individual items, record decisions and notes, then export CSV before closing.

Each uploaded image is a separate review item with a snapshot of the current application. Select an item to edit its expected values. Multiple uploads are supported in either mode. Front/back panels are not grouped automatically: supply a combined image containing all mandatory text for a complete comparison.

### Batch manifest

Download the example in the app. Exact filename matching, no duplicate filenames; up to 300 rows and 1 MB.

```json
[
  {
    "filename": "old-tom-match.png",
    "brand": "OLD TOM DISTILLERY",
    "type": "Kentucky Straight Bourbon Whiskey",
    "abv": "45",
    "net": "750 mL",
    "producer": "Bottled by Old Tom Distillery, Louisville, KY",
    "origin": "",
    "beverage": "spirits",
    "imported": false,
    "abvRequired": true
  }
]
```

Application fields are strings. `imported` and `abvRequired` are booleans; beverage is `spirits`, `wine` or `beer`. Unmatched images retain their current application. Importing a manifest recomputes comparisons for matching existing images and clears any prior decision.

## Approach and code organization

- `app/page.tsx`: accessible labeled inputs, upload/drop zone, sample buttons, per-file queue, comparison results, manual decisions and CSV export.
- `app/globals.css`: responsive review workspace with navy/teal branding, large primary controls and explicit text statuses.
- `lib/ocr.ts`: Tesseract.js 6 neural LSTM OCR in a browser Web Worker, same-origin English model and WASM. Sparse-text segmentation, white background, 1600px longest-edge limit, 90-degree rotation. No third-party AI endpoints or CDN requests.
- `lib/verify.mjs`: deterministic checks independently testable from OCR. Match/mismatch/review/not-required statuses. Missing or ambiguous text needs review, rather than claiming it is absent from the artwork.
- `scripts/copy-ocr-assets.mjs`: reproducible same-origin asset preparation from pinned dependencies.
- `scripts/create-samples.py`: precise fictional test labels; optional regeneration requires Python/Pillow. Fixtures are not approved artwork.
- `tests/verify.test.mjs`: brand, ABV, proof, warning, units, missing text, imports and CSV injection regression tests.
- `tests/ocr-benchmark.json`: measured sample OCR timing and resulting checks.

## Verification policy

Brand comparisons ignore case, whitespace and curly quotes, but preserve meaningful punctuation. The brand must appear as a standalone line or contiguous group of lines; a bottler mention alone cannot verify it. Class/type and producer/address use conservative normalized text matching. Unlocated text needs review.

ABV requires an alcohol-content marker, compares numerically, and flags conflicting recognized ABVs. Recognized proof must equal twice the expected ABV; proof alone is insufficient. Net contents convert mL, cL, L and U.S. fluid ounces. These comparisons do not implement legal ABV tolerances or approved container sizes.

Warning wording, capitalization and punctuation are exact; only whitespace/line wrapping is normalized. Heading capitalization is checked separately. Bold heading, nonbold body, continuous paragraph, separation, contrast and physical type size always require human inspection. The type-size reminder uses TTB's container-volume tiers. Warning applicability generally starts at 0.5% ABV; the entered application ABV controls the prototype's reminder. An agent must resolve conflicting actual label ABV and context.

OCR confidence below 85 adds a readability review. This score is heuristic, not a calibrated probability. Even all matching text never produces automatic approval; reviewers explicitly record the final decision.

## Privacy, batch handling and performance

Images, application values, raw OCR, notes and decisions are held in page memory only. No document uploads, server storage or third-party AI calls. Refresh clears the workspace. Model IndexedDB cache is disabled; normal HTTP caching can retain static assets, never the uploaded images. Hosting may log ordinary page and asset requests. CSV downloads are explicit and formula-leading cells are neutralized.

A single warm worker processes the queue sequentially to limit CPU/memory use on older devices. Pause finishes the current item before stopping. Failures are isolated to each image and can be retried. Recognition has a 20-second timeout after worker initialization. PNG/JPEG/WebP, up to 12 MB each, queue maximum 300.

The five-second target is not guaranteed. The app warms OCR when opened and displays measured per-label processing time, including worker readiness wait if needed, with an explicit above-target indicator. First model download, browser/hardware and image quality affect latency; 300 images do not finish in five seconds.

The three 1200x1050 fixture images read in approximately 0.60-0.71 seconds each in Node.js on the development machine; model initialization was approximately 0.28 seconds. The same English model and sparse-text settings are used in the browser, but these measurements exclude browser/network conditions and do not establish agency-device latency. Their recognized text produced the expected matching/ABV-error/warning-error results. Ten regression tests and TypeScript checking pass; the production build is also verified before deployment.

Browser UI testing was unavailable in the authoring environment. Optional read-only WebMCP `read_label_review` exposes the same selected-item state and validates empty-object input. Registration is feature-detected; runtime WebMCP validation was likewise unavailable and is not claimed.

## Scope and limitations

English printed labels only. No PDF/HEIC, multipage grouping, cloud vision service, perspective correction, glare removal or physical typography certification. Rotate is supported; difficult photos, decorative type and tiny text require inspection or clearer artwork.

Beverage category records context; this prototype is not a complete category-specific rules engine. Wine/beer exceptions are handled by the reviewer's ABV-required setting. Sulfites and other type-specific disclosures, class legality, geographic claims, field placement, container standards and other TTB requirements remain outside scope.

Before production: approved security architecture, retention controls, authentication, representative OCR corpus, accessibility assessment and agency-device latency testing. No FedRAMP claim is made.

## Sources

- [TTB distilled spirits health warning](https://www.ttb.gov/regulated-commodities/beverage-alcohol/distilled-spirits/ds-labeling-home/ds-health-warning)
- [TTB malt beverage health warning](https://www.ttb.gov/regulated-commodities/beverage-alcohol/beer/labeling/malt-beverage-health-warning)
- [27 CFR Part 16](https://www.ecfr.gov/current/title-27/chapter-I/subchapter-A/part-16)
- [Tesseract.js API](https://github.com/naptha/tesseract.js/blob/master/docs/api.md)

Third-party OCR licenses are retained under `public/ocr`; source dependencies also retain their licenses. No TTB endorsement is implied.
