export interface PartDetails {
  name: string;
  number: string;
  price: number | null;
  note: string;
}

export interface Quote {
  id: string;
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
  partRequested: string;
  createdAt: string;
  status: 'active' | 'completed';
}

export interface Part {
  id: string;
  name: string;
  number: string;
  price: number | null;
  note: string;
  quoteId: string;
  createdAt: string;
} 