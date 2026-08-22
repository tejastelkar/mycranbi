const WISHLIST_LOCAL_STORAGE_KEY = 'shopify_wishlist';

class Wishlist {
  constructor() {
    this.drawer = document.getElementById('WishlistDrawer');
    this.panel = this.drawer?.querySelector('.wishlist-drawer__panel');
    this.itemsContainer = document.getElementById('WishlistDrawer-Items');
    this.emptyState = document.getElementById('WishlistDrawer-Empty');
    this.status = document.getElementById('WishlistDrawer-Status');
    this.itemTemplate = document.getElementById('WishlistDrawer-ItemTemplate');
    this.drawerCount = this.drawer?.querySelector('.wishlist-drawer__count');
    this.lastTrigger = null;
    this.renderRequestId = 0;
    this.items = this.getItems();

    this.handleClick = this.handleClick.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);

    this.upgradeHeaderTriggers();
    document.addEventListener('click', this.handleClick);
    document.addEventListener('keydown', this.handleKeydown);

    this.syncButtons();
    this.updateHeaderBadge();
    this.observeCards();
  }

  normalizeItems(value) {
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter((item) => typeof item === 'string' && item.trim()))];
  }

  getItems() {
    try {
      return this.normalizeItems(JSON.parse(localStorage.getItem(WISHLIST_LOCAL_STORAGE_KEY) || '[]'));
    } catch (error) {
      console.warn('Unable to read wishlist storage.', error);
      return [];
    }
  }

  setItems(items) {
    this.items = this.normalizeItems(items);
    try {
      localStorage.setItem(WISHLIST_LOCAL_STORAGE_KEY, JSON.stringify(this.items));
    } catch (error) {
      console.warn('Unable to save wishlist storage.', error);
    }
    this.syncButtons();
    this.updateHeaderBadge();
    if (this.drawer?.classList.contains('is-active')) this.renderDrawerContents();
  }

  toggleItem(handle) {
    if (!handle) return;
    const nextItems = this.items.includes(handle)
      ? this.items.filter((item) => item !== handle)
      : [...this.items, handle];
    this.setItems(nextItems);
  }

  syncButtons(root = document) {
    const buttons = [];
    if (root.matches?.('.wishlist-btn')) buttons.push(root);
    root.querySelectorAll?.('.wishlist-btn').forEach((button) => buttons.push(button));
    buttons.forEach((button) => {
      const saved = this.items.includes(button.dataset.productHandle);
      const label = saved
        ? button.dataset.wishlistRemoveLabel || 'Remove from wishlist'
        : button.dataset.wishlistAddLabel || 'Add to wishlist';
      button.classList.toggle('in-wishlist', saved);
      button.setAttribute('aria-pressed', String(saved));
      button.setAttribute('aria-label', label);
      button.querySelector('.icon-heart-empty')?.classList.toggle('hidden', saved);
      button.querySelector('.icon-heart-solid')?.classList.toggle('hidden', !saved);
      const state = button.querySelector('.wishlist-btn__state');
      if (state) state.textContent = saved ? 'Remove from wishlist' : 'Add to wishlist';
    });
  }

  observeCards() {
    this.observer = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) this.syncButtons(node);
      }));
    });
    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  upgradeHeaderTriggers() {
    document.querySelectorAll('[onclick*="wishlistManager.openDrawer"]').forEach((trigger) => {
      trigger.removeAttribute('onclick');
      trigger.setAttribute('data-wishlist-open', '');
    });
  }

  handleClick(event) {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const openTrigger = target.closest('[data-wishlist-open]');
    if (openTrigger) {
      event.preventDefault();
      this.openDrawer(openTrigger);
      return;
    }

    if (target.closest('#WishlistDrawer-Overlay, [data-wishlist-close]')) {
      event.preventDefault();
      this.closeDrawer();
      return;
    }

    const removeButton = target.closest('.wishlist-item__remove[data-product-handle]');
    if (removeButton) {
      event.preventDefault();
      this.toggleItem(removeButton.dataset.productHandle);
      return;
    }

    const wishlistButton = target.closest('.wishlist-btn[data-product-handle]');
    if (wishlistButton) {
      event.preventDefault();
      event.stopPropagation();
      this.toggleItem(wishlistButton.dataset.productHandle);
    }
  }

  updateHeaderBadge() {
    const count = this.items.length;

    document.querySelectorAll('.wishlist-count-bubble').forEach((badge) => {
      const value = badge.querySelector('[aria-hidden="true"]') || badge;
      value.textContent = String(count);
      badge.hidden = count === 0;
      badge.removeAttribute('style');
    });

    if (this.drawerCount) {
      this.drawerCount.textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
    }
  }

  openDrawer(trigger = document.activeElement) {
    if (!this.drawer) return;
    this.lastTrigger = trigger instanceof HTMLElement ? trigger : null;
    this.renderDrawerContents();
    this.drawer.classList.add('is-active');
    this.drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('overflow-hidden');
    this.panel?.focus();
  }

  closeDrawer() {
    if (!this.drawer) return;
    this.drawer.classList.remove('is-active');
    this.drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('overflow-hidden');
    this.lastTrigger?.focus();
  }

  handleKeydown(event) {
    if (!this.drawer?.classList.contains('is-active')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeDrawer();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...this.panel.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')];
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) {
      event.preventDefault();
      this.panel?.focus();
    } else if (event.shiftKey && (document.activeElement === first || document.activeElement === this.panel)) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  formatMoney(cents) {
    const amount = Number(cents);
    if (!Number.isFinite(amount)) return '';
    return `Rs. ${(amount / 100).toFixed(2).replace(/\.00$/, '')}`;
  }

  async renderDrawerContents() {
    if (!this.itemsContainer || !this.emptyState || !this.status || !this.itemTemplate) return;

    const requestId = ++this.renderRequestId;
    const strings = window.wishlistStrings || {
      loading: 'Loading...',
      noImage: 'No image',
      failedToLoad: 'Failed to load wishlist items.',
    };

    this.itemsContainer.replaceChildren();
    this.emptyState.hidden = true;
    this.status.dataset.state = 'loading';
    this.status.textContent = strings.loading;

    if (this.items.length === 0) {
      this.status.textContent = '';
      this.status.removeAttribute('data-state');
      this.emptyState.hidden = false;
      return;
    }

    try {
      const products = await Promise.all(this.items.map(async (handle) => {
        try {
          const response = await fetch(`/products/${encodeURIComponent(handle)}.js`);
          if (!response.ok) return null;
          const product = await response.json();
          return product && typeof product === 'object' ? { handle, product } : null;
        } catch (error) {
          return null;
        }
      }));

      if (requestId !== this.renderRequestId) return;

      const validProducts = products.filter((entry) => entry !== null);
      this.status.textContent = '';
      this.status.removeAttribute('data-state');

      if (validProducts.length === 0) {
        this.emptyState.hidden = false;
        return;
      }

      validProducts.forEach(({ handle, product }) => {
        const fragment = this.itemTemplate.content.cloneNode(true);
        const media = fragment.querySelector('.wishlist-item__media');
        const image = fragment.querySelector('.wishlist-item__image');
        const title = fragment.querySelector('.wishlist-item__title');
        const price = fragment.querySelector('.wishlist-item__price');
        const removeButton = fragment.querySelector('.wishlist-item__remove');
        const productUrl = product.url || `/products/${encodeURIComponent(handle)}`;
        const productTitle = typeof product.title === 'string' ? product.title : '';

        media.href = productUrl;
        title.href = productUrl;
        title.textContent = productTitle;
        price.textContent = this.formatMoney(product.price);
        image.alt = product.featured_image ? productTitle : strings.noImage;
        if (product.featured_image) {
          image.src = product.featured_image;
        } else {
          image.hidden = true;
          media.setAttribute('aria-label', strings.noImage);
        }
        removeButton.dataset.productHandle = handle;
        removeButton.setAttribute('aria-label', productTitle ? `Remove ${productTitle} from wishlist` : 'Remove from wishlist');

        this.itemsContainer.append(fragment);
      });
    } catch (error) {
      if (requestId !== this.renderRequestId) return;
      this.itemsContainer.replaceChildren();
      this.emptyState.hidden = true;
      this.status.dataset.state = 'error';
      this.status.textContent = strings.failedToLoad;
      console.error('Unable to render wishlist.', error);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.wishlistManager = new Wishlist();
});
