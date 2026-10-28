'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Package, Boxes, History } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { TabNav, TabItem } from '@/components/TabNav/TabNav';
import { CatalogTab } from './components/CatalogTab';
import { InventoryStockTab } from './components/InventoryStockTab';
import { InventoryLogsTab } from './components/InventoryLogsTab';
import styles from './products.module.css';

function ProductsContent() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'catalog';
  const [counts, setCounts] = useState<{ totalProducts?: number; lowStock?: number }>({});

  useEffect(() => {
    fetch('/api/inventory?limit=1')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.summary) {
          setCounts({
            lowStock: data.summary.lowStockCount,
          });
        }
      })
      .catch(() => {});
  }, []);

  const tabs: TabItem[] = [
    {
      id: 'catalog',
      label: 'Products Catalog',
      icon: Package,
    },
    {
      id: 'inventory',
      label: 'Live Stock & Batches',
      icon: Boxes,
      count: counts.lowStock && counts.lowStock > 0 ? counts.lowStock : undefined,
    },
    {
      id: 'logs',
      label: 'Stock Movement Logs',
      icon: History,
    },
  ];

  return (
    <div className={styles.container}>
      <PageHeader
        eyebrow="Merchandise & Warehousing"
        title="Catalog & Stock"
        subtitle="Manage handcrafted candles, ceramics, live batch levels, and inventory audit logs."
      />

      <TabNav tabs={tabs} activeTab={currentTab} />

      <div role="tabpanel" id={`tabpanel-${currentTab}`} aria-labelledby={`tab-${currentTab}`}>
        {currentTab === 'inventory' && <InventoryStockTab />}
        {currentTab === 'logs' && <InventoryLogsTab />}
        {currentTab !== 'inventory' && currentTab !== 'logs' && <CatalogTab />}
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<div className={styles.container}>Loading catalog...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
