'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Truck, Eye, Search } from 'lucide-react';
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
  trackingNumber?: string | null;
  courierPartner?: string | null;
  courierStatus?: string | null;
  items: { id: string; quantity: number }[];
  user?: { name: string; email: string; phone?: string | null } | null;
}

export function LogisticsTab() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL_SHIPPED');
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
      if (statusFilter !== 'ALL_SHIPPED') {
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
        if (statusFilter === 'ALL_SHIPPED') {
          fetchedOrders = fetchedOrders.filter(
            (o: OrderItem) =>
              o.status === 'SHIPPED' ||
              o.status === 'DELIVERED' ||
              Boolean(o.trackingNumber)
          );
        }
        setOrders(fetchedOrders);
        if (data.pagination) {
          setTotal(data.pagination.total);
          setTotalPages(data.pagination.totalPages);
        }
      }
    } catch (err) {
      console.error('Logistics load error:', err);
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
      case 'SHIPPED':
        return 'shipped';
      case 'DELIVERED':
        return 'delivered';
      default:
        return 'confirmed';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search AWB tracking #, order #, or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.filterSelect}
          aria-label="Filter Logistics Orders by Status"
        >
          <option value="ALL_SHIPPED">All Dispatched Shipments</option>
          <option value="SHIPPED">In Transit (Shipped)</option>
          <option value="DELIVERED">Delivered to Customer</option>
        </select>
      </div>

      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.emptyState}>Loading courier shipments...</div>
        ) : orders.length === 0 ? (
          <div className={styles.emptyState}>
            <Truck size={36} strokeWidth={1.5} style={{ opacity: 0.45, color: 'var(--color-forest)' }} />
            <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-forest)' }}>
              No dispatched shipments found.
            </p>
            <p style={{ margin: 0, fontSize: '0.84rem', color: '#666' }}>
              Orders marked as shipped will appear in this tracking register.
            </p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Dispatched Date</th>
                <th>Recipient</th>
                <th>Courier Partner</th>
                <th>Tracking AWB</th>
                <th>Courier Status</th>
                <th>Lifecycle Status</th>
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
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--color-forest)' }}>
                      {o.courierPartner || 'Delhivery'}
                    </span>
                  </td>
                  <td>
                    {o.trackingNumber ? (
                      <span
                        style={{
                          fontFamily: 'monospace',
                          background: 'var(--color-canvas)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--color-gold-soft)',
                          fontSize: '0.8rem',
                        }}
                      >
                        {o.trackingNumber}
                      </span>
                    ) : (
                      <span style={{ color: '#aaa', fontStyle: 'italic' }}>
                        AWB Pending
                      </span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem', color: '#555' }}>
                      {o.courierStatus || 'Processing'}
                    </span>
                  </td>
                  <td>
                    <StockBadge status={mapStatusToBadge(o.status)} />
                  </td>
                  <td>
                    <Link
                      href={`/orders/${o.id}`}
                      className={styles.viewBtn}
                      title="Update Tracking"
                    >
                      <Truck size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      Tracking
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
