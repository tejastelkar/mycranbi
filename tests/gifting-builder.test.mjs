import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeGiftSelections,
  calculateGiftTotal,
  buildGiftCartItems,
  buildGiftCartPayload,
  createGiftGroupId,
  formatGiftMoney,
  upsertGiftSelection,
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
      image: '',
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
        'Gift Box': 'Custom Gift Box',
        _cranbi_gift_group: 'gift-12345',
        _cranbi_gift_label: 'Custom Gift Box',
      },
    },
    {
      id: '222',
      quantity: 1,
      properties: {
        'Gift Box': 'Custom Gift Box',
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

test('formatGiftMoney formats rupee totals for the gifting summary', () => {
  assert.equal(formatGiftMoney(259700), '₹2,597');
});

test('buildGiftCartPayload creates a Shopify cart payload for repeated quantities', () => {
  const payload = buildGiftCartPayload(
    [
      { variantId: 'gid://shopify/ProductVariant/10', quantity: 3 },
      { variantId: 'gid://shopify/ProductVariant/11', quantity: 1 },
    ],
    'gift-1721865600000-123456',
    'Custom Gift Box'
  );

  assert.deepEqual(payload, {
    items: [
      {
        id: 'gid://shopify/ProductVariant/10',
        quantity: 3,
        properties: {
          'Gift Box': 'Custom Gift Box',
          _cranbi_gift_group: 'gift-1721865600000-123456',
          _cranbi_gift_label: 'Custom Gift Box',
        },
      },
      {
        id: 'gid://shopify/ProductVariant/11',
        quantity: 1,
        properties: {
          'Gift Box': 'Custom Gift Box',
          _cranbi_gift_group: 'gift-1721865600000-123456',
          _cranbi_gift_label: 'Custom Gift Box',
        },
      },
    ],
  });
});

test('upsertGiftSelection increments an existing product chosen from the dropdown', () => {
  const selectionMap = {
    shampoo: {
      variantId: 'gid://shopify/ProductVariant/1',
      title: 'Amla & Shikakai Shampoo',
      price: 79900,
      image: '',
      quantity: 1,
    },
  };

  const result = upsertGiftSelection(selectionMap, 'shampoo', {
    variantId: 'gid://shopify/ProductVariant/1',
    title: 'Amla & Shikakai Shampoo',
    price: 79900,
    image: '',
  });

  assert.deepEqual(result, {
    shampoo: {
      variantId: 'gid://shopify/ProductVariant/1',
      title: 'Amla & Shikakai Shampoo',
      price: 79900,
      image: '',
      quantity: 2,
    },
  });
});
