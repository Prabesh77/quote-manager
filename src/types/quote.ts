import { QuoteStatus } from './common';
import { Part } from './part';

export interface Quote {
  id: string;
  vin: string;
  partRequested: string; // References parts table
  quoteRef: string;
  createdAt: string;
  make: string;
  model: string;
  series: string;
  auto: boolean;
  body: string;
  mthyr: string; // mth/yr field
  rego: string;
  requiredBy?: string; // Deadline field
  customer?: string; // Customer name
  address?: string; // Customer address
  phone?: string; // Customer phone
  status: QuoteStatus;
  taxInvoiceNumber?: string; // Tax invoice number for orders
  pc_parts?: string; // PartsCheck format parts (comma-separated)
  [key: string]: any; // Allow string indexing
}

export interface QuoteFormData {
  quoteRef: string;
  vin: string;
  make: string;
  model: string;
  series: string;
  auto: boolean;
  body: string;
  mthyr: string;
  rego: string;
  requiredBy?: string;
  customer?: string;
  address?: string;
  phone?: string;
}

export interface QuoteUpdateData {
  quoteRef?: string;
  vin?: string;
  make?: string;
  model?: string;
  series?: string;
  auto?: boolean;
  body?: string;
  mthyr?: string;
  rego?: string;
  requiredBy?: string;
  customer?: string;
  address?: string;
  phone?: string;
  status?: QuoteStatus;
  taxInvoiceNumber?: string;
}

export interface QuoteWithParts extends Quote {
  parts: Part[];
}

export interface QuoteFilters {
  search?: string;
  status?: QuoteStatus;
  make?: string;
  model?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface QuoteSort {
  field: keyof Quote;
  direction: 'asc' | 'desc';
}

export interface PartDetails {
  name: string;
  number: string;
  price: number | null;
  note: string;
} 