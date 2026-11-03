'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Truck, CheckCircle2, AlertCircle, Printer } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { StockBadge } from '@/components/StockBadge/StockBadge';
import { toast, Skeleton, formatINR } from '@meadowmist/shared';
import styles from '../orders.module.css';

function OrderDetailSkeleton() {
  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <Skeleton width="140px" height="24px" style={{ marginBottom: '8px' }} />
          <Skeleton width="260px" height="16px" />
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Skeleton width="110px" height="38px" borderRadius="var(--radius-sm)" />
          <Skeleton width="110px" height="38px" borderRadius="var(--radius-sm)" />
        </div>
      </div>

      <div className={styles.detailGrid}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className={styles.card}>
            <Skeleton width="160px" height="22px" style={{ marginBottom: '16px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <Skeleton width="50px" height="50px" borderRadius="var(--radius-sm)" />
                  <div style={{ flex: 1 }}>
                    <Skeleton width="60%" height="16px" style={{ marginBottom: '6px' }} />
                    <Skeleton width="40%" height="12px" />
                  </div>
                  <Skeleton width="70px" height="16px" />
                </div>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <Skeleton width="180px" height="22px" style={{ marginBottom: '16px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Skeleton width="100%" height="18px" />
              <Skeleton width="80%" height="18px" />
              <Skeleton width="60%" height="18px" />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className={styles.card}>
            <Skeleton width="150px" height="22px" style={{ marginBottom: '16px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Skeleton width="100%" height="38px" borderRadius="var(--radius-sm)" />
              <Skeleton width="100%" height="38px" borderRadius="var(--radius-sm)" />
              <Skeleton width="100%" height="40px" borderRadius="var(--radius-sm)" />
            </div>
          </div>

          <div className={styles.card}>
            <Skeleton width="150px" height="22px" style={{ marginBottom: '16px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Skeleton width="100%" height="16px" />
              <Skeleton width="100%" height="16px" />
              <Skeleton width="100%" height="16px" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Props {
  params: Promise<{ id: string }>;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  isGuest?: boolean;
  guestEmail?: string | null;
  guestPhone?: string | null;
  subtotal: number;
  shippingCharges: number;
  discountAmount: number;
  totalAmount: number;
  promoCode?: string | null;
  paymentMethod: string;
  paymentStatus: string;
  paymentRef?: string | null;
  refundedAmount: number;
  refundReason?: string | null;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  returnReason?: string | null;
  returnStatus?: string | null;
  returnRequestedAt?: string | null;
  returnImages?: string | null;
  trackingNumber?: string | null;
  courierPartner?: string | null;
  courierStatus?: string | null;
  shippingAddress: string;
  customerNotes?: string | null;
  user?: {
    name: string;
    email: string;
    phone?: string | null;
  } | null;
  items: {
    id: string;
    variantId?: string | null;
    productName: string;
    productImage: string;
    unitPrice: number;
    quantity: number;
    selectedFragrance?: string | null;
    selectedColor?: string | null;
    selectedSize?: string | null;
    customNotes?: string | null;
    lineTotal: number;
  }[];
}

export default function AdminOrderDetailPage({ params }: Props) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [orderStatus, setOrderStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courierPartner, setCourierPartner] = useState('');
  const [courierStatus, setCourierStatus] = useState('');

  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (res.ok) {
        const data = await res.json();
        const o = data.order;
        setOrder(o);
        setOrderStatus(o.status);
        setPaymentStatus(o.paymentStatus);
        setTrackingNumber(o.trackingNumber || '');
        setCourierPartner(o.courierPartner || 'Delhivery');
        setCourierStatus(o.courierStatus || 'Processing');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleUpdateStatus = async () => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: orderStatus,
          paymentStatus,
        }),
      });
      if (res.ok) {
        toast.success('Order status updated');
        fetchOrder();
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleUpdateCourier = async () => {
    try {
      const res = await fetch(`/api/orders/${id}/courier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingNumber,
          courierPartner,
          courierStatus,
        }),
      });
      if (res.ok) {
        toast.success('Courier information updated');
        fetchOrder();
      }
    } catch {
      toast.error('Failed to update courier tracking');
    }
  };

  const handleUpdateReturnStatus = async (status: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnStatus: status }),
      });
      if (res.ok) {
        toast.success(`Return marked as ${status}`);
        fetchOrder();
      }
    } catch {
      toast.error('Failed to update return status');
    }
  };

  const handleProcessRefund = async () => {
    if (!refundAmount || Number(refundAmount) <= 0) {
      toast.error('Please enter a valid refund amount');
      return;
    }

    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refundedAmount: Number(refundAmount),
          refundReason,
          returnStatus: 'COMPLETED',
        }),
      });
      if (res.ok) {
        toast.success('Refund recorded successfully');
        fetchOrder();
      }
    } catch {
      toast.error('Failed to record refund');
    }
  };

  if (loading || !order) {
    return <OrderDetailSkeleton />;
  }

  let address: Record<string, string> = {};
  try {
    address = JSON.parse(order.shippingAddress);
  } catch {
    address = {};
  }

  let parsedReturnImages: string[] = [];
  if (order.returnImages) {
    try {
      const parsed = JSON.parse(order.returnImages);
      if (Array.isArray(parsed)) {
        parsedReturnImages = parsed;
      }
    } catch {
      parsedReturnImages = [];
    }
  }

  return (
    <div className={styles.container}>
      <PageHeader
        eyebrow="Order Fulfillment"
        title={`Order #${order.orderNumber}`}
        subtitle={`Placed on ${new Date(order.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <StockBadge status={order.status.toLowerCase() as any} />
            <button
              type="button"
              onClick={() => window.print()}
              className={styles.viewBtn}
              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={14} />
              Print Packing Slip
            </button>
            <Link href="/orders" className={styles.viewBtn}>
              <ArrowLeft size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Back to Orders
            </Link>
          </div>
        }
      />

      {order.status === 'CANCELLED' && (
        <div
          data-testid="cancellation-banner"
          style={{
            marginBottom: '20px',
            padding: '16px 20px',
            backgroundColor: '#fff5f5',
            border: '1px solid #feb2b2',
            borderLeft: '4px solid #e53e3e',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <AlertCircle size={22} style={{ color: '#e53e3e', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#9b2c2c' }}>
              Order Cancelled
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#742a2a' }}>
              <strong>Cancellation Reason:</strong> {order.cancellationReason || 'No reason specified by customer'}
            </p>
            {order.cancelledAt && (
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#718096' }}>
                Cancelled on {new Date(order.cancelledAt).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        </div>
      )}

      <div className={styles.detailGrid}>
        <div>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Ordered Handcrafted Pieces</h2>
            {order.items.map((item) => (
              <div key={item.id} className={styles.itemRow}>
                <div className={styles.itemThumb}>
                  <Image src={item.productImage} alt={item.productName} fill style={{ objectFit: 'cover' }} />
                </div>
                <div className={styles.itemInfo}>
                  <p className={styles.itemName}>{item.productName}</p>
                  <p className={styles.itemMeta}>
                    Qty: {item.quantity} · Unit Price: {formatINR(item.unitPrice)}
                  </p>
                  {item.selectedFragrance && (
                    <p className={styles.itemMeta}>Scent: {item.selectedFragrance}</p>
                  )}
                  {item.selectedColor && (
                    <p className={styles.itemMeta}>Shade: {item.selectedColor}</p>
                  )}
                  {item.customNotes && (
                    <p className={styles.itemMeta} style={{ color: 'var(--color-gold)', fontWeight: 600 }}>
                      Note: &ldquo;{item.customNotes}&rdquo;
                    </p>
                  )}
                </div>
                <p className={styles.itemPrice}>{formatINR(item.lineTotal)}</p>
              </div>
            ))}

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-canvas-alt)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span>Subtotal</span>
                <span>{formatINR(order.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span>Shipping Charges</span>
                <span>{order.shippingCharges === 0 ? 'FREE' : formatINR(order.shippingCharges)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#2f855a' }}>
                  <span>Discount ({order.promoCode || 'PROMO'})</span>
                  <span>−{formatINR(order.discountAmount)}</span>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  marginTop: '8px',
                  borderTop: '1px dashed var(--color-gold)',
                  fontWeight: 700,
                  fontSize: '1.15rem',
                  color: 'var(--color-forest)',
                }}
              >
                <span>Total Amount</span>
                <span>{formatINR(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          <div className={styles.card} style={{ marginTop: '20px' }}>
            <h2 className={styles.cardTitle}>Shipping & Customer Contact</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--color-forest)' }}>Delivery Address</p>
                <p style={{ fontSize: '0.88rem', marginTop: '4px' }}>{address.fullName || order.user?.name}</p>
                <p style={{ fontSize: '0.88rem' }}>{address.streetAddress}</p>
                {address.apartment && <p style={{ fontSize: '0.88rem' }}>{address.apartment}</p>}
                <p style={{ fontSize: '0.88rem' }}>
                  {address.city}, {address.state} - {address.postalCode}
                </p>
                <p style={{ fontSize: '0.88rem' }}>Phone: {address.phone || order.guestPhone || order.user?.phone || 'Not provided'}</p>
              </div>

              <div>
                <p style={{ fontWeight: 600, color: 'var(--color-forest)' }}>Customer Account</p>
                <p style={{ fontSize: '0.88rem', marginTop: '4px' }}>
                  {order.isGuest ? 'Guest Checkout' : (order.user?.name || 'Registered Customer')}
                </p>
                <p style={{ fontSize: '0.88rem' }}>Email: {order.guestEmail || order.user?.email || '—'}</p>
                <p style={{ fontSize: '0.88rem', marginTop: '8px', fontWeight: 600, color: 'var(--color-forest)' }}>Payment</p>
                <p style={{ fontSize: '0.88rem' }}>Method: {order.paymentMethod}</p>
                <p style={{ fontSize: '0.88rem' }}>Status: {order.paymentStatus}</p>
                {order.paymentRef && <p style={{ fontSize: '0.88rem' }}>Ref: {order.paymentRef}</p>}
              </div>
            </div>

            {order.customerNotes && (
              <div style={{ marginTop: '16px', padding: '12px', background: 'var(--color-canvas)', borderRadius: '6px' }}>
                <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-forest)' }}>Customer Gift / Special Note:</p>
                <p style={{ fontSize: '0.88rem', fontStyle: 'italic', marginTop: '4px' }}>&ldquo;{order.customerNotes}&rdquo;</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Update Order Status</h2>
            <div className={styles.controlField}>
              <label>Fulfillment Status</label>
              <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)}>
                <option value="PENDING">Pending Studio Review</option>
                <option value="PROCESSING">Crafting / In Progress</option>
                <option value="SHIPPED">Handed to Courier</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className={styles.controlField}>
              <label>Payment Status</label>
              <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                <option value="PENDING">Pending Payment</option>
                <option value="PAID">Paid / Captured</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>

            <button onClick={handleUpdateStatus} className={styles.saveBtn}>
              Save Status Changes
            </button>
          </div>

          <div className={styles.card} style={{ marginTop: '20px' }}>
            <h2 className={styles.cardTitle}>Courier & Dispatch Tracking</h2>
            <div className={styles.controlField}>
              <label>Courier Service</label>
              <input
                value={courierPartner}
                onChange={(e) => setCourierPartner(e.target.value)}
                placeholder="Delhivery, BlueDart, IndiaPost"
              />
            </div>

            <div className={styles.controlField}>
              <label>AWB / Tracking Number</label>
              <input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. DL123456789IN"
              />
            </div>

            <div className={styles.controlField}>
              <label>Courier Status Note</label>
              <input
                value={courierStatus}
                onChange={(e) => setCourierStatus(e.target.value)}
                placeholder="Dispatched from Mumbai Hub"
              />
            </div>

            <button onClick={handleUpdateCourier} className={styles.saveBtn}>
              Update Courier Info
            </button>
          </div>

          {(order.returnReason || parsedReturnImages.length > 0 || order.refundedAmount > 0) && (
            <div className={styles.card} style={{ marginTop: '20px', borderLeft: '4px solid #c53030' }}>
              <h2 className={styles.cardTitle} style={{ color: '#c53030' }}>Return & Refund Center</h2>
              {order.returnReason && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>Customer Return Request:</p>
                  <p style={{ fontSize: '0.88rem', marginTop: '2px' }}>{order.returnReason}</p>
                  <p style={{ fontSize: '0.8rem', color: '#718096', marginTop: '2px' }}>Current Status: {order.returnStatus}</p>

                  {order.returnStatus === 'REQUESTED' && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <button
                        onClick={() => handleUpdateReturnStatus('APPROVED')}
                        className={styles.saveBtn}
                        style={{ backgroundColor: '#2b6cb0', padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        Approve Return
                      </button>
                      <button
                        onClick={() => handleUpdateReturnStatus('REJECTED')}
                        className={styles.saveBtn}
                        style={{ backgroundColor: '#718096', padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        Decline Return
                      </button>
                    </div>
                  )}
                </div>
              )}

              {parsedReturnImages.length > 0 && (
                <div
                  data-testid="damage-photo-gallery"
                  style={{
                    margin: '14px 0',
                    padding: '12px',
                    backgroundColor: '#fffaf0',
                    border: '1px solid #feebc8',
                    borderRadius: '6px',
                  }}
                >
                  <p style={{ fontWeight: 600, fontSize: '0.85rem', color: '#7b341e', margin: '0 0 8px' }}>
                    Customer Damage & Breakage Photo Evidence:
                  </p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {parsedReturnImages.map((imgUrl, idx) => (
                      <a
                        key={idx}
                        href={imgUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          position: 'relative',
                          width: '84px',
                          height: '84px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          border: '2px solid #dd6b20',
                          display: 'block',
                          backgroundColor: '#f7fafc',
                        }}
                        title="Click to view full image in new tab"
                      >
                        <Image
                          src={imgUrl}
                          alt={`Transit damage evidence ${idx + 1}`}
                          fill
                          sizes="84px"
                          style={{ objectFit: 'cover' }}
                        />
                      </a>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.74rem', color: '#9c4221', margin: '6px 0 0', fontStyle: 'italic' }}>
                    Click thumbnail to view full-resolution photo evidence.
                  </p>
                </div>
              )}

              <div className={styles.controlField}>
                <label>Refund Amount (₹)</label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder={`Max ₹${order.totalAmount}`}
                />
              </div>

              <div className={styles.controlField}>
                <label>Refund Reason</label>
                <input
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Damaged in transit / Customer return approved"
                />
              </div>

              <button onClick={handleProcessRefund} className={styles.saveBtn} style={{ backgroundColor: '#c53030' }}>
                Process & Record Refund
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.printOnlySlip}>
        <header className={styles.slipHeader}>
          <div>
            <h1 className={styles.slipTitle}>Meadow Mist Studio</h1>
            <p className={styles.slipSubtitle}>Handcrafted Botanical Candles &amp; Wheel-Thrown Ceramics</p>
            <p className={styles.slipSubtitle}>Small-Batch Artisan Workshop · Dispatch Verification</p>
          </div>
          <div className={styles.slipOrderMeta}>
            <strong>Order #{order.orderNumber}</strong>
            <div>Date: {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            <div>Payment: {order.paymentMethod} ({order.paymentStatus})</div>
          </div>
        </header>

        <section className={styles.slipCustomerGrid}>
          <div>
            <h2 className={styles.slipSectionHeading}>Delivery Recipient</h2>
            <p className={styles.slipText}><strong>{address.fullName || order.user?.name || 'Customer'}</strong></p>
            <p className={styles.slipText}>{address.streetAddress}{address.apartment ? `, ${address.apartment}` : ''}</p>
            <p className={styles.slipText}>{address.city}, {address.state} - {address.postalCode}</p>
            <p className={styles.slipText}>Phone: {address.phone || order.guestPhone || order.user?.phone || '—'}</p>
            <p className={styles.slipText}>Email: {order.guestEmail || order.user?.email || '—'}</p>
          </div>

          <div>
            <h2 className={styles.slipSectionHeading}>Dispatch &amp; Courier Details</h2>
            <p className={styles.slipText}>Carrier: {order.courierPartner || 'Artisan Direct'}</p>
            <p className={styles.slipText}>Tracking: {order.trackingNumber || 'Pending Dispatch'}</p>
            <p className={styles.slipText}>Order Status: {order.status}</p>
          </div>

          {order.customerNotes && (
            <div className={styles.slipGiftNote}>
              <strong>Customer Note / Gift Request:</strong>
              <div>&ldquo;{order.customerNotes}&rdquo;</div>
            </div>
          )}
        </section>

        <table className={styles.slipTable}>
          <thead>
            <tr>
              <th style={{ width: '40px' }}>[✓]</th>
              <th>Artisan Piece &amp; Options</th>
              <th>Options / Finish</th>
              <th style={{ textAlign: 'center', width: '50px' }}>Qty</th>
              <th style={{ textAlign: 'right', width: '90px' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td style={{ textAlign: 'center', fontSize: '14px' }}>[ &nbsp; ]</td>
                <td>
                  <strong>{item.productName}</strong>
                  {item.customNotes && (
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>Card Note: &ldquo;{item.customNotes}&rdquo;</div>
                  )}
                </td>
                <td>
                  {[item.selectedFragrance, item.selectedColor, item.selectedSize].filter(Boolean).join(' · ') || 'Standard'}
                </td>
                <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>{formatINR(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <footer className={styles.slipSignoff}>
          <div>
            <p style={{ margin: '0 0 6px' }}><strong>Artisan Quality Guarantee</strong></p>
            <p style={{ margin: 0, color: '#4b5563', lineHeight: 1.4 }}>
              Every item in this parcel was inspected by hand, wrapped in eco-friendly protective padding, and prepared for safe transit.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '0 0 16px' }}>Packer: <span className={styles.slipSignLine}></span></p>
            <p style={{ margin: 0 }}>Date: <span className={styles.slipSignLine}></span></p>
          </div>
        </footer>
      </div>
    </div>
  );
}
