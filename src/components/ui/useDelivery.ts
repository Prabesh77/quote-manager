'use client';

import { useState, useEffect } from 'react';
import supabase from '@/utils/supabase';
import { uploadImage, uploadSignature } from '@/utils/storage';

export interface Delivery {
  id: string;
  customerName: string;
  taxInvoiceNumber: string;
  receiverName: string;
  photoProof: string;
  signature: string;
  deliveredAt: string;
  status: 'delivered' | 'pending';
}

export const useDelivery = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeliveries = async () => {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select('*')
        .order('deliveredAt', { ascending: false });

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

  const addDelivery = async (deliveryData: Omit<Delivery, 'id' | 'deliveredAt'> & { matchingQuoteId?: string }) => {
    try {
      let photoProofUrl = '';
      let signatureUrl = '';

      // Upload photo proof to storage if provided
      if (deliveryData.photoProof) {
        try {
          photoProofUrl = await uploadImage(deliveryData.photoProof);
        } catch (error) {
          console.error('Error uploading photo proof:', error);
        }
      }

      // Upload signature to storage if provided
      if (deliveryData.signature) {
        try {
          signatureUrl = await uploadSignature(deliveryData.signature);
        } catch (error) {
          console.error('Error uploading signature:', error);
        }
      }

      const { data, error } = await supabase
        .from('deliveries')
        .insert({
          customerName: deliveryData.customerName,
          taxInvoiceNumber: deliveryData.taxInvoiceNumber,
          receiverName: deliveryData.receiverName,
          photoProof: photoProofUrl,
          signature: signatureUrl,
          deliveredAt: new Date().toISOString(),
          status: 'delivered',
        })
        .select();

      if (error) {
        console.error('Error adding delivery:', error);
        return { error };
      } else {
        // If there's a matching quote, update its status to 'delivered'
        if (deliveryData.matchingQuoteId) {
          const { error: quoteError } = await supabase
            .from('quotes')
            .update({ status: 'delivered' })
            .eq('id', deliveryData.matchingQuoteId);
          
          if (quoteError) {
            console.error('Error updating quote status:', quoteError);
          }
        }
        
        await fetchDeliveries();
        return { data, error: null };
      }
    } catch (error) {
      console.error('Error adding delivery:', error);
      return { error };
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  return {
    deliveries,
    addDelivery,
    loading,
  };
}; 