# About Us and Contact Us Pages

## Problem

The theme has no About Us page and only a bare-bones Contact page
(`templates/page.contact.json`: a `main-page` title/body block plus the stock
`contact-form` section, no hero, no store info). The brand — an Ayurvedic
skincare line (cream/burgundy/blush palette, "rooted in Ayurveda" brand-story
copy already in the theme) — needs both pages built out, taking structural
inspiration from Caudalie's "Our Commitments" page
(https://en.caudalie.com/about-caudalie/our-commitments-old): a hero, a
philosophy/intro block, stat callouts, alternating image+text story blocks,
a grid of commitment pillars, a values section, and a closing CTA.

This is a structure/layout reference only — not this brand's copy, imagery,
or subject matter (sustainability/tree-planting). Cranbi's own voice and an
ingredient/craft-led angle are used instead, with placeholder images and
illustrative (not real) figures, addresses, and contact details throughout.

## Non-goals

- No real photography — every image slot uses Shopify's built-in
  `placeholder_svg_tag` mechanism already used elsewhere in this theme
  (`brand-story.liquid`, `image-with-text.liquid`, etc.), not new binary assets.
- No fabricated specifics presented as real: no named founder quote, no real
  certifications/awards, no real store address/phone/hours. Content is
  clearly generic/illustrative placeholder copy in the brand's voice.
- No changes to the actual Shopify Page records (title/handle/template
  assignment) — that's an Admin-side action for the merchant. This spec only
  covers the theme template/section code; a `page.about.json` template
  becomes usable once a Page is created in Admin with template suffix `about`.
- No map embed or third-party map placeholder — store info is a text-based
  block only.

## Design

### New sections

**`sections/impact-stats.liquid`** — a row of big-number stat callouts,
following the existing custom-section convention (inline `<style>` block, no
separate CSS asset, no locale translation keys — matching `brand-story.liquid`
and `benefits-strip.liquid`, not Dawn's built-in sections). Schema: heading,
background/text color settings, up to 4 blocks each with `number` (text) and
`label` (text). Responsive grid: 2 columns mobile, `blocks.size` columns
desktop (same pattern as `benefits-strip.liquid`).

**`sections/commitment-pillars.liquid`** — "Our Commitments" grid of cards,
each with an image (placeholder via `placeholder_svg_tag`), heading, and short
richtext body. Same inline-style convention. 2-column grid on desktop, single
column mobile, up to 4 blocks. Visually distinct from `benefits-strip` (which
is a compact icon+label row) — these are larger image-led cards, closer to
`brand-story.liquid`'s column treatment but with a card background/border so
the section doesn't read as a duplicate of Our Values further down the page.

### `templates/page.about.json` (new)

Section order (all sections reused except the two new ones above):

1. `image-banner` — full-bleed hero, overlay heading + one-line mission
   statement, no button. Hero carries the page's visual title; no separate
   plain-text `main-page` title block is included on this page.
2. `rich-text` — "Our Story" heading + 2–3 sentence philosophy paragraph.
3. `impact-stats` (new) — 4 illustrative stats, e.g. "15+ Years of Tradition",
   "100% Cruelty-Free", "30+ Farming Partners", "0 Synthetic Fragrances".
4. `image-with-text` — "Our Ingredients": image + sourcing/ingredient
   philosophy copy. `layout: image_first` (image left).
5. `image-with-text` — "Our Craft": image + small-batch/handcrafted process
   copy. `layout: text_first` (image right), so the two alternate.
6. `commitment-pillars` (new) — 4 cards: Ethically-Sourced Ingredients,
   Cruelty-Free Always, Sustainable Packaging, Community & Craft.
7. `brand-story` — reused as "Our Values", 3 columns (e.g. Purity, Tradition,
   Sustainability) with new copy.
8. `rich-text` — centered closing brand-voice statement, unattributed (not a
   named founder).
9. `image-banner` — closing CTA banner, "Discover the Collection" button
   linking to `/collections/all`.

### `templates/page.contact.json` (edit)

Current: `main` (`main-page`) + `form` (`contact-form`). New composition:

1. `image-banner` — shorter hero, "Get In Touch" + one-line subtext. Replaces
   `main-page` as the page's visual title, so the `main` section is removed
   from this template (avoids a redundant plain-text "Contact" H1 stacked
   above the new hero).
2. `benefits-strip` — repurposed as a store-info row (not its usual
   shipping/product badges use elsewhere): 4 blocks — Email, Phone, Visit Us,
   Hours — each with a small inline SVG icon (mail/phone/pin/clock, via the
   section's existing `custom_svg` block setting) and placeholder illustrative
   values (no real address/phone/email).
3. `contact-form` — unchanged, existing section, heading set to "Send Us a
   Message".

### Content/copy approach

All headings and body copy are written fresh in the brand's established voice
(Ayurveda, ritual, ingredients — consistent with the existing `brand-story`
preset copy like "ROOTED IN AYURVEDA"), sized appropriately for placeholder
content the merchant will refine later. Numbers, contact details, and any
named figures are explicitly illustrative, not sourced from a real business.

## Testing

Manual verification only (Liquid theme, no test suite for section markup):
render both pages via Shopify CLI theme dev/preview, confirm all 11 sections
(9 About + 2 Contact custom/reused) render with placeholder imagery and no
Liquid errors, and check both pages responsively (mobile/desktop) for the new
sections' grid layouts.
