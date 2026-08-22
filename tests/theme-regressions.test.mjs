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
  const section = read('sections/main-collection-product-grid.liquid');
  const card = read('snippets/card-product.liquid');

  assert.match(
    section,
    /\.card__content--clinical\s*\{[^}]*padding:\s*1\.6rem 0 0 !important;/s,
    'collection card content should use a balanced image-to-title gap'
  );
  assert.match(
    section,
    /\.card__price-row\s*\{[^}]*margin-top:\s*0;/s,
    'collection prices should follow titles without an automatic spacer'
  );
  assert.equal(
    card.includes('<div class="card__meta-row">'),
    false,
    'collection cards should not insert metadata between the image and title'
  );
  assert.match(
    section,
    /\.price--on-sale \.price__regular\s*\{\s*display:\s*none !important;\s*\}/,
    'sale cards should hide the duplicate regular-price container'
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

test('cart exposes a visible update state while Shopify refreshes quantities', () => {
  const styles = read('assets/component-cart-drawer.css');
  assert.match(styles, /cart-drawer-items\.is-loading/);
  assert.match(styles, /cart-drawer-items\.is-loading quantity-input/);
  assert.match(styles, /pointer-events:\s*none/);
});
