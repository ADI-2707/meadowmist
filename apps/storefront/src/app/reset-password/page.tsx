'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Password reset token is missing. Please request a new link.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to reset password');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Account Security</p>
          <h1 className={styles.title}>Reset Password</h1>
          <p className={styles.subtitle}>
            Create a new password for your Meadow Mist collector account.
          </p>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        {success ? (
          <div>
            <div className={styles.successBanner}>
              Your password has been reset successfully! Redirecting you to sign in...
            </div>
            <div className={styles.footer}>
              <Link href="/login" className={styles.link}>
                Sign in now
              </Link>
            </div>
          </div>
        ) : !token ? (
          <div>
            <div className={styles.errorBanner}>
              Invalid or missing password reset link. Please request a new one.
            </div>
            <div className={styles.footer}>
              <Link href="/forgot-password" className={styles.link}>
                Request new link
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="new-password">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                required
                minLength={6}
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="confirm-password">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                minLength={6}
                className={styles.input}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className={styles.submitBtn}
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className={styles.page} />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
