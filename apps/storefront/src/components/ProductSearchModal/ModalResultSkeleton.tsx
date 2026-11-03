import React from 'react';
import styles from './ModalResultSkeleton.module.css';

export default function ModalResultSkeleton() {
  return (
    <div className={styles.item} aria-hidden="true" data-testid="modal-result-skeleton">
      <div className={`${styles.thumb} ${styles.shimmer}`} />
      <div className={styles.details}>
        <div className={`${styles.nameLine} ${styles.shimmer}`} />
        <div className={`${styles.metaLine} ${styles.shimmer}`} />
      </div>
    </div>
  );
}
