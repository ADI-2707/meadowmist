'use client';

import React, { useState } from 'react';
import styles from './RestockAlert.module.css';

interface RestockAlertProps {
  productId: string;
  productName: string;
  variantId?: string | null;
  variantName?: string | null;
}

export default function RestockAlert({
  productId,
  productName,
  variantId,
  variantName,
}: RestockAlertProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/products/${productId}/restock-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          variantId: variantId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to join waitlist');
      } else {
        setMessage(data.message || "You're on the list! We will notify you once restocked.");
        setEmail('');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const displayName = variantName ? `${productName} (${variantName})` : productName;

  return (
    <div className={styles.card}>
      <h3 className={styles.heading}>
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        Notify Me When Restocked
      </h3>

      <p className={styles.description}>
        Leave your email below to be notified when the next small studio batch of {displayName} is complete.
      </p>

      {message ? (
        <div className={styles.successMessage}>{message}</div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your-email@example.com"
            required
            className={styles.input}
            disabled={loading}
          />
          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? 'Joining...' : 'Notify Me'}
          </button>
        </form>
      )}

      {error && <p className={styles.errorMessage}>{error}</p>}
    </div>
  );
}
