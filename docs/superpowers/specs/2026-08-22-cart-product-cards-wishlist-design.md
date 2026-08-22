# Cart, Product Card, and Wishlist Responsive Repair

## Problem

The Cranbi storefront currently has three related UI systems that have drifted
apart. The cart drawer's free-delivery presentation and checkout spacing are
visually inconsistent, product cards receive different styling in collection
and recommendation contexts, and the wishlist drawer inherits generic cart
drawer behavior that causes transparency, horizontal offset, and stale button
states on dynamically loaded recommendations.

Live inspection also confirms that cart quantity changes eventually refresh the
Shopify cart and the ₹1,999 calculation correctly, but the response is delayed
while the cart request completes. The progress indicator therefore needs a
clear loading state and a reliable re-render, not a second source of cart truth.

## Goal

Create one coherent, responsive storefront system for product discovery and
purchase intent:

- a correctly spaced cart footer and a solid-maroon free-delivery progress bar
  calculated against ₹1,999;
- one shared product-card presentation for collections and “You may also like”;
- a usable wishlist button on every product card;
- a dedicated, accessible wishlist drawer saved on the customer's current
  device; and
- no accidental horizontal overflow at common mobile, tablet, and desktop
  widths.

## Non-goals

- Do not add account-synced or cross-device wishlist storage.
- Do not install a wishlist app, JavaScript framework, or external UI library.
- Do not change product catalogue data, prices, discount rules, or collection
  membership.
- Do not replace Cranbi's logo, typography, photography, or global navigation.
- Do not overwrite unrelated uncommitted theme work.

## Design system

The repair uses the existing Cranbi identity rather than introducing another
visual language:

- Cranbi maroon: `#660033` for primary actions, progress fill, active hearts,
  and discount badges.
- Deep maroon: `#430022` for hover/pressed states where additional contrast is
  needed.
- Warm ivory: `#FBFAF7` for drawer and card surfaces.
- Warm rule: `#E8DED4` for tracks, borders, and separators.
- Ink: `#3D3935` for display text.
- Muted copy: `#7C736C` for supporting text.
- Cormorant Garamond remains the display face; Manrope remains the interface and
  utility face.

Gradients are removed from the cart progress presentation and checkout action.
The signature treatment is restrained: solid maroon controls on warm ivory,
with consistent rounded geometry and generous but compact spacing.

## Cart drawer

### Free-delivery progress

The existing Shopify cart total remains the only source of truth. Liquid
calculates progress as `cart.total_price / 199900`, expressed as a percentage
and clamped from 0 to 100. The rendered progress bar keeps `role="progressbar"`
and accurate `aria-valuemin`, `aria-valuemax`, and `aria-valuenow` values.

The progress panel uses a solid ivory background, warm border, and solid maroon
fill on a warm neutral track. It displays one of two states:

- Below ₹1,999: “Add Rs. X more to unlock free delivery.”
- At or above ₹1,999: “Free delivery unlocked.”

Quantity changes use Dawn's existing cart update request and section re-render.
While that request is active, affected controls expose a loading/disabled state
so the customer understands that the cart is updating. The implementation must
not optimistically invent a second cart total that can diverge from Shopify.

### Footer spacing and behavior

The footer keeps the estimated total and tax note together, followed by a
consistent 16px gap before the checkout button and 20–24px safe spacing below
the button. The button is full width, at least 52px tall, solid maroon, and free
of decorative pseudo-element frames. Cart items scroll independently while the
footer stays reachable and visually separated from the item list.

On narrow screens the drawer occupies the viewport width, respects safe-area
insets, and never creates horizontal scrolling. Text and totals may wrap without
overlapping the close control or checkout button.

## Shared product card

`snippets/card-product.liquid` remains the single markup source for collection
grids and related products. Context-specific section CSS must not redefine the
card's fundamental image, badge, wishlist, title, or price layout.

Every card follows the “You may also like” visual structure:

- a consistent media area with the existing product image behavior;
- a percentage discount badge anchored 16px from the lower-left of the media;
- a wishlist control anchored at the upper-right;
- product title below the media;
- compare-at and sale prices on a stable price row; and
- no duplicate visible sale badge.

The collection template retains its filter, sort, pagination, and column logic,
but the cards inside that grid use the same shared component styling. Related
products retain their recommendation data source and section heading.

The wishlist control has a visually compact circle and a minimum 44px touch
target. It exposes an accessible label and `aria-pressed` state. Hover, focus,
active, and saved states use the Cranbi maroon system. A saved item uses a filled
heart treatment that does not rely on color alone.

## Wishlist behavior and drawer

Wishlist product handles are persisted in `localStorage` on the customer's
current browser/device. The implementation validates stored data, removes
duplicates, and tolerates corrupt or unavailable storage without breaking the
storefront.

Event delegation continues to support product cards inserted after initial page
load. A synchronization mechanism updates all matching heart controls whenever
wishlist state changes and when dynamically rendered recommendation cards enter
the DOM.

The wishlist drawer receives dedicated markup classes and styles instead of
depending on cart-specific positioning. It has:

- an opaque ivory panel;
- a stable header, title, count, and close control;
- an independently scrollable item region;
- coherent loading, empty, populated, and error states;
- product image, title, price, remove action, and product link per row;
- no inline style strings generated by JavaScript; and
- no horizontal scroll or focus-induced 10px offset.

Opening the drawer traps focus within it, Escape closes it, and closing restores
focus to the trigger. The overlay, close button, and “Continue shopping” action
all close it predictably. On mobile the panel uses the full viewport width; on
larger screens it is capped at a comfortable drawer width.

## Responsive behavior

The components are validated at approximately 390px, 430px, 768px, 1024px, and
1440px:

- drawers fit the viewport and own their internal scrolling;
- primary actions remain visible and at least 44px tall;
- product cards use the existing grid column settings but share the same inner
  spacing and badge positions;
- titles and prices wrap without clipping or collision;
- recommendation and collection rows have no accidental horizontal overflow;
- card controls remain usable with touch, keyboard, and pointer input; and
- reduced-motion preferences disable nonessential transitions.

## Implementation boundaries

- `snippets/cart-drawer.liquid` owns free-delivery calculation and semantic
  progress markup.
- `assets/component-cart-drawer.css` owns cart progress, footer, quantity, and
  responsive drawer presentation.
- `snippets/card-product.liquid` owns shared card semantics and wishlist button
  attributes.
- Shared card styles belong in an existing globally loaded card stylesheet or a
  new focused asset loaded once; collection-only overrides are removed or
  narrowed to grid layout concerns.
- `assets/wishlist.js` owns device-local state, delegated interaction, dynamic
  synchronization, rendering, and accessibility behavior.
- `snippets/wishlist-drawer.liquid` owns dedicated wishlist drawer markup and
  styles/classes.
- Existing changed files are preserved; overlapping edits remain narrow and are
  reviewed before staging or deployment.

## Testing and validation

Tests are added before implementation for the observable contracts:

- ₹0, partial, exact-threshold, and above-threshold progress values are clamped
  and display the correct message.
- progress fill uses solid maroon rather than a gradient.
- cart checkout pseudo-elements remain disabled and footer spacing stays within
  the agreed range.
- collection and related sections render the same shared card controls.
- every product card includes one accessible wishlist button and one percentage
  badge when discounted.
- wishlist storage handles add, remove, duplicate, corrupt-storage, and dynamic
  card insertion cases.
- drawer close/focus behavior does not introduce horizontal scrolling.

Theme checks and the full regression suite must pass. Browser validation uses a
real cart at multiple totals and visual checks at the target widths. Deployment
pushes only the scoped theme files to the existing live theme, followed by a
remote pull/diff and a live storefront smoke test of cart, quantity, progress,
checkout, collection cards, related cards, and wishlist persistence.
