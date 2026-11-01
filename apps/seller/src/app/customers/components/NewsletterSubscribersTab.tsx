'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Search, Copy, Check, Download } from 'lucide-react';
import { StockBadge } from '@/components/StockBadge/StockBadge';
import { Pagination } from '@/components/Pagination/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import styles from '../customers.module.css';

interface Subscriber {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export function NewsletterSubscribersTab() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 20;

  const debouncedSearch = useDebounce(searchTerm, 300);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/newsletter');
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data.subscribers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const filtered = subscribers.filter((s) =>
    s.email.toLowerCase().includes(debouncedSearch.toLowerCase().trim())
  );

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  const handleCopyEmails = () => {
    const activeEmails = subscribers
      .filter((s) => s.isActive)
      .map((s) => s.email)
      .join(', ');

    if (!activeEmails) return;

    navigator.clipboard.writeText(activeEmails).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleDownloadCsv = () => {
    if (subscribers.length === 0) return;

    const headers = ['Email', 'Status', 'Subscribed At'];
    const rows = subscribers.map((s) => [
      `"${s.email.replace(/"/g, '""')}"`,
      s.isActive ? 'Active' : 'Inactive',
      `"${new Date(s.createdAt).toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `meadow_mist_newsletter_subscribers_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search subscriber by email domain or keyword..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className={styles.searchInput}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleCopyEmails}
            disabled={subscribers.length === 0}
            className={styles.actionBtn}
            title="Copy active subscriber emails to clipboard"
          >
            {copied ? <Check size={15} style={{ color: '#166534' }} /> : <Copy size={15} />}
            <span>{copied ? 'Copied Emails' : 'Copy Active Emails'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={subscribers.length === 0}
            className={styles.actionBtn}
            title="Export subscriber list as CSV"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.emptyState}>Loading subscriber audience...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <Mail size={36} strokeWidth={1.5} style={{ opacity: 0.45, color: 'var(--color-forest)' }} />
            <p style={{ margin: '8px 0 0', fontWeight: 600, color: 'var(--color-forest)' }}>
              {debouncedSearch ? 'No subscribers matching your search.' : 'No newsletter subscribers yet.'}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#666' }}>
              Subscribers who sign up via the storefront footer will appear here.
            </p>
          </div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Subscriber Email</th>
                  <th>Subscription Status</th>
                  <th>Subscribed Date</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--color-forest-deep)' }}>
                        {sub.email}
                      </span>
                    </td>
                    <td>
                      <StockBadge status={sub.isActive ? 'in-stock' : 'out-of-stock'} />
                    </td>
                    <td>
                      {new Date(sub.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={total}
          limit={limit}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
