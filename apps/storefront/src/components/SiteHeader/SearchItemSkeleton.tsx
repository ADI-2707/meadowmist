import React from 'react';
import styles from './SearchItemSkeleton.module.css';

export default function SearchItemSkeleton() {
  return (
    <div className={styles.item} aria-hidden="true" data-testid="search-item-skeleton">
      <div className={`${styles.thumb} ${styles.shimmer}`} />
      <div className={styles.info}>
        <div className={`${styles.linePrimary} ${styles.shimmer}`} />
        <div className={`${styles.lineSecondary} ${styles.shimmer}`} />
      </div>
    </div>
  );
}
