const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
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

  // Reset DB if data version is outdated (clears old botanical seed data)
  const dbVer = db.prepare("SELECT value FROM settings WHERE key='db_version'").get();
  if (!dbVer || dbVer.value !== '2') {
    db.exec('DELETE FROM inventory; DELETE FROM purchases; DELETE FROM sales; DELETE FROM manufacture; DELETE FROM scrap;');
    seedData();
    db.prepare("INSERT OR REPLACE INTO settings (key,value) VALUES ('db_version','2')").run();
  }
}

function seedData() {
  const items = [
    { product_id: 'GRN-001', name: 'Tata GI Wire 10mm', description: 'GI Wire 10mm gauge', brand: 'Tata', category: 'Wire', quantity: 500, unit: 'KG', unit_cost: 120, status: 'In Stock', image_emoji: '🔩' },
    { product_id: 'GRN-002', name: 'Tata GI Wire 12mm', description: 'GI Wire 12mm gauge', brand: 'Tata', category: 'Wire', quantity: 500, unit: 'KG', unit_cost: 140, status: 'In Stock', image_emoji: '🔩' },
    { product_id: 'GRN-003', name: 'Tata GI Wire 14mm', description: 'GI Wire 14mm gauge', brand: 'Tata', category: 'Wire', quantity: 500, unit: 'KG', unit_cost: 160, status: 'In Stock', image_emoji: '🔩' },
    { product_id: 'GRN-004', name: 'Tata GI Wire 16mm', description: 'GI Wire 16mm gauge', brand: 'Tata', category: 'Wire', quantity: 500, unit: 'KG', unit_cost: 180, status: 'In Stock', image_emoji: '🔩' },
    { product_id: 'GRN-005', name: 'Tata GI Wire 18mm', description: 'GI Wire 18mm gauge', brand: 'Tata', category: 'Wire', quantity: 500, unit: 'KG', unit_cost: 200, status: 'In Stock', image_emoji: '🔩' },
    { product_id: 'GRN-006', name: 'Tata GI Wire 20mm', description: 'GI Wire 20mm gauge', brand: 'Tata', category: 'Wire', quantity: 500, unit: 'KG', unit_cost: 220, status: 'In Stock', image_emoji: '🔩' },
    { product_id: 'GRN-007', name: 'Tata GI Wire 22mm', description: 'GI Wire 22mm gauge', brand: 'Tata', category: 'Wire', quantity: 500, unit: 'KG', unit_cost: 240, status: 'In Stock', image_emoji: '🔩' },
    { product_id: 'GRN-008', name: 'Tata GI Wire 24mm', description: 'GI Wire 24mm gauge', brand: 'Tata', category: 'Wire', quantity: 500, unit: 'KG', unit_cost: 260, status: 'In Stock', image_emoji: '🔩' },
    { product_id: 'GRN-009', name: 'Tata GI Wire 26mm', description: 'GI Wire 26mm gauge', brand: 'Tata', category: 'Wire', quantity: 500, unit: 'KG', unit_cost: 280, status: 'In Stock', image_emoji: '🔩' },
    { product_id: 'GRN-010', name: 'Tata GI Wire 28mm', description: 'GI Wire 28mm gauge', brand: 'Tata', category: 'Wire', quantity: 500, unit: 'KG', unit_cost: 300, status: 'In Stock', image_emoji: '🔩' },
    { product_id: 'GRN-011', name: 'JSW GI Wire 10mm', description: 'GI Wire 10mm gauge', brand: 'JSW', category: 'Wire', quantity: 500, unit: 'KG', unit_cost: 115, status: 'In Stock', image_emoji: '🔩' },
    { product_id: 'GRN-012', name: 'JSW GI Wire 12mm', description: 'GI Wire 12mm gauge', brand: 'JSW', category: 'Wire', quantity: 500, unit: 'KG', unit_cost: 135, status: 'In Stock', image_emoji: '🔩' },
    { product_id: 'GRN-013', name: 'JSW GI Wire 14mm', description: 'GI Wire 14mm gauge', brand: 'JSW', category: 'Wire', quantity: 500, unit: 'KG', unit_cost: 155, status: 'In Stock', image_emoji: '🔩' },
    { product_id: 'GRN-014', name: 'JSW GI Wire 16mm', description: 'GI Wire 16mm gauge', brand: 'JSW', category: 'Wire', quantity: 500, unit: 'KG', unit_cost: 175, status: 'In Stock', image_emoji: '🔩' },
    { product_id: 'GRN-015', name: 'JSW GI Wire 18mm', description: 'GI Wire 18mm gauge', brand: 'JSW', category: 'Wire', quantity: 500, unit: 'KG', unit_cost: 195, status: 'In Stock', image_emoji: '🔩' },
    { product_id: 'GRN-016', name: 'JSW GI Wire 20mm', description: 'GI Wire 20mm gauge', brand: 'JSW', category: 'Wire', quantity: 500, unit: 'KG', unit_cost: 215, status: 'In Stock', image_emoji: '🔩' },
    { product_id: 'GRN-017', name: 'JSW GI Wire 22mm', description: 'GI Wire 22mm gauge', brand: 'JSW', category: 'Wire', quantity: 500, unit: 'KG', unit_cost: 235, status: 'In Stock', image_emoji: '🔩' },
    { product_id: 'GRN-018', name: 'JSW GI Wire 24mm', description: 'GI Wire 24mm gauge', brand: 'JSW', category: 'Wire', quantity: 500, unit: 'KG', unit_cost: 255, status: 'In Stock', image_emoji: '🔩' },
    { product_id: 'GRN-019', name: 'JSW GI Wire 26mm', description: 'GI Wire 26mm gauge', brand: 'JSW', category: 'Wire', quantity: 500, unit: 'KG', unit_cost: 275, status: 'In Stock', image_emoji: '🔩' },
    { product_id: 'GRN-020', name: 'JSW GI Wire 28mm', description: 'GI Wire 28mm gauge', brand: 'JSW', category: 'Wire', quantity: 500, unit: 'KG', unit_cost: 295, status: 'In Stock', image_emoji: '🔩' },
  ];
  const ins = db.prepare(`INSERT INTO inventory (product_id,name,description,brand,category,quantity,unit,unit_cost,status,image_emoji) VALUES (?,?,?,?,?,?,?,?,?,?)`);
  items.forEach(i => ins.run(i.product_id, i.name, i.description, i.brand, i.category, i.quantity, i.unit, i.unit_cost, i.status, i.image_emoji));

  const purchases = [
    { transaction_id: 'GRN-9201', product_name: 'Tata GI Wire 10mm', vendor: 'Tata Steel', quantity: 500, unit: 'KG', unit_cost: 120, total_value: 60000, status: 'FULFILLED' },
    { transaction_id: 'GRN-9188', product_name: 'Tata GI Wire 16mm', vendor: 'Tata Steel', quantity: 500, unit: 'KG', unit_cost: 180, total_value: 90000, status: 'FULFILLED' },
    { transaction_id: 'GRN-8992', product_name: 'JSW GI Wire 12mm', vendor: 'JSW Steel', quantity: 500, unit: 'KG', unit_cost: 135, total_value: 67500, status: 'FULFILLED' },
    { transaction_id: 'GRN-8851', product_name: 'JSW GI Wire 20mm', vendor: 'JSW Steel', quantity: 500, unit: 'KG', unit_cost: 215, total_value: 107500, status: 'PENDING' },
    { transaction_id: 'GRN-8743', product_name: 'Tata GI Wire 24mm', vendor: 'Tata Steel', quantity: 500, unit: 'KG', unit_cost: 260, total_value: 130000, status: 'FULFILLED' },
  ];
  const insPur = db.prepare(`INSERT INTO purchases (transaction_id,product_name,vendor,quantity,unit,unit_cost,total_value,status) VALUES (?,?,?,?,?,?,?,?)`);
  purchases.forEach(p => insPur.run(p.transaction_id, p.product_name, p.vendor, p.quantity, p.unit, p.unit_cost, p.total_value, p.status));

  const sales = [
    { transaction_id: 'SL-9021', product_name: 'Tata GI Wire 10mm', customer: 'Ram Hardware', quantity: 100, unit: 'KG', unit_price: 135, total_value: 13500, status: 'COMPLETED', category: 'Direct Sale' },
    { transaction_id: 'SL-9022', product_name: 'JSW GI Wire 12mm', customer: 'Shyam Traders', quantity: 150, unit: 'KG', unit_price: 150, total_value: 22500, status: 'COMPLETED', category: 'Direct Sale' },
    { transaction_id: 'SL-9023', product_name: 'Tata GI Wire 18mm', customer: 'City Builders', quantity: 200, unit: 'KG', unit_price: 220, total_value: 44000, status: 'PROCESSING', category: 'Direct Sale' },
    { transaction_id: 'SL-9024', product_name: 'JSW GI Wire 22mm', customer: 'Metro Constructions', quantity: 120, unit: 'KG', unit_price: 250, total_value: 30000, status: 'COMPLETED', category: 'Direct Sale' },
  ];
  const insSale = db.prepare(`INSERT INTO sales (transaction_id,product_name,customer,quantity,unit,unit_price,total_value,status,category) VALUES (?,?,?,?,?,?,?,?,?)`);
  sales.forEach(s => insSale.run(s.transaction_id, s.product_name, s.customer, s.quantity, s.unit, s.unit_price, s.total_value, s.status, s.category));
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
    let tq = 'SELECT COUNT(*) as count, SUM(quantity) as items, SUM(total_value) as revenue FROM sales WHERE 1=1'; const tp = [];
    if (filters?.dateFrom) { tq += ' AND sale_date >= ?'; tp.push(filters.dateFrom); }
    if (filters?.dateTo)   { tq += ' AND sale_date <= ?'; tp.push(filters.dateTo+' 23:59:59'); }
    const totals = db.prepare(tq).get(...tp);
    return { rows, totals };
  });

  ipcMain.handle('reports:getPurchases', (e, filters) => {
    let q = 'SELECT * FROM purchases WHERE 1=1'; const p = [];
    if (filters?.dateFrom) { q += ' AND purchase_date >= ?'; p.push(filters.dateFrom); }
    if (filters?.dateTo)   { q += ' AND purchase_date <= ?'; p.push(filters.dateTo+' 23:59:59'); }
    q += ' ORDER BY purchase_date DESC';
    const rows = db.prepare(q).all(...p);
    let tq = 'SELECT COUNT(*) as count, SUM(quantity) as items, SUM(total_value) as cost FROM purchases WHERE 1=1'; const tp = [];
    if (filters?.dateFrom) { tq += ' AND purchase_date >= ?'; tp.push(filters.dateFrom); }
    if (filters?.dateTo)   { tq += ' AND purchase_date <= ?'; tp.push(filters.dateTo+' 23:59:59'); }
    const totals = db.prepare(tq).get(...tp);
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

  ipcMain.handle('reports:getScrap', (e, filters) => {
    let q = 'SELECT * FROM scrap WHERE 1=1'; const p = [];
    if (filters?.dateFrom) { q += ' AND scrap_date >= ?'; p.push(filters.dateFrom); }
    if (filters?.dateTo)   { q += ' AND scrap_date <= ?'; p.push(filters.dateTo+' 23:59:59'); }
    q += ' ORDER BY scrap_date DESC';
    const rows = db.prepare(q).all(...p);
    let tq = 'SELECT COUNT(*) as count, SUM(quantity) as total_qty, SUM(value_lost) as total_loss FROM scrap WHERE 1=1'; const tp = [];
    if (filters?.dateFrom) { tq += ' AND scrap_date >= ?'; tp.push(filters.dateFrom); }
    if (filters?.dateTo)   { tq += ' AND scrap_date <= ?'; tp.push(filters.dateTo+' 23:59:59'); }
    const totals = db.prepare(tq).get(...tp);
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

  // PDF Export
  ipcMain.handle('report:printPDF', async (e, htmlContent) => {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Report as PDF',
      defaultPath: path.join(app.getPath('downloads'), 'report.pdf'),
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    });
    if (canceled || !filePath) return { success: false };

    const pdfWin = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: false, contextIsolation: false } });
    await pdfWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));
    const pdfData = await pdfWin.webContents.printToPDF({ landscape: true, printBackground: true, pageSize: 'A4' });
    pdfWin.destroy();
    fs.writeFileSync(filePath, pdfData);
    return { success: true, filePath };
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
      nativeWindowOpen: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Green – The Botanical Ledger',
    show: false
  });

  // Allow print windows to open
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    return { action: 'allow', overrideBrowserWindowOptions: { width: 900, height: 700, webPreferences: { nodeIntegration: false, contextIsolation: false } } };
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
