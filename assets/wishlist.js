const WISHLIST_LOCAL_STORAGE_KEY = 'shopify_wishlist';

class Wishlist {
  constructor() {
    this.items = this.getItems();
    this.initButtons();
    this.updateHeaderBadge();
    
    // Bind drawer events
    const overlay = document.getElementById('WishlistDrawer-Overlay');
    if (overlay) {
      overlay.addEventListener('click', () => this.closeDrawer());
    }
  }

  getItems() {
    try {
      const items = localStorage.getItem(WISHLIST_LOCAL_STORAGE_KEY);
      return items ? JSON.parse(items) : [];
    } catch (e) {
      console.error('Error reading wishlist from localStorage:', e);
      return [];
    }
  }

  setItems(items) {
    try {
      localStorage.setItem(WISHLIST_LOCAL_STORAGE_KEY, JSON.stringify(items));
      this.items = items;
      this.updateAllButtons();
      this.updateHeaderBadge();
    } catch (e) {
      console.error('Error saving wishlist to localStorage:', e);
    }
  }

  toggleItem(handle) {
    const items = this.getItems();
    const index = items.indexOf(handle);
    if (index > -1) {
      items.splice(index, 1);
    } else {
      items.push(handle);
    }
    this.setItems(items);
    
    // If drawer is open, re-render its contents
    const drawer = document.getElementById('WishlistDrawer');
    if (drawer && drawer.classList.contains('active')) {
      this.renderDrawerContents();
    }
  }

  isItemInWishlist(handle) {
    return this.items.includes(handle);
  }

  initButtons() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.wishlist-btn');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        const handle = btn.getAttribute('data-product-handle');
        if (handle) {
          this.toggleItem(handle);
        }
      }
    });

    this.updateAllButtons();
  }

  updateAllButtons() {
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
      const handle = btn.getAttribute('data-product-handle');
      if (this.isItemInWishlist(handle)) {
        btn.classList.add('in-wishlist');
        btn.querySelector('.icon-heart-empty')?.classList.add('hidden');
        btn.querySelector('.icon-heart-solid')?.classList.remove('hidden');
      } else {
        btn.classList.remove('in-wishlist');
        btn.querySelector('.icon-heart-empty')?.classList.remove('hidden');
        btn.querySelector('.icon-heart-solid')?.classList.add('hidden');
      }
    });
  }

  updateHeaderBadge() {
    const badges = document.querySelectorAll('.wishlist-count-bubble');
    badges.forEach(badge => {
      const count = this.items.length;
      badge.textContent = count;
      if (count > 0) {
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    });
  }

  openDrawer() {
    const drawer = document.getElementById('WishlistDrawer');
    if (drawer) {
      this.renderDrawerContents();
      drawer.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  closeDrawer() {
    const drawer = document.getElementById('WishlistDrawer');
    if (drawer) {
      drawer.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  async renderDrawerContents() {
    const tbody = document.getElementById('WishlistDrawer-Items');
    const emptyState = document.getElementById('WishlistDrawer-Empty');
    const contentArea = document.getElementById('WishlistDrawer-Content');
    
    if (this.items.length === 0) {
      contentArea.style.display = 'none';
      emptyState.style.display = 'block';
      tbody.innerHTML = '';
      return;
    }
    
    contentArea.style.display = 'block';
    emptyState.style.display = 'none';
    tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 2rem;">Loading...</td></tr>';

    try {
      const productPromises = this.items.map(handle => 
        fetch(`/products/${handle}.js`).then(res => {
          if (!res.ok) throw new Error('Product not found');
          return res.json();
        }).catch(err => null)
      );

      const products = await Promise.all(productPromises);
      const validProducts = products.filter(p => p !== null);

      if (validProducts.length === 0) {
        contentArea.style.display = 'none';
        emptyState.style.display = 'block';
        tbody.innerHTML = '';
        return;
      }

      const formatMoney = (cents) => {
        return 'Rs. ' + (cents / 100).toFixed(2).replace(/\.00$/, '');
      };

      tbody.innerHTML = validProducts.map(product => {
        const image = product.featured_image 
          ? `<img src="${product.featured_image}" alt="${product.title.replace(/"/g, '&quot;')}" style="width: 80px; height: auto; display: block; border-radius: 4px;">` 
          : `<div style="background:#f4f4f4; width:80px; aspect-ratio:1; display:flex; align-items:center; justify-content:center; color:#999; border-radius: 4px;">No image</div>`;
          
        return `
          <tr class="cart-item" style="border-bottom: 1px solid rgba(var(--color-foreground), 0.08);">
            <td class="cart-item__media" style="padding-top: 1.5rem; padding-bottom: 1.5rem; width: 90px; vertical-align: top;">
              <a href="${product.url}" class="cart-item__link" tabindex="-1" aria-hidden="true"></a>
              ${image}
            </td>
            <td class="cart-item__details" style="padding-top: 1.5rem; padding-bottom: 1.5rem; padding-left: 1.5rem; vertical-align: top;">
              <a href="${product.url}" class="cart-item__name h4 break" style="text-decoration: none; font-size: 1.6rem; color: rgb(var(--color-foreground)); display: block; margin-bottom: 0.5rem; font-family: var(--font-heading-family);">${product.title}</a>
              <div class="cart-item__price-wrapper">
                <span class="price price--end" style="font-size: 1.4rem;">${formatMoney(product.price)}</span>
              </div>
            </td>
            <td class="cart-item__totals right" style="padding-top: 1.5rem; padding-bottom: 1.5rem; vertical-align: middle;">
              <button class="wishlist-btn" data-product-handle="${product.handle}" style="background: none; border: none; cursor: pointer; padding: 0.5rem;" aria-label="Remove from wishlist">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.66699 2.66667L13.3337 13.3333" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  <path d="M13.3337 2.66667L2.66699 13.3333" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: red;">Failed to load wishlist items.</td></tr>';
      console.error(e);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.wishlistManager = new Wishlist();
});
