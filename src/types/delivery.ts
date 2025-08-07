export interface Delivery {
  id: string;
  account_number: string;
  customer_name: string;
  address: string;
  delivery_round: string;
  invoice_number: string;
  status: 'pending' | 'assigned' | 'delivered';
  assigned_to?: string;
  assigned_at?: string;
  delivered_at?: string;
  photo_proof?: string;
  receiver_name?: string;
  signature?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  account_number: string;
  customer_name: string;
  address: string;
  phone?: string;
  email?: string;
  created_at: string;
}

export interface DriverDelivery {
  id: string;
  deliveryId: string;
  driverId: string;
  status: 'assigned' | 'delivered';
  assignedAt: string;
  deliveredAt?: string;
  photoProof?: string;
  receiverName?: string;
  signature?: string;
  created_at: string;
}

export interface DeliveryStats {
  totalDeliveries: number;
  pendingDeliveries: number;
  assignedDeliveries: number;
  deliveredDeliveries: number;
  overdueDeliveries: number;
  deliveryRate: number;
  averageDeliveryTime: number;
} 