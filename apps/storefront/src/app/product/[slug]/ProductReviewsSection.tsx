'use client';

import { useState, useEffect, useCallback } from 'react';
import RatingSummary from '@/components/RatingSummary/RatingSummary';
import ReviewForm from '@/components/ReviewForm/ReviewForm';
import ReviewList from '@/components/ReviewList/ReviewList';
import type { Review, RatingDistribution } from '@meadowmist/shared';
import styles from './ProductReviewsSection.module.css';

interface ProductReviewsSectionProps {
  productId: string;
  productSlug: string;
  category?: string;
}

export default function ProductReviewsSection({
  productId,
}: ProductReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [distribution, setDistribution] = useState<RatingDistribution>({
    average: 0,
    total: 0,
    counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    try {
      const [revRes, userRes] = await Promise.all([
        fetch(`/api/products/${productId}/reviews`),
        fetch('/api/auth/me'),
      ]);

      if (revRes.ok) {
        const data = await revRes.json();
        setReviews(data.reviews || []);
        if (data.distribution) {
          setDistribution(data.distribution);
        }
      }

      if (userRes.ok) {
        const userData = await userRes.json();
        setIsLoggedIn(Boolean(userData.user));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleReviewSubmitted = (newReview: Review) => {
    setReviews((prev) => [newReview, ...prev]);
    setDistribution((prev) => {
      const newTotal = prev.total + 1;
      const newCounts = {
        ...prev.counts,
        [newReview.rating]: (prev.counts[newReview.rating as keyof typeof prev.counts] || 0) + 1,
      };
      const totalPoints = Object.entries(newCounts).reduce(
        (acc, [star, count]) => acc + Number(star) * count,
        0
      );
      return {
        average: Number((totalPoints / newTotal).toFixed(1)),
        total: newTotal,
        counts: newCounts,
      };
    });
    setShowForm(false);
  };

  if (loading) {
    return null;
  }

  return (
    <section className={styles.reviewsSection} aria-label="Customer Reviews">
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Words from collectors</p>
          <h2 className={styles.sectionTitle}>Customer Reviews</h2>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className={styles.writeReviewBtn}
        >
          {showForm ? 'Close Review Form' : 'Write a Review'}
        </button>
      </div>

      {distribution.total > 0 && <RatingSummary distribution={distribution} />}

      {showForm && (
        <ReviewForm
          productId={productId}
          isLoggedIn={isLoggedIn}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}

      <ReviewList reviews={reviews} />
    </section>
  );
}
