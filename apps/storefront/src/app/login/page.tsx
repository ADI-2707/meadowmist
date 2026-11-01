'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import styles from './page.module.css';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/account';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const syncCart = async () => {
    try {
      const items = useCartStore.getState().items;
      if (items.length > 0) {
        await fetch('/api/cart/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || `Failed to sign in (${res.status})`);
        setLoading(false);
        return;
      }

      await syncCart();
      router.push(redirect);
      router.refresh();
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Welcome Back</p>
          <h1 className={styles.title}>Sign In</h1>
          <p className={styles.subtitle}>
            Access your orders, saved addresses, and wishlist.
          </p>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label className={styles.label} htmlFor="password">
                Password
              </label>
              <Link href="/forgot-password" className={styles.forgotLink}>
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              required
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.submitBtn}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className={styles.footer}>
          Don&apos;t have an account?{' '}
          <Link
            href={`/signup${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className={styles.link}
          >
            Create one now
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className={styles.page} />}>
      <LoginForm />
    </Suspense>
  );
}
