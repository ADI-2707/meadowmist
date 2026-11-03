'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './Toast.module.css';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

type Listener = (toasts: ToastItem[]) => void;

let activeToasts: ToastItem[] = [];
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener([...activeToasts]));
}

export const toast = {
  success: (message: string) => {
    toast.show(message, 'success');
  },
  error: (message: string) => {
    toast.show(message, 'error');
  },
  info: (message: string) => {
    toast.show(message, 'info');
  },
  show: (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    const item: ToastItem = { id, type, message };
    activeToasts = [...activeToasts, item];
    notify();

    setTimeout(() => {
      toast.dismiss(id);
    }, 4000);
  },
  dismiss: (id: string) => {
    activeToasts = activeToasts.filter((t) => t.id !== id);
    notify();
  },
  clear: () => {
    activeToasts = [];
    notify();
  },
};

export function ToastProvider({ children }: { children?: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>(activeToasts);

  useEffect(() => {
    const handleUpdate = (updated: ToastItem[]) => {
      setToasts(updated);
    };
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const handleDismiss = useCallback((id: string) => {
    toast.dismiss(id);
  }, []);

  return (
    <>
      {children}
      <div className={styles.container} aria-live="polite" role="region" aria-label="Notifications">
        {toasts.map((item) => (
          <div
            key={item.id}
            role={item.type === 'error' ? 'alert' : 'status'}
            className={`${styles.toast} ${styles[item.type] || styles.info}`}
          >
            <span className={styles.message}>{item.message}</span>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => handleDismiss(item.id)}
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

export default ToastProvider;
