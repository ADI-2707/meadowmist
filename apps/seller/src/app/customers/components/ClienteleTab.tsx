'use client';

import React, { useState, useEffect } from 'react';
import { Users, Mail, Phone, ShoppingBag, Heart, IndianRupee, Search } from 'lucide-react';
import { StatCard } from '@/components/StatCard/StatCard';
import { Pagination } from '@/components/Pagination/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import styles from '../customers.module.css';

interface CustomerItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  createdAt: string;
  totalOrders: number;
  lifetimeSpend: number;
  wishlistCount: number;
  primaryAddress: string;
}

export function ClienteleTab() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const debouncedSearch = useDebounce(searchTerm, 350);

  const fetchCustomers = async (currentPage = page, currentLimit = limit) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      params.set('page', String(currentPage));
      params.set('limit', String(currentLimit));

      const res = await fetch(`/api/customers?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
        if (data.pagination) {
          setTotal(data.pagination.total);
          setTotalPages(data.pagination.totalPages);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchCustomers(1, limit);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchCustomers(page, limit);
  }, [page, limit]);

  const totalRegistered = total || customers.length;
  const totalOrders = customers.reduce((sum, c) => sum + c.totalOrders, 0);
  const totalSpend = customers.reduce((sum, c) => sum + c.lifetimeSpend, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div className={styles.metricsGrid}>
        <StatCard
          label="Registered Clientele"
          value={totalRegistered}
          icon={Users}
        />
        <StatCard
          label="Orders Delivered"
          value={totalOrders}
          icon={ShoppingBag}
        />
        <StatCard
          label="Clientele Lifetime Spend"
          value={`₹${totalSpend.toLocaleString('en-IN')}`}
          icon={IndianRupee}
          highlight
        />
      </div>

      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by customer name, email, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.emptyState}>Loading clientele directory...</div>
        ) : customers.length === 0 ? (
          <div className={styles.emptyState}>No customers found.</div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Contact Details</th>
                  <th>Orders</th>
                  <th>Lifetime Spend</th>
                  <th>Wishlist</th>
                  <th>Primary Delivery Address</th>
                  <th>Member Since</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => {
                  const initial = c.name ? c.name[0].toUpperCase() : '?';

                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className={styles.avatar}>{initial}</div>
                          <span className={styles.customerName}>{c.name}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: '#555',
                            }}
                          >
                            <Mail size={12} /> {c.email}
                          </span>
                          {c.phone && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: '#555',
                              }}
                            >
                              <Phone size={12} /> {c.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{c.totalOrders}</td>
                      <td style={{ fontWeight: 700, color: 'var(--color-forest)' }}>
                        ₹{c.lifetimeSpend.toLocaleString('en-IN')}
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: 'var(--color-clay)',
                            fontWeight: 600,
                          }}
                        >
                          <Heart size={13} fill="var(--color-clay)" /> {c.wishlistCount}
                        </span>
                      </td>
                      <td style={{ maxWidth: '240px', fontSize: '0.8rem', color: '#555' }}>
                        {c.primaryAddress}
                      </td>
                      <td style={{ color: '#888', whiteSpace: 'nowrap' }}>
                        {new Date(c.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          year: 'numeric',
                        })}
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
