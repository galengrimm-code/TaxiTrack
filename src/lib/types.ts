// ============================================================================
// TAXITRACK - TYPE DEFINITIONS
// ============================================================================

export interface Customer {
  customer_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  notes?: string;
  created_at: string;
  is_archived: boolean;
}

export interface Service {
  service_id: string;
  category: string;
  species: string;
  mount_type: string;
  description: string;
  base_price: number;
  is_active: boolean;
  created_at?: string;
}

export interface Estimate {
  estimate_id: string;
  customer_id: string;
  date_created: string;
  status: EstimateStatus;
  notes?: string;
  subtotal: number;
  tax_rate: number;
  total: number;
  converted_to_invoice_id?: string;
  is_archived: boolean;
}

export type EstimateStatus = 'Draft' | 'Sent' | 'Approved' | 'Declined' | 'Converted';

export interface EstimateLineItem {
  line_item_id: string;
  estimate_id: string;
  service_id?: string;
  description: string;
  species?: string;
  mount_type?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  sort_order: number;
}

export interface Invoice {
  invoice_id: string;
  estimate_id?: string;
  customer_id: string;
  date_created: string;
  status: InvoiceStatus;
  subtotal: number;
  tax_rate: number;
  total: number;
  deposit_required: number;
  amount_paid: number;
  balance_due: number;
  is_archived: boolean;
}

export type InvoiceStatus = 'Unpaid' | 'Deposit Paid' | 'Paid';

export interface InvoiceLineItem {
  line_item_id: string;
  invoice_id: string;
  service_id?: string;
  description: string;
  species?: string;
  mount_type?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  sort_order: number;
}

export interface Payment {
  payment_id: string;
  invoice_id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  notes?: string;
  created_at: string;
}

export type PaymentMethod = 'Cash' | 'Check' | 'Card' | 'Venmo' | 'Other';

export interface Project {
  project_id: string;
  invoice_id: string;
  customer_id: string;
  species?: string;
  mount_type?: string;
  description: string;
  status: ProjectStatus;
  status_updated_at: string;
  notes?: string;
  completed_at?: string;
  is_archived: boolean;
}

export type ProjectStatus = 
  | 'Received' 
  | 'In Progress' 
  | 'At Tannery' 
  | 'Finishing' 
  | 'Ready' 
  | 'Completed' 
  | 'Picked Up';

export interface Settings {
  business_name: string;
  phone: string;
  address: string;
  city_state_zip: string;
  email: string;
  default_deposit_percent: string;
  [key: string]: string;
}

// Lookup tables
export interface Category {
  category_id: string;
  name: string;
  icon: string;
  sort_order: number;
}

export interface Species {
  species_id: string;
  category: string;
  name: string;
  sort_order: number;
}

export interface MountType {
  mount_type_id: string;
  category: string;
  species: string; // empty string means applies to all species in category
  name: string;
  sort_order: number;
}

// ============================================================================
// API TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AllData {
  customers: Customer[];
  services: Service[];
  estimates: Estimate[];
  estimateLineItems: EstimateLineItem[];
  invoices: Invoice[];
  invoiceLineItems: InvoiceLineItem[];
  payments: Payment[];
  projects: Project[];
  settings: Settings;
  categories: Category[];
  species: Species[];
  mountTypes: MountType[];
}

export interface ConnectionStatus {
  connected: boolean;
  needsSetup: boolean;
  sheetName: string;
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface CustomerFormData {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  notes?: string;
}

export interface ServiceFormData {
  category: string;
  species: string;
  mount_type: string;
  description: string;
  base_price: number;
}

export interface EstimateFormData {
  customer_id: string;
  notes?: string;
  line_items: LineItemFormData[];
}

export interface LineItemFormData {
  service_id?: string;
  description: string;
  species?: string;
  mount_type?: string;
  quantity: number;
  unit_price: number;
}

export interface PaymentFormData {
  invoice_id: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  notes?: string;
}

// ============================================================================
// UI TYPES
// ============================================================================

export interface ModalState {
  show: boolean;
  type: ModalType | null;
  data?: unknown;
}

export type ModalType = 
  | 'customer' 
  | 'service' 
  | 'estimate' 
  | 'payment' 
  | 'tannery';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export type PageId = 
  | 'dashboard' 
  | 'customers' 
  | 'estimates' 
  | 'invoices' 
  | 'projects' 
  | 'pricebook' 
  | 'reports' 
  | 'settings';
