'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import RatingSummary from '@/components/RatingSummary/RatingSummary';
import CustomerPhotosGallery from '@/components/CustomerPhotosGallery';
import ReviewFilterBar, { ReviewFilters } from '@/components/ReviewFilterBar';
import ReviewForm from '@/components/ReviewForm/ReviewForm';
import ReviewList from '@/components/ReviewList/ReviewList';
import type { Review, RatingDistribution, AspectScore } from '@meadowmist/shared';
import styles from './ProductReviewsSection.module.css';

interface ProductReviewsSectionProps {
  productId: string;
  productSlug: string;
  category?: string;
}

export default function ProductReviewsSection({
  productId,
  productSlug,
  category,
}: ProductReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [customerPhotos, setCustomerPhotos] = useState<string[]>([]);
  const [aspectScores, setAspectScores] = useState<AspectScore[]>([]);
  const [distribution, setDistribution] = useState<RatingDistribution>({
    average: 0,
    total: 0,
    counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [filters, setFilters] = useState<ReviewFilters>({
    sort: 'recent',
    rating: null,
    verified: false,
    withPhotos: false,
    search: '',
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setIsLoggedIn(Boolean(data.user));
      }
    } catch {}
  }, []);

  const fetchReviews = useCallback(
    async (currentFilters: ReviewFilters) => {
      try {
        const params = new URLSearchParams();
        if (currentFilters.sort) params.set('sort', currentFilters.sort);
        if (currentFilters.rating !== null) params.set('rating', String(currentFilters.rating));
        if (currentFilters.verified) params.set('verified', 'true');
        if (currentFilters.withPhotos) params.set('withPhotos', 'true');
        if (currentFilters.search.trim()) params.set('search', currentFilters.search.trim());

        const query = params.toString();
        const url = `/api/products/${productId}/reviews${query ? `?${query}` : ''}`;
        const res = await fetch(url);

        if (res.ok) {
          const data = await res.json();
          setReviews(data.reviews || []);
          if (data.distribution) {
            setDistribution(data.distribution);
          }
          if (Array.isArray(data.customerPhotos)) {
            setCustomerPhotos(data.customerPhotos);
          }
          if (data.aspectScores) {
            const list = Array.isArray(data.aspectScores)
              ? data.aspectScores
              : Object.values(data.aspectScores);
            setAspectScores(list as AspectScore[]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [productId]
  );

  useEffect(() => {
    fetchAuth();
  }, [fetchAuth]);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchReviews(filters);
    }, 200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [fetchReviews, filters]);

  const handleSelectRating = (star: number | null) => {
    setFilters((prev) => ({
      ...prev,
      rating: star,
    }));
  };

  const handleReviewSubmitted = (newReview: Review) => {
    setReviews((prev) => [newReview, ...prev]);
    if (newReview.images && newReview.images.length > 0) {
      setCustomerPhotos((prev) => [...newReview.images!, ...prev]);
    }
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
    fetchReviews(filters);
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

      {customerPhotos.length > 0 && (
        <CustomerPhotosGallery photos={customerPhotos} reviews={reviews} />
      )}

      {distribution.total > 0 && (
        <RatingSummary
          distribution={distribution}
          selectedRating={filters.rating}
          onSelectRating={handleSelectRating}
          aspectScores={aspectScores.length > 0 ? aspectScores : distribution.aspectScores}
        />
      )}

      {showForm && (
        <ReviewForm
          productId={productId}
          productSlug={productSlug}
          category={category}
          isLoggedIn={isLoggedIn}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}

      <ReviewFilterBar
        filters={filters}
        onChange={setFilters}
        totalCount={reviews.length}
      />

      <ReviewList reviews={reviews} productId={productId} />
    </section>
  );
}
