# Configurable Per-Item Mega Menu

## Problem

The header currently supports exactly one desktop submenu style, chosen globally via
`section.settings.menu_type_desktop` (`dropdown` / `mega` / `drawer`). Every top-level
menu item with children renders the same way. The requirement is to style the
"Shop"-style reference (Caudalie) with two different submenu treatments living side
by side on the same header:

- **Columns**: multi-column list of links, each column with a bold underlined
  header, plus a centered "Discover all products" style button below the columns.
- **Gallery**: a single row of image cards (image + caption, optionally linked),
  plus a centered button below.

Different top-level items (e.g. "Pure Haircare" vs "New") need to use different
styles, configured by the merchant in the theme customizer — not hardcoded, not
tied 1:1 with the global dropdown/mega setting.

## Non-goals

- Replicating the gallery style inside the mobile hamburger drawer. Mobile keeps
  the existing simple nested-accordion menu unchanged.
- Building the actual Shopify navigation menu structure (Online Store → Navigation).
  That's done by the merchant in Admin; this spec only covers the theme code that
  renders whatever menu structure exists.
- Multi-level (3-deep) support for the Gallery style — gallery cards are a flat,
  merchant-configured list of images, independent of the menu's nested links.

## Design

### 1. New repeatable block on the Header section

Add a new block type `mega_menu` to `sections/header.liquid`'s schema (alongside
the existing `@app` block), with settings:

- `menu_handle` (text) — must match the top-level menu item's **title** exactly
  (case-insensitive compare at render time). This is how a block is associated
  with a nav item, since Shopify link lists don't carry custom settings.
- `style` (select: `columns` / `gallery`, default `columns`)
- `button_label` (text, default "Discover all products")
- `button_link` (url)
- Six fixed image slots for Gallery style: `image_1`..`image_6` (image_picker),
  `image_1_caption`..`image_6_caption` (text), `image_1_link`..`image_6_link` (url).
  Info text clarifies these are only used when style = Gallery. Empty image slots
  are skipped at render time.

Max blocks raised as needed (schema `max_blocks` currently 3 for `@app`; will bump
to accommodate a handful of mega_menu blocks, e.g. 10 total).

### 2. Unified inline menu rendering

Replace the current either/or in `sections/header.liquid`:

```
if menu_type_desktop == 'dropdown' -> render 'header-dropdown-menu'
elsif menu_type_desktop != 'drawer' -> render 'header-mega-menu'
```

with a single always-rendered snippet (new file `snippets/header-inline-menu.liquid`,
replacing the two existing snippets) that, per top-level link:

1. If `link.links != blank`:
   - Look up a `mega_menu` block whose `menu_handle` matches `link.title`
     (case-insensitive).
   - If found and `style == columns`: render the existing column layout (reuses
     current `mega-menu__list` / `mega-menu__link--level-2` structure and CSS
     already in `component-mega-menu.css`), then render the block's button
     below the columns.
   - If found and `style == gallery`: render a row of cards from the block's
     configured image slots (skip empty ones), then render the block's button
     below. The link's actual child menu items are not used for rendering in
     this branch (per Non-goals).
   - If no matching block: fall back to today's behavior, driven by
     `section.settings.menu_type_desktop` (`dropdown` renders the simple
     flyout list, anything else renders the plain mega column layout with no
     button) — i.e. visually identical to current behavior for unconfigured
     items.
2. If `link.links == blank`: render a plain link, unchanged.

Both `component-list-menu.css` (dropdown) and `component-mega-menu.css` (mega)
are always loaded, since a single header can now mix both styles.

### 3. Styling

- New CSS added to `assets/component-mega-menu.css`:
  - `.mega-menu__gallery` grid: `display:flex; flex-wrap:wrap; gap:...` row of
    cards, each `<a>` with image, caption below (reusing existing typographic
    tokens — `--font-body-family`, `--color-foreground`).
  - `.mega-menu__cta` wrapper: centered, margin-top, uses existing
    `.button--secondary` class for the anchor so it inherits the theme's real
    button look (color, radius, hover state) with no hardcoded values.
  - Staggered entrance: gallery cards get `transition-delay` based on
    `:nth-child` (small, capped increment) combined with the existing
    `.js .mega-menu__content` opacity/transform fade so the row animates in
    slightly cascaded rather than all at once.
- Dropdown flyout (`component-list-menu.css`) gains the same fade+slide
  transition pattern already used for `.mega-menu__content`, applied to
  `.header__submenu`, so plain dropdowns animate too instead of snapping open.
- No new JS: animation is pure CSS keyed off the native `<details>` `[open]`
  attribute, matching the existing mechanism in `details-disclosure.js` /
  `component-mega-menu.css`.

### 4. Mobile

No change to `snippets/header-drawer.liquid` / the menu-drawer markup. It
already renders a plain nested accordion from the same `section.settings.menu`,
which stays as-is regardless of what `mega_menu` blocks are configured for
desktop.

## Testing / Verification

- `shopify theme dev` / `shopify theme check` to confirm no Liquid/schema errors.
- Configure one `mega_menu` block per style in the theme customizer against a
  test menu (one item with real nested links for Columns, one item for Gallery
  with a few sample images) and visually verify in a real browser at desktop
  width (≥990px): correct style renders per item, button appears, animation
  plays, colors/fonts match the rest of the site.
- Verify an unconfigured menu item (no matching block) still renders exactly as
  it does today.
- Verify mobile width (<990px): hamburger drawer shows the normal nested
  accordion, unaffected by desktop mega_menu configuration.
