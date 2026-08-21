# Mobile Responsive Storefront and Concern Imagery

## Problem

The Cranbi Shopify theme has responsive behavior spread across Dawn base styles
and several custom sections. Existing mobile captures show inconsistent
section spacing, clipped/empty content, and layouts that rely on desktop widths.
The homepage's Shop by Concern section also contains nine current collection
blocks, while its image fallback derives filenames from the long block titles.
The repository's existing monochrome editorial images use older, shorter names,
so the current collection set does not reliably resolve the intended imagery.

## Goal

Make the storefront usable and visually coherent at common mobile widths while
preserving the existing Cranbi visual identity, and give every current concern
collection a deliberate black-and-white editorial image that is linked to the
correct collection.

## Non-goals

- Do not replace the existing brand palette, logo, type pairing, or navigation
  information architecture.
- Do not rewrite the Shopify product/catalogue data or collection membership.
- Do not remove or overwrite unrelated uncommitted work already present in the
  checkout.
- Do not add a JavaScript framework or external UI dependency.
- Do not use externally hosted image URLs; concern assets ship with the theme.

## Design direction

The storefront keeps its current Cranbi system: burgundy `#660033`, warm white
`#FFF9F2`, charcoal `#3D3935`, gold-toned product photography, Cormorant
Garamond for display headings, and Manrope for interface copy. The concern row
is the signature element: an editorial, square, high-contrast monochrome crop
with a small white circular arrow and a centered uppercase label. The crop is
allowed to feel close and tactile, matching the existing `concern_*.png` art
direction rather than introducing a generic beauty-stock look.

## Responsive behavior

1. Establish a shared mobile baseline for page width, grid gaps, media sizing,
   text wrapping, and horizontal overflow. Page-level overflow must remain
   hidden or clipped only where an intentional carousel owns the scroll.
2. Keep the mobile header/drawer controls within the viewport, preserve visible
   focus states, and make the mega-menu/drawer content scroll within the screen.
3. Audit the homepage custom sections (hero, collection row, brand story,
   claims, featured products, gift sets, concern row, spotlight, travel minis,
   ingredients, and footer) for fixed widths, oversized headings, and grid
   assumptions. At mobile widths, use readable type, single-column or peek
   carousels where the content benefits from horizontal browsing, and consistent
   section padding.
4. Apply the same safeguards to collection/product templates so product media,
   filters, cards, price text, quantity controls, and add-to-cart actions never
   exceed the viewport.
5. Respect `prefers-reduced-motion` for any responsive or concern-card hover
   treatment.

## Concern asset mapping

The section will use an explicit optional theme-asset filename setting for each
block, with a safe title-derived fallback for theme-editor-created blocks. The
homepage will set the filename explicitly for all nine current collections:

| Collection handle | Theme asset |
| --- | --- |
| `dry-dehydrated-skin` | `concern_dry-and-dehydrated-skin.png` |
| `dull-tired-skin` | `concern_dull-and-tired-skin.png` |
| `dark-spots-uneven-skintone` | `concern_dark-spots-and-uneven-skintone.png` |
| `sensitive-irritated-skin` | `concern_sensitive-and-irritated-skin.png` |
| `damaged-skin-barrier` | `concern_damaged-skin-barrier.png` |
| `weak-damaged-hair` | `concern_weak-and-damaged-hair.png` |
| `frizz-unmanageable-hair` | `concern_frizz-and-unmanageable-hair.png` |
| `oily-dandruff-scalp` | `concern_oily-and-dandruff-prone-scalp.png` |
| `dry-scalp-hairfall` | `concern_dry-scalp-and-hairfall.png` |

Existing monochrome concern assets will be used as visual references and
reused where they are semantically appropriate; new assets will match their
square 900px editorial treatment, with no text, logos, watermark, or color
cast. Image alt text comes from the visible concern title.

## Implementation boundaries

- `sections/shop-by-concern.liquid` owns block-level asset selection, markup,
  responsive card sizing, focus/hover behavior, and reduced motion.
- `templates/index.json` owns the nine collection-to-image assignments.
- `assets/base.css` and the relevant custom section styles own shared mobile
  layout corrections; changes stay scoped to existing selectors and breakpoints.
- New `assets/concern_*.png` files are project-bound raster deliverables.
- Existing changed files are preserved unless a responsive fix necessarily
  overlaps them; overlapping edits will be kept narrow and additive.

## Validation and deployment

Success means:

- Each of the nine concern cards renders an image and points to its intended
  collection URL.
- Fresh screenshots at approximately 390px, 430px, 768px, and 1440px show no
  accidental page-level horizontal overflow or clipped primary actions.
- Theme validation reports no Liquid/schema errors, and the existing automated
  regression/gifting tests continue to pass.
- The Shopify live theme receives only the scoped changed files, and a direct
  theme pull/diff confirms the deployed files match the local versions.

