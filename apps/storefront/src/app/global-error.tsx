'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Fatal global error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'sans-serif', backgroundColor: '#F7F2E7', color: '#33422A' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Something went wrong</h1>
          <p style={{ maxWidth: '480px', marginBottom: '2rem', lineHeight: '1.6' }}>
            A critical interruption occurred. Please try reloading the page or return to the storefront.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{ padding: '0.75rem 1.5rem', backgroundColor: '#33422A', color: '#F7F2E7', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Reload Page
            </button>
            <Link
              href="/"
              style={{ padding: '0.75rem 1.5rem', backgroundColor: '#B4903F', color: '#FFFFFF', textDecoration: 'none', borderRadius: '4px' }}
            >
              Return Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
