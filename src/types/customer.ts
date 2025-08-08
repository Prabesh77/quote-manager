export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFormData {
  name: string;
  phone?: string;
  address?: string;
}

export interface CustomerUpdateData {
  name?: string;
  phone?: string;
  address?: string;
} 