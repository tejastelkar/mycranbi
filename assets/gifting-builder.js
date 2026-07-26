export function normalizeGiftSelections(selectionMap) {
  return Object.entries(selectionMap)
    .filter(([, value]) => Number(value.quantity) > 0 && value.variantId)
    .map(([key, value]) => ({
      key,
      variantId: value.variantId,
      title: value.title,
      price: Number(value.price),
      image: value.image || '',
      quantity: Number(value.quantity),
    }));
}

export function calculateGiftTotal(lines) {
  return lines.reduce((sum, line) => sum + Number(line.price) * Number(line.quantity), 0);
}

export function buildGiftCartItems(lines, groupId, groupLabel) {
  return lines.map((line) => ({
    id: line.variantId,
    quantity: Number(line.quantity),
    properties: {
      'Gift Box': groupLabel,
      _cranbi_gift_group: groupId,
      _cranbi_gift_label: groupLabel,
    },
  }));
}

export function buildGiftCartPayload(lines, groupId, groupLabel) {
  return {
    items: buildGiftCartItems(lines, groupId, groupLabel),
  };
}

export function upsertGiftSelection(selectionMap, key, product) {
  const current = selectionMap[key];
  const nextQuantity = Number(current?.quantity || 0) + 1;

  return {
    ...selectionMap,
    [key]: {
      variantId: product.variantId,
      title: product.title,
      price: Number(product.price),
      image: product.image || '',
      quantity: nextQuantity,
    },
  };
}

export function createGiftGroupId(now = () => Date.now(), random = () => Math.random()) {
  const suffix = String(random()).replace('0.', '');
  return `gift-${now()}-${suffix}`;
}

export function formatGiftMoney(cents, currency = 'INR', locale = 'en-IN') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function getCartTarget() {
  return document.querySelector('cart-drawer') || document.querySelector('cart-notification');
}

function getCartSections(cart) {
  if (!cart || typeof cart.getSectionsToRender !== 'function') return [];
  return cart.getSectionsToRender().map((section) => section.id);
}

async function submitGiftCartPayload(payload) {
  const response = await fetch(`${routes.cart_add_url}.js`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify(payload),
  });

  return response.json();
}

function renderSummaryItems(lines, summaryList) {
  summaryList.innerHTML = '';

  for (const line of lines) {
    const item = document.createElement('li');
    item.className = 'cranbi-gift-builder__summary-item';
    item.innerHTML = `
      <div class="cranbi-gift-builder__summary-copy">
        ${
          line.image
            ? `<span class="cranbi-gift-builder__summary-thumb"><img src="${line.image}" alt="${line.title}"></span>`
            : ''
        }
        <div class="cranbi-gift-builder__summary-details">
          <span class="cranbi-gift-builder__summary-name">${line.title}</span>
          <span class="cranbi-gift-builder__summary-meta">${formatGiftMoney(line.price)} each</span>
        </div>
      </div>
      <div class="cranbi-gift-builder__summary-controls">
        <button type="button" class="cranbi-gift-builder__summary-btn" data-summary-action="decrement" data-summary-key="${line.key}" aria-label="Decrease quantity for ${line.title}">
          -
        </button>
        <span class="cranbi-gift-builder__summary-qty">${line.quantity}</span>
        <button type="button" class="cranbi-gift-builder__summary-btn" data-summary-action="increment" data-summary-key="${line.key}" aria-label="Increase quantity for ${line.title}">
          +
        </button>
        <strong class="cranbi-gift-builder__summary-line-total">${formatGiftMoney(line.price * line.quantity)}</strong>
      </div>
    `;
    summaryList.appendChild(item);
  }
}

export function initGiftBuilder(root) {
  const products = Array.from(root.querySelectorAll('[data-product-key]'));
  const selectNode = root.querySelector('[data-role="product-select"]');
  const addButton = root.querySelector('[data-role="add-product"]');
  const summaryList = root.querySelector('[data-role="summary-list"]');
  const totalNode = root.querySelector('[data-role="summary-total"]');
  const submitButton = root.querySelector('[data-role="submit"]');
  const statusNode = root.querySelector('[data-role="status"]');
  const giftLabel = root.dataset.giftLabel || 'Custom Gift Box';
  const submitLabel = root.dataset.submitLabel || 'Add custom gift box to cart';
  const emptyText = root.dataset.emptyText || 'Choose your first product to begin building the box.';
  const successText = root.dataset.successText || 'Your custom gift box has been added to cart.';
  const errorText = root.dataset.errorText || 'We could not add your gift box right now. Please try again.';
  const currencyCode = root.dataset.currencyCode || 'INR';
  let selectionMap = {};

  for (const product of products) {
    selectionMap[product.dataset.productKey] = {
      variantId: product.dataset.variantId,
      title: product.dataset.title,
      price: Number(product.dataset.price),
      image: product.dataset.image || '',
      quantity: 0,
    };
  }

  function render() {
    const lines = normalizeGiftSelections(selectionMap);
    const total = calculateGiftTotal(lines);
    totalNode.textContent = formatGiftMoney(total, currencyCode);
    submitButton.disabled = lines.length === 0;
    submitButton.textContent = submitLabel;

    if (lines.length === 0) {
      summaryList.innerHTML = '';
      const emptyItem = document.createElement('li');
      emptyItem.className = 'cranbi-gift-builder__summary-empty';
      emptyItem.textContent = emptyText;
      summaryList.appendChild(emptyItem);
    } else {
      renderSummaryItems(lines, summaryList);
    }
  }

  addButton?.addEventListener('click', () => {
    const key = selectNode?.value;
    if (!key || !selectionMap[key]) return;

    selectionMap = upsertGiftSelection(selectionMap, key, selectionMap[key]);
    if (selectNode) selectNode.value = '';
    statusNode.textContent = '';
    render();
  });

  summaryList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-summary-action]');
    if (!button) return;

    const key = button.dataset.summaryKey;
    const current = selectionMap[key];
    if (!current) return;

    const nextQuantity =
      button.dataset.summaryAction === 'increment'
        ? Number(current.quantity) + 1
        : Math.max(0, Number(current.quantity) - 1);

    selectionMap = {
      ...selectionMap,
      [key]: {
        ...current,
        quantity: nextQuantity,
      },
    };

    statusNode.textContent = '';
    render();
  });

  submitButton.addEventListener('click', async () => {
    const lines = normalizeGiftSelections(selectionMap);
    if (lines.length === 0) return;

    const cart = getCartTarget();
    const groupId = createGiftGroupId();
    const payload = buildGiftCartPayload(lines, groupId, giftLabel);
    const sections = getCartSections(cart);

    if (sections.length > 0) {
      payload.sections = sections;
      payload.sections_url = window.location.pathname;
    }

    submitButton.disabled = true;
    statusNode.textContent = 'Adding your gift box...';

    try {
      const response = await submitGiftCartPayload(payload);

      if (response.status) {
        throw new Error(response.description || response.message || errorText);
      }

      if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
        publish(PUB_SUB_EVENTS.cartUpdate, {
          source: 'gift-builder',
          cartData: response,
        });
      }

      if (cart && typeof cart.renderContents === 'function' && response.sections) {
        cart.renderContents(response);
      } else {
        window.location.href = window.routes?.cart_url || '/cart';
        return;
      }

      selectionMap = Object.fromEntries(
        Object.entries(selectionMap).map(([key, value]) => [
          key,
          {
            ...value,
            quantity: 0,
          },
        ])
      );

      statusNode.textContent = successText;
      render();
    } catch (error) {
      statusNode.textContent = error.message || errorText;
      submitButton.disabled = false;
    }
  });

  render();
}
