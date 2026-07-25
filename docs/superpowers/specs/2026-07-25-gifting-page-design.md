# Gifting Page Design

## Goal

Create a first-class gifting destination inside the MY CRANBI Shopify theme that matches the existing premium visual language, showcases curated existing products as premade gifts, and lets customers build a custom gift box by selecting any number of products with repeat quantities.

## Context

This store is a customized Dawn 15.5.0 theme with a content-first homepage and multiple custom Liquid sections. The gifting page should follow the existing structure of JSON template-driven pages and reusable custom sections rather than introducing a one-off hardcoded page. The cart behavior should stay Shopify-native and reliable.

## Decisions

- Build the page with reusable sections and a dedicated JSON page template.
- Reuse the existing homepage visual system: white and soft-neutral backgrounds, Cormorant Garamond headings, Manrope body type, MY CRANBI color palette, generous whitespace, and premium editorial spacing.
- Use existing products for the premade gifting area for now.
- Custom gift box selections will add normal Shopify line items to cart rather than creating a synthetic bundled product.
- The custom box can contain any number of products.
- The custom box can contain multiple quantities of the same product.

## User Experience

### 1. Hero

The page opens with a gifting-focused hero that feels consistent with the homepage. It should either reuse the current custom hero pattern directly or reuse its visual treatment through a gifting-specific section that supports desktop and mobile imagery, headline copy, supporting copy, and primary CTA.

Suggested content direction:

- Headline focused on gifting rituals, premium self-care, and thoughtful selection.
- Supporting text that frames MY CRANBI gifting as elegant, gift-ready, and customizable.
- CTA to jump into premade gifts or the custom box builder.

### 2. Premade Gifts

This section presents a curated selection of existing products as ready-to-shop gifting picks. Since the store does not yet have a dedicated gifts product set, the merchant should be able to manually choose the featured products in the section settings.

Requirements:

- Show product cards in the existing storefront style.
- Support a section heading, short intro copy, and optional badge or label for gifting.
- Allow the merchant to handpick products in theme editor settings.
- Keep add-to-cart or product detail access aligned with current product card behavior.

This area is not trying to invent a new product model. It is a merchandising surface for products that already exist in Shopify.

### 3. Custom Gift Box Builder

This is the core feature of the page. A customer can assemble a gift box by selecting any number of products from the catalog and increasing quantities on individual items.

Requirements:

- The builder lists store products available for gifting.
- Each product row or card shows image, title, price, and quantity controls.
- Quantity can be increased above one, including repeated units of the same product.
- A selected-items summary updates live as quantities change.
- A running total updates live based on selected quantities.
- One primary action adds all selected products to cart in a single flow.

Cart behavior:

- Each selected product is added as a standard Shopify line item.
- Shared line item properties identify that the products belong to a gift box.
- Shared properties should include at minimum a gift grouping label such as `Custom Gift Box`.
- If appropriate in the implementation, add a generated group identifier so related items can be recognized together in cart displays and order details.

This approach preserves inventory accuracy, native pricing, and checkout compatibility.

### 4. Trust / Service Strip

The page should include a lightweight reassurance area below the builder or near the bottom of the page. This should align with the site’s existing benefits and service language.

Suggested themes:

- Gift-ready experience
- Premium self-care rituals
- Thoughtful curation
- Easy gifting across skincare and haircare

Where possible, this should reuse an existing section pattern or visual treatment already present in the theme.

### 5. Navigation

The gifting page should be discoverable as a main store destination.

Requirements:

- Add Gifting to the header navigation in a way that fits the current menu structure.
- Add Gifting to the footer navigation or footer content links.
- Add links anywhere else in the theme where gifting is an obvious fit without creating noise.

The goal is visibility, not over-linking.

## Information Architecture

Recommended page flow:

1. Hero
2. Premade Gifts
3. Custom Gift Box Builder
4. Service / reassurance strip
5. Footer

This keeps the simpler buying option first, then moves into the more interactive custom experience.

## Technical Design

### Template Strategy

Create a dedicated page template for gifting, likely `templates/page.gifting.json`, so the page can be managed through Shopify’s standard page assignment workflow and edited in the theme editor.

### Section Strategy

Implement this as reusable sections rather than a single monolithic page block.

Recommended sections:

- A gifting hero section, or a gifting-specific reuse of the current hero section approach.
- A curated gifting products section for manual product selection.
- A custom gift box builder section with its own JavaScript and styling.

If an existing section can be reused cleanly, prefer reuse over duplication. If reuse would force awkward settings or brittle logic, create a focused new section.

### Product Data Strategy

The custom builder should use product references configured in the theme editor or another theme-friendly source rather than depending on external runtime infrastructure.

Preferred behavior:

- Merchant can choose which products appear in the custom builder.
- If practical, default to a broad existing set such as all active gift-appropriate products, but editor-controlled selection is safer and more predictable for launch.

### Cart Integration

The add-to-cart action should use Shopify’s standard cart endpoint behavior already compatible with the theme.

Requirements:

- Add multiple selected items in one action.
- Preserve theme drawer/cart refresh behavior.
- Ensure the existing cart UI and Standard Actions integration continue to work.

This means the implementation needs to fit the existing cart JavaScript contract instead of bypassing it with ad hoc behavior.

### Navigation Integration

Theme-level menu links may be controlled through Shopify navigation or through section/group JSON depending on the existing theme structure. The implementation should follow the current pattern used by the header and footer in this repo.

If navigation is fully store-managed through menus, the theme should provide the page and any section affordances needed, while direct menu updates may need to be done through the store admin or Shopify CLI if available in current workflow.

## Content and Styling Rules

- Match the existing MY CRANBI tone and avoid generic gifting copy.
- Keep the page premium, airy, and product-led.
- Stay within current fonts and color palette already established in the theme.
- Preserve mobile usability with clear spacing and quantity controls.
- Avoid introducing a visual style that feels detached from homepage or product pages.

## Error Handling and Edge Cases

- Prevent add-to-cart when no products are selected in the custom builder.
- Handle quantity changes down to zero cleanly by removing the item from the live summary.
- Handle unavailable or missing product data gracefully.
- Avoid broken states if a configured product is unpublished or unavailable.
- Keep the page functional if JavaScript-enhanced interactions fail; where full non-JS parity is impractical, fail gracefully and clearly.

## Testing Strategy

Implementation should cover:

- Section rendering on desktop and mobile layouts.
- Builder quantity behavior, including repeated quantities for one product.
- Live total and summary updates.
- Multi-item add-to-cart behavior.
- Cart drawer or cart page refresh compatibility with the current theme.
- Navigation visibility from header and footer.

Because this is a theme feature, testing should include both code-level verification where practical and storefront interaction checks.

## Out of Scope

- Creating a true bundled Shopify product with dynamic child items.
- App-based bundle logic.
- Checkout customizations beyond standard line item properties.
- New dedicated Shopify products created specifically for premade gift boxes at this stage.

## Recommendation

Proceed with the reusable-sections architecture. It is the best balance of launch speed, theme-editor maintainability, and consistency with the rest of this storefront.
