const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');

let mainWindow;
let db;

// ── Database ───────────────────────────────────────────────────────────────────

function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'botanical-ledger.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      brand TEXT,
      category TEXT,
      quantity REAL NOT NULL DEFAULT 0,
      unit TEXT DEFAULT 'Units',
      unit_cost REAL DEFAULT 0,
      status TEXT DEFAULT 'In Stock',
      image_emoji TEXT DEFAULT '🌿',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id TEXT UNIQUE NOT NULL,
      product_name TEXT NOT NULL,
      vendor TEXT,
      quantity REAL NOT NULL,
      unit TEXT DEFAULT 'Units',
      unit_cost REAL NOT NULL,
      total_value REAL NOT NULL,
      status TEXT DEFAULT 'PENDING',
      notes TEXT,
      purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id TEXT UNIQUE NOT NULL,
      product_name TEXT NOT NULL,
      customer TEXT,
      quantity REAL NOT NULL,
      unit TEXT DEFAULT 'Units',
      unit_price REAL NOT NULL,
      total_value REAL NOT NULL,
      status TEXT DEFAULT 'COMPLETED',
      category TEXT DEFAULT 'Direct Sale',
      notes TEXT,
      sale_date DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS manufacture (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id TEXT UNIQUE NOT NULL,
      product_name TEXT NOT NULL,
      brand TEXT,
      specification TEXT,
      quantity REAL NOT NULL,
      unit TEXT DEFAULT 'Units',
      unit_cost REAL DEFAULT 0,
      status TEXT DEFAULT 'MANUFACTURED',
      notes TEXT,
      manufacture_date DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS scrap (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id TEXT UNIQUE NOT NULL,
      product_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT DEFAULT 'Units',
      reason TEXT,
      value_lost REAL DEFAULT 0,
      status TEXT DEFAULT 'SCRAPPED',
      scrap_date DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  const count = db.prepare('SELECT COUNT(*) as c FROM inventory').get();
  if (count.c === 0) seedData();
}

function seedData() {
  const items = [
    { product_id: 'GRN-001', name: 'Ficus Lyrata (Bambino)', description: 'Compact fiddle-leaf fig', brand: 'Evergreen Nursery', category: 'Indoor Botanicals', quantity: 120, unit: 'Units', unit_cost: 18, status: 'In Stock', image_emoji: '🌿' },
    { product_id: 'GRN-002', name: 'Sansevieria Trifasciata', description: 'Snake plant, low maintenance', brand: 'Botanical Imports', category: 'Indoor Botanicals', quantity: 45, unit: 'Units', unit_cost: 12, status: 'Low Stock', image_emoji: '🌱' },
    { product_id: 'GRN-003', name: 'Monstera Deliciosa', description: 'Swiss cheese plant', brand: 'Botanical Imports', category: 'Indoor Botanicals', quantity: 85, unit: 'Units', unit_cost: 24, status: 'In Stock', image_emoji: '🌿' },
    { product_id: 'GRN-004', name: 'Spathiphyllum (Peace Lily)', description: 'Air purifying plant', brand: 'Evergreen Nursery', category: 'Indoor Botanicals', quantity: 200, unit: 'Units', unit_cost: 8, status: 'In Stock', image_emoji: '🌸' },
    { product_id: 'GRN-005', name: 'Organic Fertilizer', description: 'Premium botanical fertilizer', brand: 'EcoEarth Corp', category: 'Soil & Nutrients', quantity: 820, unit: 'kg', unit_cost: 2.5, status: 'In Stock', image_emoji: '🌾' },
    { product_id: 'GRN-006', name: 'Botanical Seeds Mix', description: 'Premium mixed seeds collection', brand: 'Arid Flora', category: 'Seeds', quantity: 450, unit: 'Packs', unit_cost: 5, status: 'In Stock', image_emoji: '🌻' },
    { product_id: 'GRN-007', name: 'Watering System Kit', description: 'Drip irrigation system', brand: 'Global Irrigation', category: 'Equipment', quantity: 61, unit: 'Units', unit_cost: 45, status: 'In Stock', image_emoji: '💧' },
    { product_id: 'GRN-008', name: 'Pruning Tools Set', description: 'Professional gardening tools', brand: 'Verdant Tools', category: 'Tools & Hardware', quantity: 29, unit: 'Sets', unit_cost: 35, status: 'Low Stock', image_emoji: '✂️' },
    { product_id: 'GRN-009', name: 'Evergreen Oak Saplings', description: 'Hardy outdoor oak trees', brand: 'Heritage Nursery', category: 'Trees', quantity: 45, unit: 'Units', unit_cost: 28, status: 'Low Stock', image_emoji: '🌳' },
    { product_id: 'GRN-010', name: 'Premium Humus Mix', description: 'High-quality compost blend', brand: 'EcoEarth Corp', category: 'Soil & Nutrients', quantity: 200, unit: 'kg', unit_cost: 4.2, status: 'In Stock', image_emoji: '🌾' },
    { product_id: 'GRN-011', name: 'Ficus Altissima', description: 'Council tree variety', brand: 'Evergreen Nursery', category: 'Indoor Botanicals', quantity: 30, unit: 'Units', unit_cost: 32, status: 'Low Stock', image_emoji: '🌿' },
    { product_id: 'GRN-012', name: 'Desert Rose Hybrid', description: 'Adenium obesum hybrid', brand: 'Arid Flora', category: 'Succulents', quantity: 500, unit: 'Units', unit_cost: 15, status: 'In Stock', image_emoji: '🌹' },
  ];
  const ins = db.prepare(`INSERT INTO inventory (product_id,name,description,brand,category,quantity,unit,unit_cost,status,image_emoji) VALUES (?,?,?,?,?,?,?,?,?,?)`);
  items.forEach(i => ins.run(i.product_id, i.name, i.description, i.brand, i.category, i.quantity, i.unit, i.unit_cost, i.status, i.image_emoji));

  const purchases = [
    { transaction_id: 'GRN-9201', product_name: 'Evergreen Oak Saplings', vendor: 'Heritage Nursery', quantity: 45, unit: 'Units', unit_cost: 28, total_value: 1250, status: 'RESTOCKED' },
    { transaction_id: 'GRN-9188', product_name: 'Premium Humus Mix', vendor: 'EcoEarth Corp', quantity: 200, unit: 'kg', unit_cost: 4.2, total_value: 840, status: 'FULFILLED' },
    { transaction_id: 'GRN-8992', product_name: 'Micro-Drip Connectors', vendor: 'Global Irrigation', quantity: 1200, unit: 'Pcs', unit_cost: 2.6, total_value: 3120, status: 'PENDING' },
    { transaction_id: 'GRN-8851', product_name: 'Organic Fertilizer', vendor: 'EcoEarth Corp', quantity: 500, unit: 'kg', unit_cost: 2.5, total_value: 1250, status: 'FULFILLED' },
    { transaction_id: 'GRN-8743', product_name: 'Botanical Seeds Mix', vendor: 'Arid Flora', quantity: 200, unit: 'Packs', unit_cost: 5, total_value: 1000, status: 'FULFILLED' },
  ];
  const insPur = db.prepare(`INSERT INTO purchases (transaction_id,product_name,vendor,quantity,unit,unit_cost,total_value,status) VALUES (?,?,?,?,?,?,?,?)`);
  purchases.forEach(p => insPur.run(p.transaction_id, p.product_name, p.vendor, p.quantity, p.unit, p.unit_cost, p.total_value, p.status));

  const sales = [
    { transaction_id: 'SL-9021', product_name: 'Ficus Lyrata (Bambino)', customer: 'Botanical Imports Ltd', quantity: 120, unit: 'Units', unit_price: 24, total_value: 2880, status: 'COMPLETED', category: 'Direct Sale' },
    { transaction_id: 'SL-9022', product_name: 'Sansevieria Trifasciata', customer: 'Green Spaces Co', quantity: 45, unit: 'Units', unit_price: 18.5, total_value: 832.5, status: 'COMPLETED', category: 'Direct Sale' },
    { transaction_id: 'SL-9023', product_name: 'Monstera Deliciosa', customer: 'Urban Jungle Ltd', quantity: 85, unit: 'Units', unit_price: 32, total_value: 2720, status: 'PROCESSING', category: 'Direct Sale' },
    { transaction_id: 'SL-9024', product_name: 'Spathiphyllum (Peace Lily)', customer: 'Flower World', quantity: 200, unit: 'Units', unit_price: 12, total_value: 2400, status: 'COMPLETED', category: 'Direct Sale' },
    { transaction_id: 'SL-8901', product_name: 'Organic Mulch Blend', customer: 'Scrap Recovery Div.', quantity: 12, unit: 'Tons', unit_price: 70, total_value: 840, status: 'COMPLETED', category: 'Scrap Sale' },
  ];
  const insSale = db.prepare(`INSERT INTO sales (transaction_id,product_name,customer,quantity,unit,unit_price,total_value,status,category) VALUES (?,?,?,?,?,?,?,?,?)`);
  sales.forEach(s => insSale.run(s.transaction_id, s.product_name, s.customer, s.quantity, s.unit, s.unit_price, s.total_value, s.status, s.category));

  const mfgs = [
    { transaction_id: 'MFG-1001', product_name: 'Ficus Altissima', brand: 'Evergreen Nursery Co.', specification: 'Large / 14-inch', quantity: 240, unit: 'Units', status: 'MANUFACTURED' },
    { transaction_id: 'MFG-1002', product_name: 'Desert Rose Hybrid', brand: 'Arid Flora Brands', specification: 'Small / 4-inch', quantity: 500, unit: 'Units', status: 'MANUFACTURED' },
  ];
  const insMfg = db.prepare(`INSERT INTO manufacture (transaction_id,product_name,brand,specification,quantity,unit,status) VALUES (?,?,?,?,?,?,?)`);
  mfgs.forEach(m => insMfg.run(m.transaction_id, m.product_name, m.brand, m.specification, m.quantity, m.unit, m.status));
}

// ── IPC Handlers ───────────────────────────────────────────────────────────────

function registerIpcHandlers() {
  // Dashboard
  ipcMain.handle('dashboard:get', () => {
    const totalStock = db.prepare('SELECT SUM(quantity) as t FROM inventory').get().t || 0;
    const totalPurchaseValue = db.prepare('SELECT SUM(total_value) as t FROM purchases').get().t || 0;
    const totalSalesValue = db.prepare('SELECT SUM(total_value) as t FROM sales').get().t || 0;
    const currentStock = db.prepare("SELECT SUM(quantity) as t FROM inventory WHERE status='In Stock'").get().t || 0;
    const recentActivity = db.prepare(`
      SELECT transaction_id, product_name as asset, vendor as origin, quantity, unit, status, total_value as value, purchase_date as date FROM purchases
      UNION ALL
      SELECT transaction_id, product_name as asset, customer as origin, quantity, unit, status, total_value as value, sale_date as date FROM sales
      ORDER BY date DESC LIMIT 8
    `).all();
    const weeklyData = db.prepare(`
      SELECT strftime('%w', sale_date) as day, SUM(total_value) as sales
      FROM sales WHERE sale_date >= date('now','-7 days') GROUP BY day
    `).all();
    return { totalStock, totalPurchaseValue, totalSalesValue, currentStock, recentActivity, weeklyData };
  });

  // Inventory
  ipcMain.handle('inventory:getAll', (e, filters) => {
    let q = 'SELECT * FROM inventory WHERE 1=1';
    const p = [];
    if (filters?.search) { q += ' AND (name LIKE ? OR brand LIKE ? OR category LIKE ? OR product_id LIKE ?)'; const s=`%${filters.search}%`; p.push(s,s,s,s); }
    if (filters?.status)   { q += ' AND status=?'; p.push(filters.status); }
    if (filters?.category) { q += ' AND category=?'; p.push(filters.category); }
    q += ' ORDER BY updated_at DESC';
    return db.prepare(q).all(...p);
  });

  ipcMain.handle('inventory:add', (e, item) => {
    const pid = 'GRN-' + String(Date.now()).slice(-6);
    const status = item.quantity <= 0 ? 'Out of Stock' : item.quantity < 50 ? 'Low Stock' : 'In Stock';
    db.prepare(`INSERT INTO inventory (product_id,name,description,brand,category,quantity,unit,unit_cost,status,image_emoji) VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .run(pid, item.name, item.description||'', item.brand||'', item.category||'', item.quantity||0, item.unit||'Units', item.unit_cost||0, status, item.image_emoji||'🌿');
    return { success: true };
  });

  ipcMain.handle('inventory:update', (e, item) => {
    const status = item.quantity <= 0 ? 'Out of Stock' : item.quantity < 50 ? 'Low Stock' : 'In Stock';
    db.prepare(`UPDATE inventory SET name=?,description=?,brand=?,category=?,quantity=?,unit=?,unit_cost=?,status=?,image_emoji=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`)
      .run(item.name, item.description, item.brand, item.category, item.quantity, item.unit, item.unit_cost, status, item.image_emoji, item.id);
    return { success: true };
  });

  ipcMain.handle('inventory:delete', (e, id) => {
    db.prepare('DELETE FROM inventory WHERE id=?').run(id);
    return { success: true };
  });

  ipcMain.handle('inventory:getCategories', () =>
    db.prepare('SELECT DISTINCT category FROM inventory ORDER BY category').all().map(r => r.category)
  );

  // Purchases
  ipcMain.handle('purchases:getAll', (e, filters) => {
    let q = 'SELECT * FROM purchases WHERE 1=1';
    const p = [];
    if (filters?.search)   { q += ' AND (product_name LIKE ? OR vendor LIKE ? OR transaction_id LIKE ?)'; const s=`%${filters.search}%`; p.push(s,s,s); }
    if (filters?.dateFrom) { q += ' AND purchase_date >= ?'; p.push(filters.dateFrom); }
    if (filters?.dateTo)   { q += ' AND purchase_date <= ?'; p.push(filters.dateTo+' 23:59:59'); }
    q += ' ORDER BY purchase_date DESC';
    return db.prepare(q).all(...p);
  });

  ipcMain.handle('purchases:add', (e, purchase) => {
    const txId = 'GRN-' + String(Date.now()).slice(-6);
    const total = purchase.quantity * purchase.unit_cost;
    db.prepare(`INSERT INTO purchases (transaction_id,product_name,vendor,quantity,unit,unit_cost,total_value,status,notes) VALUES (?,?,?,?,?,?,?,?,?)`)
      .run(txId, purchase.product_name, purchase.vendor||'', purchase.quantity, purchase.unit||'Units', purchase.unit_cost, total, purchase.status||'FULFILLED', purchase.notes||'');
    const inv = db.prepare('SELECT * FROM inventory WHERE name LIKE ?').get(`%${purchase.product_name}%`);
    if (inv) {
      const newQty = inv.quantity + purchase.quantity;
      const status = newQty <= 0 ? 'Out of Stock' : newQty < 50 ? 'Low Stock' : 'In Stock';
      db.prepare('UPDATE inventory SET quantity=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(newQty, status, inv.id);
    }
    return { success: true, transaction_id: txId };
  });

  ipcMain.handle('purchases:delete', (e, id) => {
    db.prepare('DELETE FROM purchases WHERE id=?').run(id);
    return { success: true };
  });

  // Sales
  ipcMain.handle('sales:getAll', (e, filters) => {
    let q = 'SELECT * FROM sales WHERE 1=1';
    const p = [];
    if (filters?.search)   { q += ' AND (product_name LIKE ? OR customer LIKE ? OR transaction_id LIKE ?)'; const s=`%${filters.search}%`; p.push(s,s,s); }
    if (filters?.category) { q += ' AND category=?'; p.push(filters.category); }
    if (filters?.dateFrom) { q += ' AND sale_date >= ?'; p.push(filters.dateFrom); }
    if (filters?.dateTo)   { q += ' AND sale_date <= ?'; p.push(filters.dateTo+' 23:59:59'); }
    q += ' ORDER BY sale_date DESC';
    return db.prepare(q).all(...p);
  });

  ipcMain.handle('sales:add', (e, sale) => {
    const txId = 'SL-' + String(Date.now()).slice(-6);
    const total = sale.quantity * sale.unit_price;
    db.prepare(`INSERT INTO sales (transaction_id,product_name,customer,quantity,unit,unit_price,total_value,status,category,notes) VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .run(txId, sale.product_name, sale.customer||'', sale.quantity, sale.unit||'Units', sale.unit_price, total, sale.status||'COMPLETED', sale.category||'Direct Sale', sale.notes||'');
    const inv = db.prepare('SELECT * FROM inventory WHERE name LIKE ?').get(`%${sale.product_name}%`);
    if (inv) {
      const newQty = Math.max(0, inv.quantity - sale.quantity);
      const status = newQty <= 0 ? 'Out of Stock' : newQty < 50 ? 'Low Stock' : 'In Stock';
      db.prepare('UPDATE inventory SET quantity=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(newQty, status, inv.id);
    }
    return { success: true, transaction_id: txId };
  });

  ipcMain.handle('sales:delete', (e, id) => {
    db.prepare('DELETE FROM sales WHERE id=?').run(id);
    return { success: true };
  });

  // Reports
  ipcMain.handle('reports:getSales', (e, filters) => {
    let q = 'SELECT * FROM sales WHERE 1=1'; const p = [];
    if (filters?.dateFrom) { q += ' AND sale_date >= ?'; p.push(filters.dateFrom); }
    if (filters?.dateTo)   { q += ' AND sale_date <= ?'; p.push(filters.dateTo+' 23:59:59'); }
    q += ' ORDER BY sale_date DESC';
    const rows = db.prepare(q).all(...p);
    const totals = db.prepare('SELECT COUNT(*) as count, SUM(quantity) as items, SUM(total_value) as revenue FROM sales').get();
    return { rows, totals };
  });

  ipcMain.handle('reports:getPurchases', (e, filters) => {
    let q = 'SELECT * FROM purchases WHERE 1=1'; const p = [];
    if (filters?.dateFrom) { q += ' AND purchase_date >= ?'; p.push(filters.dateFrom); }
    if (filters?.dateTo)   { q += ' AND purchase_date <= ?'; p.push(filters.dateTo+' 23:59:59'); }
    q += ' ORDER BY purchase_date DESC';
    const rows = db.prepare(q).all(...p);
    const totals = db.prepare('SELECT COUNT(*) as count, SUM(quantity) as items, SUM(total_value) as cost FROM purchases').get();
    return { rows, totals };
  });

  ipcMain.handle('reports:getStock', () => {
    const rows = db.prepare('SELECT * FROM inventory ORDER BY category,name').all();
    const totals = db.prepare('SELECT COUNT(*) as count, SUM(quantity) as total_qty, SUM(quantity*unit_cost) as total_value FROM inventory').get();
    return { rows, totals };
  });

  ipcMain.handle('reports:getManufacture', (e, filters) => {
    let q = 'SELECT * FROM manufacture WHERE 1=1'; const p = [];
    if (filters?.dateFrom) { q += ' AND manufacture_date >= ?'; p.push(filters.dateFrom); }
    if (filters?.dateTo)   { q += ' AND manufacture_date <= ?'; p.push(filters.dateTo+' 23:59:59'); }
    q += ' ORDER BY manufacture_date DESC';
    const rows = db.prepare(q).all(...p);
    const totals = db.prepare('SELECT COUNT(*) as count, SUM(quantity) as total_qty FROM manufacture').get();
    return { rows, totals };
  });

  ipcMain.handle('reports:getScrap', () => {
    const rows = db.prepare('SELECT * FROM scrap ORDER BY scrap_date DESC').all();
    const totals = db.prepare('SELECT COUNT(*) as count, SUM(quantity) as total_qty, SUM(value_lost) as total_loss FROM scrap').get();
    return { rows, totals };
  });

  ipcMain.handle('reports:getUnified', (e, filters) => {
    let q = 'SELECT sale_date as date, transaction_id, product_name, customer as brand, category, quantity, unit, total_value as value, status FROM sales WHERE 1=1';
    const p = [];
    if (filters?.dateFrom) { q += ' AND sale_date >= ?'; p.push(filters.dateFrom); }
    if (filters?.dateTo)   { q += ' AND sale_date <= ?'; p.push(filters.dateTo+' 23:59:59'); }
    q += ' ORDER BY date DESC LIMIT 50';
    const rows = db.prepare(q).all(...p);
    const totalSales = db.prepare('SELECT SUM(total_value) as v, SUM(quantity) as u FROM sales').get();
    return { rows, totalSalesValue: totalSales.v||0, totalUnits: totalSales.u||0 };
  });

  // Manufacture
  ipcMain.handle('manufacture:add', (e, item) => {
    const txId = 'MFG-' + String(Date.now()).slice(-6);
    db.prepare(`INSERT INTO manufacture (transaction_id,product_name,brand,specification,quantity,unit,unit_cost,status,notes) VALUES (?,?,?,?,?,?,?,?,?)`)
      .run(txId, item.product_name, item.brand||'', item.specification||'', item.quantity, item.unit||'Units', item.unit_cost||0, item.status||'MANUFACTURED', item.notes||'');
    return { success: true };
  });

  // Scrap
  ipcMain.handle('scrap:add', (e, item) => {
    const txId = 'SCR-' + String(Date.now()).slice(-6);
    db.prepare(`INSERT INTO scrap (transaction_id,product_name,quantity,unit,reason,value_lost,status) VALUES (?,?,?,?,?,?,?)`)
      .run(txId, item.product_name, item.quantity, item.unit||'Units', item.reason||'', item.value_lost||0, 'SCRAPPED');
    return { success: true };
  });

  // Settings
  ipcMain.handle('settings:get', () => {
    const rows = db.prepare('SELECT * FROM settings').all();
    const s = {};
    rows.forEach(r => s[r.key] = r.value);
    return s;
  });

  ipcMain.handle('settings:set', (e, key, value) => {
    db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)').run(key, value);
    return { success: true };
  });
}

// ── App lifecycle ──────────────────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#f8faf2',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Green – The Botanical Ledger',
    show: false
  });

  mainWindow.loadFile('renderer/index.html');
  mainWindow.once('ready-to-show', () => mainWindow.show());
}

app.whenReady().then(() => {
  initDatabase();
  registerIpcHandlers();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (db) db.close();
    app.quit();
  }
});
