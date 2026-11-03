import React from 'react';
import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { prisma, OrderItem } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import styles from './page.module.css';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderConfirmationPage({ params }: Props) {
  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: {
      OR: [{ orderNumber: id }, { id }],
    },
    include: {
      items: true,
    },
  });

  if (!order) {
    notFound();
  }

  if (order.userId) {
    const session = await getSessionUser();
    if (!session) {
      redirect(`/login?redirect=/order-confirmation/${encodeURIComponent(id)}`);
    }
    if (session.userId !== order.userId && session.role !== 'ADMIN') {
      notFound();
    }
  }

  let address: {
    fullName?: string;
    phone?: string;
    streetAddress?: string;
    apartment?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  } = {};

  try {
    address = JSON.parse(order.shippingAddress);
  } catch {
    address = {};
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.card}>
          <div className={styles.header}>
            <span className={styles.badge}>✦ Order Confirmed</span>
            <h1 className={styles.title}>Thank You For Your Order</h1>
            <p className={styles.subtitle}>
              We have received your order. Each candle and ceramic piece will be hand-inspected, carefully packed, and prepared for dispatch.
            </p>
          </div>

          <div className={styles.orderMeta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Order Number</span>
              <span className={styles.metaVal}>{order.orderNumber}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Order Date</span>
              <span className={styles.metaVal}>
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Payment Method</span>
              <span className={styles.metaVal}>
                {order.paymentMethod} ({order.paymentStatus})
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Delivery To</span>
              <span className={styles.metaVal}>
                {address.fullName || 'Customer'} ({address.city || ''})
              </span>
            </div>
          </div>

          <div className={styles.itemsSection}>
            <h2 className={styles.sectionHeading}>Items Ordered</h2>
            {order.items.map((item: OrderItem) => (
              <div key={item.id} className={styles.itemRow}>
                <div className={styles.itemThumb}>
                  <Image
                    src={item.productImage || '/images/products/sunflower-wax-cluster-yellow.jpg'}
                    alt={item.productName}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className={styles.itemInfo}>
                  <p className={styles.itemName}>{item.productName}</p>
                  <p className={styles.itemMeta}>
                    Qty: {item.quantity}
                    {item.selectedFragrance && ` · Scent: ${item.selectedFragrance}`}
                    {item.selectedColor && ` · Shade: ${item.selectedColor}`}
                    {item.selectedSize && ` · Size: ${item.selectedSize}`}
                  </p>
                </div>
                <div className={styles.itemPrice}>
                  ₹{item.lineTotal.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.calcSection}>
            <div className={styles.calcRow}>
              <span>Subtotal</span>
              <span>₹{order.subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className={styles.calcRow}>
              <span>Shipping Charges</span>
              <span>{order.shippingCharges === 0 ? 'FREE' : `₹${order.shippingCharges}`}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className={styles.calcRow} style={{ color: '#2f855a' }}>
                <span>Discount ({order.promoCode || 'Promo'})</span>
                <span>−₹{order.discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className={styles.calcTotal}>
              <span>Total Paid / Due</span>
              <span>₹{order.totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className={styles.actions}>
            <Link href="/account" className={styles.primaryBtn}>
              View in My Account
            </Link>
            <Link href="/candles" className={styles.secondaryBtn}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
