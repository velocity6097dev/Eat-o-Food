// Set this to your deployed backend URL, e.g. https://your-app.onrender.com
window.API_BASE = window.API_BASE || 'http://192.168.0.104:4000';

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

// Renders the sidebar/topbar/mobile-nav shell into #appShell, marking `active` as current page
function renderShell(active, contentHtml) {
  const nav = [
    { key: 'dashboard', label: 'Orders', href: 'dashboard.html', icon: '🧾' },
    { key: 'tables', label: 'Tables', href: 'tables.html', icon: '🍽️' },
    { key: 'menu', label: 'Menu', href: 'menu.html', icon: '📋' },
    { key: 'categories', label: 'Categories', href: 'categories.html', icon: '🏷️' },
    { key: 'billing', label: 'Billing', href: 'billing.html', icon: '💳' },
    { key: 'promocodes', label: 'Promo Codes', href: 'promocodes.html', icon: '🎟️' },
    { key: 'settings', label: 'Settings', href: 'settings.html', icon: '⚙️' }
  ];

  const sidebarLinks = nav.map((n) => `<a class="nav-link ${n.key === active ? 'active' : ''}" href="${n.href}">${n.icon} ${n.label}</a>`).join('');
  const mobileLinks = nav.map((n) => `<a class="${n.key === active ? 'active' : ''}" href="${n.href}"><span>${n.icon}</span>${n.label}</a>`).join('');

  document.getElementById('appShell').innerHTML = `
    <div class="mobile-topbar">
      <strong>Admin</strong>
      <button class="btn btn-sm btn-outline" style="color:#fff;border-color:rgba(255,255,255,0.4);" id="mobileLogout">Log out</button>
    </div>
    <div class="app-shell">
      <div class="sidebar">
        <div class="sidebar-brand">Admin Panel</div>
        ${sidebarLinks}
        <div style="flex:1"></div>
        <button class="nav-link" id="desktopLogout" style="background:none; text-align:left;">🚪 Log out</button>
      </div>
      <div class="main-area">${contentHtml}</div>
    </div>
    <div class="mobile-nav">${mobileLinks}</div>
  `;

  document.getElementById('desktopLogout').addEventListener('click', logout);
  document.getElementById('mobileLogout').addEventListener('click', logout);
}

function logout() {
  clearToken();
  window.location.href = 'login.html';
}
