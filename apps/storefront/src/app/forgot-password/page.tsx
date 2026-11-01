'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to submit request');
        setLoading(false);
        return;
      }

      setSubmitted(true);
      if (data.resetToken) {
        setResetToken(data.resetToken);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Account Recovery</p>
          <h1 className={styles.title}>Forgot Password</h1>
          <p className={styles.subtitle}>
            Enter your email and we will prepare your password reset instructions.
          </p>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        {submitted ? (
          <div>
            <div className={styles.successBanner}>
              If an account exists with <strong>{email}</strong>, password reset instructions have been prepared.
            </div>

            {resetToken && (
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <Link
                  href={`/reset-password?token=${resetToken}`}
                  className={styles.link}
                  style={{ display: 'inline-block', padding: '8px 16px', background: '#e8f5e9', borderRadius: '4px' }}
                >
                  Continue to Reset Password Link
                </Link>
              </div>
            )}

            <div className={styles.footer}>
              <Link href="/login" className={styles.link}>
                Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="forgot-email">
                Email Address
              </label>
              <input
                id="forgot-email"
                type="email"
                required
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className={styles.submitBtn}
            >
              {loading ? 'Sending Request...' : 'Send Reset Instructions'}
            </button>

            <div className={styles.footer}>
              Remember your password?{' '}
              <Link href="/login" className={styles.link}>
                Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

