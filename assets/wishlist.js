const WISHLIST_LOCAL_STORAGE_KEY = 'shopify_wishlist';

class Wishlist {
  constructor() {
    this.items = this.getItems();
    this.initButtons();
    this.updateHeaderBadge();
    
    // If on the wishlist page, render the grid
    if (document.getElementById('wishlist-grid')) {
      this.renderWishlistPage();
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
    
    // If on wishlist page, re-render
    if (document.getElementById('wishlist-grid')) {
      this.renderWishlistPage();
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

  async renderWishlistPage() {
    const grid = document.getElementById('wishlist-grid');
    const emptyState = document.getElementById('wishlist-empty-state');
    
    if (this.items.length === 0) {
      grid.style.display = 'none';
      emptyState.style.display = 'block';
      grid.innerHTML = '';
      return;
    }
    
    grid.style.display = 'grid';
    emptyState.style.display = 'none';
    grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 4rem;">Loading...</div>';

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
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        grid.innerHTML = '';
        return;
      }

      const formatMoney = (cents) => {
        return 'Rs. ' + (cents / 100).toFixed(2).replace(/\.00$/, '');
      };

      grid.innerHTML = validProducts.map(product => {
        const image = product.featured_image 
          ? `<img src="${product.featured_image}" alt="${product.title.replace(/"/g, '&quot;')}" style="width:100%; height:auto; object-fit:cover; display:block;">` 
          : `<div style="background:#f4f4f4; width:100%; aspect-ratio:1; display:flex; align-items:center; justify-content:center; color:#999;">No image</div>`;
          
        return `
          <div class="wishlist-product-card" style="position:relative; background:#fff; border-radius:0; box-shadow:0 2px 8px rgba(0,0,0,0.05); overflow:hidden; transition:transform 0.2s;">
            <a href="${product.url}" style="display:block; text-decoration:none;">
              <div style="position:relative; overflow:hidden; aspect-ratio: 0.8;">
                ${image}
              </div>
              <div style="padding: 1.5rem; text-align:center;">
                <h3 style="margin:0 0 0.5rem 0; font-size:1.6rem; font-weight:400; color:#333; font-family: var(--font-heading-family);">${product.title}</h3>
                <div style="font-size:1.4rem; color:#555; margin-bottom:1rem;">${formatMoney(product.price)}</div>
              </div>
            </a>
            <button class="wishlist-btn in-wishlist" data-product-handle="${product.handle}" style="position:absolute; top:1rem; right:1rem; background:#fff; border:none; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 2px 4px rgba(0,0,0,0.1); z-index:2;">
              <svg class="icon-heart-solid" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #000;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              <svg class="icon-heart-empty hidden" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #000;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </button>
            <div style="padding: 0 1.5rem 1.5rem;">
               <a href="${product.url}" style="display:block; text-align:center; padding: 1rem; background: #000; color: #fff; text-decoration:none; text-transform:uppercase; font-size:1.2rem; letter-spacing:1px; font-weight:600; border-radius: 2px;">View Product</a>
            </div>
          </div>
        `;
      }).join('');
    } catch (e) {
      grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: red;">Failed to load wishlist items. Please try again.</div>';
      console.error(e);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.wishlistManager = new Wishlist();
});
