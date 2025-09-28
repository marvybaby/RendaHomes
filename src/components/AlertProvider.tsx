'use client';

import { createContext, useContext } from 'react';
import { useAlert } from '@/hooks/useAlert';
import CustomAlert from '@/components/CustomAlert';
import { AlertType } from '@/components/CustomAlert';

interface AlertContextType {
  alerts: any[];
  success: (title: string, message: string, duration?: number) => string;
  error: (title: string, message: string, duration?: number) => string;
  warning: (title: string, message: string, duration?: number) => string;
  info: (title: string, message: string, duration?: number) => string;
  showAlert: (type: AlertType, title: string, message: string, duration?: number) => string;
  clearAll: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const { alerts, success, error, warning, info, removeAlert, clearAll } = useAlert();

  // Get showAlert from the hook too
  const showAlert = (type: AlertType, title: string, message: string, duration?: number) => {
    if (type === 'success') return success(title, message, duration);
    if (type === 'error') return error(title, message, duration);
    if (type === 'warning') return warning(title, message, duration);
    if (type === 'info') return info(title, message, duration);
    return error(title, message, duration);
  };

  return (
    <AlertContext.Provider value={{ alerts, success, error, warning, info, showAlert, clearAll }}>
      {children}
      <CustomAlert alerts={alerts} onRemove={removeAlert} />
    </AlertContext.Provider>
  );
}

export function useAlertContext() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlertContext must be used within an AlertProvider');
  }
  return context;
}