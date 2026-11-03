import React from 'react';
import { Skeleton } from '@meadowmist/shared';
import styles from './ProductCardSkeleton.module.css';

export default function ProductCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden="true" data-testid="product-card-skeleton">
      <Skeleton className={styles.imageWrapper} variant="rectangular" />
      <div className={styles.body}>
        <Skeleton className={styles.badgeRow} variant="rounded" />
        <Skeleton className={styles.titleLine} variant="text" />
        <Skeleton className={styles.subtitleLine} variant="text" />
        <div className={styles.footerRow}>
          <Skeleton className={styles.priceLine} variant="text" />
          <Skeleton className={styles.buttonBox} variant="circular" />
        </div>
      </div>
    </div>
  );
}
