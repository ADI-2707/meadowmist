'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
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

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inventory/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Logs fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={fetchLogs}
          className={styles.refreshBtn}
        >
          <RefreshCw size={15} />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.emptyState}>Loading audit log records...</div>
        ) : logs.length === 0 ? (
          <div className={styles.emptyState}>No inventory log records found.</div>
        ) : (
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
                {logs.map((log) => {
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
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
