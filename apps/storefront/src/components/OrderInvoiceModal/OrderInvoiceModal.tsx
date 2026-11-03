'use client';

import React from 'react';
import { X, Printer } from 'lucide-react';
import { Modal } from '@meadowmist/shared';
import styles from './OrderInvoiceModal.module.css';

interface InvoiceItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  selectedFragrance?: string | null;
  selectedColor?: string | null;
  selectedSize?: string | null;
}

interface InvoiceOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  subtotal: number;
  shippingCharges: number;
  discountAmount: number;
  totalAmount: number;
  promoCode?: string | null;
  paymentMethod: string;
  paymentStatus: string;
  paymentRef?: string | null;
  shippingAddress: string;
  items: InvoiceItem[];
}

interface OrderInvoiceModalProps {
  isOpen: boolean;
  order: InvoiceOrder | null;
  customerName?: string;
  customerEmail?: string;
  onClose: () => void;
}

export function OrderInvoiceModal({
  isOpen,
  order,
  customerName,
  customerEmail,
  onClose,
}: OrderInvoiceModalProps) {
  if (!isOpen || !order) return null;

  let parsedAddress: Record<string, string> = {};
  try {
    parsedAddress = JSON.parse(order.shippingAddress);
  } catch {
    parsedAddress = {
      fullName: customerName || 'Customer',
      streetAddress: order.shippingAddress || 'Not specified',
    };
  }

  const handlePrint = () => {
    window.print();
  };

  const taxableSubtotal = Math.round((order.subtotal / 1.18) * 100) / 100;
  const gstTotal = Math.round((order.subtotal - taxableSubtotal) * 100) / 100;
  const cgst = Math.round((gstTotal / 2) * 100) / 100;
  const sgst = Math.round((gstTotal / 2) * 100) / 100;

  const invoiceNumber = `INV-MM-${order.orderNumber}`;
  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} hideCloseButton maxWidth="780px">
      <div className={styles.actionBar}>
        <span className={styles.invoicePill}>Tax Invoice Preview</span>
        <div className={styles.actionBtns}>
          <button onClick={handlePrint} className={styles.printBtn}>
            <Printer size={15} />
            Print / Save PDF
          </button>
          <button onClick={onClose} className={styles.closeBtn} aria-label="Close invoice preview">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className={styles.printableArea}>
        <div className={styles.invoiceHeader}>
          <div>
            <h1 className={styles.brandName}>Meadow Mist</h1>
            <p className={styles.brandTagline}>Handcrafted Soy Candles & Ceramic Décor</p>
            <div className={styles.brandDetails}>
              <div>Meadow Mist Artisan Studio Ltd.</div>
              <div>GSTIN: 29AABCU9603R1ZM | HSN: 3406 / 6912</div>
              <div>Indiranagar 100ft Road, Bengaluru, Karnataka 560038</div>
              <div>Email: hello@meadowmist.in | Web: meadowmist.in</div>
            </div>
          </div>

          <div className={styles.invoiceMeta}>
            <div className={styles.invoiceTitle}>TAX INVOICE</div>
            <div className={styles.metaRow}>
              <strong>Invoice No:</strong> {invoiceNumber}
            </div>
            <div className={styles.metaRow}>
              <strong>Order Ref:</strong> #{order.orderNumber}
            </div>
            <div className={styles.metaRow}>
              <strong>Invoice Date:</strong> {formattedDate}
            </div>
            <div className={styles.metaRow}>
              <strong>Payment:</strong> {order.paymentMethod} ({order.paymentStatus})
            </div>
            {order.paymentRef && (
              <div className={styles.metaRow}>
                <strong>Txn ID:</strong> {order.paymentRef}
              </div>
            )}
          </div>
        </div>

        <div className={styles.addressGrid}>
          <div className={styles.addressCard}>
            <div className={styles.addressHeading}>Billed To</div>
            <div className={styles.addressName}>{parsedAddress.fullName || customerName || 'Valued Customer'}</div>
            <div className={styles.addressLine}>{customerEmail || ''}</div>
            <div className={styles.addressLine}>{parsedAddress.phone || ''}</div>
            <div className={styles.addressLine}>
              {parsedAddress.streetAddress} {parsedAddress.apartment || ''}
            </div>
            <div className={styles.addressLine}>
              {parsedAddress.city}, {parsedAddress.state} {parsedAddress.postalCode}
            </div>
          </div>

          <div className={styles.addressCard}>
            <div className={styles.addressHeading}>Shipped To</div>
            <div className={styles.addressName}>{parsedAddress.fullName || customerName || 'Valued Customer'}</div>
            <div className={styles.addressLine}>{parsedAddress.phone || ''}</div>
            <div className={styles.addressLine}>
              {parsedAddress.streetAddress} {parsedAddress.apartment || ''}
            </div>
            <div className={styles.addressLine}>
              {parsedAddress.city}, {parsedAddress.state} {parsedAddress.postalCode}
            </div>
          </div>
        </div>

        <table className={styles.itemsTable}>
          <thead>
            <tr>
              <th style={{ width: '40px' }}>#</th>
              <th>Description</th>
              <th>HSN</th>
              <th style={{ textAlign: 'center' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Unit Rate</th>
              <th style={{ textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>
                  <strong>{item.productName}</strong>
                  {(item.selectedFragrance || item.selectedColor || item.selectedSize) && (
                    <div style={{ fontSize: '0.75rem', color: '#718096', marginTop: '2px' }}>
                      {[
                        item.selectedFragrance && `Scent: ${item.selectedFragrance}`,
                        item.selectedColor && `Shade: ${item.selectedColor}`,
                        item.selectedSize && `Size: ${item.selectedSize}`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  )}
                </td>
                <td>3406</td>
                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>₹{item.unitPrice.toLocaleString('en-IN')}</td>
                <td style={{ textAlign: 'right' }}>₹{item.lineTotal.toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.summaryContainer}>
          <table className={styles.summaryTable}>
            <tbody>
              <tr>
                <td>Subtotal (Excl. Tax)</td>
                <td style={{ textAlign: 'right' }}>₹{taxableSubtotal.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>CGST (9%)</td>
                <td style={{ textAlign: 'right' }}>₹{cgst.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>SGST (9%)</td>
                <td style={{ textAlign: 'right' }}>₹{sgst.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>Shipping Charges</td>
                <td style={{ textAlign: 'right' }}>
                  {order.shippingCharges === 0 ? 'FREE' : `₹${order.shippingCharges}`}
                </td>
              </tr>
              {order.discountAmount > 0 && (
                <tr style={{ color: '#2f855a' }}>
                  <td>Discount ({order.promoCode || 'Promo'})</td>
                  <td style={{ textAlign: 'right' }}>−₹{order.discountAmount.toLocaleString('en-IN')}</td>
                </tr>
              )}
              <tr>
                <td className={styles.summaryTotal}>Grand Total</td>
                <td className={styles.summaryTotal} style={{ textAlign: 'right' }}>
                  ₹{order.totalAmount.toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={styles.notesSection}>
          <div>Each piece is handcrafted with botanical soy wax and artisanal ceramics in Bengaluru, Karnataka.</div>
          <div>Thank you for supporting slow craftsmanship · This is a computer-generated invoice.</div>
        </div>
      </div>
    </Modal>
  );
}
