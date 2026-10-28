'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Phone, Clock, AlertCircle } from 'lucide-react';
import styles from '../customers.module.css';

interface EnquiryItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  category: string;
  message: string;
  status: string;
  adminReply?: string | null;
  createdAt: string;
}

export function SupportInboxTab() {
  const [enquiries, setEnquiries] = useState<EnquiryItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const url =
        statusFilter === 'ALL'
          ? '/api/enquiries'
          : `/api/enquiries?status=${statusFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEnquiries(data.enquiries || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, [statusFilter]);

  const handleSelect = (e: EnquiryItem) => {
    setSelectedEnquiry(e);
    setReplyText(e.adminReply || '');
    setNewStatus(e.status);
  };

  const handleSaveReply = async () => {
    if (!selectedEnquiry) return;
    try {
      const res = await fetch('/api/enquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedEnquiry.id,
          status: newStatus,
          adminReply: replyText,
        }),
      });
      if (res.ok) {
        alert('Enquiry updated successfully');
        fetchEnquiries();
        setSelectedEnquiry(null);
      }
    } catch {
      alert('Error updating enquiry');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div className={styles.filterBar}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`${styles.approveBtn} ${statusFilter === 'ALL' ? styles.approveBtnActive : ''}`}
          >
            All Messages
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('PENDING')}
            className={`${styles.approveBtn} ${statusFilter === 'PENDING' ? styles.approveBtnActive : ''}`}
          >
            Pending Attention
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('RESOLVED')}
            className={`${styles.approveBtn} ${statusFilter === 'RESOLVED' ? styles.approveBtnActive : ''}`}
          >
            Resolved Tickets
          </button>
        </div>
      </div>

      <div className={styles.enquiryLayout}>
        <div className={styles.tableCard}>
          {loading ? (
            <div className={styles.emptyState}>Loading enquiries...</div>
          ) : enquiries.length === 0 ? (
            <div className={styles.emptyState}>No customer enquiries found.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Topic</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => handleSelect(e)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor:
                        selectedEnquiry?.id === e.id
                          ? 'var(--color-canvas)'
                          : undefined,
                    }}
                  >
                    <td>
                      <p className={styles.customerName}>{e.name}</p>
                      <p style={{ fontSize: '0.78rem', color: '#666' }}>{e.email}</p>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'var(--color-canvas)',
                          border: '1px solid var(--color-gold-soft)',
                          fontWeight: 600,
                        }}
                      >
                        {e.category}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          background:
                            e.status === 'RESOLVED' ? '#E8F5E9' : '#FFF3E0',
                          color:
                            e.status === 'RESOLVED' ? '#2E7D32' : '#E65100',
                        }}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td style={{ color: '#888', whiteSpace: 'nowrap' }}>
                      {new Date(e.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div>
          {selectedEnquiry ? (
            <div className={styles.detailCard}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.25rem',
                      color: 'var(--color-forest)',
                      margin: 0,
                    }}
                  >
                    {selectedEnquiry.name}
                  </h3>
                  <div
                    style={{
                      display: 'flex',
                      gap: '12px',
                      fontSize: '0.85rem',
                      color: '#666',
                      marginTop: '4px',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Mail size={13} /> {selectedEnquiry.email}
                    </span>
                    {selectedEnquiry.phone && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Phone size={13} /> {selectedEnquiry.phone}
                      </span>
                    )}
                  </div>
                </div>

                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-gold-soft)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="RESOLVED">RESOLVED</option>
                </select>
              </div>

              <div
                style={{
                  background: 'var(--color-canvas)',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-canvas-alt)',
                  marginBottom: '20px',
                }}
              >
                <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: '1.6' }}>
                  {selectedEnquiry.message}
                </p>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--color-forest)',
                  }}
                >
                  Studio Response / Resolution Notes:
                </label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Record your response or notes for this inquiry..."
                  className={styles.replyTextarea}
                />
                <button
                  type="button"
                  onClick={handleSaveReply}
                  className={styles.saveBtn}
                >
                  Save & Update Status
                </button>
              </div>
            </div>
          ) : (
            <div
              className={styles.detailCard}
              style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}
            >
              Select an enquiry from the list to view message content and reply.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
