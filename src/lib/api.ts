// ============================================================================
// TAXITRACK - API CLIENT
// ============================================================================

import type {
  ApiResponse,
  AllData,
  ConnectionStatus,
  Customer,
  CustomerFormData,
  Service,
  ServiceFormData,
  Estimate,
  EstimateFormData,
  Invoice,
  Payment,
  PaymentFormData,
  Project,
  Settings,
} from './types';

/**
 * Get the API URL from environment or localStorage
 */
function getApiUrl(): string | null {
  // Check environment variable first (for server-side)
  if (process.env.NEXT_PUBLIC_SHEETS_API_URL) {
    return process.env.NEXT_PUBLIC_SHEETS_API_URL;
  }
  // Fall back to localStorage (for client-side configuration)
  if (typeof window !== 'undefined') {
    return localStorage.getItem('taxitrack_api_url');
  }
  return null;
}

/**
 * Make an API call to Google Sheets
 * Note: Using text/plain to avoid CORS preflight with Apps Script
 */
async function apiCall<T>(
  action: string,
  data?: Record<string, unknown>
): Promise<T | null> {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    console.warn('No API URL configured');
    return null;
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...data }),
    });

    const result: ApiResponse<T> = await response.json();

    if (result.success) {
      return result.data ?? null;
    }

    console.error('API Error:', result.error);
    return null;
  } catch (err) {
    console.error('API Call Failed:', err);
    return null;
  }
}

/**
 * Make a GET API call
 */
async function apiGet<T>(action: string): Promise<T | null> {
  const apiUrl = getApiUrl();
  if (!apiUrl) return null;

  try {
    const response = await fetch(`${apiUrl}?action=${action}`);
    const result: ApiResponse<T> = await response.json();
    return result.success ? (result.data ?? null) : null;
  } catch (err) {
    console.error('API GET Failed:', err);
    return null;
  }
}

// ============================================================================
// CONNECTION & SETUP
// ============================================================================

export async function testConnection(): Promise<ConnectionStatus | null> {
  return apiGet<ConnectionStatus>('testConnection');
}

export async function setupDatabase(): Promise<{ setup: boolean } | null> {
  return apiCall<{ setup: boolean }>('setupDatabase');
}

export async function getAllData(): Promise<AllData | null> {
  return apiGet<AllData>('getAllData');
}

// ============================================================================
// CUSTOMERS
// ============================================================================

export async function addCustomer(data: CustomerFormData): Promise<Customer | null> {
  return apiCall<Customer>('addCustomer', { data });
}

export async function updateCustomer(data: Customer): Promise<Customer | null> {
  return apiCall<Customer>('updateCustomer', { data });
}

// ============================================================================
// SERVICES
// ============================================================================

export async function addService(data: ServiceFormData): Promise<Service | null> {
  return apiCall<Service>('addService', { data });
}

export async function updateService(data: Service): Promise<Service | null> {
  return apiCall<Service>('updateService', { data });
}

// ============================================================================
// ESTIMATES
// ============================================================================

export async function addEstimate(data: EstimateFormData): Promise<Estimate | null> {
  return apiCall<Estimate>('addEstimate', { data });
}

export async function updateEstimate(
  data: Estimate & { line_items: EstimateFormData['line_items'] }
): Promise<Estimate | null> {
  return apiCall<Estimate>('updateEstimate', { data });
}

export async function updateEstimateStatus(
  estimate_id: string,
  status: string
): Promise<Estimate | null> {
  return apiCall<Estimate>('updateEstimateStatus', { estimate_id, status });
}

export async function convertEstimateToInvoice(
  estimate_id: string
): Promise<{ invoice: Invoice; projects: Project[] } | null> {
  return apiCall<{ invoice: Invoice; projects: Project[] }>(
    'convertEstimateToInvoice',
    { estimate_id }
  );
}

// ============================================================================
// PAYMENTS
// ============================================================================

export async function addPayment(
  data: PaymentFormData
): Promise<{ payment: Payment; invoice: Invoice } | null> {
  return apiCall<{ payment: Payment; invoice: Invoice }>('addPayment', { data });
}

// ============================================================================
// PROJECTS
// ============================================================================

export async function updateProjectStatus(
  project_id: string,
  status: string,
  notes?: string
): Promise<Project | null> {
  return apiCall<Project>('updateProjectStatus', { project_id, status, notes });
}

export async function batchUpdateProjects(
  project_ids: string[],
  status: string,
  notes?: string
): Promise<Project[] | null> {
  return apiCall<Project[]>('batchUpdateProjects', { project_ids, status, notes });
}

// ============================================================================
// SETTINGS
// ============================================================================

export async function getSettings(): Promise<Settings | null> {
  return apiGet<Settings>('getSettings');
}

export async function updateSettings(data: Settings): Promise<Settings | null> {
  return apiCall<Settings>('updateSettings', { data });
}

// ============================================================================
// API URL MANAGEMENT
// ============================================================================

export function setApiUrl(url: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('taxitrack_api_url', url);
  }
}

export function getStoredApiUrl(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('taxitrack_api_url');
  }
  return null;
}

export function clearApiUrl(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('taxitrack_api_url');
  }
}
