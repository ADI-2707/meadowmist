'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2 } from 'lucide-react';
import styles from '../marketing.module.css';

interface PromotionItem {
  id: string;
  code: string;
  description?: string | null;
  discountType: string;
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number | null;
  timesUsed: number;
  usageLimit?: number | null;
  isActive: boolean;
}

export function PromotionsTab() {
  const [promos, setPromos] = useState<PromotionItem[]>([]);
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [discountType, setDiscountType] = useState('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('10');
  const [minOrder, setMinOrder] = useState('499');
  const [maxDiscount, setMaxDiscount] = useState('200');
  const [loading, setLoading] = useState(true);

  const fetchPromos = async () => {
    try {
      const res = await fetch('/api/content/promotions');
      if (res.ok) {
        const data = await res.json();
        setPromos(data.promotions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !discountValue) {
      alert('Code and discount value required');
      return;
    }

    try {
      const res = await fetch('/api/content/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode,
          description: newDesc,
          discountType,
          discountValue: Number(discountValue),
          minOrderValue: Number(minOrder) || 0,
          maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        }),
      });

      if (res.ok) {
        setNewCode('');
        setNewDesc('');
        fetchPromos();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to create promo');
      }
    } catch {
      alert('Error creating promotion');
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete promo code "${code}"?`)) return;
    try {
      const res = await fetch(`/api/content/promotions?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchPromos();
      } else {
        alert('Failed to delete promotion');
      }
    } catch {
      alert('Error deleting promotion');
    }
  };

  return (
    <div className={styles.splitGrid}>
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.emptyState}>Loading discount promotions...</div>
        ) : promos.length === 0 ? (
          <div className={styles.emptyState}>
            No active discount codes. Create your first promotional coupon!
          </div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Coupon Code</th>
                  <th>Discount</th>
                  <th>Min Order</th>
                  <th>Cap</th>
                  <th>Redeemed</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className={styles.promoCode}>{p.code}</span>
                      {p.description && (
                        <p className={styles.promoDesc}>{p.description}</p>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>
                        {p.discountType === 'PERCENTAGE'
                          ? `${p.discountValue}% OFF`
                          : `₹${p.discountValue} FLAT`}
                      </span>
                    </td>
                    <td>₹{p.minOrderValue}</td>
                    <td>{p.maxDiscount ? `₹${p.maxDiscount}` : 'No Cap'}</td>
                    <td>{p.timesUsed} orders</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id, p.code)}
                        className={styles.deleteBtn}
                        title="Delete Promotion"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={styles.formCard}>
        <h3 className={styles.sectionTitle}>Create New Discount Coupon</h3>
        <form onSubmit={handleCreatePromo}>
          <div className={styles.field}>
            <label className={styles.label}>Promo Code</label>
            <input
              type="text"
              placeholder="e.g. FESTIVE15"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Discount Type</label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              className={styles.select}
            >
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FLAT">Flat Amount (₹)</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Discount Value {discountType === 'PERCENTAGE' ? '(%)' : '(₹)'}
            </label>
            <input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Minimum Order Value (₹)</label>
            <input
              type="number"
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              className={styles.input}
            />
          </div>

          {discountType === 'PERCENTAGE' && (
            <div className={styles.field}>
              <label className={styles.label}>Maximum Discount Cap (₹)</label>
              <input
                type="number"
                placeholder="e.g. 300"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
                className={styles.input}
              />
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Description / Purpose</label>
            <input
              type="text"
              placeholder="e.g. Special festive celebration discount"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className={styles.input}
            />
          </div>

          <button type="submit" className={styles.submitBtn}>
            <Plus size={16} />
            <span>Publish Promotion</span>
          </button>
        </form>
      </div>
    </div>
  );
}

