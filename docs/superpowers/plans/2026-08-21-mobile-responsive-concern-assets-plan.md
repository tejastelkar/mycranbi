# Mobile Responsive Storefront and Concern Imagery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Cranbi storefront responsive across mobile and desktop, give all nine homepage concern collections explicit monochrome editorial imagery, and deploy the scoped theme changes to the live Shopify theme.

**Architecture:** Keep the Dawn/Liquid theme structure and existing Cranbi visual system. Use explicit theme asset filenames in the Shop by Concern section, scoped responsive CSS for shared and custom sections, and browser/CLI checks against a Shopify preview before a scoped live-theme push.

**Tech Stack:** Shopify Liquid theme, Dawn CSS/JS conventions, JSON templates, PNG raster assets, Node.js `node:test`, Shopify CLI 4.7.0, and Playwright or curl for storefront verification.

**Spec:** `docs/superpowers/specs/2026-08-21-mobile-responsive-concern-assets-design.md`

## Global Constraints

- Work directly on the existing `main` checkout; do not create a worktree or reset unrelated changes.
- Preserve existing uncommitted files and push only files belonging to this responsive/concern-assets change.
- Keep all nine concern assets local to the theme; do not add remote image URLs.
- Preserve the current Cranbi palette `#660033`, `#FFF9F2`, `#3D3935`, Cormorant Garamond headings, and Manrope interface copy.
- Use explicit filenames for the nine homepage concern blocks and a title-derived fallback for newly created theme-editor blocks.
- Do not claim Theme Check is clean unless the pre-existing baseline errors are resolved; record the before/after counts.

---

### Task 1: Add regression coverage for concern image contracts

**Files:**
- Modify: `tests/theme-regressions.test.mjs`
- Read: `sections/shop-by-concern.liquid`
- Read: `templates/index.json`
- Read: `assets/concern_*.png`

**Interfaces:**
- Consumes: the homepage JSON and Shop by Concern Liquid source.
- Produces: static tests that fail until every concern block has a valid local asset and the section supports explicit asset filenames.

- [ ] **Step 1: Write the failing tests**

Add these tests after the existing homepage assertions:

```js
test('homepage concern blocks map every collection to a local theme asset', () => {
  const homepage = JSON.parse(read('templates/index.json').replace(/^\/\*[\s\S]*?\*\//, ''));
  const concernSection = homepage.sections.shop_by_concern;
  const expected = {
    concern_1: ['dry-dehydrated-skin', 'concern_dry-and-dehydrated-skin.png'],
    concern_2: ['dull-tired-skin', 'concern_dull-and-tired-skin.png'],
    concern_3: ['dark-spots-uneven-skintone', 'concern_dark-spots-and-uneven-skintone.png'],
    concern_4: ['sensitive-irritated-skin', 'concern_sensitive-and-irritated-skin.png'],
    concern_5: ['damaged-skin-barrier', 'concern_damaged-skin-barrier.png'],
    concern_6: ['weak-damaged-hair', 'concern_weak-and-damaged-hair.png'],
    concern_7: ['frizz-unmanageable-hair', 'concern_frizz-and-unmanageable-hair.png'],
    concern_8: ['oily-dandruff-scalp', 'concern_oily-and-dandruff-prone-scalp.png'],
    concern_9: ['dry-scalp-hairfall', 'concern_dry-scalp-and-hairfall.png'],
  };

  for (const [blockId, [collection, asset]] of Object.entries(expected)) {
    assert.equal(concernSection.blocks[blockId].settings.collection, collection);
    assert.equal(concernSection.blocks[blockId].settings.asset_file, asset);
    assert.ok(readFileSync(resolve(root, `assets/${asset}`)).byteLength > 0, `${asset} must exist`);
  }
});

test('Shop by Concern supports explicit theme assets and mobile-safe focus behavior', () => {
  const source = read('sections/shop-by-concern.liquid');

  assert.match(source, /"id":\s*"asset_file"/);
  assert.match(source, /block\.settings\.asset_file/);
  assert.match(source, /asset_file\s*\|\s*asset_url/);
  assert.match(source, /:focus-visible/);
  assert.match(source, /prefers-reduced-motion/);
});
```

- [ ] **Step 2: Run the focused tests and verify the expected failure**

Run: `node --test tests/theme-regressions.test.mjs`

Expected: FAIL because the homepage blocks do not yet have `asset_file` settings and the new filenames are not present.

- [ ] **Step 3: Commit the failing test**

Run: `git add tests/theme-regressions.test.mjs && git commit -m "test: define concern asset contracts"`

---

### Task 2: Implement explicit concern asset mapping and responsive concern cards

**Files:**
- Modify: `sections/shop-by-concern.liquid`
- Modify: `templates/index.json`
- Create: `assets/concern_dry-and-dehydrated-skin.png`
- Create: `assets/concern_dull-and-tired-skin.png`
- Create: `assets/concern_dark-spots-and-uneven-skintone.png`
- Create: `assets/concern_sensitive-and-irritated-skin.png`
- Create: `assets/concern_damaged-skin-barrier.png`
- Create: `assets/concern_weak-and-damaged-hair.png`
- Create: `assets/concern_frizz-and-unmanageable-hair.png`
- Create: `assets/concern_oily-and-dandruff-prone-scalp.png`
- Create: `assets/concern_dry-scalp-and-hairfall.png`

**Interfaces:**
- Consumes: the existing concern block title, optional image picker, collection URL, and the nine generated/local asset files.
- Produces: a concern card that renders a selected Shopify image when present, otherwise an explicit theme asset, otherwise a title-derived fallback; the homepage assigns each collection and asset filename.

- [ ] **Step 1: Generate and inspect the nine monochrome asset candidates**

Use the built-in image generator with the existing `assets/concern_*.png` files as style references. Each prompt must request a square 900px editorial close-up, black-and-white high-contrast photography, no text, no logo, no watermark, and an emotionally neutral beauty-editorial treatment. Generate one candidate per collection, inspect every output, and retain only assets whose subject is clearly tied to its label and whose crop survives a square card.

Use these subjects:

```text
Dry and Dehydrated Skin: close-up of visibly dry cheek and softly textured skin, tactile natural light.
Dull and Tired Skin: close-up of a tired-looking face with gentle hand-to-cheek gesture, soft directional light.
Dark Spots and Uneven Skintone: close-up cheek and temple with natural tonal variation and subtle sun spots, editorial not clinical.
Sensitive and Irritated Skin: close-up of a calm face with a hand resting near the cheek, delicate texture, no graphic redness.
Damaged Skin Barrier: close-up of dry textured cheek with a protective hand gesture, soft shadow and tactile skin detail.
Weak and Damaged Hair: close-up of fragile hair strands and ends against a dark background, visible texture and breakage without gore.
Frizz and Unmanageable Hair: close-up of loose frizz and flyaway hair in side light, high-contrast texture.
Oily and Dandruff-Prone Scalp: close-up of a parted scalp with textured hair and restrained visible flaking, matching the existing dandruff asset.
Dry Scalp and Hairfall: close-up of a sparse hairline and dry scalp texture, tasteful editorial crop.
```

Copy the final selected files into `assets/` using the exact filenames in the table in the spec. Do not overwrite the existing six legacy `concern_*.png` assets.

- [ ] **Step 2: Add the explicit asset filename setting and rendering precedence**

In `sections/shop-by-concern.liquid`, keep the existing image-picker behavior first, then resolve a local asset filename, then render the image with intrinsic `900` dimensions:

```liquid
{%- if block.settings.image != blank -%}
  {{ block.settings.image | image_url: width: 900 | image_tag: loading: 'lazy', class: 'shop-by-concern__image' }}
{%- else -%}
  {%- assign asset_file = block.settings.asset_file -%}
  {%- if asset_file == blank -%}
    {%- assign asset_file = 'concern_' | append: block.settings.title | handleize | append: '.png' -%}
  {%- endif -%}
  <img src="{{ asset_file | asset_url }}" alt="{{ block.settings.title | escape }}" class="shop-by-concern__image" loading="lazy" width="900" height="900">
{%- endif -%}
```

Add a text schema setting with id `asset_file`, label `Theme asset filename (optional)`, and a blank default.

- [ ] **Step 3: Add the nine explicit filenames to the homepage blocks**

Add the `asset_file` setting to `concern_1` through `concern_9` in `templates/index.json`, matching the mapping in the spec, without changing the collection handles or block order.

- [ ] **Step 4: Make concern cards responsive and accessible**

Update the scoped CSS in `sections/shop-by-concern.liquid` so that:

```css
.shop-by-concern__scroller {
  display: flex;
  gap: clamp(1rem, 2vw, 1.8rem);
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.shop-by-concern__item {
  flex: 0 0 min(72vw, 28rem);
  min-width: 0;
  scroll-snap-align: start;
}

@media screen and (min-width: 750px) {
  .shop-by-concern__item { flex-basis: calc(33.333% - 1.2rem); }
}

@media screen and (min-width: 990px) {
  .shop-by-concern__item { flex-basis: calc(20% - 1.45rem); }
}

.shop-by-concern__link:focus-visible {
  outline: 0.2rem solid rgb(var(--color-button));
  outline-offset: 0.5rem;
}

@media (prefers-reduced-motion: reduce) {
  .shop-by-concern__link,
  .shop-by-concern__image,
  .shop-by-concern__arrow { transition: none; }
}
```

Keep the existing editorial square crop and white arrow treatment, but use `object-fit: cover`, `clamp()` for title sizing, and no fixed width that can exceed the viewport.

- [ ] **Step 5: Run the focused tests and verify they pass**

Run: `node --test tests/theme-regressions.test.mjs`

Expected: PASS, including the two new concern asset contract tests.

- [ ] **Step 6: Commit the concern section and assets**

Run: `git add sections/shop-by-concern.liquid templates/index.json assets/concern_*.png && git commit -m "feat: map concern collections to editorial assets"`

---

### Task 3: Add shared mobile layout safeguards and section-specific fixes

**Files:**
- Modify: `assets/base.css`
- Modify: `assets/component-card.css`
- Modify: `assets/component-menu-drawer.css`
- Modify: `assets/component-mega-menu.css`
- Modify: `sections/custom-hero.liquid`
- Modify: `sections/custom-collection-list.liquid`
- Modify: `sections/brand-story.liquid`
- Modify: `sections/claims-badges.liquid`
- Modify: `sections/gift-sets.liquid`
- Modify: `sections/spotlight-carousel.liquid`
- Modify: `sections/travel-minis.liquid`
- Modify: `sections/hero-ingredients.liquid`
- Modify: `sections/main-collection-product-grid.liquid`
- Modify: `sections/main-product.liquid`

**Interfaces:**
- Consumes: existing Dawn selectors and each custom section's current markup.
- Produces: fluid layout behavior at 390px, 430px, tablet, and desktop widths without changing section content or collection/product data.

- [ ] **Step 1: Add failing static assertions for the shared mobile contract**

Extend `tests/theme-regressions.test.mjs` with:

```js
test('shared theme CSS prevents page-level overflow and constrains media', () => {
  const source = read('assets/base.css');
  assert.match(source, /overflow-x:\s*(clip|hidden)/);
  assert.match(source, /img,\s*video,\s*iframe/);
  assert.match(source, /max-width:\s*100%/);
});

test('mobile custom sections use viewport-safe grid or carousel rules', () => {
  const sources = [
    read('sections/custom-hero.liquid'),
    read('sections/custom-collection-list.liquid'),
    read('sections/brand-story.liquid'),
    read('sections/claims-badges.liquid'),
    read('sections/gift-sets.liquid'),
    read('sections/spotlight-carousel.liquid'),
    read('sections/travel-minis.liquid'),
    read('sections/hero-ingredients.liquid'),
  ].join('\n');

  assert.match(sources, /@media screen and \(max-width: 749px\)/);
  assert.match(sources, /min-width:\s*0/);
  assert.match(sources, /max-width:\s*100%/);
});
```

- [ ] **Step 2: Run the new tests and verify the expected failure**

Run: `node --test tests/theme-regressions.test.mjs`

Expected: FAIL until the shared mobile safeguards are added.

- [ ] **Step 3: Add the shared mobile baseline to `assets/base.css`**

Add a scoped, end-of-file baseline that keeps the root and media inside the viewport, reduces page-width padding on small screens, keeps buttons and form controls shrinkable, and respects reduced motion:

```css
html { overflow-x: clip; }

img, video, iframe, svg { max-width: 100%; }

@media screen and (max-width: 749px) {
  .page-width { padding-left: 1.6rem; padding-right: 1.6rem; }
  .page-width--narrow { padding-left: 1.6rem; padding-right: 1.6rem; }
  .grid__item, .card, .card__inner, .card__content { min-width: 0; }
  .button, button, input, select, textarea { max-width: 100%; }
  .rte table { display: block; max-width: 100%; overflow-x: auto; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

Do not override intentional carousel containers; their own `overflow-x: auto` remains the only scroll surface.

- [ ] **Step 4: Tighten custom-section mobile rules**

For each listed custom section, add or adjust its existing `max-width: 749px` rule so text columns become single-column or compact peek cards, image wrappers use fluid widths, and horizontal rows have `min-width: 0`. Remove fixed pixel widths only where they cause overflow. Keep the existing desktop appearance unchanged.

- [ ] **Step 5: Tighten product and collection mobile controls**

In `sections/main-collection-product-grid.liquid` and `sections/main-product.liquid`, ensure the mobile product grid, filter/sort controls, quantity row, and add-to-cart buttons use `width: 100%` only within their mobile wrappers, `min-width: 0`, and wrapping price/title text. Preserve the existing clinical card layout and add-to-cart hooks.

- [ ] **Step 6: Run the focused tests and verify they pass**

Run: `node --test tests/theme-regressions.test.mjs`

Expected: PASS with the shared mobile contract tests included.

- [ ] **Step 7: Commit the responsive layout changes**

Run: `git add assets/base.css assets/component-card.css assets/component-menu-drawer.css assets/component-mega-menu.css sections/custom-hero.liquid sections/custom-collection-list.liquid sections/brand-story.liquid sections/claims-badges.liquid sections/gift-sets.liquid sections/spotlight-carousel.liquid sections/travel-minis.liquid sections/hero-ingredients.liquid sections/main-collection-product-grid.liquid sections/main-product.liquid tests/theme-regressions.test.mjs && git commit -m "fix: harden storefront layouts on mobile"`

---

### Task 4: Run automated validation and preview QA

**Files:**
- Read: all changed theme files
- Create: temporary preview/screenshot files outside the repo as needed

**Interfaces:**
- Consumes: committed theme changes and the Shopify CLI.
- Produces: fresh test results, Theme Check before/after comparison, and mobile/desktop preview evidence.

- [ ] **Step 1: Run all repository tests**

Run: `node --test tests/*.test.mjs`

Expected: all tests pass with zero failures.

- [ ] **Step 2: Run Theme Check and record the scoped result**

Run: `shopify theme check --path . --fail-level error --no-color > /tmp/cranbi-theme-check.txt; status=$?; tail -n 30 /tmp/cranbi-theme-check.txt; exit $status`

Compare the output with the baseline: the known locale completeness and existing Dawn diagnostics may remain, but there must be no new error in a changed file. If a new changed-file error appears, fix it before deployment.

- [ ] **Step 3: Start a Shopify development preview**

Run: `shopify theme dev --store 6imbm9-et.myshopify.com --path . --host 127.0.0.1`

Keep the process running and record the preview URL and preview theme id. Use a fresh browser context or curl without the stale preview cookie.

- [ ] **Step 4: Inspect mobile and desktop pages**

Check the homepage at approximately 390px, 430px, 768px, and 1440px. Confirm the header/drawer, hero, collection row, concern row, product cards, gift section, spotlight, ingredients, and footer remain inside the viewport. Open each concern link and confirm the collection handle matches the block mapping. Check one collection page and one product page for overflowing controls.

- [ ] **Step 5: Capture horizontal-overflow evidence**

For each viewport, evaluate `document.documentElement.scrollWidth <= window.innerWidth` and record the result. Scroll the concern row independently to confirm it is the only intended horizontal surface.

- [ ] **Step 6: Commit any QA-only fixes**

If QA identifies a real defect, add a failing test or explicit reproduction assertion, make the minimal fix, rerun Tasks 1–4, and commit with a focused message. Do not commit screenshots or temporary CLI output to the repository.

---

### Task 5: Deploy the scoped theme changes and verify remote parity

**Files:**
- Deploy: `assets/base.css`
- Deploy: `assets/component-card.css`
- Deploy: `assets/component-menu-drawer.css`
- Deploy: `assets/component-mega-menu.css`
- Deploy: `assets/concern_*.png` (the nine new concern assets only)
- Deploy: `sections/shop-by-concern.liquid`
- Deploy: the custom-section and product/collection files changed in Task 3
- Deploy: `templates/index.json`
- Deploy: `tests/theme-regressions.test.mjs` and docs are not uploaded to Shopify

**Interfaces:**
- Consumes: validated local theme and the live theme id returned by Shopify CLI.
- Produces: a live theme push and a direct pull/diff proof that the deployed scoped files match local files.

- [ ] **Step 1: Identify the live theme id**

Run: `shopify theme list --store 6imbm9-et.myshopify.com`

Record the numeric id marked `[live]` in a shell variable before continuing:

```bash
LIVE_THEME_ID="<numeric live theme id from the command output>"
```

Do not use the development preview id for the live push.

- [ ] **Step 2: Push only the scoped theme files**

Run the equivalent command with the recorded live id:

```bash
shopify theme push \
  --store 6imbm9-et.myshopify.com \
  --theme "$LIVE_THEME_ID" \
  --allow-live \
  --nodelete \
  --only assets/base.css \
  --only assets/component-card.css \
  --only assets/component-menu-drawer.css \
  --only assets/component-mega-menu.css \
  --only sections/shop-by-concern.liquid \
  --only templates/index.json
```

Add one `--only` flag for each custom section file actually changed in Task 3 and one for each of the nine new concern PNGs. Do not use a bare `shopify theme push` because unrelated dirty files must not be uploaded.

- [ ] **Step 3: Pull the deployed files into a temporary directory**

Run:

```bash
verify_dir=$(mktemp -d)
shopify theme pull --store 6imbm9-et.myshopify.com --theme "$LIVE_THEME_ID" --path "$verify_dir" --nodelete \
  --only assets/base.css \
  --only sections/shop-by-concern.liquid \
  --only templates/index.json
```

Compare each pulled file with its local counterpart using `cmp -s`; report every file as `MATCH` or `MISMATCH`. Repeat for the other changed CSS, Liquid, JSON, and PNG files if the CLI returns them separately.

- [ ] **Step 4: Re-check the storefront without a preview cookie**

Fetch the live homepage and verify the concern section contains the deployed asset URLs, then re-run the mobile overflow check in a fresh browser context. Record the final live URL and theme id.

- [ ] **Step 5: Commit the final implementation state if QA produced changes**

Run `git status --short`, verify only intended source/assets/docs are changed, and commit any final QA fix with a focused message. Leave unrelated user-owned files untouched.
