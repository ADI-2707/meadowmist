'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Star, CheckCircle, EyeOff, Trash2, ThumbsUp, MessageSquare, X } from 'lucide-react';
import styles from '../customers.module.css';

interface ReviewItem {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  images?: string | string[] | null;
  helpfulCount?: number;
  sellerReply?: string | null;
  sellerRepliedAt?: string | null;
  aspectRatings?: string | Record<string, number> | null;
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

const ASPECT_NAME_MAP: Record<string, string> = {
  scentThrow: 'Scent Throw',
  burnLongevity: 'Burn Longevity',
  packaging: 'Packaging',
  craftsmanship: 'Craftsmanship',
  glazeFinish: 'Glaze Finish',
  durability: 'Durability',
};

export function ReviewsModerationTab() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [savingReply, setSavingReply] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

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

  const handleStartReply = (review: ReviewItem) => {
    setReplyingToId(review.id);
    setReplyDraft(review.sellerReply || '');
  };

  const handleCancelReply = () => {
    setReplyingToId(null);
    setReplyDraft('');
  };

  const handleSaveReply = async (id: string) => {
    if (!replyDraft.trim()) return;

    setSavingReply(true);
    try {
      const res = await fetch(`/api/reviews/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyDraft.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setReviews((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  sellerReply: data.review.sellerReply,
                  sellerRepliedAt: data.review.sellerRepliedAt,
                }
              : r
          )
        );
        setReplyingToId(null);
        setReplyDraft('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingReply(false);
    }
  };

  const handleDeleteReply = async (id: string) => {
    if (!window.confirm('Remove your artisan reply to this review?')) return;

    try {
      const res = await fetch(`/api/reviews/${id}/reply`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  sellerReply: null,
                  sellerRepliedAt: null,
                }
              : r
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const parseCustomerImages = (images?: string | string[] | null): string[] => {
    if (!images) return [];
    if (Array.isArray(images)) return images;
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const parseAspects = (aspects?: string | Record<string, number> | null): Array<[string, number]> => {
    if (!aspects) return [];
    if (typeof aspects === 'object') {
      return Object.entries(aspects);
    }
    try {
      const parsed = JSON.parse(aspects);
      return typeof parsed === 'object' && parsed !== null ? Object.entries(parsed) : [];
    } catch {
      return [];
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
                  const customerPhotos = parseCustomerImages(r.images);
                  const aspects = parseAspects(r.aspectRatings);
                  const isReplying = replyingToId === r.id;

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
                        {(r.helpfulCount ?? 0) > 0 && (
                          <div className={styles.helpfulBadge}>
                            <ThumbsUp size={10} /> {r.helpfulCount} helpful
                          </div>
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
                      <td style={{ maxWidth: '340px' }}>
                        {r.title && (
                          <p style={{ fontWeight: 600, fontSize: '0.85rem', margin: '0 0 2px' }}>
                            {r.title}
                          </p>
                        )}
                        <p style={{ fontSize: '0.82rem', color: '#555', margin: 0 }}>
                          &ldquo;{r.comment}&rdquo;
                        </p>

                        {customerPhotos.length > 0 && (
                          <div className={styles.customerPhotosStrip}>
                            {customerPhotos.map((imgUrl, idx) => (
                              <button
                                key={imgUrl + idx}
                                type="button"
                                className={styles.customerPhotoBtn}
                                onClick={() => setPreviewPhotoUrl(imgUrl)}
                                title="View customer photo"
                              >
                                <Image
                                  src={imgUrl}
                                  alt={`Customer upload ${idx + 1}`}
                                  width={40}
                                  height={40}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              </button>
                            ))}
                          </div>
                        )}

                        {aspects.length > 0 && (
                          <div className={styles.aspectsRow}>
                            {aspects.map(([key, score]) => (
                              <span key={key} className={styles.aspectBadge}>
                                {ASPECT_NAME_MAP[key] || key}: {score}★
                              </span>
                            ))}
                          </div>
                        )}

                        {r.sellerReply && !isReplying && (
                          <div className={styles.artisanReplyCard}>
                            <div className={styles.artisanReplyHeader}>
                              <span className={styles.artisanReplyTitle}>
                                <MessageSquare size={12} /> Artisan Response
                              </span>
                              <div>
                                <button
                                  type="button"
                                  onClick={() => handleStartReply(r)}
                                  className={styles.replyActionBtn}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReply(r.id)}
                                  className={styles.deleteReplyBtn}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            <p className={styles.artisanReplyText}>{r.sellerReply}</p>
                          </div>
                        )}

                        {!r.sellerReply && !isReplying && (
                          <div style={{ marginTop: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleStartReply(r)}
                              className={styles.replyActionBtn}
                            >
                              + Reply as Artisan
                            </button>
                          </div>
                        )}

                        {isReplying && (
                          <div className={styles.replyInlineEditor}>
                            <textarea
                              className={styles.replyInlineTextarea}
                              placeholder="Write official artisan response from Meadow Mist Studio..."
                              value={replyDraft}
                              onChange={(e) => setReplyDraft(e.target.value)}
                            />
                            <div className={styles.replyInlineActions}>
                              <button
                                type="button"
                                onClick={() => handleSaveReply(r.id)}
                                disabled={savingReply || !replyDraft.trim()}
                                className={styles.saveBtn}
                              >
                                {savingReply ? 'Saving...' : 'Publish Reply'}
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelReply}
                                className={styles.cancelReplyBtn}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
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

      {previewPhotoUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div
            style={{ position: 'relative', maxWidth: '600px', maxHeight: '80vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewPhotoUrl(null)}
              style={{
                position: 'absolute',
                top: '-36px',
                right: '0',
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
              }}
              aria-label="Close image preview"
            >
              <X size={24} />
            </button>
            <Image
              src={previewPhotoUrl}
              alt="Customer photo zoom"
              width={800}
              height={600}
              style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '8px', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
