import React from 'react';
import { Skeleton } from '@meadowmist/shared';

export default function SellerLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', padding: 'var(--space-6)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <Skeleton width="180px" height="28px" variant="rounded" />
        <Skeleton width="320px" height="16px" variant="rounded" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              padding: 'var(--space-4)',
              background: 'var(--color-card-bg)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <Skeleton width="40%" height="14px" variant="rounded" />
            <Skeleton width="60%" height="24px" variant="rounded" />
          </div>
        ))}
      </div>

      <div
        style={{
          padding: 'var(--space-5)',
          background: 'var(--color-card-bg)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        <Skeleton width="200px" height="20px" variant="rounded" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} width="100%" height="44px" variant="rounded" />
        ))}
      </div>
    </div>
  );
}
