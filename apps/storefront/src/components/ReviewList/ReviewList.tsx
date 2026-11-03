'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import StarRating from '@/components/StarRating/StarRating';
import type { Review } from '@meadowmist/shared';
import styles from './ReviewList.module.css';

interface ReviewListProps {
  reviews: Review[];
  productId?: string;
  onPhotoClick?: (url: string, review: Review) => void;
}

const ASPECT_LABELS: Record<string, string> = {
  scentThrow: 'Scent Throw',
  burnLongevity: 'Burn Longevity',
  packaging: 'Packaging',
  craftsmanship: 'Craftsmanship',
  glazeFinish: 'Glaze Finish',
  durability: 'Durability',
};

export default function ReviewList({
  reviews,
  productId,
  onPhotoClick,
}: ReviewListProps) {
  const [helpfulMap, setHelpfulMap] = useState<Record<string, { count: number; voted: boolean }>>(() => {
    const initial: Record<string, { count: number; voted: boolean }> = {};
    reviews.forEach((r) => {
      initial[r.id] = {
        count: r.helpfulCount || 0,
        voted: Boolean(r.userVotedHelpful),
      };
    });
    return initial;
  });

  const [votingMap, setVotingMap] = useState<Record<string, boolean>>({});
  const [noticeMap, setNoticeMap] = useState<Record<string, string>>({});

  if (reviews.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No reviews yet for this handcrafted piece. Be the first to share your experience.</p>
      </div>
    );
  }

  const handleHelpfulToggle = async (review: Review) => {
    const current = helpfulMap[review.id] || {
      count: review.helpfulCount || 0,
      voted: Boolean(review.userVotedHelpful),
    };

    const targetProductId = productId || review.productId;
    if (!targetProductId) return;

    setVotingMap((prev) => ({ ...prev, [review.id]: true }));

    const nextVoted = !current.voted;
    const nextCount = nextVoted ? current.count + 1 : Math.max(0, current.count - 1);

    setHelpfulMap((prev) => ({
      ...prev,
      [review.id]: { count: nextCount, voted: nextVoted },
    }));

    try {
      const res = await fetch(`/api/products/${targetProductId}/reviews/${review.id}/helpful`, {
        method: 'POST',
      });

      if (!res.ok) {
        if (res.status === 401) {
          setHelpfulMap((prev) => ({ ...prev, [review.id]: current }));
          setNoticeMap((prev) => ({ ...prev, [review.id]: 'Please sign in to vote' }));
          setTimeout(() => {
            setNoticeMap((prev) => {
              const updated = { ...prev };
              delete updated[review.id];
              return updated;
            });
          }, 3000);
          return;
        }
        throw new Error('Failed to record helpful vote');
      }

      const data = await res.json();
      setHelpfulMap((prev) => ({
        ...prev,
        [review.id]: {
          count: data.helpfulCount,
          voted: data.userVotedHelpful,
        },
      }));
    } catch {
      setHelpfulMap((prev) => ({ ...prev, [review.id]: current }));
    } finally {
      setVotingMap((prev) => ({ ...prev, [review.id]: false }));
    }
  };

  return (
    <div className={styles.listContainer}>
      {reviews.map((r) => {
        const formattedDate = new Date(r.createdAt).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });

        const authorName = r.user?.name || 'Artisan Collector';
        const initial = authorName.charAt(0).toUpperCase();
        const helpfulInfo = helpfulMap[r.id] || {
          count: r.helpfulCount || 0,
          voted: Boolean(r.userVotedHelpful),
        };

        const aspectPairs = r.aspectRatings ? Object.entries(r.aspectRatings) : [];

        return (
          <article key={r.id} className={styles.reviewCard}>
            <div className={styles.headerRow}>
              <div className={styles.authorMeta}>
                <div className={styles.avatarCircle}>{initial}</div>
                <div className={styles.authorInfo}>
                  <span className={styles.authorName}>{authorName}</span>
                  {r.isVerifiedPurchase && (
                    <span className={styles.verifiedBadge}>
                      <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12" aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Verified Collector
                    </span>
                  )}
                </div>
              </div>
              <time dateTime={r.createdAt} className={styles.date}>
                {formattedDate}
              </time>
            </div>

            <div className={styles.ratingRow}>
              <StarRating rating={r.rating} />
            </div>

            {r.title && <h4 className={styles.reviewTitle}>{r.title}</h4>}

            {aspectPairs.length > 0 && (
              <div className={styles.aspectPillsRow}>
                {aspectPairs.map(([key, score]) => (
                  <span key={key} className={styles.aspectPill}>
                    {ASPECT_LABELS[key] || key}:{' '}
                    <span className={styles.aspectPillScore}>{score}★</span>
                  </span>
                ))}
              </div>
            )}

            <p className={styles.reviewComment}>{r.comment}</p>

            {r.images && r.images.length > 0 && (
              <div className={styles.photoRow}>
                {r.images.map((imgUrl, idx) => (
                  <button
                    key={imgUrl + idx}
                    type="button"
                    className={styles.photoThumbBtn}
                    onClick={() => onPhotoClick?.(imgUrl, r)}
                    aria-label={`View full customer image ${idx + 1}`}
                  >
                    <Image
                      src={imgUrl}
                      alt={`Customer review upload ${idx + 1}`}
                      className={styles.photoThumbImg}
                      width={80}
                      height={80}
                    />
                  </button>
                ))}
              </div>
            )}

            {r.sellerReply && (
              <div className={styles.artisanReplyBox}>
                <div className={styles.artisanReplyHeader}>
                  <div className={styles.artisanReplyTitle}>
                    <svg className={styles.artisanIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    <span>Artisan Response — Meadow Mist Studio</span>
                  </div>
                  {r.sellerRepliedAt && (
                    <span className={styles.artisanReplyDate}>
                      {new Date(r.sellerRepliedAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                </div>
                <p className={styles.artisanReplyText}>{r.sellerReply}</p>
              </div>
            )}

            <div className={styles.footerActions}>
              <div className={styles.helpfulSection}>
                <span className={styles.helpfulQuestion}>Was this review helpful?</span>
                <button
                  type="button"
                  className={`${styles.helpfulBtn} ${helpfulInfo.voted ? styles.votedHelpful : ''}`}
                  onClick={() => handleHelpfulToggle(r)}
                  disabled={votingMap[r.id]}
                  aria-pressed={helpfulInfo.voted}
                  aria-label={`Mark review as helpful. Currently ${helpfulInfo.count} helpful votes.`}
                >
                  <svg className={styles.thumbIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                  </svg>
                  <span>Helpful ({helpfulInfo.count})</span>
                </button>
                {noticeMap[r.id] && (
                  <span className={styles.helpfulNotice}>{noticeMap[r.id]}</span>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
