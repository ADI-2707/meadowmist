'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { RotateCcw, Eye, Search } from 'lucide-react';
import { StockBadge } from '@/components/StockBadge/StockBadge';
import { Pagination } from '@/components/Pagination/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { formatINR } from '@meadowmist/shared';
import styles from '../orders.module.css';

interface OrderItem {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  returnReason?: string | null;
  returnStatus?: string | null;
  returnRequestedAt?: string | null;
  refundedAmount?: number;
  user?: { name: string; email: string; phone?: string | null } | null;
}

export function ReturnsTab() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const debouncedSearch = useDebounce(searchTerm, 350);

  const fetchOrders = async (currentPage = page, currentLimit = limit) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('returnStatus', 'ANY');
      if (debouncedSearch.trim()) {
        params.set('search', debouncedSearch.trim());
      }
      params.set('page', String(currentPage));
      params.set('limit', String(currentLimit));

      const res = await fetch(`/api/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        if (data.pagination) {
          setTotal(data.pagination.total);
          setTotalPages(data.pagination.totalPages);
        }
      }
    } catch (err) {
      console.error('Returns load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchOrders(1, limit);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchOrders(page, limit);
  }, [page, limit]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search return request by order # or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.emptyState}>Loading return requests queue...</div>
        ) : orders.length === 0 ? (
          <div className={styles.emptyState}>
            <RotateCcw size={36} strokeWidth={1.5} style={{ opacity: 0.45, color: 'var(--color-forest)' }} />
            <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-forest)' }}>
              No return or refund requests reported.
            </p>
            <p style={{ margin: 0, fontSize: '0.84rem', color: '#666' }}>
              Return requests submitted by customers will be queued here for review.
            </p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Requested Date</th>
                <th>Customer</th>
                <th>Return Reason & Notes</th>
                <th>Total Value</th>
                <th>Refunded Amount</th>
                <th>Return Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/orders/${o.id}`} className={styles.orderNum}>
                      #{o.orderNumber}
                    </Link>
                  </td>
                  <td>
                    {o.returnRequestedAt
                      ? new Date(o.returnRequestedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td>
                    <p className={styles.customerName}>
                      {o.user ? o.user.name : 'Guest Customer'}
                    </p>
                    <p className={styles.customerEmail}>
                      {o.user ? o.user.email : '—'}
                    </p>
                  </td>
                  <td style={{ maxWidth: '280px' }}>
                    <p style={{ fontSize: '0.82rem', color: '#333' }}>
                      {o.returnReason || 'No details provided'}
                    </p>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {formatINR(o.totalAmount)}
                  </td>
                  <td>
                    {o.refundedAmount && o.refundedAmount > 0 ? (
                      <span style={{ color: '#2E7D32', fontWeight: 600 }}>
                        {formatINR(o.refundedAmount)}
                      </span>
                    ) : (
                      <span style={{ color: '#aaa' }}>₹0</span>
                    )}
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        background:
                          o.returnStatus === 'COMPLETED'
                            ? '#E8F5E9'
                            : o.returnStatus === 'REJECTED'
                            ? '#FFEBEE'
                            : '#FFF8E1',
                        color:
                          o.returnStatus === 'COMPLETED'
                            ? '#2E7D32'
                            : o.returnStatus === 'REJECTED'
                            ? '#C62828'
                            : '#F57F17',
                      }}
                    >
                      {o.returnStatus || 'NONE'}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/orders/${o.id}`}
                      className={styles.viewBtn}
                      title="Inspect Return"
                    >
                      <RotateCcw
                        size={14}
                        style={{ display: 'inline', marginRight: '4px' }}
                      />
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
