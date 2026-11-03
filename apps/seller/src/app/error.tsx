'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function SellerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Seller portal error:', error);
  }, [error]);

  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
      <h2 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>Failed to load seller panel</h2>
      <p style={{ maxWidth: '420px', marginBottom: '1.5rem', color: '#666' }}>
        An unexpected error occurred while rendering this view.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          type="button"
          onClick={() => reset()}
          style={{ padding: '0.6rem 1.2rem', backgroundColor: '#33422A', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Try Again
        </button>
        <Link
          href="/"
          style={{ padding: '0.6rem 1.2rem', backgroundColor: '#eaeaea', color: '#333', textDecoration: 'none', borderRadius: '4px' }}
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
