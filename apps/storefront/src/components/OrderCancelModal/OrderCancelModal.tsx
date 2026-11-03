'use client';

import React, { useState } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { Modal } from '@meadowmist/shared';
import styles from './OrderCancelModal.module.css';

interface OrderCancelModalProps {
  isOpen: boolean;
  orderNumber: string;
  paymentMethod: string;
  totalAmount: number;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

const CANCELLATION_REASONS = [
  'Placed order by mistake / duplicate order',
  'Need to modify shipping address or recipient contact',
  'Delivery timeframe is too long',
  'Found an alternative or changed mind',
  'Applied incorrect payment method or promo code',
  'Other reason',
];

export function OrderCancelModal({
  isOpen,
  orderNumber,
  paymentMethod,
  totalAmount,
  onClose,
  onConfirm,
}: OrderCancelModalProps) {
  const [selectedReason, setSelectedReason] = useState(CANCELLATION_REASONS[0]);
  const [customNotes, setCustomNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fullReason = customNotes.trim()
        ? `${selectedReason}: ${customNotes.trim()}`
        : selectedReason;
      await onConfirm(fullReason);
    } finally {
      setSubmitting(false);
    }
  };

  const isPrepaid = paymentMethod.toUpperCase() !== 'COD';

  return (
    <Modal
      isOpen={isOpen}
      onClose={submitting ? () => {} : onClose}
      hideCloseButton
      maxWidth="560px"
    >
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.eyebrow}>Order Cancellation</span>
          <h2 className={styles.title}>Cancel Order #{orderNumber}</h2>
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

      <form onSubmit={handleSubmit}>
        <div className={styles.body}>
          <div className={styles.policyAlert}>
            <AlertCircle size={18} />
            <div>
              <strong>Pre-Shipping Policy:</strong> Cancellations are only permitted before shipping confirmation. Once cancelled, reserved items are immediately returned to our studio stock.
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="cancel-reason" className={styles.label}>
              Reason for Cancellation
            </label>
            <select
              id="cancel-reason"
              className={styles.select}
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              disabled={submitting}
            >
              {CANCELLATION_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="cancel-notes" className={styles.label}>
              Additional Comments (Optional)
            </label>
            <textarea
              id="cancel-notes"
              className={styles.textarea}
              placeholder="Let us know how we could improve..."
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              disabled={submitting}
              maxLength={300}
            />
          </div>

          <div className={styles.refundNotice}>
            {isPrepaid ? (
              <>
                <strong>Refund Information:</strong> Your prepaid amount of ₹{totalAmount.toLocaleString('en-IN')} will be initiated for refund back to your original payment method within 3 to 5 business days.
              </>
            ) : (
              <>
                <strong>Cash on Delivery (COD):</strong> No payment was collected. Your order will be immediately cancelled with no dues.
              </>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className={styles.secondaryBtn}
          >
            Keep Order
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={styles.dangerBtn}
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Cancelling...
              </>
            ) : (
              'Confirm Cancellation'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
