import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve('.');

function read(relPath) {
  return readFileSync(resolve(root, relPath), 'utf8');
}

test('shared product card snippet does not branch on request.page_type', () => {
  const source = read('snippets/card-product.liquid');
  assert.equal(
    source.includes("request.page_type == 'collection'"),
    false,
    'card-product snippet should receive explicit context instead of inspecting request.page_type'
  );
});

test('collection card styles do not hide regular prices for non-sale products', () => {
  const source = read('sections/main-collection-product-grid.liquid');
  assert.equal(
    source.includes('.price__regular .price-item--regular'),
    false,
    'collection grid should not blanket-hide the regular price node'
  );
});

test('product accordion content mapping does not depend on generated block ids', () => {
  const source = read('sections/main-product.liquid');
  assert.equal(
    source.includes('case block.id'),
    false,
    'accordion content mapping should use explicit block settings, not generated block ids'
  );
});

test('known fallback images include intrinsic dimensions', () => {
  const customHero = read('sections/custom-hero.liquid');
  const giftSets = read('sections/gift-sets.liquid');
  const buyButtons = read('snippets/buy-buttons.liquid');

  assert.match(
    customHero,
    /hero-banner\.png' \| asset_url[^>]+width="[^"]+"[^>]+height="[^"]+"/,
    'custom hero fallback images should include width and height'
  );
  assert.match(
    giftSets,
    /slide-3\.png' \| asset_url[^>]+width="[^"]+"[^>]+height="[^"]+"/,
    'gift sets fallback image should include width and height'
  );
  assert.match(
    buyButtons,
    /gpay_logo\.svg' \| asset_url[^>]+width="[^"]+"[^>]+height="[^"]+"/,
    'checkout trust logos should include width and height'
  );
});

test('footer contact and brand copy are not hardcoded into the section template', () => {
  const source = read('sections/footer.liquid');
  assert.match(
    source,
    /<p class="cranbi-footer__eyebrow">\s*\{\{ section\.settings\.brand_eyebrow \}\}\s*<\/p>/,
    'footer eyebrow should render from section settings'
  );
  assert.match(
    source,
    /<a href="mailto:\{\{ section\.settings\.contact_email \}\}">\{\{ section\.settings\.contact_email \}\}<\/a>/,
    'footer email should render from section settings'
  );
  assert.match(
    source,
    /<a href="tel:\{\{ section\.settings\.contact_phone \| replace: ' ', '' \| replace: '-', '' \}\}">\{\{ section\.settings\.contact_phone \}\}<\/a>/,
    'footer phone should render from section settings'
  );
});

test('spotlight carousel renders a repeated loop pool with two neighbours per side', () => {
  const source = read('sections/spotlight-carousel.liquid');

  assert.match(
    source,
    /for repeat_index in \(1\.\.3\)/,
    'five unique videos should be repeated into a large enough DOM pool for Swiper loop mode'
  );
  assert.match(
    source,
    /spotlight-slide--second-prev/,
    'the second slide on the left should be part of the visible stack'
  );
  assert.match(
    source,
    /spotlight-slide--second-next/,
    'the second slide on the right should be part of the visible stack'
  );
});

test('spotlight carousel uses a deliberate smooth transition', () => {
  const source = read('sections/spotlight-carousel.liquid');

  assert.match(
    source,
    /speed:\s*650/,
    'coverflow transitions should be long enough to feel smooth'
  );
  assert.match(
    source,
    /--swiper-wrapper-transition-timing-function:\s*cubic-bezier/,
    'coverflow transitions should use a deliberate easing curve'
  );
  assert.match(
    source,
    /slideChangeTransitionStart:\s*function/,
    'outer neighbours should be refreshed after Swiper updates slide classes and before motion begins'
  );
  assert.equal(
    source.includes('visibility: hidden'),
    false,
    'distant slides should fade instead of popping via non-animatable visibility'
  );
});

test('homepage editorial slides select Cranbi products', () => {
  const homepage = read('templates/index.json');

  for (const handle of ['saffron-facewash', 'orange-facewash', 'saffron-face-gel', 'ceramide-lotion']) {
    assert.match(
      homepage,
      new RegExp(`"product": "${handle}"`),
      `editorial slider should select ${handle}`
    );
  }
});

test('homepage concern blocks map every collection to a local theme asset', () => {
  const homepage = JSON.parse(read('templates/index.json').replace(/^\/\*[\s\S]*?\*\//, ''));
  const concernSection = homepage.sections.shop_by_concern;
  const expected = {
    concern_1: ['dry-dehydrated-skin', 'concern_dry-and-dehydrated-skin.webp'],
    concern_2: ['dull-tired-skin', 'concern_dull-and-tired-skin.webp'],
    concern_3: ['dark-spots-uneven-skintone', 'concern_dark-spots-and-uneven-skintone.webp'],
    concern_4: ['sensitive-irritated-skin', 'concern_sensitive-and-irritated-skin.webp'],
    concern_5: ['damaged-skin-barrier', 'concern_damaged-skin-barrier.webp'],
    concern_6: ['weak-damaged-hair', 'concern_weak-and-damaged-hair.webp'],
    concern_7: ['frizz-unmanageable-hair', 'concern_frizz-and-unmanageable-hair.webp'],
    concern_8: ['oily-dandruff-scalp', 'concern_oily-and-dandruff-prone-scalp.webp'],
    concern_9: ['dry-scalp-hairfall', 'concern_dry-scalp-and-hairfall.webp'],
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
  assert.match(source, /"id":\s*"asset_file"[\s\S]*?"default":\s*"auto"/);
  assert.match(source, /block\.settings\.asset_file/);
  assert.match(source, /asset_file\s*\|\s*asset_url/);
  assert.match(source, /asset_file\s*!=\s*blank[\s\S]*?elsif block\.settings\.image\s*!=\s*blank/);
  assert.match(source, /:focus-visible/);
  assert.match(source, /prefers-reduced-motion/);
});

test('homepage ingredient blocks map every ingredient to a local theme asset', () => {
  const homepage = JSON.parse(read('templates/index.json').replace(/^\/\*[\s\S]*?\*\//, ''));
  const ingredientSection = homepage.sections.hero_ingredients;
  const expected = {
    ingredient_1: ['Saffron', 'ingredient_saffron.webp'],
    ingredient_2: ['Orange', 'ingredient_orange.webp'],
    ingredient_3: ['Amla', 'ingredient_amla.webp'],
    ingredient_4: ['Shikakai', 'ingredient_shikakai.webp'],
    ingredient_5: ['Wheat', 'ingredient_wheat.webp'],
    ingredient_6: ['Lavender', 'ingredient_lavender.webp'],
    ingredient_7: ['Tulsi', 'ingredient_tulsi.webp'],
    ingredient_8: ['Neem', 'ingredient_neem.webp'],
    ingredient_9: ['Ashwagandha', 'ingredient_ashwagandha.webp'],
  };

  for (const [blockId, [title, asset]] of Object.entries(expected)) {
    assert.equal(ingredientSection.blocks[blockId].settings.title, title);
    assert.equal(ingredientSection.blocks[blockId].settings.asset_file, asset);
    assert.ok(readFileSync(resolve(root, `assets/${asset}`)).byteLength > 0, `${asset} must exist`);
  }
});

test('Hero Ingredients prioritizes explicit theme assets and keeps image-picker fallback', () => {
  const source = read('sections/hero-ingredients.liquid');

  assert.match(source, /"id":\s*"asset_file"/);
  assert.match(source, /"id":\s*"asset_file"[\s\S]*?"default":\s*"auto"/);
  assert.match(source, /asset_file\s*!=\s*blank/);
  assert.match(source, /asset_file\s*\|\s*asset_url/);
  assert.match(source, /block\.settings\.image/);
  assert.match(source, /width="900" height="900"/);
});

test('homepage media assets use compressed WebP files', () => {
  const homepage = JSON.parse(read('templates/index.json').replace(/^\/\*[\s\S]*?\*\//, ''));
  const mediaAssets = [
    ...homepage.sections.shop_by_concern.block_order.map((blockId) => homepage.sections.shop_by_concern.blocks[blockId].settings.asset_file),
    ...homepage.sections.hero_ingredients.block_order.map((blockId) => homepage.sections.hero_ingredients.blocks[blockId].settings.asset_file),
  ];

  assert.equal(mediaAssets.every((asset) => asset.endsWith('.webp')), true);
  for (const asset of mediaAssets) {
    assert.ok(readFileSync(resolve(root, `assets/${asset}`)).byteLength > 0, `${asset} must exist`);
  }
});

test('global layout does not load homepage-only Swiper assets', () => {
  const source = read('layout/theme.liquid');

  assert.equal(source.includes('swiper-bundle.min.js'), false);
  assert.equal(source.includes('swiper-bundle.min.css'), false);
  assert.match(source, /fonts\.googleapis\.com\/css2[^>]+media="print"/);
});

test('spotlight videos are deferred and load their Swiper assets locally', () => {
  const source = read('sections/spotlight-carousel.liquid');

  assert.match(source, /swiper-bundle\.min\.css/);
  assert.match(source, /swiper-bundle\.min\.js/);
  assert.match(source, /preload:\s*'none'/);
});

test('Watch & Shop videos defer loading until they are near the viewport', () => {
  const source = read('sections/watch-shop.liquid');

  assert.match(source, /autoplay:\s*false/);
  assert.match(source, /preload:\s*'none'/);
  assert.match(source, /IntersectionObserver/);
  assert.match(source, /data-src/);
});

test('custom hero chooses one responsive image source per slide', () => {
  const source = read('sections/custom-hero.liquid');

  assert.match(source, /<picture>/);
  assert.match(source, /<source[^>]+media="\(max-width: 989px\)"/);
  assert.match(source, /image_url: width: 1600/);
  assert.match(source, /image_url: width: 900/);
});

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

test('Shop the Look uses the four selected Shopify videos', () => {
  const homepage = JSON.parse(read('templates/index.json').replace(/^\/\*[\s\S]*?\*\//, ''));
  const watchShop = homepage.sections.watch_shop;
  const expectedVideos = [
    'shopify://files/videos/Captions_71E211.mp4',
    'shopify://files/videos/Captions_C1BC16.mp4',
    'shopify://files/videos/Captions_DE26ED.mp4',
    'shopify://files/videos/57556DD0-C849-4DD0-A493-A92D2FE6A1A5.mp4',
  ];

  assert.deepEqual(
    watchShop.block_order.map((blockId) => watchShop.blocks[blockId].settings.video),
    expectedVideos,
    'Shop the Look should render the selected videos in the supplied order'
  );
});

test('travel products use Dawn quick-add hooks and compact left-aligned rows', () => {
  const source = read('sections/travel-minis.liquid');

  assert.match(
    source,
    /class="loading__spinner loading-overlay__spinner hidden"/,
    'quick add must render the spinner hook required by product-form.js'
  );
  assert.match(
    source,
    /\.travel-edit__product-link\s*\{[^}]*gap:\s*1\.2rem;/s,
    'product image and copy should use a compact explicit gap'
  );
  assert.match(
    source,
    /\.travel-edit__product-info\s*\{[^}]*align-items:\s*flex-start;[^}]*text-align:\s*left;/s,
    'product copy should remain consistently left aligned'
  );
});

test('collection product details sit directly below images and align left', () => {
  const styles = read('assets/component-card.css');
  const card = read('snippets/card-product.liquid');

  assert.match(
    styles,
    /\.product-card-wrapper \.card__content--clinical\s*\{[^}]*padding:\s*1\.6rem 0 0 !important;/s,
    'shared card content should use a balanced image-to-title gap'
  );
  assert.match(
    styles,
    /\.product-card-wrapper \.card__price-row\s*\{[^}]*margin-top:\s*0;/s,
    'shared card prices should follow titles without an automatic spacer'
  );
  assert.equal(
    card.includes('<div class="card__meta-row">'),
    false,
    'collection cards should not insert metadata between the image and title'
  );
  assert.match(
    styles,
    /\.product-card-wrapper \.price--on-sale \.price__regular\s*\{\s*display:\s*none !important;\s*\}/,
    'sale cards should hide the duplicate regular-price container in every shared-card context'
  );
});

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
  const card = read('snippets/card-product.liquid');

  assert.match(styles, /\.product-card-wrapper \.card__wishlist-toggle\s*\{[^}]*position:\s*absolute;[^}]*min-width:\s*4\.4rem;[^}]*min-height:\s*4\.4rem;/s);
  assert.match(styles, /\.product-card-wrapper \.card__inner \.card__badge--percentage\s*\{[^}]*left:\s*1\.6rem;[^}]*bottom:\s*1\.6rem;/s);
  assert.doesNotMatch(
    styles,
    /\.product-card-wrapper \.card__inner \.card__badge--percentage\s*\{[^}]*1\.2rem;/s,
    'percentage badges must not inherit the later generic 1.2rem offsets'
  );
  assert.match(card, /<div class="card__badge card__badge--percentage">/);
  assert.doesNotMatch(
    card,
    /card__badge--percentage \{\{ settings\.badge_position \}\}/,
    'percentage badges must not accept configurable top or right positioning classes'
  );
  assert.match(styles, /\.product-card-wrapper \.card__wishlist-toggle\[aria-pressed='true'\]/);
});

test('collection stylesheet leaves card fundamentals to the shared component', () => {
  const collection = read('sections/main-collection-product-grid.liquid');
  assert.doesNotMatch(collection, /product-card-wrapper--collection \.card__wishlist-toggle/);
  assert.doesNotMatch(collection, /product-card-wrapper--collection \.card__badge/);
});

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

test('wishlist focus trap recovers after the focused item is removed', () => {
  const source = read('assets/wishlist.js');
  assert.match(
    source,
    /!this\.panel\.contains\(document\.activeElement\)[\s\S]*?event\.preventDefault\(\);[\s\S]*?\(event\.shiftKey \? last : first\)\?\.focus\(\);/s,
    'Tab should move focus back inside the panel when a rerender detaches the focused remove button'
  );
});

test('wishlist drawer distinguishes empty storage from complete product-fetch failure', () => {
  const source = read('assets/wishlist.js');
  assert.match(
    source,
    /if \(this\.items\.length === 0\)[\s\S]*?this\.emptyState\.hidden = false;[\s\S]*?return;/s,
    'zero stored handles should show the empty state'
  );
  assert.match(source, /const failedProducts = products\.filter\(\(entry\) => entry\.status === 'rejected'\);/);
  assert.match(
    source,
    /validProducts\.length === 0 && failedProducts\.length === products\.length[\s\S]*?this\.status\.dataset\.state = 'error';[\s\S]*?this\.status\.textContent = strings\.failedToLoad;/s,
    'an all-failed fetch must surface the configured failure string instead of the empty state'
  );
});

test('wishlist product title provides an aligned 44px interaction target', () => {
  const styles = read('assets/component-wishlist-drawer.css');
  assert.match(
    styles,
    /\.wishlist-item__title\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*center;[^}]*min-height:\s*4\.4rem;/s,
    'the separate title link should meet the minimum touch target without misaligning its copy'
  );
});

test('storefront free-delivery copy consistently uses the ₹1,999 threshold', () => {
  const files = [
    'sections/header-group.json',
    'templates/index.json',
    'templates/product.json',
    'templates/page.faq.json',
  ];

  for (const file of files) {
    const source = read(file).replaceAll('\\u20b9', '₹');
    assert.match(source, /₹1,999/, `${file} should mention the ₹1,999 free-delivery threshold`);
    assert.equal(source.includes('₹999'), false, `${file} should not retain the old ₹999 threshold`);
  }
});

test('cart drawer includes the progressive free-delivery treatment and responsive card layout', () => {
  const markup = read('snippets/cart-drawer.liquid');
  const styles = read('assets/component-cart-drawer.css');

  assert.match(markup, /cart-drawer__shipping/);
  assert.match(markup, /free_delivery_threshold/);
  assert.match(markup, /cart-drawer__count/);
  assert.match(styles, /\.cart-drawer__shipping/);
  assert.match(styles, /grid-template-areas:/);
  assert.match(styles, /@media screen and \(max-width: 749px\)/);
});

test('cart drawer owns its sizing so items scroll independently from the footer', () => {
  const styles = read('assets/component-cart-drawer.css');

  assert.match(
    styles,
    /\.cart-drawer \.drawer__inner\s*\{[\s\S]*?display:\s*grid;[\s\S]*?grid-template-rows:\s*auto auto minmax\(0, 1fr\) auto;/s,
    'the open cart should reserve separate rows for header, shipping, items, and footer'
  );
  assert.match(
    styles,
    /cart-drawer:not\(\.is-empty\) cart-drawer-items\s*\{[^}]*min-height:\s*0;[^}]*overflow-y:\s*auto;/s,
    'cart items should be the only scrolling region'
  );
  assert.match(
    styles,
    /\.cart-drawer \.drawer__contents,\s*\.cart-drawer \.cart-drawer__form\s*\{[^}]*min-height:\s*0;/s,
    'nested cart wrappers should be allowed to shrink inside the drawer'
  );
  assert.match(
    styles,
    /\.cart-drawer \.cart__ctas\s*\{[^}]*width:\s*100%;/s,
    'checkout should occupy the footer content width without inherited sizing conflicts'
  );
  assert.match(
    styles,
    /\.cart-drawer \.cart-items \.cart-item__quantity\s*\{[\s\S]*?grid-column:\s*2;[\s\S]*?grid-row:\s*2;/s,
    'quantity controls should sit below the product details instead of under the image'
  );
});

test('cart drawer controls use a consistent Cranbi component treatment', () => {
  const styles = read('assets/component-cart-drawer.css');

  assert.match(
    styles,
    /\.cart-drawer quantity-input\s*\{[\s\S]*?height:\s*4\.2rem;[\s\S]*?border-radius:\s*1\.1rem(?:\s*!important)?;/s,
    'quantity selector should use a compact soft-corner control'
  );
  assert.match(
    styles,
    /\.cart-drawer quantity-input \.quantity__button\s*\{[\s\S]*?font-family:\s*var\(--font-body-family\);[\s\S]*?font-weight:\s*600;/s,
    'quantity buttons should use the theme type system instead of browser Arial'
  );
  assert.match(
    styles,
    /\.cart-drawer \.cart__checkout-button\s*\{[\s\S]*?border-radius:\s*0\.9rem;[\s\S]*?box-shadow:/s,
    'checkout should use the refined soft-corner CTA treatment'
  );
  assert.match(
    styles,
    /\.cart-drawer__shipping\s*\{[\s\S]*?border-left:\s*0\.3rem solid var\(--cart-plum\);[\s\S]*?border-radius:\s*0\.8rem;/s,
    'free-delivery card should use the branded accent edge and balanced radius'
  );
});

test('cart drawer header omits the ritual eyebrow copy', () => {
  const markup = read('snippets/cart-drawer.liquid');

  assert.doesNotMatch(markup, /MYCRANBI RITUAL/);
});

test('cart drawer quantity control suppresses Dawn segmented overlays', () => {
  const styles = read('assets/component-cart-drawer.css');

  assert.match(
    styles,
    /\.cart-drawer \.quantity\.cart-quantity::before,\s*\n\.cart-drawer \.quantity\.cart-quantity::after\s*\{[\s\S]*?content:\s*none;/s,
    'the cart selector should use its own single-shell treatment'
  );
  assert.match(
    styles,
    /\.cart-drawer \.quantity\.cart-quantity \.quantity__button:not\(:focus-visible\):not\(\.focused\),\s*\n\.cart-drawer \.quantity\.cart-quantity \.quantity__input:not\(:focus-visible\):not\(\.focused\)\s*\{[\s\S]*?box-shadow:\s*none;/s,
    'quantity children should not inherit the shell shadow as internal dividers'
  );
});

test('cart drawer checkout action has breathing room below the totals copy', () => {
  const styles = read('assets/component-cart-drawer.css');

  assert.match(
    styles,
    /\.cart-drawer \.cart__ctas\s*\{[^}]*margin-top:\s*1\.6rem;/s,
    'checkout should be separated from the tax note'
  );
});

test('cart drawer checkout button does not retain Dawn pseudo-element framing', () => {
  const styles = read('assets/component-cart-drawer.css');

  assert.match(
    styles,
    /\.cart-drawer \.cart__checkout-button::before,\s*\n\.cart-drawer \.cart__checkout-button::after\s*\{[\s\S]*?content:\s*none;/s,
    'checkout should render as one clean rounded surface'
  );
});

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

test('cart checkout hover keeps white copy on the deep maroon surface', () => {
  const styles = read('assets/component-cart-drawer.css');

  assert.match(
    styles,
    /\.cart-drawer \.cart__checkout-button:hover,\s*\n\.cart-drawer \.cart__checkout-button:focus-visible\s*\{[^}]*background:\s*var\(--cart-plum-deep\)\s*!important;[^}]*color:\s*#fff\s*!important;/s,
    'cart checkout hover and focus-visible states should retain white text on the deep maroon surface'
  );
});

test('cart loading controls consume the class produced by Dawn cart updates', () => {
  const producer = read('assets/cart.js');
  const styles = read('assets/component-cart-drawer.css');
  const producedClass = producer.match(/mainCartItems\.classList\.add\('([^']+)'\)/)?.[1];

  assert.equal(producedClass, 'cart__items--disabled');
  assert.match(
    styles,
    /#CartDrawer-CartItems\.cart__items--disabled quantity-input,\s*\n#CartDrawer-CartItems\.cart__items--disabled cart-remove-button\s*\{[^}]*pointer-events:\s*none;[^}]*opacity:\s*0\.55;/s,
    'quantity and remove controls should consume Dawn\'s real loading class on the drawer items container'
  );
  assert.doesNotMatch(styles, /cart-drawer-items\.is-loading/);
});

test('shared vertical card rules preserve complementary horizontal cards', () => {
  const card = read('snippets/card-product.liquid');
  const styles = read('assets/component-card.css');
  const mainProduct = read('sections/main-product.liquid');

  assert.match(mainProduct, /render 'card-product',[\s\S]*?horizontal_class:\s*true,[\s\S]*?horizontal_quick_add:\s*true/s);
  assert.match(styles, /\.product-card-wrapper \.card:not\(\.card--horizontal\)\s*\{[^}]*flex-direction:\s*column;[^}]*padding:\s*0;/s);
  assert.match(styles, /\.card\.card--horizontal\s*\{[^}]*flex-direction:\s*row;/s);
  assert.match(styles, /\.card--card\.card--horizontal\s*\{[^}]*padding:\s*1\.2rem;/s);
  assert.match(card, /\{% if horizontal_class %\} card--horizontal\{% endif %\}[\s\S]*class="wishlist-btn card__wishlist-toggle"/s);
  assert.match(styles, /\.product-card-wrapper \.card--horizontal \.card__wishlist-toggle\s*\{[^}]*display:\s*grid;[^}]*top:\s*0\.8rem;[^}]*right:\s*0\.8rem;/s);
  assert.match(
    styles,
    /\.product-card-wrapper \.card--horizontal \.card__inner \.card__badge--percentage\s*\{[^}]*display:\s*block;[^}]*left:\s*0\.8rem;[^}]*bottom:\s*0\.8rem;/s,
    'horizontal percentage badges should stay on the media and away from card content'
  );
  assert.match(styles, /\.product-card-wrapper \.card--horizontal \.card__badge--percentage \.badge\s*\{[^}]*font-size:\s*0\.85rem;[^}]*padding:\s*0\.5rem 0\.7rem;/s);
});

test('discounted cards render one percentage badge with explicit custom-badge precedence', () => {
  const card = read('snippets/card-product.liquid');

  assert.match(card, /assign show_percentage_badge = false[\s\S]*assign show_percentage_badge = true/s);
  assert.match(card, /assign show_custom_badge = false[\s\S]*custom_badge_text != blank and show_percentage_badge == false[\s\S]*assign show_custom_badge = true/s);
  assert.match(card, /if show_percentage_badge[\s\S]*products\.product\.on_sale_percentage/s);
  assert.doesNotMatch(
    card,
    /elsif card_product\.compare_at_price > card_product\.price and card_product\.available[\s\S]*products\.product\.on_sale' \| t/s,
    'the outer generic sale branch must not duplicate the percentage Badge id'
  );
  assert.equal((card.match(/products\.product\.on_sale' \| t/g) || []).length, 0);
});

test('cart drawer renders a semantic zero state and exact partial free-delivery copy', () => {
  const markup = read('snippets/cart-drawer.liquid');

  assert.match(
    markup,
    /\{%- if cart == empty -%\}[\s\S]*cart-drawer__shipping--empty[\s\S]*aria-valuenow="0"[\s\S]*--cart-shipping-progress:\s*0%;/s,
    'empty carts should expose the same progress semantics at zero percent'
  );
  assert.match(markup, /Add Rs\. \{\{ free_delivery_threshold \| money_without_currency \}\} more to unlock free delivery\./);
  assert.match(markup, /Add Rs\. \{\{ free_delivery_remaining \| money_without_currency \}\} more to unlock free delivery\./);
  assert.doesNotMatch(markup, /Add \{\{ free_delivery_remaining \| money_without_currency \}\} more to unlock free delivery\./);
});

test('dynamic headers ship the delegated wishlist hook and receive synchronized badge state', () => {
  const header = read('sections/header.liquid');
  const source = read('assets/wishlist.js');

  assert.match(header, /<a[^>]*data-wishlist-open[^>]*class="header__icon link focus-inset"/s);
  assert.doesNotMatch(header, /onclick="[^"]*wishlistManager\.openDrawer/);
  assert.match(source, /upgradeHeaderTriggers\(root = document\)/);
  assert.match(source, /updateHeaderBadge\(root = document\)/);
  assert.match(
    source,
    /if \(node\.nodeType === Node\.ELEMENT_NODE\) \{[\s\S]*this\.upgradeHeaderTriggers\(node\);[\s\S]*this\.syncButtons\(node\);[\s\S]*this\.updateHeaderBadge\(node\);[\s\S]*\}/s,
    'the observer should upgrade and synchronize every newly rendered header subtree'
  );
  assert.match(source, /root\.matches\?\.\('\.wishlist-count-bubble'\)/);
});

test('brand story cards ship editorial fallbacks for all three homepage blocks', () => {
  const source = read('sections/brand-story.liquid');

  assert.match(source, /brand-story-heritage\.webp/);
  assert.match(source, /brand-story-saffron\.webp/);
  assert.match(source, /brand-story-free-from\.webp/);
  assert.match(source, /case forloop\.index/);
  assert.match(source, /block\.settings\.image != blank[\s\S]*?story_asset != blank/s);
  assert.match(source, /story_asset \| asset_url/);
});

test('Shop by Concern resolves collection handles into working homepage links', () => {
  const source = read('sections/shop-by-concern.liquid');
  const homepage = JSON.parse(read('templates/index.json').replace(/^\/\*[\s\S]*?\*\//, ''));
  const expectedLinks = {
    concern_1: 'dry-dehydrated-skin',
    concern_2: 'dull-tired-skin',
    concern_3: 'dark-spots-uneven-skintone',
    concern_4: 'sensitive-irritated-skin',
    concern_5: 'damaged-skin-barrier',
    concern_6: 'weak-damaged-hair',
    concern_7: 'frizz-unmanageable-hair',
    concern_8: 'oily-dandruff-scalp',
    concern_9: 'dry-scalp-hairfall',
  };

  assert.match(
    source,
    /assign concern_collection_handle = block\.settings\.collection\.handle \| default: block\.settings\.collection/,
    'the section should support collection settings stored as either objects or handles'
  );
  assert.match(
    source,
    /assign concern_collection_url = routes\.collections_url \| append: '\/' \| append: concern_collection_handle/,
    'handle-based collection settings should resolve to a storefront collection URL'
  );
  assert.match(
    source,
    /href="\{\{ concern_collection_url \| default: block\.settings\.link \| default: routes\.all_products_collection_url \}\}"/,
    'concern cards should use the resolved collection URL before a manual fallback link'
  );
  assert.match(
    source,
    /"type":\s*"url"[\s\S]*?"id":\s*"link"/,
    'concern blocks should expose an explicit URL fallback for theme JSON'
  );

  for (const [blockId, handle] of Object.entries(expectedLinks)) {
    assert.equal(
      homepage.sections.shop_by_concern.blocks[blockId].settings.link,
      `shopify://collections/${handle}`,
      `${blockId} should point to its matching collection URL`
    );
  }
});
