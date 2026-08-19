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
