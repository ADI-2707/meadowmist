import React from 'react';
import { Skeleton } from '@meadowmist/shared';
import styles from './ModalResultSkeleton.module.css';

export default function ModalResultSkeleton() {
  return (
    <div className={styles.item} aria-hidden="true" data-testid="modal-result-skeleton">
      <Skeleton className={styles.thumb} variant="rounded" />
      <div className={styles.details}>
        <Skeleton className={styles.nameLine} variant="text" />
        <Skeleton className={styles.metaLine} variant="text" />
      </div>
    </div>
  );
}
