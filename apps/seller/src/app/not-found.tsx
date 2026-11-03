import React from 'react';
import Link from 'next/link';

export default function SellerNotFound() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>404 - Page Not Found</h2>
      <p style={{ maxWidth: '420px', marginBottom: '1.5rem', color: '#666' }}>
        The requested seller management page does not exist.
      </p>
      <Link
        href="/"
        style={{ padding: '0.6rem 1.2rem', backgroundColor: '#33422A', color: '#fff', textDecoration: 'none', borderRadius: '4px' }}
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
