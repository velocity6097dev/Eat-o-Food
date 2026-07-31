// Set this to your deployed backend URL, e.g. https://your-app.onrender.com
window.API_BASE = window.API_BASE || 'http://192.168.0.104:4000';

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
