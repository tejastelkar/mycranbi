(function () {
  function normalizeGiftSelections(selectionMap) {
    return Object.entries(selectionMap)
      .filter(function (_ref) {
        var value = _ref[1];
        return Number(value.quantity) > 0 && value.variantId;
      })
      .map(function (_ref2) {
        var key = _ref2[0];
        var value = _ref2[1];
        return {
          key: key,
          variantId: value.variantId,
          title: value.title,
          price: Number(value.price),
          image: value.image || '',
          quantity: Number(value.quantity),
        };
      });
  }

  function calculateGiftTotal(lines) {
    return lines.reduce(function (sum, line) {
      return sum + Number(line.price) * Number(line.quantity);
    }, 0);
  }

  function buildGiftCartItems(lines, groupId, groupLabel) {
    return lines.map(function (line) {
      return {
        id: line.variantId,
        quantity: Number(line.quantity),
        properties: {
          'Gift Box': groupLabel,
          _cranbi_gift_group: groupId,
          _cranbi_gift_label: groupLabel,
        },
      };
    });
  }

  function buildGiftCartPayload(lines, groupId, groupLabel) {
    return {
      items: buildGiftCartItems(lines, groupId, groupLabel),
    };
  }

  function upsertGiftSelection(selectionMap, key, product) {
    var current = selectionMap[key];
    var nextQuantity = Number((current && current.quantity) || 0) + 1;

    return Object.assign({}, selectionMap, {
      [key]: {
        variantId: product.variantId,
        title: product.title,
        price: Number(product.price),
        image: product.image || '',
        quantity: nextQuantity,
      },
    });
  }

  function createGiftGroupId() {
    var suffix = String(Math.random()).replace('0.', '');
    return 'gift-' + Date.now() + '-' + suffix;
  }

  function formatGiftMoney(cents, currency) {
    if (currency === void 0) currency = 'INR';

    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  }

  function getCartTarget() {
    return document.querySelector('cart-drawer') || document.querySelector('cart-notification');
  }

  function getCartSections(cart) {
    if (!cart || typeof cart.getSectionsToRender !== 'function') return [];
    return cart.getSectionsToRender().map(function (section) {
      return section.id;
    });
  }

  function submitGiftCartPayload(payload) {
    return fetch(routes.cart_add_url + '.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify(payload),
    }).then(function (response) {
      return response.json();
    });
  }

  function renderSummaryItems(lines, summaryList) {
    summaryList.innerHTML = '';

    lines.forEach(function (line) {
      var item = document.createElement('li');
      item.className = 'cranbi-gift-builder__summary-item';
      item.innerHTML =
        '<div class="cranbi-gift-builder__summary-copy">' +
        (line.image
          ? '<span class="cranbi-gift-builder__summary-thumb"><img src="' + line.image + '" alt="' + line.title + '"></span>'
          : '') +
        '<div class="cranbi-gift-builder__summary-details">' +
        '<span class="cranbi-gift-builder__summary-name">' +
        line.title +
        '</span>' +
        '<span class="cranbi-gift-builder__summary-meta">' +
        formatGiftMoney(line.price) +
        ' each</span>' +
        '</div>' +
        '</div>' +
        '<div class="cranbi-gift-builder__summary-controls">' +
        '<button type="button" class="cranbi-gift-builder__summary-btn" data-summary-action="decrement" data-summary-key="' +
        line.key +
        '" aria-label="Decrease quantity for ' +
        line.title +
        '">-</button>' +
        '<span class="cranbi-gift-builder__summary-qty">' +
        line.quantity +
        '</span>' +
        '<button type="button" class="cranbi-gift-builder__summary-btn" data-summary-action="increment" data-summary-key="' +
        line.key +
        '" aria-label="Increase quantity for ' +
        line.title +
        '">+</button>' +
        '<strong class="cranbi-gift-builder__summary-line-total">' +
        formatGiftMoney(line.price * line.quantity) +
        '</strong>' +
        '</div>';
      summaryList.appendChild(item);
    });
  }

  function initGiftBuilder(root) {
    if (!root || root.dataset.giftBuilderReady === 'true') return;
    root.dataset.giftBuilderReady = 'true';

    var products = Array.from(root.querySelectorAll('[data-product-key]'));
    var selectNode = root.querySelector('[data-role="product-select"]');
    var addButton = root.querySelector('[data-role="add-product"]');
    var summaryList = root.querySelector('[data-role="summary-list"]');
    var totalNode = root.querySelector('[data-role="summary-total"]');
    var submitButton = root.querySelector('[data-role="submit"]');
    var statusNode = root.querySelector('[data-role="status"]');
    var giftLabel = root.dataset.giftLabel || 'Custom Gift Box';
    var submitLabel = root.dataset.submitLabel || 'Add custom gift box to cart';
    var emptyText = root.dataset.emptyText || 'Choose your first product to begin building the box.';
    var successText = root.dataset.successText || 'Your custom gift box has been added to cart.';
    var errorText = root.dataset.errorText || 'We could not add your gift box right now. Please try again.';
    var currencyCode = root.dataset.currencyCode || 'INR';
    var selectionMap = {};

    products.forEach(function (product) {
      selectionMap[product.dataset.productKey] = {
        variantId: product.dataset.variantId,
        title: product.dataset.title,
        price: Number(product.dataset.price),
        image: product.dataset.image || '',
        quantity: 0,
      };
    });

    function render() {
      var lines = normalizeGiftSelections(selectionMap);
      var total = calculateGiftTotal(lines);
      totalNode.textContent = formatGiftMoney(total, currencyCode);
      submitButton.disabled = lines.length === 0;
      submitButton.textContent = submitLabel;

      if (lines.length === 0) {
        summaryList.innerHTML = '';
        var emptyItem = document.createElement('li');
        emptyItem.className = 'cranbi-gift-builder__summary-empty';
        emptyItem.textContent = emptyText;
        summaryList.appendChild(emptyItem);
      } else {
        renderSummaryItems(lines, summaryList);
      }
    }

    if (addButton) {
      addButton.addEventListener('click', function () {
        var key = selectNode && selectNode.value;
        if (!key || !selectionMap[key]) return;

        selectionMap = upsertGiftSelection(selectionMap, key, selectionMap[key]);
        if (selectNode) selectNode.value = '';
        if (statusNode) statusNode.textContent = '';
        render();
      });
    }

    if (summaryList) {
      summaryList.addEventListener('click', function (event) {
        var button = event.target.closest('[data-summary-action]');
        if (!button) return;

        var key = button.dataset.summaryKey;
        var current = selectionMap[key];
        if (!current) return;

        var nextQuantity =
          button.dataset.summaryAction === 'increment'
            ? Number(current.quantity) + 1
            : Math.max(0, Number(current.quantity) - 1);

        selectionMap = Object.assign({}, selectionMap, {
          [key]: Object.assign({}, current, { quantity: nextQuantity }),
        });

        if (statusNode) statusNode.textContent = '';
        render();
      });
    }

    if (submitButton) {
      submitButton.addEventListener('click', function () {
        var lines = normalizeGiftSelections(selectionMap);
        if (lines.length === 0) return;

        var cart = getCartTarget();
        var groupId = createGiftGroupId();
        var payload = buildGiftCartPayload(lines, groupId, giftLabel);
        var sections = getCartSections(cart);

        if (sections.length > 0) {
          payload.sections = sections;
          payload.sections_url = window.location.pathname;
        }

        submitButton.disabled = true;
        if (statusNode) statusNode.textContent = 'Adding your gift box...';

        submitGiftCartPayload(payload)
          .then(function (response) {
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
              window.location.href = (window.routes && window.routes.cart_url) || '/cart';
              return;
            }

            selectionMap = Object.fromEntries(
              Object.entries(selectionMap).map(function (_ref3) {
                var key = _ref3[0];
                var value = _ref3[1];
                return [
                  key,
                  Object.assign({}, value, {
                    quantity: 0,
                  }),
                ];
              })
            );

            if (statusNode) statusNode.textContent = successText;
            render();
          })
          .catch(function (error) {
            if (statusNode) statusNode.textContent = error.message || errorText;
            submitButton.disabled = false;
          });
      });
    }

    render();
  }

  function initAllGiftBuilders() {
    document.querySelectorAll('[id^="GiftBuilder-"]').forEach(initGiftBuilder);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllGiftBuilders);
  } else {
    initAllGiftBuilders();
  }

  document.addEventListener('shopify:section:load', initAllGiftBuilders);
})();
