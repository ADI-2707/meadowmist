'use client';

import React from 'react';
import StarRating from '@/components/StarRating/StarRating';
import type { RatingDistribution, AspectScore } from '@meadowmist/shared';
import styles from './RatingSummary.module.css';

interface RatingSummaryProps {
  distribution: RatingDistribution;
  selectedRating?: number | null;
  onSelectRating?: (rating: number | null) => void;
  aspectScores?: AspectScore[] | Record<string, AspectScore> | null;
}

export default function RatingSummary({
  distribution,
  selectedRating,
  onSelectRating,
  aspectScores,
}: RatingSummaryProps) {
  const { average, total, counts } = distribution;

  const aspectEntries: AspectScore[] = Array.isArray(aspectScores)
    ? aspectScores
    : aspectScores
    ? Object.values(aspectScores)
    : distribution.aspectScores || [];

  return (
    <div className={styles.summaryContainer}>
      <div className={styles.summaryBox}>
        <div className={styles.scoreColumn}>
          <span className={styles.bigScore}>{average.toFixed(1)}</span>
          <StarRating rating={average} />
          <span className={styles.totalLabel}>
            {total} {total === 1 ? 'review' : 'reviews'}
          </span>
          {selectedRating && onSelectRating && (
            <button
              type="button"
              className={styles.clearFilterBtn}
              onClick={() => onSelectRating(null)}
            >
              Clear {selectedRating}★ filter
            </button>
          )}
        </div>

        <div className={styles.barsColumn} role="group" aria-label="Rating filter breakdown">
          {[5, 4, 3, 2, 1].map((star) => {
            const starKey = star as keyof typeof counts;
            const count = counts[starKey] || 0;
            const percentage = total > 0 ? (count / total) * 100 : 0;
            const isSelected = selectedRating === star;

            return (
              <button
                key={star}
                type="button"
                className={`${styles.barRowBtn} ${isSelected ? styles.activeRow : ''}`}
                onClick={() => onSelectRating?.(isSelected ? null : star)}
                aria-pressed={isSelected}
                aria-label={`Filter by ${star} star reviews (${count})`}
              >
                <span className={styles.starLabel}>{star} stars</span>
                <div className={styles.barTrack}>
                  <div
                    className={`${styles.barFill} ${isSelected ? styles.barFillActive : ''}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className={styles.percentageLabel}>{Math.round(percentage)}%</span>
                <span className={styles.countLabel}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {aspectEntries.length > 0 && (
        <div className={styles.aspectSection}>
          <h4 className={styles.aspectTitle}>Rated by Feature</h4>
          <div className={styles.aspectGrid}>
            {aspectEntries.map((aspect) => {
              const aspectPercent = Math.min(100, Math.max(0, (aspect.average / 5) * 100));
              return (
                <div key={aspect.key} className={styles.aspectCard}>
                  <div className={styles.aspectHeader}>
                    <span className={styles.aspectName}>{aspect.name}</span>
                    <span className={styles.aspectScoreValue}>{aspect.average.toFixed(1)}</span>
                  </div>
                  <div className={styles.aspectTrack}>
                    <div
                      className={styles.aspectFill}
                      style={{ width: `${aspectPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
