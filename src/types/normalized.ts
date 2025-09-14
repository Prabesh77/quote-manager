// New Normalized Database Types
// This replaces the old denormalized structure

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  rego?: string;
  make: string;
  model: string;
  series?: string;
  year?: number;
  vin?: string;
  color?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  customer_id: string;
  vehicle_id: string;
  status: 'unpriced' | 'priced' | 'completed' | 'ordered' | 'delivered';
  notes?: string;
  tax_invoice_number?: string;
  created_at: string;
  updated_at: string;
}

export interface Part {
  id: string;
  vehicle_id?: string;
  part_name: string;
  part_number?: string;
  price?: number;
  created_at: string;
  updated_at: string;
}

export interface QuotePart {
  id: string;
  quote_id: string;
  part_id: string;
  final_price?: number;
  list_price?: number;
  af?: boolean;
  note?: string;
  status: 'WaitingForPrice' | 'Priced' | 'Ordered';
  created_at: string;
  updated_at: string;
}

export interface Delivery {
  id: string;
  quote_id: string;
  receiver_name?: string;
  photo_path?: string;
  signature_path?: string;
  delivered_on?: string;
  delivered_by?: string;
  created_at: string;
  updated_at: string;
}

// Extended types with joined data for UI
export interface QuoteWithDetails {
  quote: Quote;
  customer: Customer;
  vehicle: Vehicle;
  quote_parts: QuotePartWithDetails[];
  delivery?: Delivery;
}

export interface QuotePartWithDetails {
  quote_part: QuotePart;
  part: Part;
}

export interface VehicleWithParts {
  vehicle: Vehicle;
  parts: Part[];
}

// Form data types for creating/updating
export interface CreateQuoteData {
  customer: {
    name: string;
    phone?: string;
    address?: string;
  };
  vehicle: {
    rego?: string;
    make: string;
    model: string;
    series?: string;
    year?: number;
    vin?: string;
    color?: string;
    notes?: string;
  };
  parts: Array<{
    part_name: string;
    part_number?: string;
    price?: number;
    note?: string;
  }>;
  notes?: string;
}

export interface UpdateQuoteData {
  customer?: Partial<Customer>;
  vehicle?: Partial<Vehicle>;
  parts?: Array<{
    part_id?: string;
    part_name?: string;
    part_number?: string;
    price?: number;
    final_price?: number;
    note?: string;
    status?: QuotePart['status'];
  }>;
  quote?: Partial<Quote>;
}

// Dashboard stats types
export interface DashboardStats {
  total_quotes: number;
  completed_quotes: number;
  ordered_quotes: number;
  delivered_quotes: number;
  unpriced_quotes: number;
  priced_quotes: number;
  total_customers: number;
  total_vehicles: number;
  total_parts: number;
  total_revenue: number;
  average_quote_value: number;
  quote_to_order_rate: number;
  average_order_value: number;
  total_parts_ordered: number;
  average_parts_per_quote: number;
  total_deliveries: number;
  delivery_rate: number;
}

// Search and filter types
export interface QuoteFilters {
  status?: Quote['status'];
  customer_name?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  rego?: string;
  vin?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface PartFilters {
  vehicle_id?: string;
  part_name?: string;
  part_number?: string;
  price_min?: number;
  price_max?: number;
  status?: QuotePart['status'];
}

// API response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
} 