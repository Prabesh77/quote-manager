export interface Part {
  id: string;
  name: string;
  number: string;
  price: number | null;
  note: string;
  createdAt: string;
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