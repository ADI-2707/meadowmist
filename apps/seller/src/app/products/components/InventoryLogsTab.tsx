'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { Pagination } from '@/components/Pagination/Pagination';
import { TableRowSkeleton } from '@/components/TableRowSkeleton/TableRowSkeleton';
import styles from '../products.module.css';

interface InventoryLogItem {
  id: string;
  productId: string;
  changeQuantity: number;
  newQuantity: number;
  reason: string;
  note?: string | null;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    category: string;
  };
}

export function InventoryLogsTab() {
  const [logs, setLogs] = useState<InventoryLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async (currentPage = page, currentLimit = limit) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/inventory/logs?page=${currentPage}&limit=${currentLimit}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        if (data.pagination) {
          setTotal(data.pagination.total);
          setTotalPages(data.pagination.totalPages);
        }
      }
    } catch (err) {
      console.error('Logs fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page, limit);
  }, [page, limit]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => fetchLogs(page, limit)}
          className={styles.refreshBtn}
        >
          <RefreshCw size={15} />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Product</th>
                <th>Change Delta</th>
                <th>New Quantity</th>
                <th>Reason</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableRowSkeleton columns={6} rows={limit > 10 ? 8 : limit} />
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className={styles.emptyState}>No inventory log records found.</div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isPositive = log.changeQuantity > 0;
                  return (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap', color: '#666' }}>
                        {new Date(log.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td>
                        {log.product ? (
                          <Link
                            href={`/products/${log.product.id}/edit`}
                            className={styles.productName}
                          >
                            {log.product.name}
                          </Link>
                        ) : (
                          <span style={{ color: '#888' }}>Deleted Product</span>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color: isPositive ? '#2E7D32' : '#C62828',
                          }}
                        >
                          {isPositive ? `+${log.changeQuantity}` : log.changeQuantity}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{log.newQuantity}</td>
                      <td>
                        <span className={styles.reasonPill}>
                          {log.reason.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      </td>
                      <td style={{ color: '#555', fontSize: '0.85rem' }}>
                        {log.note || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

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
