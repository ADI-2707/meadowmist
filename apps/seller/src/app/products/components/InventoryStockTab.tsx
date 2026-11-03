'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flame, Layers, AlertCircle, RefreshCw, IndianRupee } from 'lucide-react';
import { StatCard } from '@/components/StatCard/StatCard';
import { StockBadge, BadgeStatus } from '@/components/StockBadge/StockBadge';
import { Pagination } from '@/components/Pagination/Pagination';
import { formatINR } from '@meadowmist/shared';
import styles from '../products.module.css';

interface ProductInventory {
  id: string;
  name: string;
  category: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
  inStock: boolean;
  variants?: Array<{
    id: string;
    sku: string;
    name: string;
    stockQuantity: number;
    inStock: boolean;
  }>;
  _count?: {
    restockAlerts?: number;
  };
}

interface Summary {
  totalCandles: number;
  totalCeramics: number;
  totalInventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export function InventoryStockTab() {
  const [products, setProducts] = useState<ProductInventory[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [editingStock, setEditingStock] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = async (currentPage = page, currentLimit = limit) => {
    setLoading(true);
    try {
      const invRes = await fetch(
        `/api/inventory?filter=${filter}&page=${currentPage}&limit=${currentLimit}`
      );

      if (invRes.ok) {
        const data = await invRes.json();
        setProducts(data.products || []);
        setSummary(data.summary);
        if (data.pagination) {
          setTotal(data.pagination.total);
          setTotalPages(data.pagination.totalPages);
        }

        const stockMap: Record<string, number> = {};
        for (const p of data.products || []) {
          stockMap[p.id] = p.stockQuantity;
        }
        setEditingStock(stockMap);
      }
    } catch (err) {
      console.error('Inventory fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchData(1, limit);
  }, [filter]);

  useEffect(() => {
    fetchData(page, limit);
  }, [page, limit]);

  const handleStockChange = (id: string, delta: number) => {
    setEditingStock((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] ?? 0) + delta),
    }));
  };

  const handleStockInput = (id: string, val: string) => {
    const num = parseInt(val, 10);
    setEditingStock((prev) => ({
      ...prev,
      [id]: isNaN(num) ? 0 : Math.max(0, num),
    }));
  };

  const handleSaveStock = async (id: string) => {
    const newQty = editingStock[id];
    setSavingId(id);
    try {
      const res = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: id,
          newQuantity: newQty,
          reason: 'MANUAL_ADJUSTMENT',
        }),
      });

      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  stockQuantity: newQty,
                  inStock: newQty > 0,
                }
              : p
          )
        );
      }
    } catch (err) {
      console.error('Save stock error:', err);
    } finally {
      setSavingId(null);
    }
  };

  const getStockStatus = (
    qty: number,
    threshold: number,
    inStock: boolean
  ): BadgeStatus => {
    if (!inStock || qty <= 0) return 'out-of-stock';
    if (qty <= threshold) return 'low-stock';
    return 'in-stock';
  };

  return (
    <div>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Artisan Studio Inventory</h2>
          <p className={styles.sectionDesc}>
            Manage small-batch workshop levels and keep stock aligned with direct customer orders.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchData()}
          className={styles.refreshBtn}
          title="Refresh inventory"
        >
          <RefreshCw size={16} />
          Sync Stock
        </button>
      </div>

      {summary && (
        <div className={styles.statsGrid}>
          <StatCard
            label="Hand-Poured Candles"
            value={summary.totalCandles}
            icon={Flame}
          />
          <StatCard
            label="Handcrafted Ceramics"
            value={summary.totalCeramics}
            icon={Layers}
          />
          <StatCard
            label="Total Asset Value"
            value={formatINR(summary.totalInventoryValue)}
            icon={IndianRupee}
            highlight
          />
          <StatCard
            label="Low Stock Alerts"
            value={summary.lowStockCount}
            icon={AlertCircle}
          />
        </div>
      )}

      <div className={styles.filterRow}>
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          className={`${styles.filterBtn} ${filter === 'ALL' ? styles.filterBtnActive : ''}`}
        >
          All Pieces
        </button>
        <button
          type="button"
          onClick={() => setFilter('LOW_STOCK')}
          className={`${styles.filterBtn} ${filter === 'LOW_STOCK' ? styles.filterBtnActive : ''}`}
        >
          Low Stock ({summary?.lowStockCount || 0})
        </button>
        <button
          type="button"
          onClick={() => setFilter('OUT_OF_STOCK')}
          className={`${styles.filterBtn} ${filter === 'OUT_OF_STOCK' ? styles.filterBtnActive : ''}`}
        >
          Out of Stock ({summary?.outOfStockCount || 0})
        </button>
        <button
          type="button"
          onClick={() => setFilter('CANDLE')}
          className={`${styles.filterBtn} ${filter === 'CANDLE' ? styles.filterBtnActive : ''}`}
        >
          Soy Candles
        </button>
        <button
          type="button"
          onClick={() => setFilter('CERAMIC')}
          className={`${styles.filterBtn} ${filter === 'CERAMIC' ? styles.filterBtnActive : ''}`}
        >
          Wheel-Thrown Ceramics
        </button>
      </div>

      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.emptyState}>Loading batch levels...</div>
        ) : products.length === 0 ? (
          <div className={styles.emptyState}>No items match this stock filter.</div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Unit Price</th>
                  <th>Status</th>
                  <th>Customer Demand</th>
                  <th>Adjust Batch Stock</th>
                  <th>Commit</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const currentVal = editingStock[p.id] ?? p.stockQuantity;
                  const isDirty = currentVal !== p.stockQuantity;
                  const isSaving = savingId === p.id;

                  return (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/products/${p.id}/edit`} className={styles.productName}>
                          {p.name}
                        </Link>
                        {p.variants && p.variants.length > 0 && (
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                            {p.variants.length} SKU variants: {p.variants.map((v) => `${v.name} (${v.stockQuantity})`).join(' · ')}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={styles.categoryPill}>
                          {p.category.toUpperCase()}
                        </span>
                      </td>
                      <td>{formatINR(p.price)}</td>
                      <td>
                        <StockBadge
                          status={getStockStatus(
                            p.stockQuantity,
                            p.lowStockThreshold,
                            p.inStock
                          )}
                        />
                      </td>
                      <td>
                        {p._count?.restockAlerts && p._count.restockAlerts > 0 ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '12px',
                              backgroundColor: '#fef3c7',
                              color: '#92400e',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                            }}
                          >
                            🔔 {p._count.restockAlerts} waiting
                          </span>
                        ) : (
                          <span style={{ opacity: 0.4, fontSize: '0.8rem' }}>None</span>
                        )}
                      </td>
                      <td>
                        <div className={styles.stockControl}>
                          <button
                            type="button"
                            className={styles.stepperBtn}
                            onClick={() => handleStockChange(p.id, -5)}
                            title="Decrease by 5"
                          >
                            -5
                          </button>
                          <button
                            type="button"
                            className={styles.stepperBtn}
                            onClick={() => handleStockChange(p.id, -1)}
                            title="Decrease by 1"
                          >
                            -1
                          </button>
                          <input
                            type="text"
                            className={styles.stockInput}
                            value={currentVal}
                            onChange={(e) => handleStockInput(p.id, e.target.value)}
                            aria-label={`Stock for ${p.name}`}
                          />
                          <button
                            type="button"
                            className={styles.stepperBtn}
                            onClick={() => handleStockChange(p.id, 1)}
                            title="Increase by 1"
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            className={styles.stepperBtn}
                            onClick={() => handleStockChange(p.id, 5)}
                            title="Increase by 5"
                          >
                            +5
                          </button>
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.saveBtn}
                          disabled={!isDirty || isSaving}
                          onClick={() => handleSaveStock(p.id)}
                          style={{
                            opacity: isDirty ? 1 : 0.4,
                            cursor: isDirty ? 'pointer' : 'default',
                          }}
                        >
                          {isSaving ? 'Saving...' : 'Save'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={total}
          limit={limit}
          onPageChange={(p) => setPage(p)}
        />
      </div>
    </div>
  );
}
