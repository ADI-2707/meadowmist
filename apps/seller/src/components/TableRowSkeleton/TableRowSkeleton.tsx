import React from 'react';
import styles from './TableRowSkeleton.module.css';

interface TableRowSkeletonProps {
  columns?: number;
  rows?: number;
}

export function TableRowSkeleton({ columns = 6, rows = 5 }: TableRowSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className={styles.row} aria-hidden="true" data-testid="table-row-skeleton">
          {Array.from({ length: columns }).map((_, cIdx) => (
            <td key={cIdx} className={styles.cell}>
              <div
                className={`${styles.pill} ${styles.shimmer}`}
                style={{
                  width: cIdx === 0 ? '70%' : cIdx === 1 ? '85%' : '50%',
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
