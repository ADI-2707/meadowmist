import React from 'react';
import styles from './ProductCardSkeleton.module.css';

export default function ProductCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden="true" data-testid="product-card-skeleton">
      <div className={`${styles.imageWrapper} ${styles.shimmer}`} />
      <div className={styles.body}>
        <div className={`${styles.badgeRow} ${styles.shimmer}`} />
        <div className={`${styles.titleLine} ${styles.shimmer}`} />
        <div className={`${styles.subtitleLine} ${styles.shimmer}`} />
        <div className={styles.footerRow}>
          <div className={`${styles.priceLine} ${styles.shimmer}`} />
          <div className={`${styles.buttonBox} ${styles.shimmer}`} />
        </div>
      </div>
    </div>
  );
}

