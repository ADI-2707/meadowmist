'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useCartStore, ToastInfo } from '@/store/cartStore';
import styles from './CartToast.module.css';

export default function CartToast() {
  const toast = useCartStore((s) => s.toast);
  const isDrawerOpen = useCartStore((s) => s.isDrawerOpen);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const clearToast = useCartStore((s) => s.clearToast);
  const [activeToast, setActiveToast] = useState<ToastInfo | null>(null);
  const prevIsDrawerOpen = useRef(isDrawerOpen);

  useEffect(() => {
    if (!toast) {
      setActiveToast(null);
      return;
    }
    setActiveToast(toast);

    const timer = setTimeout(() => {
      setActiveToast(null);
      clearToast();
    }, 4000);

    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  useEffect(() => {
    if (prevIsDrawerOpen.current && !isDrawerOpen) {
      setActiveToast(null);
      clearToast();
    }
    prevIsDrawerOpen.current = isDrawerOpen;
  }, [isDrawerOpen, clearToast]);

  const handleToastClick = () => {
    if (activeToast?.showViewBag) {
      openDrawer();
      setActiveToast(null);
      clearToast();
    }
  };

  const handleViewBag = (e: React.MouseEvent) => {
    e.stopPropagation();
    openDrawer();
    setActiveToast(null);
    clearToast();
  };

  const getStatusText = (action: ToastInfo['action']) => {
    if (action === 'removed') return 'Removed from bag';
    if (action === 'updated') return 'Bag updated';
    return 'Added to your bag';
  };

  return (
    <div className={styles.toastContainer}>
      <AnimatePresence mode="wait">
        {activeToast && (
          <motion.div
            key={activeToast.id}
            className={`${styles.toast} ${!activeToast.showViewBag ? styles.toastWithoutBtn : ''}`}
            initial={{ opacity: 0, x: 60, scale: 0.94 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 120, scale: 0.9, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={handleToastClick}
            role="status"
            aria-live="polite"
          >
            <div className={styles.thumb}>
              <Image
                src={activeToast.image}
                alt={activeToast.name}
                fill
                sizes="44px"
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div className={styles.info}>
              <p className={styles.statusLine}>
                <span className={styles.checkIcon}>✓</span> {getStatusText(activeToast.action)}
              </p>
              <p className={styles.nameLine}>
                {activeToast.name} · <span className={styles.price}>₹{activeToast.price.toLocaleString('en-IN')}</span>
              </p>
            </div>
            {activeToast.showViewBag && (
              <button type="button" className={styles.viewBtn} onClick={handleViewBag}>
                View Bag →
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
