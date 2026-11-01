'use client';

import React, { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import StarRating from '@/components/StarRating/StarRating';
import type { Review } from '@meadowmist/shared';
import styles from './ReviewForm.module.css';

interface ReviewFormProps {
  productId: string;
  productSlug?: string;
  category?: string;
  isLoggedIn: boolean;
  onReviewSubmitted: (review: Review) => void;
}

interface AspectConfig {
  key: string;
  name: string;
}

const CANDLE_ASPECTS: AspectConfig[] = [
  { key: 'scentThrow', name: 'Scent Throw' },
  { key: 'burnLongevity', name: 'Burn Longevity' },
  { key: 'packaging', name: 'Packaging Quality' },
];

const CERAMIC_ASPECTS: AspectConfig[] = [
  { key: 'craftsmanship', name: 'Craftsmanship' },
  { key: 'glazeFinish', name: 'Glaze Finish' },
  { key: 'durability', name: 'Durability' },
];

export default function ReviewForm({
  productId,
  productSlug,
  category,
  isLoggedIn,
  onReviewSubmitted,
}: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspects = useMemo<AspectConfig[]>(() => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('ceramic') || cat.includes('pottery') || cat.includes('dish') || cat.includes('mug')) {
      return CERAMIC_ASPECTS;
    }
    return CANDLE_ASPECTS;
  }, [category]);

  const [aspectRatings, setAspectRatings] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    aspects.forEach((a) => {
      initial[a.key] = 5;
    });
    return initial;
  });

  const handleAspectChange = (key: string, val: number) => {
    setAspectRatings((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 3) {
      setError('You can upload a maximum of 3 customer photos.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploadingPhotos(true);
    setError(null);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/reviews/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to upload image');
        }
        return data.url as string;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...uploadedUrls]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error uploading photos');
    } finally {
      setUploadingPhotos(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  if (!isLoggedIn) {
    const redirectTarget = productSlug ? `/product/${productSlug}` : `/product/${productId}`;
    return (
      <div className={styles.loginPrompt}>
        <span>Have you experienced this piece? </span>
        <Link href={`/login?redirect=${redirectTarget}`} className={styles.loginLink}>
          Sign in to leave a review
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || comment.trim().length < 5) {
      setError('Please write at least 5 characters in your review.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          title: title.trim() || null,
          comment: comment.trim(),
          images,
          aspectRatings,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setSuccess(true);
      setTitle('');
      setComment('');
      setImages([]);
      setRating(5);
      onReviewSubmitted(data.review);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error submitting review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.formContainer}>
      <h3 className={styles.title}>Leave an Artisan Review</h3>

      <div className={styles.ratingSelectGroup}>
        <span className={styles.label}>Overall Rating</span>
        <StarRating
          rating={rating}
          size="large"
          interactive
          onRatingChange={setRating}
        />
      </div>

      <div className={styles.aspectSection}>
        <h4 className={styles.aspectTitle}>Rate Product Features</h4>
        <div className={styles.aspectGrid}>
          {aspects.map((aspect) => (
            <div key={aspect.key} className={styles.aspectRow}>
              <span className={styles.aspectLabel}>{aspect.name}</span>
              <div className={styles.aspectRatingControl}>
                <StarRating
                  rating={aspectRatings[aspect.key] ?? 5}
                  interactive
                  onRatingChange={(val) => handleAspectChange(aspect.key, val)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="review-title" className={styles.label}>
          Headline (Optional)
        </label>
        <input
          id="review-title"
          type="text"
          className={styles.input}
          placeholder="e.g. Beautiful scent throw, burns cleanly"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="review-comment" className={styles.label}>
          Your Thoughts & Experience *
        </label>
        <textarea
          id="review-comment"
          required
          className={styles.textarea}
          placeholder="Share your thoughts on the texture, fragrance, burn time, or craftsmanship..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
        />
      </div>

      <div className={styles.photoUploadSection}>
        <span className={styles.label}>Customer Photos (Max 3)</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className={styles.hiddenFileInput}
          onChange={handleFileSelect}
          id="review-photo-input"
        />
        {images.length < 3 && (
          <label htmlFor="review-photo-input" className={styles.uploadDropzone}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>{uploadingPhotos ? 'Uploading...' : 'Add Photos'}</span>
          </label>
        )}

        {images.length > 0 && (
          <div className={styles.photoPreviewRow}>
            {images.map((url, idx) => (
              <div key={url + idx} className={styles.previewCard}>
                <img src={url} alt={`Preview ${idx + 1}`} className={styles.previewImg} />
                <button
                  type="button"
                  className={styles.removePhotoBtn}
                  onClick={() => handleRemovePhoto(idx)}
                  aria-label={`Remove photo ${idx + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <div className={styles.errorMsg}>{error}</div>}
      {success && (
        <div className={styles.successMsg}>
          Thank you! Your review has been published.
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || uploadingPhotos}
        className={styles.submitBtn}
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}
