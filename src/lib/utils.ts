// ============================================================================
// TAXITRACK - UTILITY FUNCTIONS
// ============================================================================

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format a date string for display
 */
export function formatDate(dateString: string | Date): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date for input fields (YYYY-MM-DD)
 */
export function formatDateInput(dateString: string | Date): string {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

/**
 * Format a phone number
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const str = String(phone);
  const cleaned = str.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return str;
}

/**
 * Generate a unique ID with a prefix
 */
export function generateId(prefix: string): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).slice(-4);
  return `${prefix}-${timestamp}${random}`;
}

/**
 * Generate a project ID in format YY.XX (e.g., 26.01, 26.02)
 */
export function generateProjectId(existingProjects: { project_id: string }[]): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const yearProjects = existingProjects.filter(p =>
    p.project_id && p.project_id.startsWith(year + '.')
  );
  const maxNum = yearProjects.reduce((max, p) => {
    const parts = p.project_id.split('.');
    const num = parseInt(parts[1]) || 0;
    return num > max ? num : max;
  }, 0);
  const nextNum = (maxNum + 1).toString().padStart(2, '0');
  return `${year}.${nextNum}`;
}

/**
 * Calculate days since a date
 */
export function daysSince(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Get status color classes for estimates
 */
export function getEstimateStatusColor(status: string): string {
  const colors: Record<string, string> = {
    Draft: 'bg-gray-100 text-gray-600',
    Sent: 'bg-blue-100 text-blue-700',
    Approved: 'bg-emerald-100 text-emerald-700',
    Declined: 'bg-red-100 text-red-700',
    Converted: 'bg-purple-100 text-purple-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

/**
 * Get status color classes for invoices
 */
export function getInvoiceStatusColor(status: string): string {
  const colors: Record<string, string> = {
    Unpaid: 'bg-red-100 text-red-700',
    'Deposit Paid': 'bg-amber-100 text-amber-700',
    Paid: 'bg-emerald-100 text-emerald-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

/**
 * Get status color classes for projects
 */
export function getProjectStatusColor(status: string): string {
  const colors: Record<string, string> = {
    Received: 'bg-blue-100 text-blue-700',
    'In Progress': 'bg-amber-100 text-amber-700',
    'At Tannery': 'bg-purple-100 text-purple-700',
    Finishing: 'bg-orange-100 text-orange-700',
    Ready: 'bg-emerald-100 text-emerald-700',
    Completed: 'bg-gray-100 text-gray-600',
    'Picked Up': 'bg-gray-100 text-gray-500',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

/**
 * Combine class names, filtering out falsy values
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Service categories
 */
export const SERVICE_CATEGORIES = [
  'Big Game - Shoulder',
  'Big Game - Pedestal',
  'Big Game - Life-size',
  'Birds - Turkey',
  'Birds - Waterfowl',
  'Birds - Upland',
  'Fish - Replica',
  'Fish - Skin Mount',
  'Habitats & Bases',
  'Repairs',
  'Miscellaneous',
] as const;

/**
 * Project statuses in order
 */
export const PROJECT_STATUSES = [
  { value: 'Received', label: 'Received' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'At Tannery', label: 'At Tannery' },
  { value: 'Finishing', label: 'Finishing' },
  { value: 'Ready', label: 'Ready for Pickup' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Picked Up', label: 'Picked Up' },
] as const;

/**
 * Payment methods
 */
export const PAYMENT_METHODS = [
  'Cash',
  'Check',
  'Card',
  'Venmo',
  'Other',
] as const;
