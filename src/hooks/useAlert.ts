'use client';

import { useState, useCallback } from 'react';
import { AlertMessage, AlertType } from '@/components/CustomAlert';

export function useAlert() {
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);

  const showAlert = useCallback((
    type: AlertType,
    title: string,
    message: string,
    duration?: number
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newAlert: AlertMessage = {
      id,
      type,
      title,
      message,
      duration
    };

    setAlerts(prev => [...prev, newAlert]);
    return id;
  }, []);

  const success = useCallback((title: string, message: string, duration?: number) => {
    return showAlert('success', title, message, duration);
  }, [showAlert]);

  const error = useCallback((title: string, message: string, duration?: number) => {
    return showAlert('error', title, message, duration);
  }, [showAlert]);

  const warning = useCallback((title: string, message: string, duration?: number) => {
    return showAlert('warning', title, message, duration);
  }, [showAlert]);

  const info = useCallback((title: string, message: string, duration?: number) => {
    return showAlert('info', title, message, duration);
  }, [showAlert]);

  const removeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setAlerts([]);
  }, []);

  return {
    alerts,
    success,
    error,
    warning,
    info,
    removeAlert,
    clearAll
  };
}