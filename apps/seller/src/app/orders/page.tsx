'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShoppingBag, Truck, RotateCcw } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { TabNav, TabItem } from '@/components/TabNav/TabNav';
import { ActiveOrdersTab } from './components/ActiveOrdersTab';
import { LogisticsTab } from './components/LogisticsTab';
import { ReturnsTab } from './components/ReturnsTab';
import styles from './orders.module.css';

function OrdersContent() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'active';
  const [counts, setCounts] = useState<{ active?: number; returns?: number }>({});

  useEffect(() => {
    fetch('/api/analytics')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.summary) {
          setCounts({
            active:
              (data.summary.pendingOrdersCount || 0) +
              (data.summary.processingOrdersCount || 0),
            returns: data.summary.returnRequestedCount || 0,
          });
        }
      })
      .catch(() => {});
  }, []);

  const tabs: TabItem[] = [
    {
      id: 'active',
      label: 'Active Orders',
      icon: ShoppingBag,
      count: counts.active && counts.active > 0 ? counts.active : undefined,
    },
    {
      id: 'logistics',
      label: 'Dispatched & Tracking',
      icon: Truck,
    },
    {
      id: 'returns',
      label: 'Returns & Refunds',
      icon: RotateCcw,
      count: counts.returns && counts.returns > 0 ? counts.returns : undefined,
    },
  ];

  return (
    <div className={styles.container}>
      <PageHeader
        eyebrow="Order Lifecycle & Shipments"
        title="Orders & Logistics"
        subtitle="Process incoming orders, track courier dispatches, and manage customer returns."
      />

      <TabNav tabs={tabs} activeTab={currentTab} />

      <div role="tabpanel" id={`tabpanel-${currentTab}`} aria-labelledby={`tab-${currentTab}`}>
        {currentTab === 'logistics' && <LogisticsTab />}
        {currentTab === 'returns' && <ReturnsTab />}
        {currentTab !== 'logistics' && currentTab !== 'returns' && <ActiveOrdersTab />}
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className={styles.container}>Loading orders...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
