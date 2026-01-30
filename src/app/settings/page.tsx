'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout';
import { Card, CardContent, Button, Input } from '@/components/ui';
import { useData } from '@/lib/DataContext';
import * as api from '@/lib/api';
import { CheckCircle, Database, Copy, ExternalLink } from 'lucide-react';

// Full Apps Script code
const APPS_SCRIPT_CODE = `// TAXITRACK API - Google Apps Script
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
  Settings: ['key','value'],
  Categories: ['category_id','name','icon','sort_order'],
  Species: ['species_id','category','name','sort_order'],
  MountTypes: ['mount_type_id','category','species','name','sort_order']
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
      case 'addSpecies': result = addSpecies(postData.data); break;
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

  // Setup Categories lookup
  const cats = ss.getSheetByName('Categories');
  if (cats.getLastRow() === 1) {
    cats.getRange(2,1,8,4).setValues([
      ['CAT-01','Big Game','🦌',1],
      ['CAT-02','Birds','🦃',2],
      ['CAT-03','Fish','🐟',3],
      ['CAT-04','Small Game','🦝',4],
      ['CAT-05','European / Skull','💀',5],
      ['CAT-06','Tanning','🧪',6],
      ['CAT-07','Repairs','🔧',7],
      ['CAT-08','Fees / Admin','💵',8]
    ]);
  }

  // Setup Species lookup
  const spec = ss.getSheetByName('Species');
  if (spec.getLastRow() === 1) {
    spec.getRange(2,1,30,4).setValues([
      ['SP-01','Big Game','Whitetail',1],['SP-02','Big Game','Mule Deer',2],['SP-03','Big Game','Elk',3],
      ['SP-04','Big Game','Antelope',4],['SP-05','Big Game','Bear',5],['SP-06','Big Game','Moose',6],
      ['SP-07','Birds','Turkey',1],['SP-08','Birds','Pheasant',2],['SP-09','Birds','Duck',3],
      ['SP-10','Birds','Goose',4],['SP-11','Birds','Grouse',5],['SP-12','Birds','Quail',6],
      ['SP-13','Fish','Bass',1],['SP-14','Fish','Walleye',2],['SP-15','Fish','Crappie',3],
      ['SP-16','Fish','Pike',4],['SP-17','Fish','Trout',5],['SP-18','Fish','Catfish',6],
      ['SP-19','Small Game','Squirrel',1],['SP-20','Small Game','Raccoon',2],['SP-21','Small Game','Fox',3],
      ['SP-22','Small Game','Coyote',4],['SP-23','Small Game','Bobcat',5],
      ['SP-24','European / Skull','Whitetail',1],['SP-25','European / Skull','Elk',2],['SP-26','European / Skull','Bear',3],
      ['SP-27','Tanning','Deer',1],['SP-28','Tanning','Elk',2],['SP-29','Tanning','Bear',3],['SP-30','Tanning','Small Game',4]
    ]);
  }

  // Setup MountTypes lookup
  const mts = ss.getSheetByName('MountTypes');
  if (mts.getLastRow() === 1) {
    mts.getRange(2,1,35,5).setValues([
      ['MT-01','Big Game','','Shoulder',1],['MT-02','Big Game','','Pedestal',2],['MT-03','Big Game','','Life Size',3],
      ['MT-04','Big Game','','Rug',4],['MT-05','Big Game','','Hide Tanning',5],
      ['MT-06','Birds','','Standing',1],['MT-07','Birds','','Flying',2],['MT-08','Birds','','Swimming',3],
      ['MT-09','Birds','Turkey','Strutter',4],['MT-10','Birds','','Wall Mount',5],
      ['MT-11','Fish','','Skin Mount',1],['MT-12','Fish','','Replica',2],['MT-13','Fish','','Wall Mount',3],
      ['MT-14','Fish','','Pedestal',4],['MT-15','Fish','','Open Mouth',5],
      ['MT-16','Small Game','','Standing',1],['MT-17','Small Game','','Walking',2],['MT-18','Small Game','','Life Size',3],['MT-19','Small Game','','Rug',4],
      ['MT-20','European / Skull','','European Skull',1],['MT-21','European / Skull','','Boiled & Cleaned',2],['MT-22','European / Skull','','Plaque Mount',3],
      ['MT-23','Tanning','','Cape Tanning',1],['MT-24','Tanning','','Hide Tanning',2],['MT-25','Tanning','','Hair-On',3],['MT-26','Tanning','','Hair-Off',4],
      ['MT-27','Repairs','','Minor Repair',1],['MT-28','Repairs','','Major Repair',2],['MT-29','Repairs','','Antler Repair',3],['MT-30','Repairs','','Ear Repair',4],['MT-31','Repairs','','Cleaning',5],
      ['MT-32','Fees / Admin','','Rush Fee',1],['MT-33','Fees / Admin','','Storage Fee',2],['MT-34','Fees / Admin','','Late Pickup Fee',3],['MT-35','Fees / Admin','','Shipping',4]
    ]);
  }

  // Setup starter Services
  const svc = ss.getSheetByName('Services');
  if (svc.getLastRow() === 1) {
    svc.getRange(2,1,10,8).setValues([
      ['SVC-001','Big Game','Whitetail','Shoulder','Whitetail Shoulder Mount',650,true,new Date()],
      ['SVC-002','Big Game','Elk','Shoulder','Elk Shoulder Mount',1100,true,new Date()],
      ['SVC-003','Big Game','Whitetail','Pedestal','Whitetail Pedestal Mount',850,true,new Date()],
      ['SVC-004','Birds','Turkey','Strutter','Turkey Full Strut',550,true,new Date()],
      ['SVC-005','Birds','Duck','Standing','Duck Standing Mount',325,true,new Date()],
      ['SVC-006','Fish','Bass','Replica','Bass Replica Mount',18,true,new Date()],
      ['SVC-007','European / Skull','Whitetail','European Skull','Whitetail European Skull',150,true,new Date()],
      ['SVC-008','Tanning','Deer','Cape Tanning','Deer Cape Tanning',85,true,new Date()],
      ['SVC-009','Repairs','Any','Minor Repair','Minor Repair',75,true,new Date()],
      ['SVC-010','Fees / Admin','N/A','Rush Fee','Rush Fee (25%)',0,true,new Date()]
    ]);
  }

  // Setup Settings
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

function addSpecies(data) {
  const sheet = getSheet('Species');
  const existing = toObjects(sheet);
  // Check if species already exists for this category
  const exists = existing.find(s => s.category === data.category && s.name.toLowerCase() === data.name.toLowerCase());
  if (exists) return exists;
  // Get next sort order
  const maxSort = existing.filter(s => s.category === data.category).reduce((max, s) => Math.max(max, s.sort_order || 0), 0);
  const newSpecies = {
    species_id: genId('SP'),
    category: data.category,
    name: data.name,
    sort_order: maxSort + 1
  };
  sheet.appendRow([newSpecies.species_id, newSpecies.category, newSpecies.name, newSpecies.sort_order]);
  return newSpecies;
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
    settings: getSettings(),
    categories: toObjects(getSheet('Categories')),
    species: toObjects(getSheet('Species')),
    mountTypes: toObjects(getSheet('MountTypes'))
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
}`;

function SettingsContent() {
  const { settings, updateSettings, connected } = useData();
  
  const [apiUrl, setApiUrl] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string; needsSetup?: boolean } | null>(null);
  const [testing, setTesting] = useState(false);
  const [settingUp, setSettingUp] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  
  const [businessInfo, setBusinessInfo] = useState({
    business_name: '',
    phone: '',
    address: '',
    city_state_zip: '',
    email: '',
    default_deposit_percent: '50',
  });

  useEffect(() => {
    // Load API URL from localStorage
    const savedUrl = api.getStoredApiUrl();
    if (savedUrl) setApiUrl(savedUrl);
    
    // Load settings
    if (settings) {
      setBusinessInfo({
        business_name: settings.business_name || '',
        phone: settings.phone || '',
        address: settings.address || '',
        city_state_zip: settings.city_state_zip || '',
        email: settings.email || '',
        default_deposit_percent: settings.default_deposit_percent || '50',
      });
    }
  }, [settings]);

  const testConnection = async () => {
    if (!apiUrl) {
      setConnectionStatus({ success: false, message: 'Please enter an API URL' });
      return;
    }
    
    setTesting(true);
    setConnectionStatus(null);
    
    try {
      api.setApiUrl(apiUrl);
      const result = await api.testConnection();
      
      if (result) {
        setConnectionStatus({
          success: true,
          message: `Connected to: ${result.sheetName}`,
          needsSetup: result.needsSetup,
        });
        
        // Load settings if database is set up
        if (!result.needsSetup) {
          const settingsData = await api.getSettings();
          if (settingsData) {
            setBusinessInfo(prev => ({ ...prev, ...settingsData }));
          }
        }
      } else {
        setConnectionStatus({ success: false, message: 'Connection failed' });
      }
    } catch (error) {
      setConnectionStatus({ success: false, message: `Failed to connect: ${error}` });
    }
    
    setTesting(false);
  };

  const setupDatabase = async () => {
    setSettingUp(true);

    try {
      const result = await api.setupDatabase();
      if (result && result.setup) {
        setConnectionStatus({ success: true, message: 'Database setup complete! Refresh the page to load data.', needsSetup: false });
        // Reload the page after a short delay to load the new data
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setConnectionStatus({ success: false, message: 'Setup returned unexpected result' });
      }
    } catch (error) {
      setConnectionStatus({ success: false, message: `Setup failed: ${error}` });
    }

    setSettingUp(false);
  };

  const saveSettings = async () => {
    if (savingSettings) return;

    setSavingSettings(true);
    try {
      api.setApiUrl(apiUrl);

      if (connected) {
        await updateSettings(businessInfo as any);
        alert('Settings saved!');
      } else {
        alert('Settings saved locally. Connect to Google Sheets to sync.');
      }
    } finally {
      setSavingSettings(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    alert('Code copied to clipboard!');
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Configure your TaxiTrack installation</p>
      </div>

      {/* Google Sheets Connection */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Database className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Google Sheets Connection</h2>
              <p className="text-sm text-gray-500">Connect to sync your data</p>
            </div>
          </div>

          {/* Setup Instructions */}
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <h3 className="font-medium text-blue-800 mb-2">📋 Quick Setup (3 steps)</h3>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Create a <strong>new blank Google Sheet</strong></li>
              <li>Go to <strong>Extensions → Apps Script</strong>, paste the code below, click <strong>Deploy → New deployment → Web app → Anyone</strong></li>
              <li>Copy the URL, paste below, click <strong>Test Connection</strong>, then <strong>Setup Database</strong></li>
            </ol>
          </div>

          {/* Apps Script Code */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Apps Script Code</label>
              <div className="flex gap-2">
                <a
                  href="https://github.com/galengrimm-code/TaxiTrack/blob/main/apps-script/Code.gs"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="ghost" size="sm" type="button">
                    <ExternalLink className="w-4 h-4" />
                    View on GitHub
                  </Button>
                </a>
                <Button variant="ghost" size="sm" onClick={copyCode}>
                  <Copy className="w-4 h-4" />
                  Copy Code
                </Button>
              </div>
            </div>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-xl text-xs font-mono max-h-64 overflow-auto">
              <pre className="whitespace-pre-wrap">{APPS_SCRIPT_CODE}</pre>
            </div>
          </div>

          {/* API URL Input */}
          <div className="space-y-4">
            <div className="flex gap-3">
              <Input
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/xxxxx/exec"
                className="flex-1"
              />
              <Button onClick={testConnection} loading={testing} variant="secondary">
                Test Connection
              </Button>
            </div>

            {/* Connection Status */}
            {connectionStatus && (
              <div className={`p-4 rounded-xl ${connectionStatus.success ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {connectionStatus.success ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <span className="text-red-600">❌</span>
                    )}
                    <span className={`font-medium ${connectionStatus.success ? 'text-emerald-700' : 'text-red-700'}`}>
                      {connectionStatus.message}
                    </span>
                  </div>
                  {connectionStatus.success && connectionStatus.needsSetup && (
                    <Button onClick={setupDatabase} loading={settingUp} size="sm">
                      🚀 Setup Database
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card>
        <CardContent>
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Business Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Business Name"
              value={businessInfo.business_name}
              onChange={(e) => setBusinessInfo({ ...businessInfo, business_name: e.target.value })}
            />
            <Input
              label="Phone"
              value={businessInfo.phone}
              onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
            />
            <Input
              label="Address"
              value={businessInfo.address}
              onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
            />
            <Input
              label="City, State, ZIP"
              value={businessInfo.city_state_zip}
              onChange={(e) => setBusinessInfo({ ...businessInfo, city_state_zip: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={businessInfo.email}
              onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
            />
            <Input
              label="Default Deposit %"
              type="number"
              value={businessInfo.default_deposit_percent}
              onChange={(e) => setBusinessInfo({ ...businessInfo, default_deposit_percent: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={saveSettings} size="lg" disabled={savingSettings}>
        {savingSettings ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AppShell>
      <SettingsContent />
    </AppShell>
  );
}
