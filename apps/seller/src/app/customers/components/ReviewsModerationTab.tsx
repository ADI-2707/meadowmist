'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Star, CheckCircle, EyeOff, Trash2 } from 'lucide-react';
import styles from '../customers.module.css';

interface ReviewItem {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  product: {
    id: string;
    name: string;
    slug: string;
    images: string;
  };
}

export function ReviewsModerationTab() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');

  const fetchReviews = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (ratingFilter) params.set('rating', ratingFilter);

      const res = await fetch(`/api/reviews?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, ratingFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const toggleApproval = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: !currentStatus }),
      });

      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, isApproved: !currentStatus } : r))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteReview = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this review?')) return;

    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div className={styles.filterBar}>
        <input
          type="text"
          placeholder="Search reviews by customer, product, or keywords..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid var(--color-gold-soft)',
            fontFamily: 'var(--font-body)',
          }}
          aria-label="Filter by Star Rating"
        >
          <option value="">All Star Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
      </div>

      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.emptyState}>Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className={styles.emptyState}>No reviews match this filter.</div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Customer</th>
                  <th>Rating</th>
                  <th>Review Details</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => {
                  let parsedImages: string[] = [];
                  try {
                    parsedImages = JSON.parse(r.product.images);
                  } catch {
                    parsedImages = ['/images/placeholder.jpg'];
                  }
                  const thumb = parsedImages[0] || '/images/placeholder.jpg';

                  return (
                    <tr key={r.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              position: 'relative',
                              width: '40px',
                              height: '40px',
                              borderRadius: '4px',
                              overflow: 'hidden',
                              flexShrink: 0,
                            }}
                          >
                            <Image
                              src={thumb}
                              alt={r.product.name}
                              fill
                              sizes="40px"
                              style={{ objectFit: 'cover' }}
                            />
                          </div>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                            {r.product.name}
                          </span>
                        </div>
                      </td>
                      <td>
                        <p className={styles.customerName}>{r.user.name}</p>
                        <p style={{ fontSize: '0.78rem', color: '#666' }}>{r.user.email}</p>
                        {r.isVerifiedPurchase && (
                          <span className={styles.verifiedBadge}>
                            <CheckCircle size={10} /> Verified Purchase
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '2px', color: 'var(--color-gold)' }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={13}
                              fill={star <= r.rating ? 'var(--color-gold)' : 'none'}
                              stroke="var(--color-gold)"
                            />
                          ))}
                        </div>
                      </td>
                      <td style={{ maxWidth: '280px' }}>
                        {r.title && (
                          <p style={{ fontWeight: 600, fontSize: '0.85rem', margin: '0 0 2px' }}>
                            {r.title}
                          </p>
                        )}
                        <p style={{ fontSize: '0.82rem', color: '#555', margin: 0 }}>
                          &ldquo;{r.comment}&rdquo;
                        </p>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            background: r.isApproved ? '#E8F5E9' : '#FFF3E0',
                            color: r.isApproved ? '#2E7D32' : '#E65100',
                          }}
                        >
                          {r.isApproved ? 'Approved' : 'Hidden'}
                        </span>
                      </td>
                      <td style={{ color: '#888', whiteSpace: 'nowrap' }}>
                        {new Date(r.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => toggleApproval(r.id, r.isApproved)}
                            className={`${styles.approveBtn} ${r.isApproved ? '' : styles.approveBtnActive}`}
                            title={r.isApproved ? 'Hide from Store' : 'Approve Review'}
                          >
                            {r.isApproved ? <EyeOff size={13} /> : <CheckCircle size={13} />}
                            {r.isApproved ? 'Hide' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteReview(r.id)}
                            className={styles.deleteBtn}
                            title="Delete Review"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
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
