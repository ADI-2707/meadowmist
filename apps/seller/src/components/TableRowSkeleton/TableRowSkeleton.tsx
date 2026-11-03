import React from 'react';
import { Skeleton } from '@meadowmist/shared';
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
              <Skeleton
                className={styles.pill}
                variant="rounded"
                width={cIdx === 0 ? '70%' : cIdx === 1 ? '85%' : '50%'}
                height={16}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
