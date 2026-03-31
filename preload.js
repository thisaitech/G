const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Dashboard
  getDashboard: () => ipcRenderer.invoke('dashboard:get'),

  // Inventory
  getInventory: (filters) => ipcRenderer.invoke('inventory:getAll', filters),
  addInventory: (item) => ipcRenderer.invoke('inventory:add', item),
  updateInventory: (item) => ipcRenderer.invoke('inventory:update', item),
  deleteInventory: (id) => ipcRenderer.invoke('inventory:delete', id),
  getCategories: () => ipcRenderer.invoke('inventory:getCategories'),

  // Purchases
  getPurchases: (filters) => ipcRenderer.invoke('purchases:getAll', filters),
  addPurchase: (purchase) => ipcRenderer.invoke('purchases:add', purchase),
  deletePurchase: (id) => ipcRenderer.invoke('purchases:delete', id),

  // Sales
  getSales: (filters) => ipcRenderer.invoke('sales:getAll', filters),
  addSale: (sale) => ipcRenderer.invoke('sales:add', sale),
  deleteSale: (id) => ipcRenderer.invoke('sales:delete', id),

  // Reports
  getReportSales: (filters) => ipcRenderer.invoke('reports:getSales', filters),
  getReportDirectSales: (filters) => ipcRenderer.invoke('reports:getDirectSales', filters),
  getReportPurchases: (filters) => ipcRenderer.invoke('reports:getPurchases', filters),
  getReportStock: () => ipcRenderer.invoke('reports:getStock'),
  getReportManufacture: (filters) => ipcRenderer.invoke('reports:getManufacture', filters),
  getReportScrap: (filters) => ipcRenderer.invoke('reports:getScrap', filters),
  getReportUnified: (filters) => ipcRenderer.invoke('reports:getUnified', filters),

  // Manufacture & Scrap
  addManufacture: (item) => ipcRenderer.invoke('manufacture:add', item),
  addScrap: (item) => ipcRenderer.invoke('scrap:add', item),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSetting: (key, value) => ipcRenderer.invoke('settings:set', key, value),

  // PDF
  printPDF: (html, filename) => ipcRenderer.invoke('report:printPDF', html, filename),
  viewHTML: (html, title) => ipcRenderer.invoke('report:viewHTML', html, title),
});
