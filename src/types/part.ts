export interface Part {
  id: string;
  name: string;
  number: string;
  price: number | null;
  note: string;
  createdAt: string;
}

// Extended interface for parts with variants (used by QuoteTable)
export interface PartWithVariants extends Part {
  variants: Array<{
    id: string;
    note: string;
    created_at: string;
    is_default: boolean;
    final_price: number | null;
  }>;
}

export interface PartFormData {
  name: string;
  number: string;
  price: number | null;
  note: string;
}

export interface PartUpdateData {
  name?: string;
  number?: string;
  price?: number | null;
  note?: string;
} 