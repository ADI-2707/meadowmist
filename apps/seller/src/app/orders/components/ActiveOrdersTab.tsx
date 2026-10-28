'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Eye } from 'lucide-react';
import { StockBadge, BadgeStatus } from '@/components/StockBadge/StockBadge';
import { Pagination } from '@/components/Pagination/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import styles from '../orders.module.css';

interface OrderItem {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  trackingNumber?: string | null;
  returnStatus?: string | null;
  items: { id: string; quantity: number }[];
  user?: { name: string; email: string; phone?: string | null } | null;
}

export function ActiveOrdersTab() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL_ACTIVE');
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
      if (statusFilter !== 'ALL_ACTIVE') {
        params.set('status', statusFilter);
      }
      if (debouncedSearch.trim()) {
        params.set('search', debouncedSearch.trim());
      }
      params.set('page', String(currentPage));
      params.set('limit', String(currentLimit));

      const res = await fetch(`/api/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        let fetchedOrders = data.orders || [];
        if (statusFilter === 'ALL_ACTIVE') {
          fetchedOrders = fetchedOrders.filter(
            (o: OrderItem) =>
              o.status === 'PENDING' ||
              o.status === 'CONFIRMED' ||
              o.status === 'PROCESSING'
          );
        }
        setOrders(fetchedOrders);
        if (data.pagination) {
          setTotal(data.pagination.total);
          setTotalPages(data.pagination.totalPages);
        }
      }
    } catch (err) {
      console.error('Orders load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchOrders(1, limit);
  }, [statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchOrders(page, limit);
  }, [page, limit]);

  const mapStatusToBadge = (status: string): BadgeStatus => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'pending';
      case 'PROCESSING':
      case 'CONFIRMED':
        return 'confirmed';
      case 'SHIPPED':
        return 'shipped';
      case 'DELIVERED':
        return 'delivered';
      case 'CANCELLED':
        return 'cancelled';
      default:
        return 'pending';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div className={styles.filterBar}>
        <div style={{ display: 'flex', flex: 1, gap: '8px' }}>
          <input
            type="text"
            placeholder="Search order #, customer name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.filterSelect}
          aria-label="Filter Active Orders by Status"
        >
          <option value="ALL_ACTIVE">All Active Queue</option>
          <option value="PENDING">Pending Payment/Review</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PROCESSING">In Workshop / Packing</option>
        </select>
      </div>

      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.emptyState}>Loading active orders queue...</div>
        ) : orders.length === 0 ? (
          <div className={styles.emptyState}>No active orders awaiting processing.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const totalItems = o.items.reduce((sum, i) => sum + i.quantity, 0);

                return (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/orders/${o.id}`} className={styles.orderNum}>
                        #{o.orderNumber}
                      </Link>
                    </td>
                    <td>
                      {new Date(o.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td>
                      <p className={styles.customerName}>
                        {o.user ? o.user.name : 'Guest Customer'}
                      </p>
                      <p className={styles.customerEmail}>
                        {o.user ? o.user.email : '—'}
                      </p>
                    </td>
                    <td>{totalItems} pcs</td>
                    <td style={{ fontWeight: 600 }}>
                      ₹{o.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td>
                      <span className={styles.paymentMethod}>{o.paymentMethod}</span>
                      <span
                        className={`${styles.paymentStatus} ${
                          o.paymentStatus === 'PAID'
                            ? styles.paymentPaid
                            : styles.paymentPending
                        }`}
                      >
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <StockBadge status={mapStatusToBadge(o.status)} />
                    </td>
                    <td>
                      <Link
                        href={`/orders/${o.id}`}
                        className={styles.viewBtn}
                        title="Process Order"
                      >
                        <Eye size={14} style={{ display: 'inline', marginRight: '4px' }} />
                        Process
                      </Link>
                    </td>
                  </tr>
                );
              })}
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
