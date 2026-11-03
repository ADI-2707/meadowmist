'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Sparkles, Loader2, Flame, ShieldAlert, UploadCloud, Trash2 } from 'lucide-react';
import styles from './OrderReturnModal.module.css';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
}

interface OrderReturnModalProps {
  isOpen: boolean;
  orderNumber: string;
  items: OrderItem[];
  onClose: () => void;
  onConfirm: (data: {
    reason: string;
    resolutionPreference: 'REFUND' | 'REPLACEMENT';
    notes: string;
    selectedItems: string[];
    images?: string[];
  }) => Promise<void>;
}

const RETURN_REASONS = [
  'Damaged during transit / broken ceramic piece',
  'Defective wick / improper burn / wax leak',
  'Received wrong fragrance, color, or variant',
  'Product differs significantly from photographs/description',
  'Other craftsmanship concern',
];

export function OrderReturnModal({
  isOpen,
  orderNumber,
  items,
  onClose,
  onConfirm,
}: OrderReturnModalProps) {
  const [selectedReason, setSelectedReason] = useState(RETURN_REASONS[0]);
  const [resolutionPreference, setResolutionPreference] = useState<'REFUND' | 'REPLACEMENT'>('REFUND');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(() => items.map((i) => i.id));
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const toggleItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (images.length >= 3) {
      setUploadError('Maximum 3 photos allowed');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const file = files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
      if (!validTypes.includes(file.type)) {
        setUploadError('Invalid format. Please upload JPG, PNG, or WebP.');
        if (e.target) e.target.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(`Photo exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
        if (e.target) e.target.value = '';
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/reviews/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || 'Failed to upload photo');
      } else if (data.url) {
        setImages((prev) => [...prev, data.url].slice(0, 3));
      }
    } catch {
      setUploadError('Network error uploading photo');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItemIds.length === 0) {
      alert('Please select at least one item to return');
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm({
        reason: selectedReason,
        resolutionPreference,
        notes,
        selectedItems: selectedItemIds,
        images,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={submitting ? undefined : onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <span className={styles.eyebrow}>Artisan Guarantee</span>
            <h2 className={styles.title}>Request Return #{orderNumber}</h2>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className={styles.closeBtn}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.body}>
            <div className={styles.guaranteeBox}>
              <Sparkles size={18} />
              <div>
                <strong>7-Day Handcrafted Guarantee:</strong> If any ceramic piece or candle arrives broken, defective, or not as expected, we will gladly arrange a swift replacement or full refund.
              </div>
            </div>

            <div className={styles.policyNotice}>
              <Flame size={16} className={styles.candleIcon} />
              <div>
                <strong>Candle Hygiene & Safety Policy:</strong> Used or burned candles cannot be returned for buyer&apos;s remorse (once the wick is burned, the piece cannot be resold). Unused, unlit candles in original packaging can be returned within 7 to 14 days of delivery.
              </div>
            </div>

            <div className={styles.damageNotice}>
              <ShieldAlert size={16} className={styles.damageIcon} />
              <div>
                <strong>Transit Breakage Protocol:</strong> Breakage must be reported within 48 hours of delivery with a clear photo of the cracked piece and the shipping label. Shipping sharp shards of broken ceramic back to the artisan wastes courier fees and creates a safety hazard. Once your photo is verified, we immediately dispatch a fresh studio replacement or issue a full refund.
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Select Item(s) to Return</label>
              <div className={styles.itemsList}>
                {items.map((item) => (
                  <label key={item.id} className={styles.itemCheckboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedItemIds.includes(item.id)}
                      onChange={() => toggleItem(item.id)}
                      disabled={submitting}
                    />
                    <span>
                      {item.productName} (Qty: {item.quantity})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="return-reason" className={styles.label}>
                Reason for Return
              </label>
              <select
                id="return-reason"
                className={styles.select}
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                disabled={submitting}
              >
                {RETURN_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Preferred Resolution</label>
              <div className={styles.preferenceGrid}>
                <label
                  className={`${styles.preferenceCard} ${resolutionPreference === 'REFUND' ? styles.preferenceCardActive : ''}`}
                >
                  <input
                    type="radio"
                    name="preference"
                    checked={resolutionPreference === 'REFUND'}
                    onChange={() => setResolutionPreference('REFUND')}
                  />
                  <div>
                    <div className={styles.preferenceTitle}>Original Refund</div>
                    <div className={styles.preferenceDesc}>
                      Amount credited back to original payment source
                    </div>
                  </div>
                </label>

                <label
                  className={`${styles.preferenceCard} ${resolutionPreference === 'REPLACEMENT' ? styles.preferenceCardActive : ''}`}
                >
                  <input
                    type="radio"
                    name="preference"
                    checked={resolutionPreference === 'REPLACEMENT'}
                    onChange={() => setResolutionPreference('REPLACEMENT')}
                  />
                  <div>
                    <div className={styles.preferenceTitle}>Studio Replacement</div>
                    <div className={styles.preferenceDesc}>
                      We hand-pack and dispatch a fresh replacement piece
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Damage or Defect Photographs (Max 3 photos)
              </label>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '8px' }}>
                Clear photos of the defect or packaging &bull; JPG, PNG, WebP up to 5MB each
              </span>
              <div className={styles.uploadArea}>
                {images.map((imgUrl, index) => (
                  <div key={imgUrl} className={styles.thumbnailWrapper}>
                    <Image src={imgUrl} alt={`Damage photo ${index + 1}`} className={styles.thumbnail} width={64} height={64} />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className={styles.removeImageBtn}
                      aria-label="Remove photo"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                {images.length < 3 && (
                  <label className={styles.uploadBtn}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={handleFileUpload}
                      disabled={uploading || submitting}
                      className={styles.hiddenFileInput}
                    />
                    {uploading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <UploadCloud size={16} />
                    )}
                    <span>{uploading ? 'Uploading...' : 'Upload Photo'}</span>
                  </label>
                )}
              </div>
              {uploadError && <div className={styles.uploadError}>{uploadError}</div>}
            </div>

            <div className={styles.field}>
              <label htmlFor="return-notes" className={styles.label}>
                Craftsmanship Details / Issue Notes
              </label>
              <textarea
                id="return-notes"
                className={styles.textarea}
                placeholder="Describe any damage, hairline cracks, or fragrance concerns..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={submitting}
                maxLength={400}
              />
            </div>
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={styles.secondaryBtn}
            >
              Keep Items
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={styles.submitBtn}
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Submitting Request...
                </>
              ) : (
                'Submit Return Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
