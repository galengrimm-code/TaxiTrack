// TAXITRACK API - Google Apps Script
// Paste this into Extensions > Apps Script, Save, Deploy as Web App

const SHEETS = {
  Customers: ['customer_id','first_name','last_name','phone','email','city','state','notes','created_at','is_archived'],
  Services: ['service_id','category','species','mount_type','description','base_price','is_active','created_at'],
  Estimates: ['estimate_id','customer_id','date_created','status','notes','subtotal','tax_rate','total','converted_to_invoice_id','is_archived'],
  EstimateLineItems: ['line_item_id','estimate_id','service_id','description','species','mount_type','quantity','unit_price','line_total','sort_order'],
  Invoices: ['invoice_id','estimate_id','customer_id','date_created','status','subtotal','tax_rate','total','deposit_required','amount_paid','balance_due','is_archived'],
  InvoiceLineItems: ['line_item_id','invoice_id','service_id','description','species','mount_type','quantity','unit_price','line_total','sort_order'],
  Payments: ['payment_id','invoice_id','date','amount','method','notes','created_at'],
  Projects: ['project_id','invoice_id','customer_id','species','mount_type','description','status','status_updated_at','notes','is_archived'],
  Settings: ['key','value']
};

function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  try {
    const params = e.parameter || {};
    const postData = e.postData ? JSON.parse(e.postData.contents) : {};
    const action = params.action || postData.action;
    let result;
    switch(action) {
      case 'testConnection': result = testConnection(); break;
      case 'setupDatabase': result = setupDatabase(); break;
      case 'getAllData': result = getAllData(); break;
      case 'getSettings': result = getSettings(); break;
      case 'updateSettings': result = updateSettings(postData.data); break;
      case 'addCustomer': result = addRow('Customers', postData.data, 'CUST'); break;
      case 'updateCustomer': result = updateRow('Customers', 'customer_id', postData.data); break;
      case 'addService': result = addRow('Services', postData.data, 'SVC'); break;
      case 'updateService': result = updateRow('Services', 'service_id', postData.data); break;
      case 'addEstimate': result = addEstimate(postData.data); break;
      case 'updateEstimate': result = updateEstimate(postData.data); break;
      case 'updateEstimateStatus': result = updateEstimateStatus(postData.estimate_id, postData.status); break;
      case 'convertEstimateToInvoice': result = convertEstimateToInvoice(postData.estimate_id); break;
      case 'addPayment': result = addPayment(postData.data); break;
      case 'updateProjectStatus': result = updateProjectStatus(postData.project_id, postData.status, postData.notes); break;
      case 'batchUpdateProjects': result = batchUpdateProjects(postData.project_ids, postData.status, postData.notes); break;
      default: result = { error: 'Unknown action: ' + action };
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true, data: result })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function testConnection() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const needsSetup = !ss.getSheetByName('Customers');
  return { connected: true, needsSetup, sheetName: ss.getName() };
}

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEETS).forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.getRange(1, 1, 1, SHEETS[name].length).setValues([SHEETS[name]]);
      sheet.getRange(1, 1, 1, SHEETS[name].length).setFontWeight('bold').setBackground('#334155').setFontColor('#fff');
      sheet.setFrozenRows(1);
    }
  });
  const s1 = ss.getSheetByName('Sheet1');
  if (s1 && ss.getSheets().length > 1) ss.deleteSheet(s1);
  
  // Add starter services
  const svc = ss.getSheetByName('Services');
  if (svc.getLastRow() === 1) {
    svc.getRange(2,1,6,8).setValues([
      ['SVC-001','Big Game - Shoulder','Whitetail','Shoulder','Whitetail Deer - Shoulder Mount',650,true,new Date()],
      ['SVC-002','Big Game - Shoulder','Elk','Shoulder','Elk - Shoulder Mount',1100,true,new Date()],
      ['SVC-003','Birds - Turkey','Turkey','Strutter','Turkey - Full Strut',550,true,new Date()],
      ['SVC-004','Birds - Waterfowl','Mallard','Standing','Mallard Drake - Standing',325,true,new Date()],
      ['SVC-005','Miscellaneous','','Skull','European Skull Mount',150,true,new Date()],
      ['SVC-006','Repairs','','Repair','Minor Repair',75,true,new Date()]
    ]);
  }
  
  // Add default settings
  const settings = ss.getSheetByName('Settings');
  if (settings.getLastRow() === 1) {
    settings.getRange(2,1,6,2).setValues([
      ['business_name','Your Taxidermy Business'],
      ['phone','(555) 123-4567'],
      ['address','123 Main Street'],
      ['city_state_zip','Springfield, OR 97477'],
      ['email','info@yourbusiness.com'],
      ['default_deposit_percent','50']
    ]);
  }
  return { setup: true };
}

function getSheet(n) { return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(n); }
function genId(p) { return p + '-' + Date.now().toString().slice(-6) + Math.random().toString(36).slice(-2); }

// Generate project ID in format YY.XX (e.g., 26.01, 26.02)
function genProjectId() {
  const year = new Date().getFullYear().toString().slice(-2);
  const projects = toObjects(getSheet('Projects'));
  const yearProjects = projects.filter(p => p.project_id && p.project_id.startsWith(year + '.'));
  const maxNum = yearProjects.reduce((max, p) => {
    const num = parseInt(p.project_id.split('.')[1]) || 0;
    return num > max ? num : max;
  }, 0);
  const nextNum = (maxNum + 1).toString().padStart(2, '0');
  return year + '.' + nextNum;
}

function toObjects(sheet) {
  if (!sheet) return [];
  const d = sheet.getDataRange().getValues();
  if (d.length <= 1) return [];
  const h = d[0];
  return d.slice(1).map(r => { const o = {}; h.forEach((k,i) => o[k] = r[i]); return o; }).filter(o => o[h[0]]);
}

function findRow(sheet, col, id) {
  const d = sheet.getDataRange().getValues();
  const i = d[0].indexOf(col);
  for (let r = 1; r < d.length; r++) { if (d[r][i] == id) return r + 1; }
  return -1;
}

function addRow(sheetName, data, prefix) {
  const sheet = getSheet(sheetName);
  const headers = SHEETS[sheetName];
  const idCol = headers[0];
  if (!data[idCol]) data[idCol] = genId(prefix);
  if (headers.includes('created_at') && !data.created_at) data.created_at = new Date();
  if (headers.includes('is_active') && data.is_active === undefined) data.is_active = true;
  if (headers.includes('is_archived') && data.is_archived === undefined) data.is_archived = false;
  sheet.appendRow(headers.map(h => data[h] !== undefined ? data[h] : ''));
  return data;
}

function updateRow(sheetName, idCol, data) {
  const sheet = getSheet(sheetName);
  const headers = SHEETS[sheetName];
  const row = findRow(sheet, idCol, data[idCol]);
  if (row === -1) throw new Error('Not found');
  sheet.getRange(row, 1, 1, headers.length).setValues([headers.map(h => data[h] !== undefined ? data[h] : '')]);
  return data;
}

function getSettings() {
  const sheet = getSheet('Settings');
  const data = sheet.getDataRange().getValues();
  const settings = {};
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) settings[data[i][0]] = data[i][1];
  }
  return settings;
}

function updateSettings(data) {
  const sheet = getSheet('Settings');
  const existing = sheet.getDataRange().getValues();
  Object.keys(data).forEach(key => {
    let found = false;
    for (let i = 1; i < existing.length; i++) {
      if (existing[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(data[key]);
        found = true;
        break;
      }
    }
    if (!found) sheet.appendRow([key, data[key]]);
  });
  return getSettings();
}

function getAllData() {
  return {
    customers: toObjects(getSheet('Customers')).filter(c => !c.is_archived),
    services: toObjects(getSheet('Services')).filter(s => s.is_active !== false),
    estimates: toObjects(getSheet('Estimates')).filter(e => !e.is_archived),
    estimateLineItems: toObjects(getSheet('EstimateLineItems')),
    invoices: toObjects(getSheet('Invoices')).filter(i => !i.is_archived),
    invoiceLineItems: toObjects(getSheet('InvoiceLineItems')),
    payments: toObjects(getSheet('Payments')),
    projects: toObjects(getSheet('Projects')).filter(p => !p.is_archived),
    settings: getSettings()
  };
}

function addEstimate(data) {
  const id = genId('EST');
  const sub = data.line_items.reduce((s,l) => s + l.quantity * l.unit_price, 0);
  const est = { estimate_id: id, customer_id: data.customer_id, date_created: new Date(), status: 'Draft', notes: data.notes || '', subtotal: sub, tax_rate: 0, total: sub, converted_to_invoice_id: '', is_archived: false };
  addRow('Estimates', est, 'EST');
  data.line_items.forEach((l,i) => addRow('EstimateLineItems', { estimate_id: id, service_id: l.service_id || '', description: l.description, species: l.species || '', mount_type: l.mount_type || '', quantity: l.quantity, unit_price: l.unit_price, line_total: l.quantity * l.unit_price, sort_order: i + 1 }, 'ELI'));
  return { ...est, line_items: data.line_items };
}

function updateEstimate(data) {
  const sub = data.line_items.reduce((t,l) => t + l.quantity * l.unit_price, 0);
  const est = { ...data, subtotal: sub, total: sub };
  delete est.line_items;
  updateRow('Estimates', 'estimate_id', est);
  const liSheet = getSheet('EstimateLineItems');
  const all = liSheet.getDataRange().getValues();
  for (let i = all.length - 1; i >= 1; i--) { if (all[i][1] == data.estimate_id) liSheet.deleteRow(i + 1); }
  data.line_items.forEach((l,i) => addRow('EstimateLineItems', { estimate_id: data.estimate_id, service_id: l.service_id || '', description: l.description, species: l.species || '', mount_type: l.mount_type || '', quantity: l.quantity, unit_price: l.unit_price, line_total: l.quantity * l.unit_price, sort_order: i + 1 }, 'ELI'));
  return { ...est, line_items: data.line_items };
}

function updateEstimateStatus(estId, status) {
  const sheet = getSheet('Estimates');
  const est = toObjects(sheet).find(e => e.estimate_id == estId);
  if (!est) throw new Error('Not found');
  est.status = status;
  updateRow('Estimates', 'estimate_id', est);
  return est;
}

function convertEstimateToInvoice(estId) {
  const est = toObjects(getSheet('Estimates')).find(e => e.estimate_id == estId);
  if (!est) throw new Error('Estimate not found');
  const lis = toObjects(getSheet('EstimateLineItems')).filter(l => l.estimate_id == estId);
  const invId = genId('INV');
  const inv = { invoice_id: invId, estimate_id: estId, customer_id: est.customer_id, date_created: new Date(), status: 'Unpaid', subtotal: est.subtotal, tax_rate: 0, total: est.total, deposit_required: est.total * 0.5, amount_paid: 0, balance_due: est.total, is_archived: false };
  addRow('Invoices', inv, 'INV');
  const projs = [];
  lis.forEach((l,i) => {
    addRow('InvoiceLineItems', { invoice_id: invId, service_id: l.service_id, description: l.description, species: l.species, mount_type: l.mount_type, quantity: l.quantity, unit_price: l.unit_price, line_total: l.line_total, sort_order: i + 1 }, 'ILI');
    const projId = genProjectId();
    const p = { project_id: projId, invoice_id: invId, customer_id: est.customer_id, species: l.species, mount_type: l.mount_type, description: l.description, status: 'Received', status_updated_at: new Date(), notes: '', is_archived: false };
    addRow('Projects', p, 'PRJ');
    projs.push(p);
  });
  est.status = 'Converted';
  est.converted_to_invoice_id = invId;
  updateRow('Estimates', 'estimate_id', est);
  return { invoice: inv, projects: projs, invoiceLineItems: lis.map((l,i) => ({...l, invoice_id: invId, line_item_id: 'ILI-'+i})) };
}

function addPayment(data) {
  const pay = { invoice_id: data.invoice_id, date: data.date || new Date(), amount: data.amount, method: data.method || 'Cash', notes: data.notes || '', created_at: new Date() };
  addRow('Payments', pay, 'PAY');
  const invSheet = getSheet('Invoices');
  const inv = toObjects(invSheet).find(i => i.invoice_id == data.invoice_id);
  const row = findRow(invSheet, 'invoice_id', data.invoice_id);
  const paid = Number(inv.amount_paid) + Number(data.amount);
  const bal = Number(inv.total) - paid;
  inv.amount_paid = paid;
  inv.balance_due = Math.max(0, bal);
  inv.status = bal <= 0 ? 'Paid' : (paid > 0 ? 'Deposit Paid' : 'Unpaid');
  updateRow('Invoices', 'invoice_id', inv);
  return { payment: pay, invoice: inv };
}

function updateProjectStatus(id, status, notes) {
  const sheet = getSheet('Projects');
  const proj = toObjects(sheet).find(p => p.project_id == id);
  if (!proj) throw new Error('Project not found');
  proj.status = status;
  proj.status_updated_at = new Date();
  if (notes !== undefined) proj.notes = notes;
  updateRow('Projects', 'project_id', proj);
  return proj;
}

function batchUpdateProjects(ids, status, notes) {
  return ids.map(id => { try { return updateProjectStatus(id, status, notes); } catch(e) { return { error: e.toString(), id }; }});
}
