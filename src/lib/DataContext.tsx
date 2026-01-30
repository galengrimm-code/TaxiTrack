'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import * as api from '@/lib/api';
import { generateId, generateProjectId } from '@/lib/utils';
import type {
  Customer,
  Service,
  Estimate,
  EstimateLineItem,
  Invoice,
  InvoiceLineItem,
  Payment,
  Project,
  Settings,
  Category,
  Species,
  MountType,
  CustomerFormData,
  ServiceFormData,
  EstimateFormData,
  PaymentFormData,
} from '@/lib/types';

// Local cache key
const CACHE_KEY = 'taxitrack_data_cache';

// Load cached data from localStorage
function loadCache() {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch (e) {
    console.warn('Failed to load cache:', e);
  }
  return null;
}

// Save data to localStorage cache
function saveCache(data: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save cache:', e);
  }
}

interface DataContextType {
  // Data
  customers: Customer[];
  services: Service[];
  estimates: Estimate[];
  estimateLineItems: EstimateLineItem[];
  invoices: Invoice[];
  invoiceLineItems: InvoiceLineItem[];
  payments: Payment[];
  projects: Project[];
  settings: Settings | null;

  // Lookup tables
  categories: Category[];
  species: Species[];
  mountTypes: MountType[];

  // Status
  loading: boolean;
  syncing: boolean;
  connected: boolean;
  
  // Actions
  refreshData: () => Promise<void>;
  
  // Customer actions
  addCustomer: (data: CustomerFormData) => Promise<Customer>;
  updateCustomer: (data: Customer) => Promise<void>;
  
  // Service actions
  addService: (data: ServiceFormData) => Promise<Service>;

  // Species actions
  addSpecies: (category: string, name: string) => Promise<Species>;
  updateService: (data: Service) => Promise<void>;
  
  // Estimate actions
  addEstimate: (data: EstimateFormData) => Promise<string>;
  updateEstimate: (estimate: Estimate, lineItems: EstimateLineItem[]) => Promise<void>;
  updateEstimateStatus: (estimateId: string, status: string) => Promise<void>;
  convertEstimateToInvoice: (estimateId: string) => Promise<string>;
  
  // Payment actions
  addPayment: (data: PaymentFormData) => Promise<void>;
  
  // Project actions
  updateProjectStatus: (projectId: string, status: string, notes?: string) => Promise<void>;
  batchUpdateProjects: (projectIds: string[], status: string, notes?: string) => Promise<void>;
  
  // Settings actions
  updateSettings: (data: Settings) => Promise<void>;
  
  // Helpers
  getCustomer: (id: string) => Customer | undefined;
  getEstimateLineItems: (estimateId: string) => EstimateLineItem[];
  getInvoiceLineItems: (invoiceId: string) => InvoiceLineItem[];
  getInvoicePayments: (invoiceId: string) => Payment[];
  getInvoiceProjects: (invoiceId: string) => Project[];
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  // Data state - initialize from cache for instant render
  const cache = useRef(loadCache());
  const [customers, setCustomers] = useState<Customer[]>(cache.current?.customers || []);
  const [services, setServices] = useState<Service[]>(cache.current?.services || []);
  const [estimates, setEstimates] = useState<Estimate[]>(cache.current?.estimates || []);
  const [estimateLineItems, setEstimateLineItems] = useState<EstimateLineItem[]>(cache.current?.estimateLineItems || []);
  const [invoices, setInvoices] = useState<Invoice[]>(cache.current?.invoices || []);
  const [invoiceLineItems, setInvoiceLineItems] = useState<InvoiceLineItem[]>(cache.current?.invoiceLineItems || []);
  const [payments, setPayments] = useState<Payment[]>(cache.current?.payments || []);
  const [projects, setProjects] = useState<Project[]>(cache.current?.projects || []);
  const [settings, setSettings] = useState<Settings | null>(cache.current?.settings || null);

  // Lookup tables
  const [categories, setCategories] = useState<Category[]>(cache.current?.categories || []);
  const [species, setSpecies] = useState<Species[]>(cache.current?.species || []);
  const [mountTypes, setMountTypes] = useState<MountType[]>(cache.current?.mountTypes || []);

  // Status state - loading is false if we have cached data
  const [loading, setLoading] = useState(!cache.current);
  const [syncing, setSyncing] = useState(false);
  const [connected, setConnected] = useState(!!cache.current);

  // Load data from API and update cache
  const refreshData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setSyncing(true);

    const data = await api.getAllData();

    if (data) {
      setCustomers(data.customers || []);
      setServices(data.services || []);
      setEstimates(data.estimates || []);
      setEstimateLineItems(data.estimateLineItems || []);
      setInvoices(data.invoices || []);
      setInvoiceLineItems(data.invoiceLineItems || []);
      setPayments(data.payments || []);
      setProjects(data.projects || []);
      setSettings(data.settings || null);
      setCategories(data.categories || []);
      setSpecies(data.species || []);
      setMountTypes(data.mountTypes || []);
      setConnected(true);

      // Save to cache for next page load
      saveCache({
        customers: data.customers || [],
        services: data.services || [],
        estimates: data.estimates || [],
        estimateLineItems: data.estimateLineItems || [],
        invoices: data.invoices || [],
        invoiceLineItems: data.invoiceLineItems || [],
        payments: data.payments || [],
        projects: data.projects || [],
        settings: data.settings || null,
        categories: data.categories || [],
        species: data.species || [],
        mountTypes: data.mountTypes || [],
      });
    }

    setLoading(false);
    setSyncing(false);
  }, []);

  useEffect(() => {
    // Fetch fresh data on mount (background sync if we have cache)
    refreshData();
  }, [refreshData]);

  // Keep cache in sync with local state changes
  useEffect(() => {
    if (!loading && connected) {
      saveCache({
        customers,
        services,
        estimates,
        estimateLineItems,
        invoices,
        invoiceLineItems,
        payments,
        projects,
        settings,
        categories,
        species,
        mountTypes,
      });
    }
  }, [customers, services, estimates, estimateLineItems, invoices, invoiceLineItems, payments, projects, settings, categories, species, mountTypes, loading, connected]);

  // Customer actions
  const addCustomer = async (data: CustomerFormData): Promise<Customer> => {
    const newCustomer: Customer = {
      ...data,
      customer_id: generateId('CUST'),
      created_at: new Date().toISOString().split('T')[0],
      is_archived: false,
    };
    
    setCustomers(prev => [...prev, newCustomer]);
    setSyncing(true);
    
    const result = await api.addCustomer(data);
    if (result) {
      setCustomers(prev => prev.map(c => 
        c.customer_id === newCustomer.customer_id ? result : c
      ));
    }
    
    setSyncing(false);
    return result || newCustomer;
  };

  const updateCustomer = async (data: Customer): Promise<void> => {
    setCustomers(prev => prev.map(c => 
      c.customer_id === data.customer_id ? data : c
    ));
    setSyncing(true);
    await api.updateCustomer(data);
    setSyncing(false);
  };

  // Service actions
  const addService = async (data: ServiceFormData): Promise<Service> => {
    const newService: Service = {
      ...data,
      service_id: generateId('SVC'),
      is_active: true,
    };
    
    setServices(prev => [...prev, newService]);
    setSyncing(true);
    
    const result = await api.addService(data);
    if (result) {
      setServices(prev => prev.map(s => 
        s.service_id === newService.service_id ? result : s
      ));
    }
    
    setSyncing(false);
    return result || newService;
  };

  const updateService = async (data: Service): Promise<void> => {
    setServices(prev => prev.map(s =>
      s.service_id === data.service_id ? data : s
    ));
    setSyncing(true);
    await api.updateService(data);
    setSyncing(false);
  };

  // Species actions
  const addSpeciesAction = async (category: string, name: string): Promise<Species> => {
    // Check if already exists locally
    const existing = species.find(s => s.category === category && s.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing;

    // Create optimistic entry
    const newSpecies: Species = {
      species_id: generateId('SP'),
      category,
      name,
      sort_order: 999,
    };

    setSpecies(prev => [...prev, newSpecies]);
    setSyncing(true);

    const result = await api.addSpecies({ category, name });
    if (result) {
      setSpecies(prev => prev.map(s =>
        s.species_id === newSpecies.species_id ? result : s
      ));
      setSyncing(false);
      return result;
    }

    setSyncing(false);
    return newSpecies;
  };

  // Estimate actions
  const addEstimate = async (data: EstimateFormData): Promise<string> => {
    const estimateId = generateId('EST');
    const subtotal = data.line_items.reduce((sum, li) => sum + (li.quantity * li.unit_price), 0);
    
    const newEstimate: Estimate = {
      estimate_id: estimateId,
      customer_id: data.customer_id,
      date_created: new Date().toISOString().split('T')[0],
      status: 'Draft',
      notes: data.notes || '',
      subtotal,
      tax_rate: 0,
      total: subtotal,
      is_archived: false,
    };
    
    const newLineItems: EstimateLineItem[] = data.line_items.map((li, idx) => ({
      line_item_id: generateId('ELI'),
      estimate_id: estimateId,
      service_id: li.service_id,
      description: li.description,
      species: li.species,
      mount_type: li.mount_type,
      quantity: li.quantity,
      unit_price: li.unit_price,
      line_total: li.quantity * li.unit_price,
      sort_order: idx + 1,
    }));
    
    setEstimates(prev => [...prev, newEstimate]);
    setEstimateLineItems(prev => [...prev, ...newLineItems]);
    
    setSyncing(true);
    const result = await api.addEstimate(data);
    if (result) {
      setEstimates(prev => prev.map(e => 
        e.estimate_id === estimateId ? { ...result } : e
      ));
    }
    setSyncing(false);
    
    return result?.estimate_id || estimateId;
  };

  const updateEstimate = async (estimate: Estimate, lineItems: EstimateLineItem[]): Promise<void> => {
    const subtotal = lineItems.reduce((sum, li) => sum + (li.quantity * li.unit_price), 0);
    const updated = { ...estimate, subtotal, total: subtotal };
    
    setEstimates(prev => prev.map(e => 
      e.estimate_id === estimate.estimate_id ? updated : e
    ));
    setEstimateLineItems(prev => [
      ...prev.filter(li => li.estimate_id !== estimate.estimate_id),
      ...lineItems,
    ]);
    
    setSyncing(true);
    await api.updateEstimate({
      ...updated,
      line_items: lineItems.map(li => ({
        service_id: li.service_id,
        description: li.description,
        species: li.species,
        mount_type: li.mount_type,
        quantity: li.quantity,
        unit_price: li.unit_price,
      })),
    });
    setSyncing(false);
  };

  const updateEstimateStatus = async (estimateId: string, status: string): Promise<void> => {
    setEstimates(prev => prev.map(e => 
      e.estimate_id === estimateId ? { ...e, status: status as Estimate['status'] } : e
    ));
    setSyncing(true);
    await api.updateEstimateStatus(estimateId, status);
    setSyncing(false);
  };

  const convertEstimateToInvoice = async (estimateId: string): Promise<string> => {
    setSyncing(true);
    const result = await api.convertEstimateToInvoice(estimateId);
    
    if (result) {
      setEstimates(prev => prev.map(e => 
        e.estimate_id === estimateId 
          ? { ...e, status: 'Converted' as const, converted_to_invoice_id: result.invoice.invoice_id }
          : e
      ));
      setInvoices(prev => [...prev, result.invoice]);
      setProjects(prev => [...prev, ...result.projects]);
      setSyncing(false);
      return result.invoice.invoice_id;
    }
    
    // Fallback to local-only if API fails
    const estimate = estimates.find(e => e.estimate_id === estimateId);
    const estLineItems = estimateLineItems.filter(li => li.estimate_id === estimateId);
    
    if (!estimate) {
      setSyncing(false);
      throw new Error('Estimate not found');
    }
    
    const invoiceId = generateId('INV');
    const newInvoice: Invoice = {
      invoice_id: invoiceId,
      estimate_id: estimateId,
      customer_id: estimate.customer_id,
      date_created: new Date().toISOString().split('T')[0],
      status: 'Unpaid',
      subtotal: estimate.subtotal,
      tax_rate: 0,
      total: estimate.total,
      deposit_required: estimate.total * 0.5,
      amount_paid: 0,
      balance_due: estimate.total,
      is_archived: false,
    };
    
    // Generate projects with sequential IDs
    const newProjects: Project[] = [];
    const tempProjects = [...projects];
    for (const li of estLineItems) {
      const projId = generateProjectId(tempProjects);
      const proj: Project = {
        project_id: projId,
        invoice_id: invoiceId,
        customer_id: estimate.customer_id,
        species: li.species,
        mount_type: li.mount_type,
        description: li.description,
        status: 'Received',
        status_updated_at: new Date().toISOString(),
        notes: '',
        is_archived: false,
      };
      newProjects.push(proj);
      tempProjects.push(proj);
    }
    
    setEstimates(prev => prev.map(e => 
      e.estimate_id === estimateId 
        ? { ...e, status: 'Converted' as const, converted_to_invoice_id: invoiceId }
        : e
    ));
    setInvoices(prev => [...prev, newInvoice]);
    setProjects(prev => [...prev, ...newProjects]);
    
    setSyncing(false);
    return invoiceId;
  };

  // Payment actions
  const addPayment = async (data: PaymentFormData): Promise<void> => {
    const payment: Payment = {
      payment_id: generateId('PAY'),
      ...data,
      created_at: new Date().toISOString(),
    };
    
    setPayments(prev => [...prev, payment]);
    setInvoices(prev => prev.map(inv => {
      if (inv.invoice_id === data.invoice_id) {
        const newPaid = inv.amount_paid + data.amount;
        const newBalance = inv.total - newPaid;
        return {
          ...inv,
          amount_paid: newPaid,
          balance_due: Math.max(0, newBalance),
          status: newBalance <= 0 ? 'Paid' : newPaid > 0 ? 'Deposit Paid' : 'Unpaid',
        } as Invoice;
      }
      return inv;
    }));
    
    setSyncing(true);
    await api.addPayment(data);
    setSyncing(false);
  };

  // Project actions
  const updateProjectStatus = async (projectId: string, status: string, notes?: string): Promise<void> => {
    setProjects(prev => prev.map(p => 
      p.project_id === projectId 
        ? { 
            ...p, 
            status: status as Project['status'], 
            status_updated_at: new Date().toISOString(),
            notes: notes !== undefined ? notes : p.notes,
          }
        : p
    ));
    
    setSyncing(true);
    await api.updateProjectStatus(projectId, status, notes);
    setSyncing(false);
  };

  const batchUpdateProjects = async (projectIds: string[], status: string, notes?: string): Promise<void> => {
    setProjects(prev => prev.map(p => 
      projectIds.includes(p.project_id)
        ? {
            ...p,
            status: status as Project['status'],
            status_updated_at: new Date().toISOString(),
            notes: notes || p.notes,
          }
        : p
    ));
    
    setSyncing(true);
    await api.batchUpdateProjects(projectIds, status, notes);
    setSyncing(false);
  };

  // Settings actions
  const updateSettingsAction = async (data: Settings): Promise<void> => {
    setSettings(data);
    setSyncing(true);
    await api.updateSettings(data);
    setSyncing(false);
  };

  // Helpers
  const getCustomer = (id: string) => customers.find(c => c.customer_id === id);
  const getEstimateLineItems = (estimateId: string) => 
    estimateLineItems.filter(li => li.estimate_id === estimateId);
  const getInvoiceLineItems = (invoiceId: string) => 
    invoiceLineItems.filter(li => li.invoice_id === invoiceId);
  const getInvoicePayments = (invoiceId: string) => 
    payments.filter(p => p.invoice_id === invoiceId);
  const getInvoiceProjects = (invoiceId: string) => 
    projects.filter(p => p.invoice_id === invoiceId);

  const value: DataContextType = {
    customers,
    services,
    estimates,
    estimateLineItems,
    invoices,
    invoiceLineItems,
    payments,
    projects,
    settings,
    categories,
    species,
    mountTypes,
    loading,
    syncing,
    connected,
    refreshData,
    addCustomer,
    updateCustomer,
    addService,
    updateService,
    addSpecies: addSpeciesAction,
    addEstimate,
    updateEstimate,
    updateEstimateStatus,
    convertEstimateToInvoice,
    addPayment,
    updateProjectStatus,
    batchUpdateProjects,
    updateSettings: updateSettingsAction,
    getCustomer,
    getEstimateLineItems,
    getInvoiceLineItems,
    getInvoicePayments,
    getInvoiceProjects,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
