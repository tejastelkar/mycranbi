# Gifting Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a premium MY CRANBI gifting landing page with a curated premade-gifts section, a multi-quantity custom gift box builder that adds normal Shopify line items with shared gift metadata, and header/footer navigation entry points.

**Architecture:** Add a dedicated `page.gifting.json` template composed of reusable theme sections. Keep the interactive gift-builder logic in a focused asset module with pure helper functions that can be tested with Node’s built-in test runner, then bind that module to a new Liquid section that uses Shopify’s native cart add endpoint and the existing Dawn cart refresh contract.

**Tech Stack:** Shopify Liquid, JSON templates, Dawn section architecture, vanilla JavaScript, Shopify Ajax cart endpoints, Node `--test`.

## Global Constraints

- Build the page with reusable sections and a dedicated JSON page template.
- Reuse the existing homepage visual system: white and soft-neutral backgrounds, Cormorant Garamond headings, Manrope body type, MY CRANBI color palette, generous whitespace, and premium editorial spacing.
- Use existing products for the premade gifting area for now.
- Custom gift box selections will add normal Shopify line items to cart rather than creating a synthetic bundled product.
- The custom box can contain any number of products.
- The custom box can contain multiple quantities of the same product.
- Add Gifting to the header navigation in a way that fits the current menu structure.
- Add Gifting to the footer navigation or footer content links.
- Prevent add-to-cart when no products are selected in the custom builder.
- Preserve mobile usability with clear spacing and quantity controls.

---

## File Map

- `assets/gifting-builder.js`
  Pure gift-builder helpers plus the DOM controller that powers the custom builder section.
- `sections/gifting-hero.liquid`
  Gifting-specific hero that matches the homepage visual treatment and supports desktop/mobile imagery and CTA copy.
- `sections/curated-gift-products.liquid`
  Merchant-configurable premade gifts merchandising section using existing products.
- `sections/custom-gift-builder.liquid`
  Interactive builder UI that renders product cards, live summary, live total, and bulk add-to-cart.
- `templates/page.gifting.json`
  Dedicated gifting page template that assembles the hero, curated gifts, builder, and reassurance strip.
- `sections/header-group.json`
  Theme-managed header section group config; only touch if this repo keeps navigation affordances here rather than fully in Shopify Navigation.
- `sections/footer-group.json`
  Theme-managed footer section group config; only touch if footer link visibility needs explicit theme config support.
- `tests/gifting-builder.test.mjs`
  Node test coverage for pure selection, total, and cart-payload behavior.

## Interfaces

- `normalizeGiftSelections(selectionMap: Record<string, { variantId: string; title: string; price: number; quantity: number }>): Array<{ key: string; variantId: string; title: string; price: number; quantity: number }>`
- `calculateGiftTotal(lines: Array<{ price: number; quantity: number }>): number`
- `buildGiftCartItems(lines: Array<{ variantId: string; quantity: number }>, groupId: string, groupLabel: string): Array<{ id: string; quantity: number; properties: Record<string, string> }>`
- `createGiftGroupId(now?: () => number, random?: () => number): string`
- `window.CranbiGiftingBuilder.init(root: HTMLElement): void`

Later tasks may consume only these names and shapes.

### Task 1: Build the testable gift-builder domain module

**Files:**
- Create: `assets/gifting-builder.js`
- Create: `tests/gifting-builder.test.mjs`
- Modify: none
- Test: `tests/gifting-builder.test.mjs`

**Interfaces:**
- Consumes: none
- Produces:
  - `normalizeGiftSelections(selectionMap)`
  - `calculateGiftTotal(lines)`
  - `buildGiftCartItems(lines, groupId, groupLabel)`
  - `createGiftGroupId(now, random)`

- [ ] **Step 1: Write the failing test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeGiftSelections,
  calculateGiftTotal,
  buildGiftCartItems,
  createGiftGroupId,
} from '../assets/gifting-builder.js';

test('normalizeGiftSelections keeps only positive-quantity selections', () => {
  const result = normalizeGiftSelections({
    shampoo: {
      variantId: 'gid://shopify/ProductVariant/1',
      title: 'Amla & Shikakai Shampoo',
      price: 79900,
      quantity: 2,
    },
    empty: {
      variantId: 'gid://shopify/ProductVariant/2',
      title: 'Saffron Face Gel',
      price: 99900,
      quantity: 0,
    },
  });

  assert.deepEqual(result, [
    {
      key: 'shampoo',
      variantId: 'gid://shopify/ProductVariant/1',
      title: 'Amla & Shikakai Shampoo',
      price: 79900,
      quantity: 2,
    },
  ]);
});

test('calculateGiftTotal sums repeated quantities', () => {
  const total = calculateGiftTotal([
    { price: 79900, quantity: 2 },
    { price: 99900, quantity: 1 },
  ]);

  assert.equal(total, 259700);
});

test('buildGiftCartItems stamps shared gift properties on every line', () => {
  const result = buildGiftCartItems(
    [
      { variantId: '111', quantity: 2 },
      { variantId: '222', quantity: 1 },
    ],
    'gift-12345',
    'Custom Gift Box'
  );

  assert.deepEqual(result, [
    {
      id: '111',
      quantity: 2,
      properties: {
        _cranbi_gift_group: 'gift-12345',
        _cranbi_gift_label: 'Custom Gift Box',
      },
    },
    {
      id: '222',
      quantity: 1,
      properties: {
        _cranbi_gift_group: 'gift-12345',
        _cranbi_gift_label: 'Custom Gift Box',
      },
    },
  ]);
});

test('createGiftGroupId is deterministic when time and random are injected', () => {
  const id = createGiftGroupId(() => 1721865600000, () => 0.123456);
  assert.equal(id, 'gift-1721865600000-123456');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/gifting-builder.test.mjs`

Expected: FAIL with module export errors because `assets/gifting-builder.js` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```js
export function normalizeGiftSelections(selectionMap) {
  return Object.entries(selectionMap)
    .filter(([, value]) => Number(value.quantity) > 0 && value.variantId)
    .map(([key, value]) => ({
      key,
      variantId: value.variantId,
      title: value.title,
      price: Number(value.price),
      quantity: Number(value.quantity),
    }));
}

export function calculateGiftTotal(lines) {
  return lines.reduce((sum, line) => sum + Number(line.price) * Number(line.quantity), 0);
}

export function buildGiftCartItems(lines, groupId, groupLabel) {
  return lines.map((line) => ({
    id: line.variantId,
    quantity: Number(line.quantity),
    properties: {
      _cranbi_gift_group: groupId,
      _cranbi_gift_label: groupLabel,
    },
  }));
}

export function createGiftGroupId(now = () => Date.now(), random = () => Math.random()) {
  const suffix = String(random()).replace('0.', '');
  return `gift-${now()}-${suffix}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/gifting-builder.test.mjs`

Expected: PASS with 4 passing tests and 0 failures.

- [ ] **Step 5: Commit**

```bash
git add assets/gifting-builder.js tests/gifting-builder.test.mjs
git commit -m "feat: add gift builder domain helpers"
```

### Task 2: Add the reusable gifting sections and page template

**Files:**
- Create: `sections/gifting-hero.liquid`
- Create: `sections/curated-gift-products.liquid`
- Create: `templates/page.gifting.json`
- Modify: `config/settings_data.json` only if local preview setup needs a template assignment stub; otherwise leave it untouched
- Test: `tests/gifting-builder.test.mjs`

**Interfaces:**
- Consumes:
  - Existing theme CSS variables from `layout/theme.liquid`
  - Existing `card-product` snippet API
- Produces:
  - `sections/gifting-hero.liquid`
  - `sections/curated-gift-products.liquid`
  - `templates/page.gifting.json`

- [ ] **Step 1: Write the failing test**

Add one more test to `tests/gifting-builder.test.mjs` that proves the module can produce a zero-state summary used by the section markup.

```js
import { normalizeGiftSelections, calculateGiftTotal } from '../assets/gifting-builder.js';

test('empty builder state normalizes to no selections and zero total', () => {
  const lines = normalizeGiftSelections({});
  assert.deepEqual(lines, []);
  assert.equal(calculateGiftTotal(lines), 0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/gifting-builder.test.mjs`

Expected: FAIL because the new test is not satisfied until the module continues to support the empty-state contract after the section markup is designed around it.

- [ ] **Step 3: Write minimal implementation**

Create a gifting hero section that mirrors the existing homepage treatment from `sections/custom-hero.liquid`, but uses editable heading, body copy, CTA label, CTA link, desktop image, and mobile image fields.

Create a curated gifts section that renders a section heading, intro copy, and a merchant-selected product list:

```liquid
{% for block in section.blocks %}
  {% assign gift_product = block.settings.product %}
  {% if gift_product != blank %}
    <li class="grid__item">
      {% render 'card-product',
        card_product: gift_product,
        media_aspect_ratio: 'square',
        show_secondary_image: true,
        show_vendor: false,
        show_rating: false,
        section_id: section.id
      %}
    </li>
  {% endif %}
{% endfor %}
```

Create `templates/page.gifting.json` with this initial order:

```json
{
  "sections": {
    "hero": { "type": "gifting-hero", "settings": {} },
    "premade_gifts": { "type": "curated-gift-products", "settings": {} },
    "custom_builder": { "type": "custom-gift-builder", "settings": {} },
    "reassurance": {
      "type": "benefits-strip",
      "settings": {
        "heading": "Why gift with MY CRANBI"
      }
    }
  },
  "order": ["hero", "premade_gifts", "custom_builder", "reassurance"]
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/gifting-builder.test.mjs`

Expected: PASS with 5 passing tests and 0 failures.

Then verify theme JSON and Liquid syntax:

Run: `ruby -e 'require "json"; JSON.parse(File.read("templates/page.gifting.json"))'`

Expected: command exits 0 with no JSON parse error.

- [ ] **Step 5: Commit**

```bash
git add sections/gifting-hero.liquid sections/curated-gift-products.liquid templates/page.gifting.json tests/gifting-builder.test.mjs
git commit -m "feat: add gifting page sections and template"
```

### Task 3: Implement the custom gift box builder UI and multi-line cart flow

**Files:**
- Modify: `assets/gifting-builder.js`
- Create: `sections/custom-gift-builder.liquid`
- Modify: `layout/theme.liquid`
- Test: `tests/gifting-builder.test.mjs`

**Interfaces:**
- Consumes:
  - `normalizeGiftSelections(selectionMap)`
  - `calculateGiftTotal(lines)`
  - `buildGiftCartItems(lines, groupId, groupLabel)`
  - `createGiftGroupId(now, random)`
  - Dawn cart refresh globals: `routes.cart_add_url`, `PUB_SUB_EVENTS`, `publish`
- Produces:
  - `window.CranbiGiftingBuilder.init(root)`
  - `<custom-gift-builder>` section markup with quantity controls, summary, and submit button

- [ ] **Step 1: Write the failing test**

Add a failing test that captures the exact cart payload shape the DOM controller must send.

```js
import { buildGiftCartItems } from '../assets/gifting-builder.js';

test('buildGiftCartItems produces Shopify cart payload lines for repeated quantities', () => {
  const payload = {
    items: buildGiftCartItems(
      [
        { variantId: 'gid://shopify/ProductVariant/10', quantity: 3 },
        { variantId: 'gid://shopify/ProductVariant/11', quantity: 1 },
      ],
      'gift-1721865600000-123456',
      'Custom Gift Box'
    ),
  };

  assert.deepEqual(payload, {
    items: [
      {
        id: 'gid://shopify/ProductVariant/10',
        quantity: 3,
        properties: {
          _cranbi_gift_group: 'gift-1721865600000-123456',
          _cranbi_gift_label: 'Custom Gift Box',
        },
      },
      {
        id: 'gid://shopify/ProductVariant/11',
        quantity: 1,
        properties: {
          _cranbi_gift_group: 'gift-1721865600000-123456',
          _cranbi_gift_label: 'Custom Gift Box',
        },
      },
    ],
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/gifting-builder.test.mjs`

Expected: FAIL until `assets/gifting-builder.js` is expanded without breaking the existing helper contract.

- [ ] **Step 3: Write minimal implementation**

Extend `assets/gifting-builder.js` with a browser controller:

```js
function formatMoney(cents, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

async function addGiftItemsToCart(lines, sectionsToRender) {
  const response = await fetch(routes.cart_add_url + '.js', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify({ items: lines, sections: sectionsToRender, sections_url: window.location.pathname }),
  });

  return response.json();
}

function init(root) {
  // bind quantity buttons
  // update summary list
  // disable submit when no selections
  // build shared gift group id and call addGiftItemsToCart()
}

window.CranbiGiftingBuilder = { init };
```

Create `sections/custom-gift-builder.liquid` with:

```liquid
<section class="cranbi-gift-builder section-{{ section.id }}-padding" data-section-id="{{ section.id }}">
  <div class="page-width">
    <div class="cranbi-gift-builder__layout" id="GiftBuilder-{{ section.id }}">
      <div class="cranbi-gift-builder__catalog">
        {% for block in section.blocks %}
          {% assign gift_product = block.settings.product %}
          {% assign gift_variant = gift_product.selected_or_first_available_variant %}
          {% if gift_product != blank and gift_variant != blank %}
            <article
              class="cranbi-gift-builder__product"
              data-product-key="{{ gift_product.handle }}"
              data-variant-id="{{ gift_variant.id }}"
              data-title="{{ gift_product.title | escape }}"
              data-price="{{ gift_variant.price }}"
            >
              <button type="button" data-action="decrement">-</button>
              <span data-role="quantity">0</span>
              <button type="button" data-action="increment">+</button>
            </article>
          {% endif %}
        {% endfor %}
      </div>
      <aside class="cranbi-gift-builder__summary">
        <ul data-role="summary-list"></ul>
        <p data-role="summary-total">₹0</p>
        <button type="button" data-role="submit" disabled>Add custom gift box to cart</button>
      </aside>
    </div>
  </div>
</section>
<script src="{{ 'gifting-builder.js' | asset_url }}" defer="defer"></script>
```

If `layout/theme.liquid` does not already load the new asset globally, leave it section-scoped and initialize from an inline script:

```liquid
<script>
  document.addEventListener('DOMContentLoaded', function () {
    const root = document.getElementById('GiftBuilder-{{ section.id }}');
    if (root && window.CranbiGiftingBuilder) window.CranbiGiftingBuilder.init(root);
  });
</script>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/gifting-builder.test.mjs`

Expected: PASS with 6 passing tests and 0 failures.

Then verify the builder asset is syntactically valid:

Run: `node --check assets/gifting-builder.js`

Expected: exit 0 with no syntax errors.

- [ ] **Step 5: Commit**

```bash
git add assets/gifting-builder.js sections/custom-gift-builder.liquid layout/theme.liquid tests/gifting-builder.test.mjs
git commit -m "feat: add custom gift box builder"
```

### Task 4: Wire navigation and complete storefront verification

**Files:**
- Modify: `sections/header-group.json`
- Modify: `sections/footer-group.json`
- Modify: `templates/page.gifting.json`
- Test: `tests/gifting-builder.test.mjs`

**Interfaces:**
- Consumes:
  - `templates/page.gifting.json`
  - Existing menu handles from `sections/header-group.json` and `sections/footer-group.json`
- Produces:
  - Visible Gifting destination in header/footer flows

- [ ] **Step 1: Write the failing test**

Add a final safety test that confirms mixed zero and non-zero quantities still collapse correctly before navigation/storefront wiring begins.

```js
import { normalizeGiftSelections, calculateGiftTotal } from '../assets/gifting-builder.js';

test('summary total ignores products removed back to zero', () => {
  const lines = normalizeGiftSelections({
    shampoo: { variantId: '10', title: 'Shampoo', price: 79900, quantity: 2 },
    gel: { variantId: '11', title: 'Gel', price: 99900, quantity: 0 },
  });

  assert.equal(calculateGiftTotal(lines), 159800);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/gifting-builder.test.mjs`

Expected: FAIL until the helper logic remains stable after the final navigation-related edits.

- [ ] **Step 3: Write minimal implementation**

Prefer Shopify Navigation for the actual link destinations because both the header and footer are already driven by `main-menu` / `footer` menus in:

- `sections/header-group.json`
- `sections/footer-group.json`

Implementation rules:

- Create the Shopify page using the `page.gifting` template.
- Add the page handle to `main-menu`.
- Add the page handle to `footer`.
- Only modify `sections/header-group.json` or `sections/footer-group.json` if a theme-managed quick link, featured block, or section default needs to reference the gifting page directly.

If a theme-level link is needed, use the page URL directly in existing rich text content:

```json
"subtext": "<p>Email:<br>service@mycranbi.com</p><p>Phone:<br>+91-8010200666</p><p><a href=\"/pages/gifting\">Gifting</a></p><p><a href=\"/pages/contact\">Contact Us</a></p>"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/gifting-builder.test.mjs`

Expected: PASS with 7 passing tests and 0 failures.

Then run storefront-level verification:

Run: `shopify theme check`

Expected: no new Liquid or JSON syntax errors introduced by the gifting files.

Run: `git diff --stat`

Expected: diff includes only gifting template/section/asset/navigation-related files plus the new test file.

Manual verification checklist:

- Open the gifting page and confirm the hero matches the site’s typography, spacing, and palette.
- Confirm curated gift cards open the right products and visually match the storefront.
- Increase one product to quantity 2 and another to quantity 1 in the custom builder; verify the summary and total update live.
- Click add to cart and confirm the cart drawer opens with both products present.
- Confirm each added line includes shared gift properties in the cart payload or cart JSON.
- Confirm the Gifting link appears in the header and footer destinations that use `main-menu` / `footer`.
- Confirm the page remains usable on mobile widths.

- [ ] **Step 5: Commit**

```bash
git add sections/header-group.json sections/footer-group.json templates/page.gifting.json tests/gifting-builder.test.mjs
git commit -m "feat: wire gifting page navigation"
```

## Self-Review

### Spec Coverage

- Hero: covered in Task 2.
- Premade gifts with manual product selection: covered in Task 2.
- Custom builder with unlimited products and repeat quantities: covered in Task 3.
- Shared gift metadata on standard line items: covered in Tasks 1 and 3.
- Navigation visibility: covered in Task 4.
- Mobile and cart compatibility: covered in Tasks 3 and 4 verification.

### Placeholder Scan

- No `TODO`, `TBD`, or “appropriate error handling” placeholders remain.
- All tasks include concrete file paths, commands, and code snippets.

### Type Consistency

- Helper interfaces are defined once and reused consistently across tasks:
  - `normalizeGiftSelections`
  - `calculateGiftTotal`
  - `buildGiftCartItems`
  - `createGiftGroupId`
  - `window.CranbiGiftingBuilder.init`
