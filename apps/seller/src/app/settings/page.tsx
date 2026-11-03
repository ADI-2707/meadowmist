'use client';

import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { toast, Skeleton } from '@meadowmist/shared';
import styles from './settings.module.css';

function SettingsSkeleton() {
  return (
    <div className={styles.container}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Skeleton width="140px" height="24px" style={{ marginBottom: '8px' }} />
        <Skeleton width="280px" height="16px" />
      </div>

      <div className={styles.formCard}>
        <div className={styles.formSection}>
          <Skeleton width="180px" height="22px" style={{ marginBottom: '16px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <Skeleton width="120px" height="14px" style={{ marginBottom: '6px' }} />
              <Skeleton width="100%" height="42px" borderRadius="var(--radius-sm)" />
            </div>
            <div>
              <Skeleton width="160px" height="14px" style={{ marginBottom: '6px' }} />
              <Skeleton width="100%" height="42px" borderRadius="var(--radius-sm)" />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <Skeleton width="180px" height="22px" style={{ marginBottom: '16px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <Skeleton width="140px" height="14px" style={{ marginBottom: '6px' }} />
              <Skeleton width="100%" height="42px" borderRadius="var(--radius-sm)" />
            </div>
          </div>
        </div>

        <Skeleton width="140px" height="42px" borderRadius="var(--radius-sm)" style={{ marginTop: '16px' }} />
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [storeName, setStoreName] = useState('Meadow Mist');
  const [contactEmail, setContactEmail] = useState('hello@meadowmist.in');
  const [contactPhone, setContactPhone] = useState('+91 98765 43210');
  const [shippingFlatRate, setShippingFlatRate] = useState('99');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('1499');
  const [codEnabled, setCodEnabled] = useState(true);
  const [codFee, setCodFee] = useState('0');
  const [aboutHeadline, setAboutHeadline] = useState('');
  const [aboutStory, setAboutStory] = useState('');
  const [aboutArtisanNote, setAboutArtisanNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          const s = data.settings;
          if (s) {
            setStoreName(s.storeName || 'Meadow Mist');
            setContactEmail(s.contactEmail || 'hello@meadowmist.in');
            setContactPhone(s.contactPhone || '+91 98765 43210');
            setShippingFlatRate(String(s.shippingFlatRate ?? 99));
            setFreeShippingThreshold(String(s.freeShippingThreshold ?? 1499));
            setCodEnabled(s.codEnabled ?? true);
            setCodFee(String(s.codFee ?? 0));
            setAboutHeadline(s.aboutHeadline || '');
            setAboutStory(s.aboutStory || '');
            setAboutArtisanNote(s.aboutArtisanNote || '');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName,
          contactEmail,
          contactPhone,
          shippingFlatRate: Number(shippingFlatRate),
          freeShippingThreshold: Number(freeShippingThreshold),
          codEnabled,
          codFee: Number(codFee),
          aboutHeadline,
          aboutStory,
          aboutArtisanNote,
        }),
      });

      if (res.ok) {
        toast.success('Store and shipping settings updated successfully');
      } else {
        toast.error('Failed to update settings');
      }
    } catch {
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className={styles.container}>
      <PageHeader
        eyebrow="Configuration"
        title="Store & Shipping Settings"
        subtitle="Manage merchant contact details, courier flat rates, free shipping rules, and payment gateways."
      />

      <form onSubmit={handleSave} className={styles.formCard}>
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>1. Store Profile & Brand</h2>
          <div className={styles.field}>
            <label className={styles.label}>Brand Name</label>
            <input
              className={styles.input}
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Support & Concierge Email</label>
            <input
              type="email"
              className={styles.input}
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Support Phone / WhatsApp</label>
            <input
              className={styles.input}
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>2. Logistics & Delivery Surcharges</h2>

          <div className={styles.field}>
            <label className={styles.label}>Standard Shipping Charge (₹)</label>
            <input
              type="number"
              className={styles.input}
              value={shippingFlatRate}
              onChange={(e) => setShippingFlatRate(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Free Delivery Order Threshold (₹)</label>
            <input
              type="number"
              className={styles.input}
              value={freeShippingThreshold}
              onChange={(e) => setFreeShippingThreshold(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>3. Payment Modes</h2>

          <div className={styles.checkboxField}>
            <input
              type="checkbox"
              id="codEnabled"
              checked={codEnabled}
              onChange={(e) => setCodEnabled(e.target.checked)}
            />
            <label htmlFor="codEnabled" style={{ cursor: 'pointer', fontSize: '0.88rem' }}>
              Accept Cash on Delivery (COD)
            </label>
          </div>

          {codEnabled && (
            <div className={styles.field}>
              <label className={styles.label}>Extra COD Handling Convenience Fee (₹, 0 for Free COD)</label>
              <input
                type="number"
                className={styles.input}
                value={codFee}
                onChange={(e) => setCodFee(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>4. Brand Story & Artisan Narrative</h2>

          <div className={styles.field}>
            <label className={styles.label}>Homepage & Story Headline</label>
            <input
              className={styles.input}
              value={aboutHeadline}
              onChange={(e) => setAboutHeadline(e.target.value)}
              placeholder="e.g. Things made by hand, grown like something living."
            />
            <p className={styles.helpText}>
              Featured on the storefront homepage story section and the /our-story page hero banner.
            </p>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Artisan Brand Story</label>
            <textarea
              className={styles.textarea}
              rows={4}
              value={aboutStory}
              onChange={(e) => setAboutStory(e.target.value)}
              placeholder="Describe the origins, small-batch philosophy, and studio process..."
            />
            <p className={styles.helpText}>
              Displayed across the homepage story block and the primary &ldquo;How it started&rdquo; chapter on /our-story.
            </p>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Artisan Note / Studio Footnote</label>
            <textarea
              className={styles.textarea}
              rows={3}
              value={aboutArtisanNote}
              onChange={(e) => setAboutArtisanNote(e.target.value)}
              placeholder="e.g. Variations in glaze and petal folds are intentional features of handmade work..."
            />
            <p className={styles.helpText}>
              Appears as the artisan craftsmanship disclaimer on /our-story when provided.
            </p>
          </div>
        </div>

        <button type="submit" disabled={saving} className={styles.submitBtn}>
          <Save size={15} />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </form>
    </div>
  );
}
