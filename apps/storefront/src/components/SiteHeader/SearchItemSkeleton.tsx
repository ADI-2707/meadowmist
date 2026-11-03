import React from 'react';
import { Skeleton } from '@meadowmist/shared';
import styles from './SearchItemSkeleton.module.css';

export default function SearchItemSkeleton() {
  return (
    <div className={styles.item} aria-hidden="true" data-testid="search-item-skeleton">
      <Skeleton className={styles.thumb} variant="rounded" />
      <div className={styles.info}>
        <Skeleton className={styles.linePrimary} variant="text" />
        <Skeleton className={styles.lineSecondary} variant="text" />
      </div>
    </div>
  );
}
