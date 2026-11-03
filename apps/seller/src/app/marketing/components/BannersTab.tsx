'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from '@meadowmist/shared';
import styles from '../marketing.module.css';

interface BannerItem {
  id: string;
  title: string;
  subtitle?: string | null;
  badgeText?: string | null;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
}

export function BannersTab() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [newBanner, setNewBanner] = useState({
    title: '',
    subtitle: '',
    badgeText: '',
    imageUrl: '',
    linkUrl: '/candles',
  });
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/content/banners');
      if (res.ok) {
        const d = await res.json();
        setBanners(d.banners || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid format. Please upload JPG, PNG, WebP, or AVIF.');
      if (e.target) e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is 5MB.`);
      if (e.target) e.target.value = '';
      return;
    }

    setUploadingBanner(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setNewBanner((prev) => ({ ...prev, imageUrl: data.url }));
      } else {
        toast.error(data.error || 'Failed to upload banner photo');
      }
    } catch {
      toast.error('Error uploading banner');
    } finally {
      setUploadingBanner(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBanner.title || !newBanner.imageUrl) {
      toast.error('Banner title and image are required');
      return;
    }

    try {
      const res = await fetch('/api/content/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBanner),
      });

      if (res.ok) {
        setNewBanner({
          title: '',
          subtitle: '',
          badgeText: '',
          imageUrl: '',
          linkUrl: '/candles',
        });
        fetchBanners();
      } else {
        toast.error('Failed to save banner');
      }
    } catch {
      toast.error('Error adding banner');
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      const res = await fetch(`/api/content/banners?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchBanners();
    } catch {
      toast.error('Error deleting banner');
    }
  };

  return (
    <div className={styles.splitGrid}>
      <div>
        <h3 className={styles.sectionTitle}>Active Showcase & Hero Banners</h3>
        {loading ? (
          <div className={styles.emptyState}>Loading banners...</div>
        ) : banners.length === 0 ? (
          <div className={styles.emptyState}>
            No banners defined. Add a banner to showcase on the storefront.
          </div>
        ) : (
          <div className={styles.bannerList}>
            {banners.map((b) => (
              <div key={b.id} className={styles.bannerCard}>
                <div className={styles.bannerImgWrap}>
                  <Image
                    src={b.imageUrl}
                    alt={b.title}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className={styles.bannerBody}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div>
                      {b.badgeText && (
                        <span className={styles.bannerBadge}>{b.badgeText}</span>
                      )}
                      <h4 className={styles.bannerTitle}>{b.title}</h4>
                      {b.subtitle && <p className={styles.bannerSub}>{b.subtitle}</p>}
                      <span className={styles.bannerLink}>Links to: {b.linkUrl}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteBanner(b.id)}
                      className={styles.deleteBtn}
                      title="Delete Banner"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.formCard}>
        <h3 className={styles.sectionTitle}>Add New Showcase Banner</h3>
        <form onSubmit={handleAddBanner}>
          <div className={styles.field}>
            <label className={styles.label}>Headline Title</label>
            <input
              type="text"
              placeholder="e.g. Winter Solstice Wax Collection"
              value={newBanner.title}
              onChange={(e) =>
                setNewBanner((prev) => ({ ...prev, title: e.target.value }))
              }
              className={styles.input}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Subtitle / Tagline</label>
            <input
              type="text"
              placeholder="e.g. Hand-poured floral soy pillars with organic scents"
              value={newBanner.subtitle}
              onChange={(e) =>
                setNewBanner((prev) => ({ ...prev, subtitle: e.target.value }))
              }
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Badge Pill Text</label>
            <input
              type="text"
              placeholder="e.g. Limited Artisan Run"
              value={newBanner.badgeText}
              onChange={(e) =>
                setNewBanner((prev) => ({ ...prev, badgeText: e.target.value }))
              }
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Destination Route</label>
            <input
              type="text"
              value={newBanner.linkUrl}
              onChange={(e) =>
                setNewBanner((prev) => ({ ...prev, linkUrl: e.target.value }))
              }
              className={styles.input}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Banner Image</label>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '6px' }}>
              Recommended: 1920 &times; 600px &bull; JPG, PNG, WebP up to 5MB
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={handleBannerUpload}
              className={styles.input}
            />
            {uploadingBanner && (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-gold)' }}>
                Uploading banner photo...
              </p>
            )}
            {newBanner.imageUrl && (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  marginTop: '8px',
                }}
              >
                <Image
                  src={newBanner.imageUrl}
                  alt="Preview"
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={uploadingBanner}
            className={styles.submitBtn}
          >
            <Plus size={16} />
            <span>Publish Banner</span>
          </button>
        </form>
      </div>
    </div>
  );
}

