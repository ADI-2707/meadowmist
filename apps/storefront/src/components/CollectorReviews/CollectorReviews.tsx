import React from 'react';
import Link from 'next/link';
import StarRating from '@/components/StarRating/StarRating';
import SectionReveal from '@/components/SectionReveal/SectionReveal';
import styles from './CollectorReviews.module.css';

interface TopReview {
  id: string;
  rating: number;
  title?: string | null;
  comment: string;
  isVerifiedPurchase: boolean;
  user?: { name: string } | null;
  product?: { name: string; slug: string; category: string } | null;
}

interface CollectorReviewsProps {
  reviews: TopReview[];
}

export function CollectorReviews({ reviews }: CollectorReviewsProps) {
  if (!reviews || reviews.length === 0) {
    return null;
  }

  return (
    <section className={styles.section} aria-label="Collector Testimonials">
      <div className="container">
        <SectionReveal>
          <header className={styles.header}>
            <p className={styles.eyebrow}>Words From Collectors</p>
            <h2 className={styles.title}>Cherished In Everyday Sanctuaries</h2>
            <p className={styles.subtitle}>
              Stories and impressions shared by thoughtful patrons who bring our handcrafted
              candles and ceramics into their homes.
            </p>
          </header>
        </SectionReveal>

        <div className={styles.grid}>
          {reviews.map((r, i) => (
            <SectionReveal key={r.id} delay={i * 0.08}>
              <article className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.collectorName}>{r.user?.name || 'Collector'}</div>
                    {r.isVerifiedPurchase && (
                      <span className={styles.verifiedBadge}>✓ Verified Collector</span>
                    )}
                  </div>
                  <StarRating rating={r.rating} />
                </div>

                {r.title && <h3 className={styles.reviewTitle}>{r.title}</h3>}

                <p className={styles.reviewComment}>{r.comment}</p>

                {r.product && (
                  <Link href={`/product/${r.product.slug}`} className={styles.productLink}>
                    Regarding: {r.product.name} →
                  </Link>
                )}
              </article>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
