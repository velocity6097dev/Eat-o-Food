// Left blank on purpose: the backend now serves this page too (at /admin), so
// API calls go to the same address the page was loaded from. Only set this if
// you host the admin files somewhere separate from the API.
window.API_BASE = window.API_BASE || '';

function getToken() { return localStorage.getItem('adminToken'); }
function setToken(t) { localStorage.setItem('adminToken', t); }
function clearToken() { localStorage.removeItem('adminToken'); }

function requireAuth() {
  if (!getToken()) window.location.href = 'login.html';
}

const AdminApi = {
  async request(method, path, body, isForm) {
    const headers = { Authorization: `Bearer ${getToken()}` };
    if (!isForm) headers['Content-Type'] = 'application/json';

    const res = await fetch(`${window.API_BASE}${path}`, {
      method,
      headers,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined
    });

    if (res.status === 401) {
      clearToken();
      window.location.href = 'login.html';
      throw new Error('Session expired');
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Something went wrong');
    return data;
  },
  get(path) { return this.request('GET', path); },
  post(path, body, isForm) { return this.request('POST', path, body, isForm); },
  put(path, body, isForm) { return this.request('PUT', path, body, isForm); },
  patch(path, body) { return this.request('PATCH', path, body); },
  del(path) { return this.request('DELETE', path); }
};

function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

function formatMoney(n) { return `Rs. ${Number(n).toFixed(2)}`; }

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Renders the sidebar/topbar/mobile-drawer shell into #appShell, marking `active` as current page
function renderShell(active, contentHtml) {
  const nav = [
    { key: 'dashboard', label: 'Orders', href: 'dashboard.html', icon: 'clipboard-list' },
    { key: 'tables', label: 'Tables', href: 'tables.html', icon: 'armchair' },
    { key: 'menu', label: 'Menu', href: 'menu.html', icon: 'utensils' },
    { key: 'categories', label: 'Categories', href: 'categories.html', icon: 'tags' },
    { key: 'billing', label: 'Billing', href: 'billing.html', icon: 'credit-card' },
    { key: 'promocodes', label: 'Promo Codes', href: 'promocodes.html', icon: 'ticket-percent' },
    { key: 'settings', label: 'Settings', href: 'settings.html', icon: 'settings' }
  ];

  const sidebarLinks = nav.map((n) => `<a class="nav-link ${n.key === active ? 'active' : ''}" href="${n.href}"><i data-lucide="${n.icon}" class="icon"></i> ${n.label}</a>`).join('');
  const drawerLinks = nav.map((n) => `<a class="drawer-link ${n.key === active ? 'active' : ''}" href="${n.href}"><i data-lucide="${n.icon}" class="icon"></i>${n.label}</a>`).join('');
  const currentLabel = (nav.find((n) => n.key === active) || {}).label || 'Admin';

  document.getElementById('appShell').innerHTML = `
    <div class="mobile-topbar">
      <button class="hamburger-btn" id="hamburgerBtn" aria-label="Open menu"><i data-lucide="menu" class="icon-lg"></i></button>
      <strong>${currentLabel}</strong>
      <button class="btn btn-sm btn-outline" style="color:#fff;border-color:rgba(255,255,255,0.4);" id="mobileLogout">Log out</button>
    </div>
    <div class="drawer-overlay" id="drawerOverlay">
      <div class="drawer-panel" id="drawerPanel">
        <div class="drawer-head">
          <span class="sidebar-brand" style="color:var(--color-ink);margin:0;">Admin Panel</span>
          <button class="modal-close" id="drawerClose"><i data-lucide="x" class="icon"></i></button>
        </div>
        ${drawerLinks}
      </div>
    </div>
    <div class="app-shell">
      <div class="sidebar">
        <div class="sidebar-brand">Admin Panel</div>
        ${sidebarLinks}
        <div style="flex:1"></div>
        <button class="nav-link" id="desktopLogout" style="background:none; text-align:left;"><i data-lucide="log-out" class="icon"></i> Log out</button>
      </div>
      <div class="main-area">${contentHtml}</div>
    </div>
  `;

  document.getElementById('desktopLogout').addEventListener('click', logout);
  document.getElementById('mobileLogout').addEventListener('click', logout);

  const overlay = document.getElementById('drawerOverlay');
  document.getElementById('hamburgerBtn').addEventListener('click', () => overlay.classList.add('open'));
  document.getElementById('drawerClose').addEventListener('click', () => overlay.classList.remove('open'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });

  if (window.lucide) window.lucide.createIcons();
}

function logout() {
  clearToken();
  window.location.href = 'login.html';
}

// Connects to the realtime channel so this page can react instantly when data
// changes from another admin device/tab (or, for the kitchen board, from a
// customer placing an order). Returns null if the socket.io script isn't loaded.
function connectSocket() {
  if (typeof io === 'undefined') return null;
  return window.API_BASE ? io(window.API_BASE) : io();
}
