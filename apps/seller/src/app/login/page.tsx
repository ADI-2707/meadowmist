'use client';

import { useState } from 'react';
import styles from './page.module.css';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [require2FA, setRequire2FA] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const storefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: { email: string; password: string; totpCode?: string } = {
        email,
        password,
      };

      if (require2FA) {
        payload.totpCode = totpCode;
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || `Login failed (${res.status}). Please check credentials or server logs.`);
        setLoading(false);
        return;
      }

      if (data?.require2FA) {
        setRequire2FA(true);
        setLoading(false);
        return;
      }

      window.location.href = '/';
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Store Management</p>
          <h1 className={styles.title}>Seller Portal</h1>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="admin-email">
              Seller Email
            </label>
            <input
              id="admin-email"
              type="email"
              required
              disabled={require2FA}
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@meadowmist.in"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="admin-password">
              Security Password
            </label>
            <input
              id="admin-password"
              type="password"
              required
              disabled={require2FA}
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {require2FA && (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="admin-totp">
                Two-Factor Security Code
              </label>
              <input
                id="admin-totp"
                type="text"
                required
                maxLength={6}
                autoFocus
                className={styles.input}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={styles.submitBtn}
          >
            {loading
              ? 'Authenticating...'
              : require2FA
              ? 'Verify Security Code'
              : 'Sign In to Seller Portal'}
          </button>
        </form>

        <a href={storefrontUrl} className={styles.backLink}>
          ← Return to Meadow Mist Storefront
        </a>
      </div>
    </div>
  );
}
