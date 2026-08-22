# Cart, Product Cards, and Wishlist Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a correctly spaced responsive cart with a solid-maroon ₹1,999 free-delivery progress bar, one shared product-card presentation across collections and recommendations, and an accessible device-local wishlist.

**Architecture:** Keep Shopify's cart response as the only cart-total source and refine its existing section re-render. Keep `snippets/card-product.liquid` as the shared product-card markup, move card fundamentals into the globally reused card stylesheet, and narrow collection CSS to grid concerns. Replace the wishlist drawer's cart-class inheritance and inline generated styles with dedicated markup/CSS and a small localStorage controller that synchronizes dynamically inserted cards.

**Tech Stack:** Shopify Liquid, Dawn custom elements and cart sections API, CSS, browser JavaScript, Node.js built-in test runner, Shopify CLI Theme Check.

**Spec:** `docs/superpowers/specs/2026-08-22-cart-product-cards-wishlist-design.md`

## Global Constraints

- Wishlist persistence stays on the customer's current browser/device through `localStorage`; do not add account sync or an external app.
- Free delivery is unlocked at exactly `199900` paise (₹1,999), with progress clamped from 0 to 100.
- Cart totals returned by Shopify remain the only source of truth; do not calculate an optimistic replacement total in JavaScript.
- Use solid Cranbi maroon `#660033`, deep maroon `#430022`, warm ivory `#FBFAF7`, warm rule `#E8DED4`, ink `#3D3935`, and muted copy `#7C736C`; do not use gradients for cart progress or checkout.
- Keep Cormorant Garamond for display text and Manrope/theme body variables for interface text.
- Preserve unrelated uncommitted work. For overlapping dirty files, inspect the diff first and stage only the task's hunks with `git add -p`.
- Do not add a JavaScript framework, external UI dependency, or wishlist app.
- Validate approximately 390px, 430px, 768px, 1024px, and 1440px widths without page-level horizontal overflow.
- Push only scoped changed theme files to live theme `147126517930` on store `6imbm9-et.myshopify.com`.

---

### Task 1: Cart Progress and Checkout Footer

**Files:**
- Modify: `tests/theme-regressions.test.mjs`
- Modify: `snippets/cart-drawer.liquid`
- Modify: `assets/component-cart-drawer.css`

**Interfaces:**
- Consumes: Dawn's existing `cart.total_price`, `CartDrawerItems`, section re-render, and cart loading classes.
- Produces: `.cart-drawer__shipping-progress` with `role="progressbar"`, `--cart-shipping-progress: <0..100>%`, `.cart-drawer__shipping-note`, and solid-maroon cart UI tokens consumed by browser validation.

- [ ] **Step 1: Add failing cart contract tests**

Append tests that assert the exact threshold, clamping, semantic progress state,
solid fill, loading affordance, and footer spacing:

```js
test('cart free-delivery progress is clamped against exactly ₹1,999', () => {
  const markup = read('snippets/cart-drawer.liquid');
  assert.match(markup, /assign free_delivery_threshold = 199900/);
  assert.match(markup, /if free_delivery_progress > 100[\s\S]*assign free_delivery_progress = 100/);
  assert.match(markup, /if free_delivery_progress < 0[\s\S]*assign free_delivery_progress = 0/);
  assert.match(markup, /role="progressbar"/);
  assert.match(markup, /aria-valuenow="\{\{ free_delivery_progress \}\}"/);
  assert.match(markup, /--cart-shipping-progress: \{\{ free_delivery_progress \}\}%/);
  assert.match(markup, /Free delivery unlocked/);
});

test('cart progress and checkout use solid Cranbi maroon with balanced spacing', () => {
  const styles = read('assets/component-cart-drawer.css');
  assert.match(styles, /--cart-plum:\s*#660033/);
  assert.match(styles, /\.cart-drawer__shipping-progress > span\s*\{[^}]*background:\s*var\(--cart-plum\);/s);
  assert.doesNotMatch(styles, /\.cart-drawer__shipping-progress > span\s*\{[^}]*linear-gradient/s);
  assert.match(styles, /\.cart-drawer \.cart__ctas\s*\{[^}]*margin-top:\s*1\.6rem;/s);
  assert.match(styles, /\.cart-drawer \.drawer__footer\s*\{[^}]*padding-bottom:\s*max\(2\.4rem, env\(safe-area-inset-bottom\)\);/s);
  assert.match(styles, /\.cart-drawer \.cart__checkout-button\s*\{[^}]*background:\s*var\(--cart-plum\);/s);
});

test('cart exposes a visible update state while Shopify refreshes quantities', () => {
  const styles = read('assets/component-cart-drawer.css');
  assert.match(styles, /cart-drawer-items\.is-loading/);
  assert.match(styles, /cart-drawer-items\.is-loading quantity-input/);
  assert.match(styles, /pointer-events:\s*none/);
});
```

- [ ] **Step 2: Run the focused tests and verify failure**

Run:

```bash
node --test --test-name-pattern='cart free-delivery|cart progress and checkout|cart exposes' tests/theme-regressions.test.mjs
```

Expected: FAIL on the lower clamp, solid fill/no-gradient, 1.6rem CTA gap, safe-area footer padding, and loading-state selectors.

- [ ] **Step 3: Refine the Liquid progress contract**

In `snippets/cart-drawer.liquid`, keep integer paise calculations and render this state shape:

```liquid
{%- liquid
  assign free_delivery_threshold = 199900
  assign free_delivery_progress = cart.total_price | times: 100 | divided_by: free_delivery_threshold
  if free_delivery_progress > 100
    assign free_delivery_progress = 100
  endif
  if free_delivery_progress < 0
    assign free_delivery_progress = 0
  endif
  assign free_delivery_remaining = free_delivery_threshold | minus: cart.total_price
  if free_delivery_remaining < 0
    assign free_delivery_remaining = 0
  endif
-%}
```

Keep the existing panel content but ensure the progress element is:

```liquid
<div
  class="cart-drawer__shipping-progress"
  role="progressbar"
  aria-label="Free delivery progress"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuenow="{{ free_delivery_progress }}"
  style="--cart-shipping-progress: {{ free_delivery_progress }}%;"
>
  <span aria-hidden="true"></span>
</div>
```

Below threshold, output `Add {{ free_delivery_remaining | money_without_currency }} more to unlock free delivery.` using the existing store copy convention. At/above threshold output `Free delivery unlocked.`

- [ ] **Step 4: Consolidate cart presentation into the final scoped overrides**

In `assets/component-cart-drawer.css`, remove superseded duplicate shipping/footer rules and make the final declarations equivalent to:

```css
.cart-drawer {
  --cart-plum: #660033;
  --cart-plum-deep: #430022;
  --cart-ivory: #fbfaf7;
  --cart-rule: #e8ded4;
  --cart-ink: #3d3935;
  --cart-muted: #7c736c;
}

.cart-drawer__shipping {
  margin: 1.8rem 2.8rem 0;
  padding: 1.8rem 2rem;
  background: var(--cart-ivory);
  border: 0.1rem solid var(--cart-rule);
  border-left: 0.3rem solid var(--cart-plum);
  border-radius: 0.8rem;
}

.cart-drawer__shipping-progress {
  height: 0.6rem;
  overflow: hidden;
  border-radius: 999px;
  background: var(--cart-rule);
}

.cart-drawer__shipping-progress > span {
  display: block;
  width: var(--cart-shipping-progress, 0%);
  height: 100%;
  border-radius: inherit;
  background: var(--cart-plum);
  transition: width 240ms ease;
}

.cart-drawer .drawer__footer {
  padding: 2rem 2.8rem max(2.4rem, env(safe-area-inset-bottom));
}

.cart-drawer .cart__ctas {
  width: 100%;
  margin-top: 1.6rem;
}

.cart-drawer .cart__checkout-button {
  min-height: 5.4rem;
  border-radius: 0.9rem;
  background: var(--cart-plum);
  box-shadow: 0 1rem 2.4rem rgba(102, 0, 51, 0.14);
}

.cart-drawer .cart__checkout-button::before,
.cart-drawer .cart__checkout-button::after {
  content: none;
}

cart-drawer-items.is-loading quantity-input,
cart-drawer-items.is-loading .cart-item__remove {
  pointer-events: none;
  opacity: 0.55;
}
```

At `max-width: 749px`, use 1.6rem side padding for panel/footer, `width: 100vw; max-width: 100vw` for the drawer, and preserve safe-area padding. Add a reduced-motion rule that disables the progress transition.

- [ ] **Step 5: Run focused and full tests**

Run:

```bash
node --test --test-name-pattern='cart' tests/theme-regressions.test.mjs
node --test tests/theme-regressions.test.mjs
```

Expected: all cart-focused tests PASS, then the complete regression file PASS.

- [ ] **Step 6: Commit only Task 1 hunks**

```bash
git diff -- snippets/cart-drawer.liquid assets/component-cart-drawer.css tests/theme-regressions.test.mjs
git add -p tests/theme-regressions.test.mjs snippets/cart-drawer.liquid assets/component-cart-drawer.css
git diff --cached --check
git commit -m "fix: refine cart delivery progress and footer"
```

### Task 2: Shared Collection and Recommendation Product Card

**Files:**
- Modify: `tests/theme-regressions.test.mjs`
- Modify: `snippets/card-product.liquid`
- Modify: `assets/component-card.css`
- Modify: `sections/main-collection-product-grid.liquid`
- Verify: `sections/related-products.liquid`

**Interfaces:**
- Consumes: `card_product`, `media_aspect_ratio`, `show_secondary_image`, `show_vendor`, `show_rating`, `lazy_load`, `skip_styles`, `quick_add`, `section_id`, and existing price snippet inputs.
- Produces: `.product-card-wrapper`, `.card__wishlist-toggle[data-product-handle]`, `.card__badge--percentage`, and the same inner visual contract in collection and recommendation contexts.

- [ ] **Step 1: Add failing shared-card tests**

```js
test('shared product cards expose one accessible wishlist control', () => {
  const card = read('snippets/card-product.liquid');
  assert.match(card, /class="wishlist-btn card__wishlist-toggle"/);
  assert.match(card, /aria-pressed="false"/);
  assert.match(card, /data-wishlist-add-label=/);
  assert.match(card, /data-wishlist-remove-label=/);
  assert.equal((card.match(/class="wishlist-btn card__wishlist-toggle"/g) || []).length, 1);
});

test('shared card stylesheet owns wishlist and percentage badge placement', () => {
  const styles = read('assets/component-card.css');
  assert.match(styles, /\.product-card-wrapper \.card__wishlist-toggle\s*\{[^}]*position:\s*absolute;[^}]*min-width:\s*4\.4rem;[^}]*min-height:\s*4\.4rem;/s);
  assert.match(styles, /\.product-card-wrapper \.card__badge--percentage\s*\{[^}]*left:\s*1\.6rem;[^}]*bottom:\s*1\.6rem;/s);
  assert.match(styles, /\.product-card-wrapper \.card__wishlist-toggle\[aria-pressed='true'\]/);
});

test('collection stylesheet leaves card fundamentals to the shared component', () => {
  const collection = read('sections/main-collection-product-grid.liquid');
  assert.doesNotMatch(collection, /product-card-wrapper--collection \.card__wishlist-toggle/);
  assert.doesNotMatch(collection, /product-card-wrapper--collection \.card__badge/);
});
```

- [ ] **Step 2: Run focused tests and verify failure**

```bash
node --test --test-name-pattern='shared product cards|shared card stylesheet|collection stylesheet leaves' tests/theme-regressions.test.mjs
```

Expected: FAIL because wishlist/badge fundamentals still live in collection-only CSS and the button lacks synchronized ARIA label data.

- [ ] **Step 3: Make card markup context-independent**

In `snippets/card-product.liquid`, keep a single heart button inside the media container:

```liquid
<button
  type="button"
  class="wishlist-btn card__wishlist-toggle"
  data-product-handle="{{ card_product.handle | escape }}"
  data-wishlist-add-label="Add {{ card_product.title | escape }} to wishlist"
  data-wishlist-remove-label="Remove {{ card_product.title | escape }} from wishlist"
  aria-label="Add {{ card_product.title | escape }} to wishlist"
  aria-pressed="false"
>
  <span class="visually-hidden wishlist-btn__state">Add to wishlist</span>
  <svg class="icon-heart-solid hidden" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
  <svg class="icon-heart-empty" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
</button>
```

Give the percentage badge the explicit class `card__badge--percentage`, keep it once inside `.card__inner`, and remove/hide the duplicate outer sale badge for products already displaying a percentage.

- [ ] **Step 4: Move shared visuals into `component-card.css`**

Add scoped rules for all `.product-card-wrapper` instances:

```css
.product-card-wrapper .card__wishlist-toggle {
  position: absolute;
  z-index: 3;
  top: 1.6rem;
  right: 1.6rem;
  display: grid;
  place-items: center;
  min-width: 4.4rem;
  min-height: 4.4rem;
  padding: 0;
  border: 0.1rem solid rgba(102, 0, 51, 0.14);
  border-radius: 50%;
  background: rgba(251, 250, 247, 0.92);
  color: #660033;
  cursor: pointer;
}

.product-card-wrapper .card__wishlist-toggle[aria-pressed='true'] {
  color: #fff;
  background: #660033;
}

.product-card-wrapper .card__badge--percentage {
  position: absolute;
  z-index: 2;
  left: 1.6rem;
  bottom: 1.6rem;
  margin: 0;
  background: #660033;
}
```

Define stable title and price spacing using existing card classes so collection and related cards render identically inside their respective grid widths. Use `:focus-visible` and a reduced-motion media query.

- [ ] **Step 5: Narrow collection-only CSS**

Remove collection rules for wishlist position/state, percentage badge position, image-to-title fundamentals, and price typography that now belong to `component-card.css`. Retain only collection page shell, filter/sort, grid column/gap, pagination, and any explicit `card_layout` hook needed for collection grid sizing.

- [ ] **Step 6: Run focused and full tests**

```bash
node --test --test-name-pattern='product card|shared card|collection card|related' tests/theme-regressions.test.mjs
node --test tests/theme-regressions.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit Task 2**

```bash
git diff -- snippets/card-product.liquid assets/component-card.css sections/main-collection-product-grid.liquid sections/related-products.liquid tests/theme-regressions.test.mjs
git add -p tests/theme-regressions.test.mjs
git add snippets/card-product.liquid assets/component-card.css sections/main-collection-product-grid.liquid
git diff --cached --check
git commit -m "refactor: unify storefront product cards"
```

### Task 3: Device-Local Wishlist Controller and Dedicated Drawer

**Files:**
- Create: `assets/component-wishlist-drawer.css`
- Modify: `layout/theme.liquid`
- Modify: `assets/wishlist.js`
- Modify: `snippets/wishlist-drawer.liquid`
- Modify: `tests/theme-regressions.test.mjs`

**Interfaces:**
- Consumes: `.wishlist-btn[data-product-handle]`, product JSON at `/products/<handle>.js`, `window.wishlistStrings`, and localStorage key `shopify_wishlist`.
- Produces: `window.wishlistManager.openDrawer(trigger?)`, `closeDrawer()`, `toggleItem(handle)`, `syncButtons(root?)`, `.wishlist-drawer.is-active`, and populated `.wishlist-drawer__items` rows cloned from `#WishlistDrawer-ItemTemplate`.

- [ ] **Step 1: Add failing wishlist contract tests**

```js
test('wishlist drawer uses dedicated opaque responsive structure', () => {
  const markup = read('snippets/wishlist-drawer.liquid');
  const styles = read('assets/component-wishlist-drawer.css');
  assert.match(markup, /class="wishlist-drawer"/);
  assert.match(markup, /id="WishlistDrawer-ItemTemplate"/);
  assert.doesNotMatch(markup, /style="/);
  assert.doesNotMatch(markup, /onclick=/);
  assert.match(styles, /\.wishlist-drawer__panel\s*\{[^}]*background:\s*#fbfaf7;[^}]*overflow-x:\s*hidden;/s);
  assert.match(styles, /@media screen and \(max-width: 749px\)[\s\S]*width:\s*100vw;/s);
});

test('wishlist controller normalizes storage and synchronizes dynamic cards', () => {
  const source = read('assets/wishlist.js');
  assert.match(source, /normalizeItems\(value\)/);
  assert.match(source, /new Set\(/);
  assert.match(source, /MutationObserver/);
  assert.match(source, /syncButtons\(root = document\)/);
  assert.match(source, /setAttribute\('aria-pressed'/);
  assert.doesNotMatch(source, /\.style\.display/);
  assert.doesNotMatch(source, /onmouseover=/);
});

test('wishlist drawer supports focus restoration and Escape', () => {
  const source = read('assets/wishlist.js');
  assert.match(source, /this\.lastTrigger/);
  assert.match(source, /event\.key === 'Escape'/);
  assert.match(source, /this\.lastTrigger\?\.focus\(\)/);
});
```

- [ ] **Step 2: Run focused tests and verify failure**

```bash
node --test --test-name-pattern='wishlist' tests/theme-regressions.test.mjs
```

Expected: FAIL because the current drawer uses cart classes, inline styles/handlers, and no mutation synchronization or focus restoration.

- [ ] **Step 3: Add the dedicated wishlist stylesheet once**

In `layout/theme.liquid`, immediately after the existing globally loaded drawer/card assets, add:

```liquid
{{ 'component-wishlist-drawer.css' | asset_url | stylesheet_tag }}
```

Create `assets/component-wishlist-drawer.css` with an overlay, fixed right panel capped near 48rem, opaque ivory background, grid rows `auto minmax(0, 1fr)`, internal vertical scrolling, zero horizontal overflow, dedicated close positioning, item rows, empty/loading/error states, 44px controls, mobile `width: 100vw`, safe-area padding, focus-visible rings, and reduced-motion handling. Do not reuse `.drawer__close` positioning.

- [ ] **Step 4: Replace wishlist drawer markup with semantic dedicated classes**

Use this structure in `snippets/wishlist-drawer.liquid`:

```liquid
<div id="WishlistDrawer" class="wishlist-drawer" aria-hidden="true">
  <button id="WishlistDrawer-Overlay" class="wishlist-drawer__overlay" type="button" aria-label="Close wishlist"></button>
  <section class="wishlist-drawer__panel" role="dialog" aria-modal="true" aria-labelledby="WishlistDrawer-Title" tabindex="-1">
    <header class="wishlist-drawer__header">
      <h2 id="WishlistDrawer-Title" class="wishlist-drawer__title">Your Wishlist</h2>
      <span class="wishlist-drawer__count" aria-live="polite"></span>
      <button class="wishlist-drawer__close" type="button" data-wishlist-close aria-label="Close wishlist">
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 3l14 14M17 3L3 17" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
    </header>
    <div id="WishlistDrawer-Status" class="wishlist-drawer__status" role="status" aria-live="polite"></div>
    <div id="WishlistDrawer-Empty" class="wishlist-drawer__empty" hidden>
      <svg class="wishlist-drawer__empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      <p class="wishlist-drawer__empty-text">Your Wishlist is Empty</p>
      <button class="button" type="button" data-wishlist-close>Continue shopping</button>
    </div>
    <div id="WishlistDrawer-Items" class="wishlist-drawer__items"></div>
  </section>
</div>

<template id="WishlistDrawer-ItemTemplate">
  <article class="wishlist-item">
    <a class="wishlist-item__media"><img class="wishlist-item__image" width="96" height="96" loading="lazy"></a>
    <div class="wishlist-item__details">
      <a class="wishlist-item__title"></a>
      <p class="wishlist-item__price"></p>
    </div>
    <button class="wishlist-item__remove" type="button" aria-label="Remove from wishlist">
      <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 3l14 14M17 3L3 17" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
    </button>
  </article>
</template>
```

Retain escaped theme-editor strings in `window.wishlistStrings`, but remove all inline `style` and `onclick` attributes.

- [ ] **Step 5: Rewrite the wishlist controller around explicit state methods**

Implement these exact state and synchronization methods in `assets/wishlist.js`:

```js
normalizeItems(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item) => typeof item === 'string' && item.trim()))];
}

getItems() {
  try {
    return this.normalizeItems(JSON.parse(localStorage.getItem(WISHLIST_LOCAL_STORAGE_KEY) || '[]'));
  } catch (error) {
    console.warn('Unable to read wishlist storage.', error);
    return [];
  }
}

setItems(items) {
  this.items = this.normalizeItems(items);
  try {
    localStorage.setItem(WISHLIST_LOCAL_STORAGE_KEY, JSON.stringify(this.items));
  } catch (error) {
    console.warn('Unable to save wishlist storage.', error);
  }
  this.syncButtons();
  this.updateHeaderBadge();
  if (this.drawer?.classList.contains('is-active')) this.renderDrawerContents();
}

toggleItem(handle) {
  if (!handle) return;
  const nextItems = this.items.includes(handle)
    ? this.items.filter((item) => item !== handle)
    : [...this.items, handle];
  this.setItems(nextItems);
}

syncButtons(root = document) {
  const buttons = [];
  if (root.matches?.('.wishlist-btn')) buttons.push(root);
  root.querySelectorAll?.('.wishlist-btn').forEach((button) => buttons.push(button));
  buttons.forEach((button) => {
    const saved = this.items.includes(button.dataset.productHandle);
    button.classList.toggle('in-wishlist', saved);
    button.setAttribute('aria-pressed', String(saved));
    button.setAttribute('aria-label', saved ? button.dataset.wishlistRemoveLabel : button.dataset.wishlistAddLabel);
    button.querySelector('.icon-heart-empty')?.classList.toggle('hidden', saved);
    button.querySelector('.icon-heart-solid')?.classList.toggle('hidden', !saved);
    const state = button.querySelector('.wishlist-btn__state');
    if (state) state.textContent = saved ? 'Remove from wishlist' : 'Add to wishlist';
  });
}

observeCards() {
  this.observer = new MutationObserver((records) => {
    records.forEach((record) => record.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) this.syncButtons(node);
    }));
  });
  this.observer.observe(document.body, { childList: true, subtree: true });
}

openDrawer(trigger = document.activeElement) {
  if (!this.drawer) return;
  this.lastTrigger = trigger instanceof HTMLElement ? trigger : null;
  this.renderDrawerContents();
  this.drawer.classList.add('is-active');
  this.drawer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('overflow-hidden');
  this.panel?.focus();
}

closeDrawer() {
  if (!this.drawer) return;
  this.drawer.classList.remove('is-active');
  this.drawer.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('overflow-hidden');
  this.lastTrigger?.focus();
}

handleKeydown(event) {
  if (!this.drawer?.classList.contains('is-active')) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    this.closeDrawer();
    return;
  }
  if (event.key !== 'Tab') return;
  const focusable = [...this.panel.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')];
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}
```

Implement `renderDrawerContents()` by setting the status to the escaped loading string, fetching every `/products/${encodeURIComponent(handle)}.js`, filtering failed responses, cloning `#WishlistDrawer-ItemTemplate` once per valid product, and assigning title/price with `textContent`, links with `.href`, and image URL/alt with `.src`/`.alt`. Set each remove button's `data-product-handle`, show the empty state when no valid products remain, and show the escaped failure string in the status on an exception. Never interpolate product data into an HTML string. Overlay, close, continue-shopping, remove, and header triggers use delegated `addEventListener` handlers. Keep `window.wishlistManager = new Wishlist()` for existing header integration, but replace inline header invocation with a `data-wishlist-open` hook if present.

- [ ] **Step 6: Run focused and full tests**

```bash
node --test --test-name-pattern='wishlist' tests/theme-regressions.test.mjs
node --test tests/theme-regressions.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit Task 3**

```bash
git diff -- layout/theme.liquid assets/wishlist.js assets/component-wishlist-drawer.css snippets/wishlist-drawer.liquid tests/theme-regressions.test.mjs
git add -p tests/theme-regressions.test.mjs layout/theme.liquid
git add assets/wishlist.js assets/component-wishlist-drawer.css snippets/wishlist-drawer.liquid
git diff --cached --check
git commit -m "fix: rebuild responsive device wishlist"
```

### Task 4: Integrated Responsive Verification and Scoped Deployment

**Files:**
- Verify: all files changed in Tasks 1–3
- Modify only if a regression is found: the owning file from Tasks 1–3

**Interfaces:**
- Consumes: completed cart, card, and wishlist contracts.
- Produces: verified local theme, scoped live deployment, remote/local parity evidence, and a live smoke-test result.

- [ ] **Step 1: Run static verification**

```bash
node --test tests/theme-regressions.test.mjs
shopify theme check --path . --fail-level error --no-color > /tmp/cranbi-cart-card-wishlist-theme-check.txt
tail -n 40 /tmp/cranbi-cart-card-wishlist-theme-check.txt
git diff --check
```

Expected: all Node tests PASS, Theme Check exits 0, and `git diff --check` prints nothing.

- [ ] **Step 2: Preview and test cart behavior at desktop and mobile widths**

Use the signed-in in-app browser against the development preview or live URL. At 1440×900 and 390×844:

1. Open cart with a known quantity.
2. Record total, remaining delivery amount, `aria-valuenow`, and fill width.
3. Increase quantity and wait for Shopify's section response.
4. Confirm total, remaining amount, and progress all refresh together.
5. Test an exact/above-threshold cart if available and confirm 100% plus “Free delivery unlocked.”
6. Confirm the quantity control shows an update state, items own vertical scrolling, checkout stays visible, and the page/drawer have no horizontal overflow.
7. Measure footer spacing: tax note to button approximately 16px; button bottom to safe footer edge 20–24px.

- [ ] **Step 3: Test shared cards and wishlist at all target widths**

At 390px, 430px, 768px, 1024px, and 1440px:

1. Open a collection and a product's “You may also like” section.
2. Confirm both use the same heart circle, lower-left 10% badge inset, title spacing, and price row.
3. Add an item from each context and confirm every matching heart updates immediately.
4. Reload and confirm the wishlist persists on the current device.
5. Open the wishlist drawer; verify opaque background, no 10px offset, no horizontal scroll, and correct loading/empty/populated states.
6. Remove an item, close via overlay/button/Escape, and confirm focus returns to the trigger.
7. Confirm 44px touch targets and visible keyboard focus.

- [ ] **Step 4: Fix only observed regressions and re-run verification**

For each observed failure, first add a focused regression assertion to `tests/theme-regressions.test.mjs`, run it to see FAIL, make the smallest owning-file fix, then rerun the focused test and the full suite. Do not expand scope into unrelated homepage sections.

- [ ] **Step 5: Commit any verification-only corrections**

```bash
git diff --check
git add -p
git commit -m "fix: close responsive storefront regressions"
```

Skip this commit if Step 4 required no code changes.

- [ ] **Step 6: Resolve the exact deployment file list**

```bash
git diff --name-only 922014b..HEAD -- assets layout sections snippets | sort
shopify theme list --store 6imbm9-et.myshopify.com
```

Expected scoped files:

```text
assets/component-card.css
assets/component-cart-drawer.css
assets/component-wishlist-drawer.css
assets/wishlist.js
layout/theme.liquid
sections/main-collection-product-grid.liquid
snippets/card-product.liquid
snippets/cart-drawer.liquid
snippets/wishlist-drawer.liquid
```

If the resolved list contains unrelated files, stop and correct the range/list before deployment.

- [ ] **Step 7: Push only scoped files to the live theme**

Run `shopify theme push` with theme `147126517930`, store `6imbm9-et.myshopify.com`, and one `--only` argument for each resolved scoped file. Do not run a bare theme push.

```bash
shopify theme push \
  --store 6imbm9-et.myshopify.com \
  --theme 147126517930 \
  --path . \
  --only assets/component-card.css \
  --only assets/component-cart-drawer.css \
  --only assets/component-wishlist-drawer.css \
  --only assets/wishlist.js \
  --only layout/theme.liquid \
  --only sections/main-collection-product-grid.liquid \
  --only snippets/card-product.liquid \
  --only snippets/cart-drawer.liquid \
  --only snippets/wishlist-drawer.liquid
```

- [ ] **Step 8: Verify remote parity and live storefront behavior**

```bash
verify_dir=$(mktemp -d /tmp/cranbi-cart-card-wishlist-verify.XXXXXX)
shopify theme pull --store 6imbm9-et.myshopify.com --theme 147126517930 --path "$verify_dir" --nodelete \
  --only assets/component-card.css \
  --only assets/component-cart-drawer.css \
  --only assets/component-wishlist-drawer.css \
  --only assets/wishlist.js \
  --only layout/theme.liquid \
  --only sections/main-collection-product-grid.liquid \
  --only snippets/card-product.liquid \
  --only snippets/cart-drawer.liquid \
  --only snippets/wishlist-drawer.liquid
```

Compare each pulled file with the workspace using `cmp -s`; every comparison must exit 0. Then repeat the desktop/mobile smoke path on `https://my-cranbi-2.myshopify.com/` and capture final screenshots of the cart, collection cards, related cards, and populated wishlist drawer.

- [ ] **Step 9: Record final evidence**

Report test totals, Theme Check status, responsive widths checked, cart progress values observed, wishlist persistence/focus results, live theme ID, and remote parity result. Mention any unrelated dirty files that were intentionally left untouched.
