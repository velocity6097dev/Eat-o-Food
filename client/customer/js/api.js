// Left blank on purpose: the backend now serves this page too, so API calls
// go to the same address the page was loaded from - works automatically
// whether you open it via localhost, your PC's LAN IP, or a real domain.
// Only set this if you host the client files somewhere separate from the API.
window.API_BASE = window.API_BASE || '';

const Api = {
  async get(path) {
    const res = await fetch(`${window.API_BASE}${path}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Something went wrong');
    return data;
  },
  async post(path, body) {
    const res = await fetch(`${window.API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Something went wrong');
    return data;
  }
};

function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

function formatMoney(n) {
  return `Rs. ${Number(n).toFixed(2)}`;
}

// Applies the shop's configured theme color live, used on every page
async function applyShopTheme() {
  try {
    const shop = await Api.get('/api/shop');
    if (shop.theme_color) document.documentElement.style.setProperty('--color-primary', shop.theme_color);
    if (shop.accent_color) document.documentElement.style.setProperty('--color-accent', shop.accent_color);
    return shop;
  } catch (e) {
    return null;
  }
}

function getTable() {
  return localStorage_get('table');
}
function setTable(table) {
  localStorage_set('table', table);
  setCart([]);
  setMyOrders([]); // starting fresh at a (possibly new) table
}

// Wrapped so we degrade gracefully if storage is ever unavailable
function localStorage_get(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
}
function localStorage_set(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}

function getCart() {
  return localStorage_get('cart') || [];
}
function setCart(cart) {
  localStorage_set('cart', cart);
}
function cartCount(cart) {
  return cart.reduce((sum, i) => sum + i.quantity, 0);
}
function cartSubtotal(cart) {
  return cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

// Connects to the realtime channel and keeps this page's theme colors/shop name
// in sync if the owner changes them in Settings while the page is open. Returns
// the socket so callers can add their own listeners (e.g. menuUpdate) on top.
function listenForShopUpdates() {
  if (typeof io === 'undefined') return null;
  const socket = window.API_BASE ? io(window.API_BASE) : io();
  socket.on('shopUpdate', (shop) => {
    if (shop.theme_color) document.documentElement.style.setProperty('--color-primary', shop.theme_color);
    if (shop.accent_color) document.documentElement.style.setProperty('--color-accent', shop.accent_color);
    const nameEl = document.getElementById('shopNameTop') || document.getElementById('shopName');
    if (nameEl) nameEl.textContent = shop.name;
    const addrEl = document.getElementById('shopAddress');
    if (addrEl) addrEl.textContent = shop.address;
  });
  return socket;
}

// Tracks which orders were placed at the current table so the customer can
// come back to "My Orders" and see everything from this dining session.
function getMyOrders() {
  return localStorage_get('myOrders') || [];
}
function setMyOrders(list) {
  localStorage_set('myOrders', list);
}
function addMyOrder(orderNumber) {
  const list = getMyOrders();
  if (!list.includes(orderNumber)) {
    list.unshift(orderNumber);
    setMyOrders(list);
  }
}

// Renders the fixed bottom tab bar (Menu / Orders / Cart) into #tabBar.
// Call on menu.html, cart.html, and orders.html. `active` is one of those three.
function renderTabBar(active) {
  const el = document.getElementById('tabBar');
  if (!el) return;
  const cart = getCart();
  const count = cartCount(cart);
  el.innerHTML = `
    <a href="menu.html" class="${active === 'menu' ? 'active' : ''}"><i data-lucide="utensils" class="tab-icon"></i>Menu</a>
    <a href="orders.html" class="${active === 'orders' ? 'active' : ''}"><i data-lucide="clipboard-list" class="tab-icon"></i>Orders</a>
    <a href="cart.html" class="${active === 'cart' ? 'active' : ''}" style="position:relative;">
      <i data-lucide="shopping-cart" class="tab-icon"></i>Cart
      ${count > 0 ? `<span class="tab-badge">${count}</span>` : ''}
    </a>
  `;
  if (window.lucide) window.lucide.createIcons();
}

// Small dialog letting the customer switch to a different table without
// losing their place entirely. Re-validates the new table number via the API.
function openChangeTableModal(currentTable) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-head"><h3 class="display" style="font-size:18px;">Change Table</h3><button class="modal-close"><i data-lucide="x" class="icon"></i></button></div>
      <p style="font-size:13.5px;color:var(--color-ink-soft);margin-top:0;">Switching tables will clear your current cart.</p>
      <input class="input" id="changeTableInput" inputmode="numeric" placeholder="New table number" value="${currentTable}">
      <div style="color:var(--color-danger,#C1462F);font-size:13px;margin-top:8px;min-height:16px;" id="changeTableError"></div>
      <button class="btn btn-primary btn-block" style="margin-top:10px;" id="changeTableConfirm">Switch Table</button>
    </div>
  `;
  document.body.appendChild(overlay);
  if (window.lucide) window.lucide.createIcons();
  overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  overlay.querySelector('#changeTableConfirm').addEventListener('click', async () => {
    const val = overlay.querySelector('#changeTableInput').value.trim();
    const errorEl = overlay.querySelector('#changeTableError');
    if (!val) { errorEl.textContent = 'Enter a table number'; return; }
    try {
      const { table } = await Api.get(`/api/tables/check/${encodeURIComponent(val)}`);
      setTable(table);
      window.location.href = 'menu.html';
    } catch (err) {
      errorEl.textContent = err.message;
    }
  });
}
