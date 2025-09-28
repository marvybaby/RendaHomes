'use client';

import { useEffect, useState } from 'react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertMessage {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  duration?: number;
}

interface CustomAlertProps {
  alerts: AlertMessage[];
  onRemove: (id: string) => void;
}

const alertStyles = {
  success: {
    container: 'bg-green-900 border-green-500 text-green-100',
    icon: '✓',
    iconBg: 'bg-green-500'
  },
  error: {
    container: 'bg-red-900 border-red-500 text-red-100',
    icon: '✕',
    iconBg: 'bg-red-500'
  },
  warning: {
    container: 'bg-yellow-900 border-yellow-500 text-yellow-100',
    icon: '⚠',
    iconBg: 'bg-yellow-500'
  },
  info: {
    container: 'bg-blue-900 border-blue-500 text-blue-100',
    icon: 'i',
    iconBg: 'bg-blue-500'
  }
};

export default function CustomAlert({ alerts, onRemove }: CustomAlertProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full">
      {alerts.map((alert) => (
        <AlertItem key={alert.id} alert={alert} onRemove={onRemove} />
      ))}
    </div>
  );
}

function AlertItem({ alert, onRemove }: { alert: AlertMessage; onRemove: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const style = alertStyles[alert.type] || alertStyles.info;

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10);

    const timer = setTimeout(() => {
      handleRemove();
    }, alert.duration || 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onRemove(alert.id);
    }, 300);
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-out
        ${isVisible && !isLeaving 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
        }
        ${style.container}
        border-l-4 rounded-lg shadow-2xl backdrop-blur-sm
        p-4 cursor-pointer hover:shadow-3xl
      `}
      onClick={handleRemove}
    >
      <div className="flex items-start space-x-3">
        <div className={`
          flex-shrink-0 w-6 h-6 rounded-full ${style.iconBg}
          flex items-center justify-center text-white text-sm font-bold
        `}>
          {style.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">
            {alert.title}
          </p>
          <p className="text-sm opacity-90 mt-1">
            {alert.message}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRemove();
          }}
          className="flex-shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}