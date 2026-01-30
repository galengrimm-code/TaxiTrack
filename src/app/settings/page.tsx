'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout';
import { Card, CardContent, Button, Input } from '@/components/ui';
import { useData } from '@/lib/DataContext';
import * as api from '@/lib/api';
import { CheckCircle, Database, Copy } from 'lucide-react';

// Apps Script code for copying
const APPS_SCRIPT_CODE = `// TAXITRACK API - Paste into Extensions > Apps Script, Save, Deploy as Web App
// Full code available at: https://github.com/galengrimm-code/TaxiTrack/blob/main/apps-script/Code.gs

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

// ... See full code in GitHub repo`;

function SettingsContent() {
  const { settings, updateSettings, connected } = useData();
  
  const [apiUrl, setApiUrl] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string; needsSetup?: boolean } | null>(null);
  const [testing, setTesting] = useState(false);
  const [settingUp, setSettingUp] = useState(false);
  
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
      if (result) {
        setConnectionStatus({ success: true, message: 'Database setup complete!', needsSetup: false });
      }
    } catch (error) {
      setConnectionStatus({ success: false, message: `Setup failed: ${error}` });
    }
    
    setSettingUp(false);
  };

  const saveSettings = async () => {
    api.setApiUrl(apiUrl);
    
    if (connected) {
      await updateSettings(businessInfo as any);
      alert('Settings saved!');
    } else {
      alert('Settings saved locally. Connect to Google Sheets to sync.');
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
              <Button variant="ghost" size="sm" onClick={copyCode}>
                <Copy className="w-4 h-4" />
                Copy Code
              </Button>
            </div>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-xl text-xs font-mono max-h-48 overflow-auto">
              <pre className="whitespace-pre-wrap">{APPS_SCRIPT_CODE}</pre>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Full code available at: <a href="https://github.com/galengrimm-code/TaxiTrack/blob/main/apps-script/Code.gs" target="_blank" className="text-amber-600 hover:underline">GitHub</a>
            </p>
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

      <Button onClick={saveSettings} size="lg">
        Save Settings
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
