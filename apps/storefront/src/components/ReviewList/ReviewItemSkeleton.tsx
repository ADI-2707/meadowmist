import React from 'react';
import styles from './ReviewItemSkeleton.module.css';

export default function ReviewItemSkeleton() {
  return (
    <article className={styles.card} aria-hidden="true" data-testid="review-item-skeleton">
      <div className={styles.header}>
        <div className={`${styles.avatar} ${styles.shimmer}`} />
        <div className={styles.authorMeta}>
          <div className={`${styles.authorName} ${styles.shimmer}`} />
          <div className={`${styles.ratingRow} ${styles.shimmer}`} />
        </div>
      </div>
      <div className={`${styles.commentLine1} ${styles.shimmer}`} />
      <div className={`${styles.commentLine2} ${styles.shimmer}`} />
    </article>
  );
}

