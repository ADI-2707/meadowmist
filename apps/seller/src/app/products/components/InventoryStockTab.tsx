'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flame, Layers, AlertCircle, RefreshCw, IndianRupee } from 'lucide-react';
import { StatCard } from '@/components/StatCard/StatCard';
import { StockBadge, BadgeStatus } from '@/components/StockBadge/StockBadge';
import { Pagination } from '@/components/Pagination/Pagination';
import styles from '../products.module.css';

interface ProductInventory {
  id: string;
  name: string;
  category: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
  inStock: boolean;
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
          note: 'Updated from inventory grid',
        }),
      });

      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to update stock');
      }
    } catch {
      alert('Error updating stock');
    } finally {
      setSavingId(null);
    }
  };

  const getStockStatus = (qty: number, threshold: number, inStock: boolean): BadgeStatus => {
    if (!inStock || qty <= 0) return 'out-of-stock';
    if (qty <= threshold) return 'low-stock';
    return 'in-stock';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => fetchData(page, limit)}
          className={styles.refreshBtn}
        >
          <RefreshCw size={15} />
          <span>Refresh Counts</span>
        </button>
      </div>

      {summary && (
        <div className={styles.summaryGrid}>
          <StatCard
            label="Candles in Stock"
            value={`${summary.totalCandles} pcs`}
            icon={Flame}
          />
          <StatCard
            label="Ceramics in Studio"
            value={`${summary.totalCeramics} pcs`}
            icon={Layers}
          />
          <StatCard
            label="Total Asset Value"
            value={`₹${summary.totalInventoryValue.toLocaleString('en-IN')}`}
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
                      </td>
                      <td>
                        <span className={styles.categoryPill}>
                          {p.category.toUpperCase()}
                        </span>
                      </td>
                      <td>₹{p.price.toLocaleString('en-IN')}</td>
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
