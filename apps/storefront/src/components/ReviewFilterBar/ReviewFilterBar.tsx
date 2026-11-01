'use client';

import React from 'react';
import styles from './ReviewFilterBar.module.css';

export type ReviewSortOption = 'recent' | 'highest' | 'lowest' | 'helpful';

export interface ReviewFilters {
  sort: ReviewSortOption;
  rating: number | null;
  verified: boolean;
  withPhotos: boolean;
  search: string;
}

export interface ReviewFilterBarProps {
  filters: ReviewFilters;
  onChange: (filters: ReviewFilters) => void;
  totalCount: number;
}

export default function ReviewFilterBar({
  filters,
  onChange,
  totalCount,
}: ReviewFilterBarProps) {
  const hasActiveFilters =
    filters.rating !== null ||
    filters.verified ||
    filters.withPhotos ||
    filters.search.trim().length > 0;

  const handleClearAll = () => {
    onChange({
      sort: filters.sort,
      rating: null,
      verified: false,
      withPhotos: false,
      search: '',
    });
  };

  const handleStarClick = (star: number) => {
    onChange({
      ...filters,
      rating: filters.rating === star ? null : star,
    });
  };

  const handleAllClick = () => {
    onChange({
      ...filters,
      rating: null,
      verified: false,
      withPhotos: false,
    });
  };

  return (
    <div className={styles.toolbarContainer} role="region" aria-label="Review filters">
      <div className={styles.topControls}>
        <div className={styles.searchWrapper}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search customer reviews..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            aria-label="Search reviews"
          />
          {filters.search && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => onChange({ ...filters, search: '' })}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className={styles.sortWrapper}>
          <label htmlFor="review-sort-select" className={styles.sortLabel}>
            Sort by:
          </label>
          <select
            id="review-sort-select"
            className={styles.sortSelect}
            value={filters.sort}
            onChange={(e) =>
              onChange({
                ...filters,
                sort: e.target.value as ReviewSortOption,
              })
            }
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
        </div>
      </div>

      <div className={styles.chipsRow} role="toolbar" aria-label="Rating filter chips">
        <button
          type="button"
          className={`${styles.chipBtn} ${
            filters.rating === null && !filters.verified && !filters.withPhotos
              ? styles.activeChip
              : ''
          }`}
          onClick={handleAllClick}
        >
          All
        </button>

        {[5, 4, 3, 2, 1].map((star) => {
          const isSelected = filters.rating === star;
          return (
            <button
              key={star}
              type="button"
              className={`${styles.chipBtn} ${isSelected ? styles.activeChip : ''}`}
              onClick={() => handleStarClick(star)}
              aria-pressed={isSelected}
            >
              {star}★
            </button>
          );
        })}

        <button
          type="button"
          className={`${styles.chipBtn} ${filters.verified ? styles.activeChip : ''}`}
          onClick={() => onChange({ ...filters, verified: !filters.verified })}
          aria-pressed={filters.verified}
        >
          <svg className={styles.chipIcon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          Verified Purchase
        </button>

        <button
          type="button"
          className={`${styles.chipBtn} ${filters.withPhotos ? styles.activeChip : ''}`}
          onClick={() => onChange({ ...filters, withPhotos: !filters.withPhotos })}
          aria-pressed={filters.withPhotos}
        >
          <svg className={styles.chipIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          With Photos
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            className={styles.clearAllBtn}
            onClick={handleClearAll}
          >
            Clear all filters
          </button>
        )}
      </div>

      <div className={styles.summaryStatus}>
        <span>
          Showing {totalCount} {totalCount === 1 ? 'review' : 'reviews'}
        </span>
      </div>
    </div>
  );
}

