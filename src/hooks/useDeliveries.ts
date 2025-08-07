'use client';

import { useState, useEffect } from 'react';
import supabase from '@/utils/supabase';
import { Delivery, Customer } from '@/types/delivery';

export const useDeliveries = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeliveries = async () => {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching deliveries:', error);
      } else {
        setDeliveries(data || []);
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('customer_name', { ascending: true });

      if (error) {
        console.error('Error fetching customers:', error);
      } else {
        setCustomers(data || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const addDelivery = async (deliveryData: Omit<Delivery, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .insert({
          ...deliveryData,
          status: 'pending',
        })
        .select();

      if (error) {
        console.error('Error adding delivery:', error);
        return { error };
      } else {
        await fetchDeliveries();
        return { data, error: null };
      }
    } catch (error) {
      console.error('Error adding delivery:', error);
      return { error };
    }
  };

  const updateDelivery = async (id: string, updates: Partial<Delivery>) => {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Error updating delivery:', error);
        return { error };
      } else {
        await fetchDeliveries();
        return { data, error: null };
      }
    } catch (error) {
      console.error('Error updating delivery:', error);
      return { error };
    }
  };

  const assignDelivery = async (deliveryId: string, driverId: string) => {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .update({
          status: 'assigned',
          assignedTo: driverId,
          assignedAt: new Date().toISOString(),
        })
        .eq('id', deliveryId)
        .select();

      if (error) {
        console.error('Error assigning delivery:', error);
        return { error };
      } else {
        await fetchDeliveries();
        return { data, error: null };
      }
    } catch (error) {
      console.error('Error assigning delivery:', error);
      return { error };
    }
  };

  const markAsDelivered = async (
    deliveryId: string,
    photoProof: string,
    receiverName: string,
    signature: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .update({
          status: 'delivered',
          deliveredAt: new Date().toISOString(),
          photoProof,
          receiverName,
          signature,
        })
        .eq('id', deliveryId)
        .select();

      if (error) {
        console.error('Error marking delivery as delivered:', error);
        return { error };
      } else {
        await fetchDeliveries();
        return { data, error: null };
      }
    } catch (error) {
      console.error('Error marking delivery as delivered:', error);
      return { error };
    }
  };

  const getCustomerByAccountNumber = (accountNumber: string) => {
    const customer = customers.find(customer => 
      customer.account_number.toLowerCase() === accountNumber.toLowerCase()
    );
    return customer;
  };

  const getOverdueDeliveries = () => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return deliveries.filter(delivery => 
      delivery.status === 'pending' && 
      new Date(delivery.created_at) < twentyFourHoursAgo
    );
  };

  useEffect(() => {
    fetchDeliveries();
    fetchCustomers();
  }, []);



  return {
    deliveries,
    customers,
    loading,
    addDelivery,
    updateDelivery,
    assignDelivery,
    markAsDelivered,
    getCustomerByAccountNumber,
    getOverdueDeliveries,
    refetch: fetchDeliveries,
  };
}; 