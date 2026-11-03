import React from 'react';
import { Skeleton } from '@meadowmist/shared';
import styles from './ReviewItemSkeleton.module.css';

export default function ReviewItemSkeleton() {
  return (
    <article className={styles.card} aria-hidden="true" data-testid="review-item-skeleton">
      <div className={styles.header}>
        <Skeleton className={styles.avatar} variant="circular" />
        <div className={styles.authorMeta}>
          <Skeleton className={styles.authorName} variant="text" />
          <Skeleton className={styles.ratingRow} variant="text" />
        </div>
      </div>
      <Skeleton className={styles.commentLine1} variant="text" />
      <Skeleton className={styles.commentLine2} variant="text" />
    </article>
  );
}
