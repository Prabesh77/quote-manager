'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Loader2, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import supabase from '@/utils/supabase';

interface ConnectionStatusProps {
  status: 'checking' | 'connected' | 'error' | 'disconnected';
}

interface HealthStatus {
  database: boolean;
  overall: 'healthy' | 'warning' | 'error';
}

export const ConnectionStatus = ({ status }: ConnectionStatusProps) => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    database: false,
    overall: 'error'
  });
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      setIsChecking(true);
      
      try {
        // Check database connection using existing Supabase client
        const { data, error } = await supabase
          .from('quotes')
          .select('count')
          .limit(1);
        
        const dbHealthy = !error;
        
        const overall = dbHealthy ? 'healthy' : 'error';
        
        setHealthStatus({
          database: dbHealthy,
          overall
        });
      } catch (error) {
        setHealthStatus({
          database: false,
          overall: 'error'
        });
      } finally {
        setIsChecking(false);
      }
    };

    checkHealth();
    
    // Check health every 1:30 seconds
    const interval = setInterval(checkHealth, 90000);
    return () => clearInterval(interval);
  }, []);

  const getStatusConfig = () => {
    if (isChecking) {
      return {
        icon: Loader2,
        text: 'Checking system health...',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        iconColor: 'text-gray-500'
      };
    }

    switch (healthStatus.overall) {
      case 'healthy':
        return {
          icon: CheckCircle,
          text: 'All systems functional',
          color: 'text-green-700',
          bgColor: 'bg-green-100',
          iconColor: 'text-green-600'
        };
      case 'warning':
        return {
          icon: AlertCircle,
          text: 'Partial system issues',
          color: 'text-yellow-700',
          bgColor: 'bg-yellow-100',
          iconColor: 'text-yellow-600'
        };
      case 'error':
        return {
          icon: XCircle,
          text: 'System issues detected',
          color: 'text-red-700',
          bgColor: 'bg-red-100',
          iconColor: 'text-red-600'
        };
      default:
        return {
          icon: WifiOff,
          text: 'Health check failed',
          color: 'text-gray-700',
          bgColor: 'bg-gray-100',
          iconColor: 'text-gray-600'
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <IconComponent className={`h-4 w-4 ${config.iconColor} ${isChecking ? 'animate-spin' : ''}`} />
    // <div className={`hidden md:flex items-center space-x-2 px-2 py-1 rounded-sm ${config.bgColor} border border-gray-200 shadow-sm`}>
    //   <IconComponent className={`h-4 w-4 ${config.iconColor} ${isChecking ? 'animate-spin' : ''}`} />
    //   <span className={`text-xs font-medium ${config.color}`}>
    //     {config.text}
    //   </span>
    // </div>
  );
}; 