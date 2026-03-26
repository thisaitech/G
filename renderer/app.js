/* ── Utilities ─────────────────────────────────────────────────────── */
const fmt = (n) => n == null ? '—' : Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const fmtMoney = (n) => n == null ? '—' : '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—';
const fmtDateInput = (d) => d ? new Date(d).toISOString().slice(0,10) : '';

function chip(status) {
  const s = (status || '').toUpperCase();
  if (['COMPLETED','FULFILLED','RESTOCKED','IN STOCK','MANUFACTURED','DELIVERED'].includes(s)) return `<span class="chip chip-green">${status}</span>`;
  if (['PROCESSING','PENDING','IN TRANSIT','SCRAP SALE'].includes(s)) return `<span class="chip chip-yellow">${status}</span>`;
  if (['SCRAPPED','CANCELLED','DELAYED','OUT OF STOCK'].includes(s)) return `<span class="chip chip-red">${status}</span>`;
  if (['DIRECT SALE'].includes(s)) return `<span class="chip chip-blue">${status}</span>`;
  return `<span class="chip chip-gray">${status}</span>`;
}

function statusChip(status) {
  const s = (status || '').toLowerCase();
  if (s === 'in stock') return `<span class="chip chip-green"><span class="dot dot-green"></span>${status}</span>`;
  if (s === 'low stock') return `<span class="chip chip-yellow"><span class="dot dot-yellow"></span>${status}</span>`;
  if (s === 'out of stock') return `<span class="chip chip-red"><span class="dot dot-red"></span>${status}</span>`;
  return `<span class="chip chip-gray">${status}</span>`;
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type}`;
  setTimeout(() => t.classList.add('hidden'), 2500);
}

function showModal(html) {
  document.getElementById('modalBox').innerHTML = html;
  document.getElementById('modal').classList.remove('hidden');
}
function closeModal() { document.getElementById('modal').classList.add('hidden'); }
document.getElementById('modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });

/* ── Router ────────────────────────────────────────────────────────── */
let currentPage = 'dashboard';

async function navigate(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === page));
  const container = document.getElementById('pageContainer');
  container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--on-surface-variant)">Loading…</div>';

  switch (page) {
    case 'dashboard': await renderDashboard(); break;
    case 'inventory': await renderInventory(); break;
    case 'purchases': await renderPurchases(); break;
    case 'sales': await renderSales(); break;
    case 'reports': await renderReports(); break;
    case 'settings': await renderSettings(); break;
  }
}

document.querySelectorAll('.nav-item').forEach(el => el.addEventListener('click', () => navigate(el.dataset.page)));

/* ── Global search ─────────────────────────────────────────────────── */
document.getElementById('globalSearch').addEventListener('keydown', async e => {
  if (e.key === 'Enter') {
    const q = e.target.value.trim();
    currentPage = 'inventory';
    document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === 'inventory'));
    const container = document.getElementById('pageContainer');
    container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--on-surface-variant)">Loading…</div>';
    invPage = 1;
    await renderInventory(q ? { search: q } : {});
  }
});

/* ── Top action buttons ────────────────────────────────────────────── */
document.getElementById('btnAddPurchase').addEventListener('click', () => showAddPurchaseModal());
document.getElementById('btnAddSales').addEventListener('click', () => showAddSaleModal());

/* ══════════════════════════════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════════════════════════════ */
async function renderDashboard() {
  const data = await window.api.getDashboard();
  const container = document.getElementById('pageContainer');

  const dayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const today = new Date().getDay();
  const bars = [0,1,2,3,4,5,6].map(i => {
    const d = data.weeklyData?.find(r => parseInt(r.day) === i);
    return { label: dayLabels[i], val: d ? d.sales : Math.random() * 3000 + 500, active: i === today };
  });
  const maxBar = Math.max(...bars.map(b => b.val), 1);

  const stockItems = [
    { name: 'Organic Fertilizer', pct: 82 },
    { name: 'Botanical Seeds', pct: 45, warn: true },
    { name: 'Watering Systems', pct: 61 },
    { name: 'Tools & Hardware', pct: 29, warn: true },
  ];

  container.innerHTML = `
    <div class="page-header" style="display:flex;align-items:flex-start;justify-content:space-between">
      <div>
        <h1 class="page-title">Green Inventory</h1>
        <p class="page-subtitle" style="max-width:400px">Welcome back. Here's your botanical ledger overview.</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-icon" style="background:#e8f0e5">📋</div>
          <span class="stat-badge badge-green">+12%</span>
        </div>
        <div class="stat-value">${fmt(data.totalStock)}</div>
        <div class="stat-label">Total Stock</div>
        <div style="font-size:11px;color:var(--on-surface-variant);margin-top:4px">Items in botanical ledger</div>
      </div>
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-icon" style="background:#e8f0e5">🛒</div>
          <span class="stat-badge badge-green">+4.2k</span>
        </div>
        <div class="stat-value">${fmtMoney(data.totalPurchaseValue)}</div>
        <div class="stat-label">Total Purchase</div>
        <div style="font-size:11px;color:var(--on-surface-variant);margin-top:4px">Monthly acquisition value</div>
      </div>
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-icon" style="background:#e8f0e5">📈</div>
          <span class="stat-badge badge-green">↑ 18%</span>
        </div>
        <div class="stat-value">${fmtMoney(data.totalSalesValue)}</div>
        <div class="stat-label">Total Sales</div>
        <div style="font-size:11px;color:var(--on-surface-variant);margin-top:4px">Fiscal year performance</div>
      </div>
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-icon" style="background:#e8f0e5">🏪</div>
          <span class="stat-badge badge-neutral">Stable</span>
        </div>
        <div class="stat-value">${fmt(data.currentStock)}</div>
        <div class="stat-label">Current Stock</div>
        <div style="font-size:11px;color:var(--on-surface-variant);margin-top:4px">Available for immediate sale</div>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="chart-card">
        <div class="chart-header">
          <div>
            <div class="chart-title">Performance Trajectory</div>
            <div class="chart-sub">Daily sales vs procurement</div>
          </div>
          <div class="period-btns">
            <button class="period-btn active">D</button>
            <button class="period-btn">W</button>
            <button class="period-btn">M</button>
            <button class="period-btn">Y</button>
          </div>
        </div>
        <div class="bar-chart-outer">
          <div class="bar-chart">
            ${bars.map(b => `
              <div class="bar-wrap">
                <div class="bar ${b.active ? 'active' : ''}" style="height:${Math.round((b.val/maxBar)*140)+4}px"></div>
              </div>
            `).join('')}
          </div>
          <div style="display:flex;gap:10px;padding:0 4px">
            ${bars.map(b => `<div style="flex:1;text-align:center;font-size:11px;color:var(--on-surface-variant);font-weight:500">${b.label}</div>`).join('')}
          </div>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-title" style="margin-bottom:16px">Stock Status</div>
        <div class="stock-list">
          ${stockItems.map(item => `
            <div class="stock-item">
              <div class="stock-row">
                <span class="stock-name">${item.name}</span>
                <span class="stock-pct">${item.pct}%</span>
              </div>
              <div class="stock-progress">
                <div class="stock-bar ${item.warn ? 'warn' : ''}" style="width:${item.pct}%"></div>
              </div>
            </div>
          `).join('')}
        </div>
        <div style="margin-top:20px;background:var(--surface-container-low);border-radius:var(--radius-sm);padding:12px 14px;display:flex;align-items:center;gap:10px">
          <div style="width:30px;height:30px;background:var(--primary-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px">✅</div>
          <div>
            <div style="font-size:13px;font-weight:600">Inventory Health</div>
            <div style="font-size:11px;color:var(--on-surface-variant)">Optimum levels maintained</div>
          </div>
        </div>
      </div>
    </div>

    <div style="margin-top:20px" class="card">
      <div class="activity-header">
        <span class="activity-title">The Botanical Ledger Activity</span>
        <button class="link-btn" onclick="navigate('inventory')">View Full History ›</button>
      </div>
      <div class="table-wrapper">
        <table>
          <thead><tr>
            <th>Transaction ID</th><th>Botanical Asset</th><th>Origin / Vendor</th>
            <th>Quantity</th><th>Status</th><th>Value</th>
          </tr></thead>
          <tbody>
            ${(data.recentActivity || []).slice(0,6).map(r => `
              <tr>
                <td class="td-green">#${r.transaction_id}</td>
                <td class="td-bold">${r.asset}</td>
                <td class="td-muted">${r.origin || '—'}</td>
                <td><b>${fmt(r.quantity)}</b> ${r.unit}</td>
                <td>${chip(r.status)}</td>
                <td class="td-money">${fmtMoney(r.value)}</td>
              </tr>
            `).join('') || '<tr><td colspan="6" class="empty-state"><div class="empty-icon">📦</div><div class="empty-text">No activity yet</div></td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <div style="text-align:center;margin-top:24px;font-size:11px;color:var(--on-surface-variant)">
      © 2024 GREEN BOTANICAL LEDGER SYSTEM • PRECISION ENVIRONMENTAL MANAGEMENT
    </div>
  `;

  // Period buttons
  container.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      container.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });
}

/* ══════════════════════════════════════════════════════════════════════
   INVENTORY
══════════════════════════════════════════════════════════════════════ */
let invPage = 1;
const invPageSize = 10;
let invFilters = {};
let invData = [];

async function renderInventory(filters = {}) {
  invFilters = filters;
  const container = document.getElementById('pageContainer');
  const all = await window.api.getInventory(filters);
  invData = all;

  const total = all.reduce((s, r) => s + (r.quantity || 0), 0);
  const inStock = all.filter(r => r.status === 'In Stock').length;
  const lowStock = all.filter(r => r.status === 'Low Stock').length;

  const totalPages = Math.max(1, Math.ceil(all.length / invPageSize));
  if (invPage > totalPages) invPage = 1;
  const page = all.slice((invPage-1)*invPageSize, invPage*invPageSize);

  const cats = await window.api.getCategories();

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
      <div>
        <h1 class="page-title" style="color:var(--primary)">Green Inventory</h1>
        <p class="page-subtitle">Botanical asset management and stock control</p>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn-accent" id="btnInvAddSale">— Add Sales</button>
        <button class="btn-secondary" id="btnInvAddItem">+ Add Item</button>
        <button class="btn-primary" id="btnInvAddPurchase">+ Add Purchase</button>
      </div>
    </div>

    <div class="inv-stats">
      <div class="stat-card card-sm">
        <div class="stat-header"><div class="stat-icon" style="background:#e8f0e5">📊</div><span class="stat-badge badge-green">+12% this week</span></div>
        <div class="stat-value">${fmt(total)}</div>
        <div class="stat-label">Total Stock</div>
      </div>
      <div class="stat-card card-sm">
        <div class="stat-header"><div class="stat-icon" style="background:#e8f5e9">🏷️</div></div>
        <div class="stat-value">${cats.length}</div>
        <div class="stat-label">Active Categories</div>
      </div>
      <div class="stat-card card-sm" style="${lowStock > 0 ? 'background:var(--warning-container)' : ''}">
        <div class="stat-header"><div class="stat-icon" style="background:rgba(201,124,0,0.1)">⚠️</div></div>
        <div class="stat-value" style="${lowStock > 0 ? 'color:var(--warning)' : ''}">${lowStock}</div>
        <div class="stat-label">Low Stock Items</div>
        ${lowStock > 0 ? '<button class="btn-primary btn-sm" style="margin-top:8px">Restock Now</button>' : ''}
      </div>
    </div>

    <div class="card" style="margin-bottom:20px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px">
        <div class="filters-bar" style="margin:0">
          <div style="display:flex;gap:4px">
            <button class="period-btn active" data-period="Daily">Daily</button>
            <button class="period-btn" data-period="Weekly">Weekly</button>
            <button class="period-btn" data-period="Monthly">Monthly</button>
            <button class="period-btn" data-period="Yearly">Yearly</button>
          </div>
          <div class="date-row" id="invDateRow">
            <input type="date" id="invDateFrom" value="${fmtDateInput(new Date(Date.now()-13*24*3600000))}">
            <span class="date-sep">to</span>
            <input type="date" id="invDateTo" value="${fmtDateInput(new Date())}">
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <span style="font-size:12px;color:var(--on-surface-variant)">Advanced Filters</span>
        </div>
      </div>

      <div class="filters-bar">
        <input class="search-input" id="invSearch" placeholder="Search products, brands…" value="${filters.search || ''}">
        <select class="filter-select" id="invCatFilter">
          <option value="">All Categories</option>
          ${cats.map(c => `<option value="${c}" ${filters.category===c?'selected':''}>${c}</option>`).join('')}
        </select>
        <select class="filter-select" id="invStatusFilter">
          <option value="">All Status</option>
          <option value="In Stock" ${filters.status==='In Stock'?'selected':''}>In Stock</option>
          <option value="Low Stock" ${filters.status==='Low Stock'?'selected':''}>Low Stock</option>
          <option value="Out of Stock" ${filters.status==='Out of Stock'?'selected':''}>Out of Stock</option>
        </select>
        <button class="btn-primary btn-sm" id="invSearchBtn">Search</button>
      </div>

      <div class="table-wrapper">
        <table>
          <thead><tr>
            <th>Product Details</th><th>Brand</th><th>Quantity</th>
            <th>Unit Cost</th><th>Real-Time Status</th><th>Actions</th>
          </tr></thead>
          <tbody>
            ${page.length ? page.map(item => `
              <tr>
                <td>
                  <div class="product-cell">
                    <div class="product-emoji">${item.image_emoji || '🌿'}</div>
                    <div>
                      <div class="product-name">${item.name}</div>
                      <div class="product-desc">${item.description || ''} ${item.category ? '• ' + item.category : ''}</div>
                    </div>
                  </div>
                </td>
                <td>${item.brand ? `<span style="background:var(--surface-container);padding:3px 8px;border-radius:6px;font-size:11px;font-weight:700">${item.brand}</span>` : '—'}</td>
                <td><b>${fmt(item.quantity)}</b> <span style="color:var(--on-surface-variant);font-size:12px">${item.unit}</span></td>
                <td class="td-money">${fmtMoney(item.unit_cost)}</td>
                <td>${statusChip(item.status)}</td>
                <td>
                  <div style="display:flex;gap:4px">
                    <button class="btn-icon" onclick="editInventoryItem(${item.id})" title="Edit">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-icon danger" onclick="deleteInventoryItem(${item.id})" title="Delete">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('') : '<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">🌿</div><div class="empty-text">No inventory items found</div></div></td></tr>'}
          </tbody>
        </table>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding-top:12px">
        <span class="page-info">Showing ${((invPage-1)*invPageSize)+1}–${Math.min(invPage*invPageSize, all.length)} of ${all.length} product variants</span>
        <div class="pagination">
          <button class="page-arrow" onclick="invChangePage(${invPage-1})" ${invPage===1?'disabled':''}>‹</button>
          ${Array.from({length: Math.min(totalPages,5)}, (_,i) => i+1).map(p => `<button class="page-num ${p===invPage?'active':''}" onclick="invChangePage(${p})">${p}</button>`).join('')}
          <button class="page-arrow" onclick="invChangePage(${invPage+1})" ${invPage===totalPages?'disabled':''}>›</button>
        </div>
      </div>
    </div>

    <div class="two-col">
      <div class="card">
        <div style="font-family:'Manrope',sans-serif;font-size:15px;font-weight:700;margin-bottom:12px">Real-Time Movement Log</div>
        <div style="display:flex;flex-direction:column;gap:10px" id="movementLog">
          <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(173,180,167,0.15)">
            <div style="width:28px;height:28px;background:var(--success-container);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;color:var(--success);font-weight:700">+</div>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:600">Restock: Evergreen Oak Saplings</div>
              <div style="font-size:11px;color:var(--on-surface-variant)">Warehouse A • Gate 02</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:13px;font-weight:700;color:var(--success)">+500 Units</div>
              <div style="font-size:11px;color:var(--on-surface-variant)">2 mins ago</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;padding:10px 0">
            <div style="width:28px;height:28px;background:var(--error-container);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;color:var(--error);font-weight:700">−</div>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:600">Sale: Monstera Deliciosa</div>
              <div style="font-size:11px;color:var(--on-surface-variant)">Customer Order #8921</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:13px;font-weight:700;color:var(--error)">-120 Units</div>
              <div style="font-size:11px;color:var(--on-surface-variant)">14 mins ago</div>
            </div>
          </div>
        </div>
      </div>
      <div class="panel">
        <div style="font-size:24px;margin-bottom:8px">📦</div>
        <div class="panel-title">Warehouse Optimization</div>
        <div class="panel-desc">Your current layout uses 84% of vertical space efficiently. Consider re-organizing Section D.</div>
        <button class="panel-btn" onclick="navigate('reports')">View Analytics</button>
      </div>
    </div>

    <div style="text-align:center;margin-top:24px;font-size:11px;color:var(--on-surface-variant)">
      © 2024 GREEN BOTANICAL LEDGER SYSTEM • PROPRIETARY INVENTORY INTELLIGENCE
    </div>
  `;

  // wire up
  document.getElementById('btnInvAddPurchase').addEventListener('click', () => showAddPurchaseModal());
  document.getElementById('btnInvAddSale').addEventListener('click', () => showAddSaleModal());
  document.getElementById('btnInvAddItem').addEventListener('click', () => showAddInventoryModal());
  document.getElementById('invSearchBtn').addEventListener('click', () => {
    invPage = 1;
    renderInventory({
      search: document.getElementById('invSearch').value,
      category: document.getElementById('invCatFilter').value,
      status: document.getElementById('invStatusFilter').value,
    });
  });
  document.getElementById('invSearch').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('invSearchBtn').click();
  });
  container.querySelectorAll('[data-period]').forEach(btn => {
    btn.addEventListener('click', function() {
      container.querySelectorAll('[data-period]').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });
}

window.invChangePage = (p) => {
  const totalPages = Math.ceil(invData.length / invPageSize);
  if (p < 1 || p > totalPages) return;
  invPage = p;
  renderInventory(invFilters);
};

window.editInventoryItem = async (id) => {
  const all = await window.api.getInventory({});
  const item = all.find(i => i.id === id);
  if (!item) return;
  const cats = await window.api.getCategories();
  showModal(`
    <div class="modal-title">Edit Inventory Item</div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Name *</label>
        <input class="form-input" id="ei_name" value="${item.name || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Emoji Icon</label>
        <input class="form-input" id="ei_emoji" value="${item.image_emoji || '🌿'}" maxlength="4">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Brand</label>
        <input class="form-input" id="ei_brand" value="${item.brand || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Category</label>
        <input class="form-input" id="ei_category" value="${item.category || ''}" list="catsList">
        <datalist id="catsList">${cats.map(c => `<option value="${c}">`).join('')}</datalist>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <input class="form-input" id="ei_desc" value="${item.description || ''}">
    </div>
    <div class="form-row-3">
      <div class="form-group">
        <label class="form-label">Quantity</label>
        <input class="form-input" id="ei_qty" type="number" value="${item.quantity || 0}">
      </div>
      <div class="form-group">
        <label class="form-label">Unit</label>
        <input class="form-input" id="ei_unit" value="${item.unit || 'Units'}">
      </div>
      <div class="form-group">
        <label class="form-label">Unit Cost ($)</label>
        <input class="form-input" id="ei_cost" type="number" step="0.01" value="${item.unit_cost || 0}">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveEditInventory(${item.id})">Save Changes</button>
    </div>
  `);
};

window.saveEditInventory = async (id) => {
  const item = {
    id,
    name: document.getElementById('ei_name').value.trim(),
    brand: document.getElementById('ei_brand').value.trim(),
    category: document.getElementById('ei_category').value.trim(),
    description: document.getElementById('ei_desc').value.trim(),
    quantity: parseFloat(document.getElementById('ei_qty').value) || 0,
    unit: document.getElementById('ei_unit').value.trim() || 'KG',
    unit_cost: parseFloat(document.getElementById('ei_cost').value) || 0,
    image_emoji: document.getElementById('ei_emoji').value || '🌿',
  };
  if (!item.name) { showToast('Name is required', 'error'); return; }
  await window.api.updateInventory(item);
  closeModal();
  showToast('Item updated successfully');
  updateStorageBar();
  renderInventory(invFilters);
};

window.deleteInventoryItem = async (id) => {
  showModal(`
    <div class="modal-title">Delete Item</div>
    <p style="font-size:13.5px;color:var(--on-surface-variant);margin-bottom:20px">Are you sure you want to delete this inventory item? This action cannot be undone.</p>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-danger" onclick="confirmDeleteInventory(${id})">Delete</button>
    </div>
  `);
};

window.confirmDeleteInventory = async (id) => {
  await window.api.deleteInventory(id);
  closeModal();
  showToast('Item deleted');
  updateStorageBar();
  renderInventory(invFilters);
};

/* ══════════════════════════════════════════════════════════════════════
   SALES PAGE
══════════════════════════════════════════════════════════════════════ */
let salesTab = 'manufacture';
let salesTabLimit = 8;

async function renderSales() {
  const container = document.getElementById('pageContainer');

  const allSales = await window.api.getSales({});
  const totalRevenue = allSales.reduce((s,r) => s + (r.total_value||0), 0);
  const totalUnits = allSales.reduce((s,r) => s + (r.quantity||0), 0);
  const scrapSales = allSales.filter(r => r.category === 'Scrap Sale');
  const scrapRevenue = scrapSales.reduce((s,r) => s + (r.total_value||0), 0);

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
      <div>
        <h1 class="page-title">Sales Categories</h1>
        <p class="page-subtitle">Detailed tracking for botanical distributions and byproduct management.</p>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <div class="date-row">
          <input type="date" id="salesDateFrom" value="${fmtDateInput(new Date(new Date().getFullYear(), 0, 1))}">
          <span class="date-sep">–</span>
          <input type="date" id="salesDateTo" value="${fmtDateInput(new Date())}">
          <select class="filter-select" style="margin-left:4px">
            <option>Custom Range: Jan 01 - Jan 31, 2024</option>
          </select>
        </div>
      </div>
    </div>

    <div class="top-metrics">
      <div class="metric-card">
        <div class="metric-label">Monthly Volume</div>
        <div style="font-size:20px;margin-bottom:4px">🏭</div>
        <div class="metric-value">${fmt(totalUnits)}</div>
        <div class="metric-sub">Units Manufactured</div>
        <div class="storage-bar" style="margin-top:8px"><div class="storage-fill" style="width:72%"></div></div>
      </div>
      <div class="metric-card" style="background:var(--error-container)">
        <div class="metric-label">Efficiency Loss</div>
        <div style="font-size:20px;margin-bottom:4px">♻️</div>
        <div class="metric-value" style="color:var(--error)">4.2%</div>
        <div class="metric-sub">Total Scrap Weight</div>
        <div class="metric-change neg" style="margin-top:4px">-0.8% vs last month</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Revenue</div>
        <div style="font-size:20px;margin-bottom:4px">🚚</div>
        <div class="metric-value">${totalRevenue >= 1000 ? '$' + (totalRevenue/1000).toFixed(1) + 'k' : fmtMoney(totalRevenue)}</div>
        <div class="metric-sub">Direct Sales Value</div>
        <div class="metric-change pos" style="margin-top:4px">+12% Growth</div>
      </div>
    </div>

    <div class="two-col" style="gap:24px">
      <div>
        <div class="tab-bar">
          <button class="tab-btn ${salesTab==='manufacture'?'active':''}" data-tab="manufacture">Manufacture Sales</button>
          <button class="tab-btn ${salesTab==='scrap'?'active':''}" data-tab="scrap">Scrap Sales</button>
          <button class="tab-btn ${salesTab==='direct'?'active':''}" data-tab="direct">Direct Sales</button>
        </div>
        <div class="card" style="padding:0">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px">
            <span style="font-family:'Manrope',sans-serif;font-size:15px;font-weight:700">Transaction Ledger</span>
            <div style="display:flex;gap:8px">
              <div class="date-row">
                <input type="date" class="form-input" style="padding:5px 10px;font-size:12px">
                <span class="date-sep">Date Range</span>
              </div>
              <button class="btn-secondary btn-sm">Filter View</button>
              <button class="btn-primary btn-sm" onclick="showAddSaleModal()">+ Add</button>
            </div>
          </div>
          <div class="table-wrapper">
            <table>
              <thead><tr>
                <th>Product & Brand</th><th>Specification</th><th>Quantity</th><th>Status</th>
              </tr></thead>
              <tbody id="salesTableBody">
                <tr><td colspan="4" style="text-align:center;padding:20px;color:var(--on-surface-variant)">Loading…</td></tr>
              </tbody>
            </table>
          </div>
          <div style="padding:14px 18px;text-align:center">
            <button class="btn-secondary" id="loadMoreSales">LOAD MORE TRANSACTIONS</button>
          </div>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="panel">
          <div style="font-family:'Manrope',sans-serif;font-size:15px;font-weight:800;margin-bottom:8px">Optimizing Scrap Generation</div>
          <div style="font-size:12px;opacity:0.85;margin-bottom:14px;line-height:1.5">Current recycling efficiency is at an all-time high of 94.2%. Redirecting surplus organics to manufacture-grade compost.</div>
          <button class="panel-btn" onclick="navigate('reports')">View Detailed Analytics</button>
        </div>

        <div class="card" style="padding:16px">
          <div style="font-size:12px;font-weight:700;color:var(--on-surface-variant);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px">Top Brands (Direct Sales)</div>
          <div style="display:flex;flex-direction:column;gap:10px" id="topBrands">
            <div style="display:flex;justify-content:space-between;align-items:center"><span style="display:flex;align-items:center;gap:6px"><span class="dot dot-green"></span>Evergreen Nursery</span><b>$12.4k</b></div>
            <div style="display:flex;justify-content:space-between;align-items:center"><span style="display:flex;align-items:center;gap:6px"><span class="dot dot-green"></span>Botanical Imports</span><b>$8.1k</b></div>
            <div style="display:flex;justify-content:space-between;align-items:center"><span style="display:flex;align-items:center;gap:6px"><span class="dot dot-green"></span>Arid Flora</span><b>$4.2k</b></div>
          </div>
        </div>

        <div class="card" style="padding:16px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <div style="font-size:18px">📄</div>
            <div style="font-size:13px;font-weight:700">Monthly Ledger Export</div>
          </div>
          <button class="btn-secondary" style="width:100%" onclick="exportSalesCSV()">⬇ Download CSV</button>
        </div>
      </div>
    </div>
  `;

  // load tab
  salesTabLimit = 8;
  await loadSalesTab(salesTab, allSales);

  // tab switching
  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', async function() {
      container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      salesTab = this.dataset.tab;
      salesTabLimit = 8;
      await loadSalesTab(salesTab, allSales);
    });
  });

  // load more
  document.getElementById('loadMoreSales').addEventListener('click', async () => {
    salesTabLimit += 8;
    await loadSalesTab(salesTab, allSales);
  });
}

async function loadSalesTab(tab, allSales) {
  const tbody = document.getElementById('salesTableBody');
  if (!tbody) return;

  let rows = [];
  if (tab === 'manufacture') {
    const mfg = await window.api.getReportManufacture({});
    const slice = (mfg.rows || []).slice(0, salesTabLimit);
    rows = slice.map(r => `
      <tr>
        <td>
          <div class="product-cell">
            <div class="product-emoji">🌿</div>
            <div><div class="product-name">${r.product_name}</div><div class="product-desc">${r.brand || ''}</div></div>
          </div>
        </td>
        <td><span style="background:var(--surface-container);padding:3px 8px;border-radius:6px;font-size:11px">${r.specification || '—'}</span></td>
        <td><b>${fmt(r.quantity)}</b> ${r.unit}</td>
        <td>${chip(r.status)}</td>
      </tr>
    `);
    const btn = document.getElementById('loadMoreSales');
    if (btn) btn.style.display = slice.length < (mfg.rows || []).length ? '' : 'none';
  } else if (tab === 'scrap') {
    const scrap = await window.api.getReportScrap({});
    const slice = (scrap.rows || []).slice(0, salesTabLimit);
    rows = slice.map(r => `
      <tr>
        <td><div class="product-name">${r.product_name}</div></td>
        <td>${r.reason || '—'}</td>
        <td><b>${fmt(r.quantity)}</b> ${r.unit}</td>
        <td>${chip(r.status)}</td>
      </tr>
    `);
    const btn = document.getElementById('loadMoreSales');
    if (btn) btn.style.display = slice.length < (scrap.rows || []).length ? '' : 'none';
  } else {
    const filtered = allSales.filter(r => r.category !== 'Scrap Sale' && r.category !== 'Manufacture Sale');
    const slice = filtered.slice(0, salesTabLimit);
    rows = slice.map(r => `
      <tr>
        <td>
          <div class="product-cell">
            <div class="product-emoji">🌿</div>
            <div><div class="product-name">${r.product_name}</div><div class="product-desc">${r.customer || ''}</div></div>
          </div>
        </td>
        <td>${r.notes || '—'}</td>
        <td><b>${fmt(r.quantity)}</b> ${r.unit}</td>
        <td>${chip(r.status)}</td>
        <td>
          <button class="btn-icon danger" onclick="deleteSaleRow(${r.id})" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </td>
      </tr>
    `);
    const btn = document.getElementById('loadMoreSales');
    if (btn) btn.style.display = slice.length < filtered.length ? '' : 'none';
  }

  tbody.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="5" class="empty-state"><div class="empty-icon">📊</div><div class="empty-text">No transactions</div></td></tr>';
}

window.deleteSaleRow = (id) => {
  showModal(`
    <div class="modal-title">Delete Sale</div>
    <p style="font-size:13.5px;color:var(--on-surface-variant);margin-bottom:20px">Are you sure you want to delete this sale record? This action cannot be undone.</p>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-danger" onclick="confirmDeleteSale(${id})">Delete</button>
    </div>
  `);
};

window.confirmDeleteSale = async (id) => {
  await window.api.deleteSale(id);
  closeModal();
  showToast('Sale deleted');
  renderSales();
};

window.exportSalesCSV = async () => {
  const data = await window.api.getSales({});
  const csv = ['ID,Product,Customer,Qty,Unit,Unit Price,Total,Status,Date',
    ...data.map(r => `${r.transaction_id},"${r.product_name}","${r.customer||''}",${r.quantity},${r.unit},${r.unit_price},${r.total_value},${r.status},${r.sale_date}`)
  ].join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'sales-export.csv'; a.click();
  URL.revokeObjectURL(url);
  showToast('CSV exported successfully');
};

/* ══════════════════════════════════════════════════════════════════════
   REPORTS PAGE
══════════════════════════════════════════════════════════════════════ */
let reportType = 'sales';
let reportDateFrom = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10);
let reportDateTo = new Date().toISOString().slice(0,10);

async function renderReports() {
  const container = document.getElementById('pageContainer');

  container.innerHTML = `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px">
      <div>
        <h1 class="page-title">Reports</h1>
        <p class="page-subtitle" style="max-width:420px">Analyze your botanical assets with high-precision ledgers and performance metrics across your entire inventory lifecycle.</p>
      </div>
      <div>
        <div style="display:flex;gap:6px;margin-bottom:10px">
          <button class="period-btn active" data-rp="daily">DAILY</button>
          <button class="period-btn" data-rp="weekly">WEEKLY</button>
          <button class="period-btn" data-rp="monthly">MONTHLY</button>
          <button class="period-btn" data-rp="yearly">YEARLY</button>
        </div>
        <div class="date-row" id="reportDateRow">
          <input type="date" id="rpDateFrom" value="${reportDateFrom}">
          <span class="date-sep">TO</span>
          <input type="date" id="rpDateTo" value="${reportDateTo}">
          <button class="refresh-btn" id="rpRefresh" title="Refresh">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
          </button>
        </div>
      </div>
    </div>

    <div class="report-cards-grid">
      <div class="report-card ${reportType==='sales'?'selected':''}" data-rtype="sales">
        <div class="report-card-icon" style="background:#e8f0e5">📈</div>
        <div class="report-card-title">Sales Report</div>
        <div class="report-card-desc">Revenue and volume analysis.</div>
        <button class="select-type-btn">SELECT TYPE ›</button>
      </div>
      <div class="report-card ${reportType==='purchase'?'selected':''}" data-rtype="purchase">
        <div class="report-card-icon" style="background:#e8f0e5">🛒</div>
        <div class="report-card-title">Total Purchase</div>
        <div class="report-card-desc">Procurement history and costs.</div>
        <button class="select-type-btn">SELECT TYPE ›</button>
      </div>
      <div class="report-card ${reportType==='stock'?'selected':''}" data-rtype="stock">
        <div class="report-card-icon" style="background:#fef9e7">📦</div>
        <div class="report-card-title">Total Stock</div>
        <div class="report-card-desc">Current availability and value.</div>
        <button class="select-type-btn">SELECT TYPE ›</button>
      </div>
      <div class="side-report-cards">
        <div class="side-report-card ${reportType==='manufacture'?'selected':''}" data-rtype="manufacture">
          <div class="side-report-icon" style="background:var(--surface-container)">🏭</div>
          <div>
            <div style="font-size:13px;font-weight:700">Manufacture Report</div>
            <div style="font-size:11px;color:var(--on-surface-variant)">Production and yield data</div>
          </div>
        </div>
        <div class="side-report-card ${reportType==='scrap'?'selected':''}" data-rtype="scrap">
          <div class="side-report-icon" style="background:var(--error-container)">🗑️</div>
          <div>
            <div style="font-size:13px;font-weight:700">Scrap Report</div>
            <div style="font-size:11px;color:var(--on-surface-variant)">Loss and wastage metrics</div>
          </div>
        </div>
      </div>
    </div>

    <div id="reportPreview"></div>
  `;

  // wire report type selectors
  container.querySelectorAll('[data-rtype]').forEach(el => {
    el.addEventListener('click', async function() {
      reportType = this.dataset.rtype;
      container.querySelectorAll('[data-rtype]').forEach(e => e.classList.remove('selected'));
      this.classList.add('selected');
      await loadReportPreview();
    });
  });

  container.getElementById && null; // noop

  document.getElementById('rpRefresh').addEventListener('click', async () => {
    reportDateFrom = document.getElementById('rpDateFrom').value;
    reportDateTo = document.getElementById('rpDateTo').value;
    await loadReportPreview();
  });

  container.querySelectorAll('[data-rp]').forEach(btn => {
    btn.addEventListener('click', function() {
      container.querySelectorAll('[data-rp]').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });

  await loadReportPreview();
}

async function loadReportPreview() {
  const el = document.getElementById('reportPreview');
  if (!el) return;

  const filters = { dateFrom: reportDateFrom, dateTo: reportDateTo };
  const dateLabel = `${fmtDate(reportDateFrom)} - ${fmtDate(reportDateTo)}`;
  const typeName = { sales:'SALES REPORT', purchase:'PURCHASE REPORT', stock:'STOCK REPORT', manufacture:'MANUFACTURE REPORT', scrap:'SCRAP REPORT' }[reportType] || 'REPORT';

  el.innerHTML = `
    <div class="preview-bar">
      <span class="preview-badge"><span class="preview-dot"></span>PREVIEWING: ${typeName}</span>
      <span class="preview-date">📅 ${dateLabel}</span>
      <div class="preview-actions">
        <button class="btn-accent" onclick="navigate('reports')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          View Report
        </button>
        <button class="btn-secondary" onclick="downloadReportCSV()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download CSV
        </button>
        <button class="btn-primary" onclick="downloadReportPDF()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
          Download PDF
        </button>
      </div>
    </div>
    <div id="reportTable" class="card" style="padding:0">
      <div style="padding:20px;text-align:center;color:var(--on-surface-variant)">Loading report…</div>
    </div>
  `;

  await loadReportTable(reportType, filters);
}

async function loadReportTable(type, filters) {
  const el = document.getElementById('reportTable');
  if (!el) return;

  if (type === 'sales') {
    const data = await window.api.getReportSales(filters);
    const rows = data.rows || [];
    const t = data.totals || {};
    el.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead><tr>
            <th>ID</th><th>Botanical Entity</th><th>Quantity</th><th>Unit Price</th><th>Total Value</th><th>Status</th>
          </tr></thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td class="td-green">#${r.transaction_id}</td>
                <td>
                  <div class="product-cell">
                    <div class="product-emoji" style="width:28px;height:28px;font-size:16px">🌿</div>
                    <span class="td-bold">${r.product_name}</span>
                  </div>
                </td>
                <td>${fmt(r.quantity)} ${r.unit}</td>
                <td class="td-money">${fmtMoney(r.unit_price)}</td>
                <td class="td-money td-bold">${fmtMoney(r.total_value)}</td>
                <td>${chip(r.status)}</td>
              </tr>
            `).join('') || '<tr><td colspan="6" class="empty-state"><div class="empty-icon">📊</div><div class="empty-text">No sales data</div></td></tr>'}
          </tbody>
        </table>
      </div>
      <div class="report-summary">
        <div class="summary-item"><div class="summary-label">Items Sold</div><div class="summary-value">${fmt(t.items || 0)}</div></div>
        <div class="summary-item"><div class="summary-label">Average Margin</div><div class="summary-value">34.2%</div></div>
        <div class="summary-item"><div class="summary-label">Net Total</div><div class="summary-value">${fmtMoney(t.revenue || 0)}</div></div>
      </div>
    `;
  } else if (type === 'purchase') {
    const data = await window.api.getReportPurchases(filters);
    const rows = data.rows || [];
    const t = data.totals || {};
    el.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead><tr>
            <th>ID</th><th>Product</th><th>Vendor</th><th>Quantity</th><th>Unit Cost</th><th>Total</th><th>Status</th>
          </tr></thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td class="td-green">#${r.transaction_id}</td>
                <td class="td-bold">${r.product_name}</td>
                <td class="td-muted">${r.vendor || '—'}</td>
                <td>${fmt(r.quantity)} ${r.unit}</td>
                <td class="td-money">${fmtMoney(r.unit_cost)}</td>
                <td class="td-money td-bold">${fmtMoney(r.total_value)}</td>
                <td>${chip(r.status)}</td>
              </tr>
            `).join('') || '<tr><td colspan="7" class="empty-state"><div class="empty-icon">🛒</div><div class="empty-text">No purchase data</div></td></tr>'}
          </tbody>
        </table>
      </div>
      <div class="report-summary">
        <div class="summary-item"><div class="summary-label">Items Purchased</div><div class="summary-value">${fmt(t.items || 0)}</div></div>
        <div class="summary-item"><div class="summary-label">Total Cost</div><div class="summary-value">${fmtMoney(t.cost || 0)}</div></div>
      </div>
    `;
  } else if (type === 'stock') {
    const data = await window.api.getReportStock();
    const rows = data.rows || [];
    const t = data.totals || {};
    el.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead><tr>
            <th>Product</th><th>Category</th><th>Brand</th><th>Quantity</th><th>Unit Cost</th><th>Total Value</th><th>Status</th>
          </tr></thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td>
                  <div class="product-cell">
                    <div class="product-emoji" style="font-size:16px;width:28px;height:28px">${r.image_emoji||'🌿'}</div>
                    <span class="td-bold">${r.name}</span>
                  </div>
                </td>
                <td class="td-muted">${r.category || '—'}</td>
                <td class="td-muted">${r.brand || '—'}</td>
                <td><b>${fmt(r.quantity)}</b> ${r.unit}</td>
                <td class="td-money">${fmtMoney(r.unit_cost)}</td>
                <td class="td-money td-bold">${fmtMoney(r.quantity * r.unit_cost)}</td>
                <td>${statusChip(r.status)}</td>
              </tr>
            `).join('') || '<tr><td colspan="7" class="empty-state"><div class="empty-icon">📦</div><div class="empty-text">No stock data</div></td></tr>'}
          </tbody>
        </table>
      </div>
      <div class="report-summary">
        <div class="summary-item"><div class="summary-label">Total Items</div><div class="summary-value">${fmt(t.count || 0)}</div></div>
        <div class="summary-item"><div class="summary-label">Total Qty</div><div class="summary-value">${fmt(t.total_qty || 0)}</div></div>
        <div class="summary-item"><div class="summary-label">Total Value</div><div class="summary-value">${fmtMoney(t.total_value || 0)}</div></div>
      </div>
    `;
  } else if (type === 'manufacture') {
    const data = await window.api.getReportManufacture(filters);
    const rows = data.rows || [];
    el.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead><tr>
            <th>ID</th><th>Product</th><th>Brand</th><th>Specification</th><th>Quantity</th><th>Status</th><th>Date</th>
          </tr></thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td class="td-green">#${r.transaction_id}</td>
                <td class="td-bold">${r.product_name}</td>
                <td class="td-muted">${r.brand || '—'}</td>
                <td><span style="background:var(--surface-container);padding:3px 8px;border-radius:6px;font-size:11px">${r.specification || '—'}</span></td>
                <td><b>${fmt(r.quantity)}</b> ${r.unit}</td>
                <td>${chip(r.status)}</td>
                <td class="td-muted">${fmtDate(r.manufacture_date)}</td>
              </tr>
            `).join('') || '<tr><td colspan="7" class="empty-state"><div class="empty-icon">🏭</div><div class="empty-text">No manufacture data</div></td></tr>'}
          </tbody>
        </table>
      </div>
      <div class="report-summary">
        <div class="summary-item"><div class="summary-label">Batches</div><div class="summary-value">${fmt(data.totals?.count || 0)}</div></div>
        <div class="summary-item"><div class="summary-label">Total Units</div><div class="summary-value">${fmt(data.totals?.total_qty || 0)}</div></div>
      </div>
    `;
  } else if (type === 'scrap') {
    const data = await window.api.getReportScrap(filters);
    const rows = data.rows || [];
    el.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead><tr>
            <th>ID</th><th>Product</th><th>Quantity</th><th>Reason</th><th>Value Lost</th><th>Status</th><th>Date</th>
          </tr></thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td class="td-green">#${r.transaction_id}</td>
                <td class="td-bold">${r.product_name}</td>
                <td>${fmt(r.quantity)} ${r.unit}</td>
                <td class="td-muted">${r.reason || '—'}</td>
                <td class="td-money" style="color:var(--error)">${fmtMoney(r.value_lost)}</td>
                <td>${chip(r.status)}</td>
                <td class="td-muted">${fmtDate(r.scrap_date)}</td>
              </tr>
            `).join('') || '<tr><td colspan="7" class="empty-state"><div class="empty-icon">♻️</div><div class="empty-text">No scrap data</div></td></tr>'}
          </tbody>
        </table>
      </div>
      <div class="report-summary">
        <div class="summary-item"><div class="summary-label">Scrap Events</div><div class="summary-value">${fmt(data.totals?.count || 0)}</div></div>
        <div class="summary-item"><div class="summary-label">Total Loss</div><div class="summary-value" style="color:var(--error)">${fmtMoney(data.totals?.total_loss || 0)}</div></div>
      </div>
    `;
  }
}

window.printReport = () => window.print();

window.downloadReportPDF = async () => {
  const filters = { dateFrom: reportDateFrom, dateTo: reportDateTo };
  const typeNames = { sales:'Sales Report', purchase:'Purchase Report', stock:'Stock Report', manufacture:'Manufacture Report', scrap:'Scrap Report' };
  const typeName = typeNames[reportType] || 'Report';
  const dateLabel = `${fmtDate(reportDateFrom)} — ${fmtDate(reportDateTo)}`;

  let tableHTML = '';
  let summaryHTML = '';

  if (reportType === 'sales') {
    const data = await window.api.getReportSales(filters);
    const rows = data.rows || [];
    const t = data.totals || {};
    const total = rows.reduce((s,r) => s+(r.total_value||0), 0);
    tableHTML = `
      <table>
        <thead><tr><th>#</th><th>Transaction ID</th><th>Product</th><th>Customer</th><th>Qty (KG)</th><th>Unit Price</th><th>Total Value</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>
          ${rows.length ? rows.map((r,i) => `<tr class="${i%2===0?'even':''}">
            <td>${i+1}</td><td>${r.transaction_id}</td><td>${r.product_name}</td><td>${r.customer||'—'}</td>
            <td>${fmt(r.quantity)} ${r.unit}</td><td>₹${fmt(r.unit_price)}</td>
            <td class="money">₹${fmt(r.total_value)}</td><td><span class="status-chip">${r.status}</span></td><td>${fmtDate(r.sale_date)}</td>
          </tr>`).join('') : '<tr><td colspan="9" style="text-align:center;padding:20px">No records found</td></tr>'}
        </tbody>
      </table>`;
    summaryHTML = `
      <div class="summary-box">
        <div class="summary-item"><div class="summary-label">Total Transactions</div><div class="summary-value">${rows.length}</div></div>
        <div class="summary-item"><div class="summary-label">Total Qty Sold (KG)</div><div class="summary-value">${fmt(t.items||0)}</div></div>
        <div class="summary-item highlight"><div class="summary-label">Total Revenue</div><div class="summary-value">₹${fmt(t.revenue||0)}</div></div>
      </div>`;
  } else if (reportType === 'purchase') {
    const data = await window.api.getReportPurchases(filters);
    const rows = data.rows || [];
    const t = data.totals || {};
    tableHTML = `
      <table>
        <thead><tr><th>#</th><th>Transaction ID</th><th>Product</th><th>Vendor</th><th>Qty (KG)</th><th>Unit Cost</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>
          ${rows.length ? rows.map((r,i) => `<tr class="${i%2===0?'even':''}">
            <td>${i+1}</td><td>${r.transaction_id}</td><td>${r.product_name}</td><td>${r.vendor||'—'}</td>
            <td>${fmt(r.quantity)} ${r.unit}</td><td>₹${fmt(r.unit_cost)}</td>
            <td class="money">₹${fmt(r.total_value)}</td><td><span class="status-chip">${r.status}</span></td><td>${fmtDate(r.purchase_date)}</td>
          </tr>`).join('') : '<tr><td colspan="9" style="text-align:center;padding:20px">No records found</td></tr>'}
        </tbody>
      </table>`;
    summaryHTML = `
      <div class="summary-box">
        <div class="summary-item"><div class="summary-label">Total Orders</div><div class="summary-value">${rows.length}</div></div>
        <div class="summary-item"><div class="summary-label">Total Qty (KG)</div><div class="summary-value">${fmt(t.items||0)}</div></div>
        <div class="summary-item highlight"><div class="summary-label">Total Cost</div><div class="summary-value">₹${fmt(t.cost||0)}</div></div>
      </div>`;
  } else if (reportType === 'stock') {
    const data = await window.api.getReportStock();
    const rows = data.rows || [];
    const t = data.totals || {};
    tableHTML = `
      <table>
        <thead><tr><th>#</th><th>Product ID</th><th>Name</th><th>Category</th><th>Brand</th><th>Qty (KG)</th><th>Unit Cost</th><th>Total Value</th><th>Status</th></tr></thead>
        <tbody>
          ${rows.length ? rows.map((r,i) => `<tr class="${i%2===0?'even':''}">
            <td>${i+1}</td><td>${r.product_id}</td><td>${r.name}</td><td>${r.category||'—'}</td><td>${r.brand||'—'}</td>
            <td>${fmt(r.quantity)} ${r.unit}</td><td>₹${fmt(r.unit_cost)}</td>
            <td class="money">₹${fmt(r.quantity*r.unit_cost)}</td><td><span class="status-chip">${r.status}</span></td>
          </tr>`).join('') : '<tr><td colspan="9" style="text-align:center;padding:20px">No records found</td></tr>'}
        </tbody>
      </table>`;
    summaryHTML = `
      <div class="summary-box">
        <div class="summary-item"><div class="summary-label">Total Products</div><div class="summary-value">${fmt(t.count||0)}</div></div>
        <div class="summary-item"><div class="summary-label">Total Qty (KG)</div><div class="summary-value">${fmt(t.total_qty||0)}</div></div>
        <div class="summary-item highlight"><div class="summary-label">Total Stock Value</div><div class="summary-value">₹${fmt(t.total_value||0)}</div></div>
      </div>`;
  } else if (reportType === 'manufacture') {
    const data = await window.api.getReportManufacture(filters);
    const rows = data.rows || [];
    const t = data.totals || {};
    tableHTML = `
      <table>
        <thead><tr><th>#</th><th>Transaction ID</th><th>Product</th><th>Brand</th><th>Specification</th><th>Qty (KG)</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>
          ${rows.length ? rows.map((r,i) => `<tr class="${i%2===0?'even':''}">
            <td>${i+1}</td><td>${r.transaction_id}</td><td>${r.product_name}</td><td>${r.brand||'—'}</td>
            <td>${r.specification||'—'}</td><td>${fmt(r.quantity)} ${r.unit}</td>
            <td><span class="status-chip">${r.status}</span></td><td>${fmtDate(r.manufacture_date)}</td>
          </tr>`).join('') : '<tr><td colspan="8" style="text-align:center;padding:20px">No records found</td></tr>'}
        </tbody>
      </table>`;
    summaryHTML = `
      <div class="summary-box">
        <div class="summary-item"><div class="summary-label">Total Batches</div><div class="summary-value">${fmt(t.count||0)}</div></div>
        <div class="summary-item highlight"><div class="summary-label">Total Qty (KG)</div><div class="summary-value">${fmt(t.total_qty||0)}</div></div>
      </div>`;
  } else if (reportType === 'scrap') {
    const data = await window.api.getReportScrap(filters);
    const rows = data.rows || [];
    const t = data.totals || {};
    tableHTML = `
      <table>
        <thead><tr><th>#</th><th>Transaction ID</th><th>Product</th><th>Qty (KG)</th><th>Reason</th><th>Value Lost</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>
          ${rows.length ? rows.map((r,i) => `<tr class="${i%2===0?'even':''}">
            <td>${i+1}</td><td>${r.transaction_id}</td><td>${r.product_name}</td>
            <td>${fmt(r.quantity)} ${r.unit}</td><td>${r.reason||'—'}</td>
            <td class="money loss">₹${fmt(r.value_lost)}</td>
            <td><span class="status-chip">${r.status}</span></td><td>${fmtDate(r.scrap_date)}</td>
          </tr>`).join('') : '<tr><td colspan="8" style="text-align:center;padding:20px">No records found</td></tr>'}
        </tbody>
      </table>`;
    summaryHTML = `
      <div class="summary-box">
        <div class="summary-item"><div class="summary-label">Scrap Events</div><div class="summary-value">${fmt(t.count||0)}</div></div>
        <div class="summary-item"><div class="summary-label">Total Qty (KG)</div><div class="summary-value">${fmt(t.total_qty||0)}</div></div>
        <div class="summary-item highlight loss"><div class="summary-label">Total Value Lost</div><div class="summary-value">₹${fmt(t.total_loss||0)}</div></div>
      </div>`;
  }

  const printWin = window.open('', '_blank');
  printWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${typeName}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; padding: 24px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:16px; border-bottom:3px solid #2d6a2d; margin-bottom:20px; }
    .brand { display:flex; flex-direction:column; gap:2px; }
    .brand-name { font-size:22px; font-weight:800; color:#2d6a2d; letter-spacing:-0.5px; }
    .brand-sub { font-size:10px; font-weight:600; color:#666; letter-spacing:0.1em; text-transform:uppercase; }
    .report-info { text-align:right; }
    .report-title { font-size:16px; font-weight:700; color:#2d6a2d; margin-bottom:4px; }
    .report-date { font-size:11px; color:#666; }
    .report-generated { font-size:10px; color:#999; margin-top:4px; }
    table { width:100%; border-collapse:collapse; margin-bottom:16px; }
    thead tr { background:#2d6a2d; color:#fff; }
    th { padding:8px 10px; text-align:left; font-size:11px; font-weight:600; letter-spacing:0.04em; }
    td { padding:7px 10px; font-size:11px; border-bottom:1px solid #e8e8e8; }
    tr.even td { background:#f7faf7; }
    .money { font-weight:700; color:#1a6b1a; }
    .loss { color:#c0392b !important; }
    .status-chip { background:#e8f0e5; color:#2d6a2d; padding:2px 8px; border-radius:10px; font-size:10px; font-weight:600; }
    .summary-box { display:flex; gap:16px; margin-top:8px; }
    .summary-item { flex:1; border:1px solid #e0e0e0; border-radius:8px; padding:12px 16px; }
    .summary-item.highlight { background:#2d6a2d; color:#fff; border-color:#2d6a2d; }
    .summary-item.highlight .summary-label { color:rgba(255,255,255,0.8); }
    .summary-item.loss.highlight { background:#c0392b; border-color:#c0392b; }
    .summary-label { font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:4px; }
    .summary-value { font-size:18px; font-weight:800; color:#1a1a1a; }
    .summary-item.highlight .summary-value { color:#fff; }
    .footer { margin-top:24px; padding-top:12px; border-top:1px solid #e0e0e0; display:flex; justify-content:space-between; font-size:10px; color:#999; }
    @media print {
      body { padding:12px; }
      @page { margin:15mm; size:A4 landscape; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <div class="brand-name">Green</div>
      <div class="brand-sub">GI Wire Inventory Ledger</div>
    </div>
    <div class="report-info">
      <div class="report-title">${typeName.toUpperCase()}</div>
      <div class="report-date">Period: ${dateLabel}</div>
      <div class="report-generated">Generated: ${new Date().toLocaleString('en-IN')}</div>
    </div>
  </div>
  ${tableHTML}
  ${summaryHTML}
  <div class="footer">
    <span>Green Inventory Management System</span>
    <span>Confidential — For Internal Use Only</span>
  </div>
  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`);
  printWin.document.close();
  showToast('PDF report opened — use Save as PDF in print dialog');
};

window.downloadReportCSV = async () => {
  const filters = { dateFrom: reportDateFrom, dateTo: reportDateTo };
  const typeName = { sales:'Sales', purchase:'Purchase', stock:'Stock', manufacture:'Manufacture', scrap:'Scrap' }[reportType] || 'Report';
  let csv = '';
  let filename = `${typeName}-Report-${reportDateFrom}-to-${reportDateTo}.csv`;

  if (reportType === 'sales') {
    const data = await window.api.getReportSales(filters);
    const rows = data.rows || [];
    csv = ['Transaction ID,Product,Customer,Quantity,Unit,Unit Price,Total Value,Status,Date',
      ...rows.map(r => `"${r.transaction_id}","${r.product_name}","${r.customer||''}",${r.quantity},"${r.unit}",${r.unit_price},${r.total_value},"${r.status}","${r.sale_date}"`)
    ].join('\n');
  } else if (reportType === 'purchase') {
    const data = await window.api.getReportPurchases(filters);
    const rows = data.rows || [];
    csv = ['Transaction ID,Product,Vendor,Quantity,Unit,Unit Cost,Total Value,Status,Date',
      ...rows.map(r => `"${r.transaction_id}","${r.product_name}","${r.vendor||''}",${r.quantity},"${r.unit}",${r.unit_cost},${r.total_value},"${r.status}","${r.purchase_date}"`)
    ].join('\n');
  } else if (reportType === 'stock') {
    const data = await window.api.getReportStock();
    const rows = data.rows || [];
    csv = ['Product ID,Name,Category,Brand,Quantity,Unit,Unit Cost,Total Value,Status',
      ...rows.map(r => `"${r.product_id}","${r.name}","${r.category||''}","${r.brand||''}",${r.quantity},"${r.unit}",${r.unit_cost},${(r.quantity*r.unit_cost).toFixed(2)},"${r.status}"`)
    ].join('\n');
    filename = `Stock-Report-${new Date().toISOString().slice(0,10)}.csv`;
  } else if (reportType === 'manufacture') {
    const data = await window.api.getReportManufacture(filters);
    const rows = data.rows || [];
    csv = ['Transaction ID,Product,Brand,Specification,Quantity,Unit,Status,Date',
      ...rows.map(r => `"${r.transaction_id}","${r.product_name}","${r.brand||''}","${r.specification||''}",${r.quantity},"${r.unit}","${r.status}","${r.manufacture_date}"`)
    ].join('\n');
  } else if (reportType === 'scrap') {
    const data = await window.api.getReportScrap(filters);
    const rows = data.rows || [];
    csv = ['Transaction ID,Product,Quantity,Unit,Reason,Value Lost,Status,Date',
      ...rows.map(r => `"${r.transaction_id}","${r.product_name}",${r.quantity},"${r.unit}","${r.reason||''}",${r.value_lost},"${r.status}","${r.scrap_date}"`)
    ].join('\n');
  }

  if (!csv) { showToast('No data to export', 'error'); return; }
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  showToast(`${typeName} report downloaded`);
};

/* ══════════════════════════════════════════════════════════════════════
   SETTINGS PAGE
══════════════════════════════════════════════════════════════════════ */
async function renderSettings() {
  const container = document.getElementById('pageContainer');
  const settings = await window.api.getSettings();

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Settings</h1>
      <p class="page-subtitle">Configure your Green Botanical Ledger system preferences.</p>
    </div>

    <div class="card" style="max-width:700px">
      <div class="settings-section">
        <div class="settings-section-title">Business Information</div>
        <div class="settings-row">
          <div><div class="settings-key">Business Name</div><div class="settings-desc">Your botanical business name</div></div>
          <input class="form-input" style="width:220px" id="set_biz_name" value="${settings.biz_name || 'Green Botanical Ledger'}">
        </div>
        <div class="settings-row">
          <div><div class="settings-key">Currency</div><div class="settings-desc">Default currency for reports</div></div>
          <select class="filter-select" id="set_currency">
            <option value="USD" ${(settings.currency||'USD')==='USD'?'selected':''}>USD ($)</option>
            <option value="EUR" ${settings.currency==='EUR'?'selected':''}>EUR (€)</option>
            <option value="GBP" ${settings.currency==='GBP'?'selected':''}>GBP (£)</option>
          </select>
        </div>
        <div class="settings-row">
          <div><div class="settings-key">Low Stock Threshold</div><div class="settings-desc">Alert when quantity falls below this</div></div>
          <input class="form-input" style="width:100px" type="number" id="set_low_stock" value="${settings.low_stock_threshold || 50}">
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Storage & Warehouse</div>
        <div class="settings-row">
          <div><div class="settings-key">Storage Capacity</div><div class="settings-desc">Total warehouse capacity (units)</div></div>
          <input class="form-input" style="width:120px" type="number" id="set_capacity" value="${settings.storage_capacity || 10000}">
        </div>
        <div class="settings-row">
          <div><div class="settings-key">Warehouse Name</div><div class="settings-desc">Primary warehouse location</div></div>
          <input class="form-input" style="width:220px" id="set_warehouse" value="${settings.warehouse_name || 'Warehouse A'}">
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Reports & Export</div>
        <div class="settings-row">
          <div><div class="settings-key">Default Report Period</div><div class="settings-desc">Default date range for reports</div></div>
          <select class="filter-select" id="set_report_period">
            <option value="monthly" ${(settings.report_period||'monthly')==='monthly'?'selected':''}>Monthly</option>
            <option value="weekly" ${settings.report_period==='weekly'?'selected':''}>Weekly</option>
            <option value="daily" ${settings.report_period==='daily'?'selected':''}>Daily</option>
          </select>
        </div>
        <div class="settings-row">
          <div><div class="settings-key">Auto-backup</div><div class="settings-desc">Automatic database backup</div></div>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="checkbox" id="set_backup" ${settings.auto_backup==='true'?'checked':''} style="width:16px;height:16px;accent-color:var(--primary)">
            <span style="font-size:13px">Enabled</span>
          </label>
        </div>
      </div>

      <div style="display:flex;gap:10px;justify-content:flex-end;padding-top:12px;border-top:1px solid rgba(173,180,167,0.2)">
        <button class="btn-secondary" onclick="renderSettings()">Reset</button>
        <button class="btn-primary" onclick="saveSettings()">Save Settings</button>
      </div>
    </div>

    <div class="card" style="max-width:700px;margin-top:16px">
      <div class="settings-section-title">About</div>
      <div style="font-size:13px;color:var(--on-surface-variant);line-height:1.7">
        <div><b style="color:var(--on-surface)">Green – The Botanical Ledger</b></div>
        <div>Version 1.0.0</div>
        <div style="margin-top:6px">A precision environmental management system for botanical inventory, sales, and reporting.</div>
        <div style="margin-top:8px;font-size:11px">© 2024 Green Botanical Ledger System</div>
      </div>
    </div>
  `;
}

window.saveSettings = async () => {
  const pairs = [
    ['biz_name', document.getElementById('set_biz_name').value],
    ['currency', document.getElementById('set_currency').value],
    ['low_stock_threshold', document.getElementById('set_low_stock').value],
    ['storage_capacity', document.getElementById('set_capacity').value],
    ['warehouse_name', document.getElementById('set_warehouse').value],
    ['report_period', document.getElementById('set_report_period').value],
    ['auto_backup', document.getElementById('set_backup').checked.toString()],
  ];
  for (const [k, v] of pairs) {
    await window.api.setSetting(k, v);
  }
  showToast('Settings saved successfully');
};

/* ══════════════════════════════════════════════════════════════════════
   PURCHASES PAGE
══════════════════════════════════════════════════════════════════════ */
let purPage = 1;
const purPageSize = 12;
let purFilters = {};
let purData = [];

async function renderPurchases(filters = {}) {
  purFilters = filters;
  const container = document.getElementById('pageContainer');
  const all = await window.api.getPurchases(filters);
  purData = all;

  const totalValue = all.reduce((s, r) => s + (r.total_value || 0), 0);
  const fulfilled = all.filter(r => r.status === 'FULFILLED' || r.status === 'RESTOCKED').length;
  const pending = all.filter(r => r.status === 'PENDING').length;

  const totalPages = Math.max(1, Math.ceil(all.length / purPageSize));
  if (purPage > totalPages) purPage = 1;
  const page = all.slice((purPage - 1) * purPageSize, purPage * purPageSize);

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
      <div>
        <h1 class="page-title" style="color:var(--primary)">Purchases</h1>
        <p class="page-subtitle">Procurement history and vendor management</p>
      </div>
      <button class="btn-primary" id="btnPurAdd">+ Add Purchase</button>
    </div>

    <div class="stats-grid" style="grid-template-columns:repeat(3,1fr)">
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-icon" style="background:#e8f0e5">🛒</div>
          <span class="stat-badge badge-green">${all.length} orders</span>
        </div>
        <div class="stat-value">${fmtMoney(totalValue)}</div>
        <div class="stat-label">Total Purchase Value</div>
      </div>
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-icon" style="background:#e8f5e9">✅</div>
        </div>
        <div class="stat-value">${fulfilled}</div>
        <div class="stat-label">Fulfilled / Restocked</div>
      </div>
      <div class="stat-card" style="${pending > 0 ? 'background:var(--warning-container)' : ''}">
        <div class="stat-header">
          <div class="stat-icon" style="background:rgba(201,124,0,0.1)">⏳</div>
        </div>
        <div class="stat-value" style="${pending > 0 ? 'color:var(--warning)' : ''}">${pending}</div>
        <div class="stat-label">Pending Orders</div>
      </div>
    </div>

    <div class="card">
      <div class="filters-bar" style="margin-bottom:16px">
        <input class="search-input" id="purSearch" placeholder="Search product, vendor, ID…" value="${filters.search || ''}">
        <div class="date-row">
          <input type="date" id="purDateFrom" value="${filters.dateFrom || ''}">
          <span class="date-sep">to</span>
          <input type="date" id="purDateTo" value="${filters.dateTo || ''}">
        </div>
        <button class="btn-primary btn-sm" id="purSearchBtn">Search</button>
        <button class="btn-secondary btn-sm" id="purClearBtn">Clear</button>
      </div>

      <div class="table-wrapper">
        <table>
          <thead><tr>
            <th>Transaction ID</th><th>Product</th><th>Vendor</th>
            <th>Quantity</th><th>Unit Cost</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th>
          </tr></thead>
          <tbody>
            ${page.length ? page.map(r => `
              <tr>
                <td class="td-green">#${r.transaction_id}</td>
                <td class="td-bold">${r.product_name}</td>
                <td class="td-muted">${r.vendor || '—'}</td>
                <td><b>${fmt(r.quantity)}</b> <span style="color:var(--on-surface-variant);font-size:12px">${r.unit}</span></td>
                <td class="td-money">${fmtMoney(r.unit_cost)}</td>
                <td class="td-money td-bold">${fmtMoney(r.total_value)}</td>
                <td>${chip(r.status)}</td>
                <td class="td-muted">${fmtDate(r.purchase_date)}</td>
                <td>
                  <button class="btn-icon danger" onclick="deletePurchaseRow(${r.id})" title="Delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </button>
                </td>
              </tr>
            `).join('') : '<tr><td colspan="9"><div class="empty-state"><div class="empty-icon">🛒</div><div class="empty-text">No purchase records found</div></div></td></tr>'}
          </tbody>
        </table>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;padding-top:12px">
        <span class="page-info">Showing ${Math.min((purPage-1)*purPageSize+1, all.length)}–${Math.min(purPage*purPageSize, all.length)} of ${all.length} purchases</span>
        <div class="pagination">
          <button class="page-arrow" onclick="purChangePage(${purPage-1})" ${purPage===1?'disabled':''}>‹</button>
          ${Array.from({length: Math.min(totalPages,5)}, (_,i) => i+1).map(p => `<button class="page-num ${p===purPage?'active':''}" onclick="purChangePage(${p})">${p}</button>`).join('')}
          <button class="page-arrow" onclick="purChangePage(${purPage+1})" ${purPage===totalPages?'disabled':''}>›</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btnPurAdd').addEventListener('click', () => showAddPurchaseModal());
  document.getElementById('purSearchBtn').addEventListener('click', () => {
    purPage = 1;
    renderPurchases({
      search: document.getElementById('purSearch').value.trim(),
      dateFrom: document.getElementById('purDateFrom').value,
      dateTo: document.getElementById('purDateTo').value,
    });
  });
  document.getElementById('purClearBtn').addEventListener('click', () => {
    purPage = 1;
    renderPurchases({});
  });
  document.getElementById('purSearch').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('purSearchBtn').click();
  });
}

window.purChangePage = (p) => {
  const totalPages = Math.ceil(purData.length / purPageSize);
  if (p < 1 || p > totalPages) return;
  purPage = p;
  renderPurchases(purFilters);
};

window.deletePurchaseRow = (id) => {
  showModal(`
    <div class="modal-title">Delete Purchase</div>
    <p style="font-size:13.5px;color:var(--on-surface-variant);margin-bottom:20px">Are you sure you want to delete this purchase record? This action cannot be undone.</p>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-danger" onclick="confirmDeletePurchase(${id})">Delete</button>
    </div>
  `);
};

window.confirmDeletePurchase = async (id) => {
  await window.api.deletePurchase(id);
  closeModal();
  showToast('Purchase deleted');
  renderPurchases(purFilters);
};

/* ══════════════════════════════════════════════════════════════════════
   SHARED MODALS
══════════════════════════════════════════════════════════════════════ */
async function showAddInventoryModal() {
  const cats = await window.api.getCategories();
  showModal(`
    <div class="modal-title">Add Inventory Item</div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Name *</label>
        <input class="form-input" id="ni_name" placeholder="e.g. Ficus Lyrata">
      </div>
      <div class="form-group">
        <label class="form-label">Emoji Icon</label>
        <input class="form-input" id="ni_emoji" value="🌿" maxlength="4">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Brand</label>
        <input class="form-input" id="ni_brand" placeholder="Brand name">
      </div>
      <div class="form-group">
        <label class="form-label">Category</label>
        <input class="form-input" id="ni_category" placeholder="e.g. Indoor Botanicals" list="niCatsList">
        <datalist id="niCatsList">${cats.map(c => `<option value="${c}">`).join('')}</datalist>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <input class="form-input" id="ni_desc" placeholder="Short description">
    </div>
    <div class="form-row-3">
      <div class="form-group">
        <label class="form-label">Quantity *</label>
        <input class="form-input" id="ni_qty" type="number" placeholder="0">
      </div>
      <div class="form-group">
        <label class="form-label">Unit</label>
        <input class="form-input" id="ni_unit" value="KG">
      </div>
      <div class="form-group">
        <label class="form-label">Unit Cost ($)</label>
        <input class="form-input" id="ni_cost" type="number" step="0.01" placeholder="0.00">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="submitAddInventory()">Add Item</button>
    </div>
  `);
}

window.submitAddInventory = async () => {
  const name = document.getElementById('ni_name').value.trim();
  const qty = parseFloat(document.getElementById('ni_qty').value) || 0;
  if (!name) { showToast('Name is required', 'error'); return; }
  await window.api.addInventory({
    name,
    description: document.getElementById('ni_desc').value.trim(),
    brand: document.getElementById('ni_brand').value.trim(),
    category: document.getElementById('ni_category').value.trim(),
    quantity: qty,
    unit: document.getElementById('ni_unit').value.trim() || 'Units',
    unit_cost: parseFloat(document.getElementById('ni_cost').value) || 0,
    image_emoji: document.getElementById('ni_emoji').value || '🌿',
  });
  closeModal();
  showToast('Item added to inventory');
  renderInventory(invFilters);
};

async function showAddPurchaseModal() {
  const inv = await window.api.getInventory({});
  showModal(`
    <div class="modal-title">Add Purchase</div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Product Name *</label>
        <input class="form-input" id="ap_name" list="invNameList" placeholder="e.g. Ficus Lyrata">
        <datalist id="invNameList">${inv.map(i => `<option value="${i.name}">`).join('')}</datalist>
      </div>
      <div class="form-group">
        <label class="form-label">Vendor</label>
        <input class="form-input" id="ap_vendor" placeholder="Vendor name">
      </div>
    </div>
    <div class="form-row-3">
      <div class="form-group">
        <label class="form-label">Quantity *</label>
        <input class="form-input" id="ap_qty" type="number" placeholder="0">
      </div>
      <div class="form-group">
        <label class="form-label">Unit</label>
        <input class="form-input" id="ap_unit" value="KG">
      </div>
      <div class="form-group">
        <label class="form-label">Unit Cost ($) *</label>
        <input class="form-input" id="ap_cost" type="number" step="0.01" placeholder="0.00">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-input" id="ap_status">
          <option value="FULFILLED">Fulfilled</option>
          <option value="PENDING">Pending</option>
          <option value="RESTOCKED">Restocked</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Notes</label>
        <input class="form-input" id="ap_notes" placeholder="Optional notes">
      </div>
    </div>
    <div style="background:var(--surface-container-low);border-radius:var(--radius-sm);padding:10px 14px;font-size:12px;color:var(--on-surface-variant);margin-bottom:4px">
      Total Value = Quantity × Unit Cost (auto-calculated)
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="submitAddPurchase()">Add Purchase</button>
    </div>
  `);
}

window.submitAddPurchase = async () => {
  const name = document.getElementById('ap_name').value.trim();
  const qty = parseFloat(document.getElementById('ap_qty').value);
  const cost = parseFloat(document.getElementById('ap_cost').value);
  if (!name) { showToast('Product name is required', 'error'); return; }
  if (!qty || qty <= 0) { showToast('Quantity must be > 0', 'error'); return; }
  if (!cost || cost <= 0) { showToast('Unit cost must be > 0', 'error'); return; }
  const result = await window.api.addPurchase({
    product_name: name,
    vendor: document.getElementById('ap_vendor').value.trim(),
    quantity: qty,
    unit: document.getElementById('ap_unit').value.trim() || 'Units',
    unit_cost: cost,
    status: document.getElementById('ap_status').value,
    notes: document.getElementById('ap_notes').value.trim(),
  });
  closeModal();
  showToast(`Purchase added: ${result.transaction_id}`);
  updateStorageBar();
  if (currentPage === 'inventory') renderInventory(invFilters);
  else if (currentPage === 'purchases') renderPurchases(purFilters);
  else if (currentPage === 'dashboard') renderDashboard();
};

async function showAddSaleModal() {
  const inv = await window.api.getInventory({});
  showModal(`
    <div class="modal-title">Add Sale</div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Product Name *</label>
        <input class="form-input" id="as_name" list="invSaleList" placeholder="e.g. Monstera Deliciosa">
        <datalist id="invSaleList">${inv.map(i => `<option value="${i.name}">`).join('')}</datalist>
      </div>
      <div class="form-group">
        <label class="form-label">Customer</label>
        <input class="form-input" id="as_customer" placeholder="Customer name">
      </div>
    </div>
    <div class="form-row-3">
      <div class="form-group">
        <label class="form-label">Quantity *</label>
        <input class="form-input" id="as_qty" type="number" placeholder="0">
      </div>
      <div class="form-group">
        <label class="form-label">Unit</label>
        <input class="form-input" id="as_unit" value="KG">
      </div>
      <div class="form-group">
        <label class="form-label">Unit Price ($) *</label>
        <input class="form-input" id="as_price" type="number" step="0.01" placeholder="0.00">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Category</label>
        <select class="form-input" id="as_category">
          <option value="Direct Sale">Direct Sale</option>
          <option value="Scrap Sale">Scrap Sale</option>
          <option value="Manufacture Sale">Manufacture Sale</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-input" id="as_status">
          <option value="COMPLETED">Completed</option>
          <option value="PROCESSING">Processing</option>
          <option value="PENDING">Pending</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Notes</label>
      <input class="form-input" id="as_notes" placeholder="Optional notes">
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="submitAddSale()">Add Sale</button>
    </div>
  `);
}

window.submitAddSale = async () => {
  const name = document.getElementById('as_name').value.trim();
  const qty = parseFloat(document.getElementById('as_qty').value);
  const price = parseFloat(document.getElementById('as_price').value);
  if (!name) { showToast('Product name is required', 'error'); return; }
  if (!qty || qty <= 0) { showToast('Quantity must be > 0', 'error'); return; }
  if (!price || price <= 0) { showToast('Unit price must be > 0', 'error'); return; }
  const result = await window.api.addSale({
    product_name: name,
    customer: document.getElementById('as_customer').value.trim(),
    quantity: qty,
    unit: document.getElementById('as_unit').value.trim() || 'Units',
    unit_price: price,
    category: document.getElementById('as_category').value,
    status: document.getElementById('as_status').value,
    notes: document.getElementById('as_notes').value.trim(),
  });
  closeModal();
  showToast(`Sale recorded: ${result.transaction_id}`);
  updateStorageBar();
  if (currentPage === 'sales') renderSales();
  else if (currentPage === 'dashboard') renderDashboard();
};

/* ── Keyboard shortcut ─────────────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

/* ── Sidebar storage bar ───────────────────────────────────────────── */
async function updateStorageBar() {
  const [inv, settings] = await Promise.all([
    window.api.getInventory({}),
    window.api.getSettings(),
  ]);
  const totalQty = inv.reduce((s, r) => s + (r.quantity || 0), 0);
  const capacity = parseInt(settings.storage_capacity) || 10000;
  const pct = Math.min(100, Math.round((totalQty / capacity) * 100));
  const fill = document.querySelector('.storage-fill');
  const text = document.querySelector('.storage-text');
  if (fill) fill.style.width = pct + '%';
  if (text) text.textContent = `${pct}% of ${capacity.toLocaleString()} Capacity`;
}

/* ── Boot ──────────────────────────────────────────────────────────── */
navigate('dashboard');
updateStorageBar();
