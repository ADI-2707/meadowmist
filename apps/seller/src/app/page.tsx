'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  IndianRupee,
  ShoppingBag,
  Clock,
  Flame,
  Layers,
  AlertTriangle,
  PlusCircle,
  Boxes,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { StatCard } from '@/components/StatCard/StatCard';
import { StockBadge, BadgeStatus } from '@/components/StockBadge/StockBadge';
import { Skeleton, formatINR } from '@meadowmist/shared';
import styles from './dashboard.module.css';

function DashboardSkeleton() {
  return (
    <div className={styles.dashboard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <Skeleton width="180px" height="28px" style={{ marginBottom: '8px' }} />
          <Skeleton width="320px" height="16px" />
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Skeleton width="130px" height="38px" borderRadius="var(--radius-sm)" />
          <Skeleton width="130px" height="38px" borderRadius="var(--radius-sm)" />
        </div>
      </div>

      <div className={styles.metricsGrid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--color-gold-soft)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 14px',
              minHeight: '128px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Skeleton width="90px" height="14px" />
              <Skeleton width="28px" height="28px" borderRadius="var(--radius-sm)" />
            </div>
            <Skeleton width="120px" height="26px" style={{ margin: '8px 0' }} />
            <Skeleton width="80px" height="16px" borderRadius="9999px" />
          </div>
        ))}
      </div>

      <div className={styles.lowerGrid}>
        <div className={styles.sectionCard}>
          <div className={styles.cardHeader}>
            <Skeleton width="140px" height="22px" />
            <Skeleton width="100px" height="16px" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} width="100%" height="40px" borderRadius="var(--radius-sm)" />
            ))}
          </div>
        </div>

        <div className={styles.sectionCard}>
          <div className={styles.cardHeader}>
            <Skeleton width="160px" height="22px" />
            <Skeleton width="100px" height="16px" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} width="100%" height="40px" borderRadius="var(--radius-sm)" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface SummaryData {
  totalRevenue: number;
  totalOrdersCount: number;
  pendingOrdersCount: number;
  processingOrdersCount: number;
  shippedOrdersCount: number;
  deliveredOrdersCount: number;
  cancelledOrdersCount: number;
  returnRequestedCount: number;
  totalProductsCount: number;
  totalCandlesInStock: number;
  totalCeramicsInStock: number;
  lowStockCount: number;
  outOfStockCount: number;
}

interface BestSellingItem {
  productId: string;
  productName: string;
  productImage: string;
  category: string;
  unitsSold: number;
  revenue: number;
  currentStock: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  itemCount: number;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [bestSelling, setBestSelling] = useState<BestSellingItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/analytics');
        if (res.ok) {
          const data = await res.json();
          setSummary(data.summary);
          setBestSelling(data.bestSelling || []);
          setRecentOrders(data.recentOrders || []);
        }
      } catch (err) {
        console.error('Analytics load error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const mapStatusToBadge = (status: string): BadgeStatus => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'pending';
      case 'PROCESSING':
      case 'CONFIRMED':
        return 'confirmed';
      case 'SHIPPED':
        return 'shipped';
      case 'DELIVERED':
        return 'delivered';
      case 'CANCELLED':
        return 'cancelled';
      default:
        return 'pending';
    }
  };

  return (
    <div className={styles.dashboard}>
      <PageHeader
        title="Store Overview"
        eyebrow="Live Artisan Operations"
        subtitle="Real-time orders, revenue, inventory stock, and incoming shipments."
        actions={
          <>
            <Link href="/products/new" className={styles.actionBtn}>
              <PlusCircle size={16} />
              Add Product
            </Link>
            <Link href="/products?tab=stock" className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}>
              <Boxes size={16} />
              Update Stock
            </Link>
          </>
        }
      />

      {summary && summary.pendingOrdersCount > 0 && (
        <div className={styles.alertBanner}>
          <div className={styles.alertText}>
            You have {summary.pendingOrdersCount} pending order(s) waiting for packing and dispatch.
          </div>
          <Link href="/orders" className={styles.alertLink}>
            Fulfill Orders →
          </Link>
        </div>
      )}

      {summary && (
        <div className={styles.metricsGrid}>
          <StatCard
            label="Gross Revenue"
            value={formatINR(summary.totalRevenue)}
            icon={IndianRupee}
            highlight={true}
            subtext="Net sales to date"
          />

          <StatCard
            label="Total Orders"
            value={summary.totalOrdersCount}
            icon={ShoppingBag}
            badge={{
              text: `${summary.processingOrdersCount} In progress`,
              variant: 'neutral',
            }}
          />

          <StatCard
            label="Pending Dispatch"
            value={summary.pendingOrdersCount}
            icon={Clock}
            badge={{
              text: summary.pendingOrdersCount > 0 ? 'Action Needed' : 'All Clear',
              variant: summary.pendingOrdersCount > 0 ? 'warning' : 'success',
            }}
          />

          <StatCard
            label="Candle Stock"
            value={`${summary.totalCandlesInStock} units`}
            icon={Flame}
            badge={{ text: 'Soy Wax', variant: 'success' }}
          />

          <StatCard
            label="Ceramic Stock"
            value={`${summary.totalCeramicsInStock} units`}
            icon={Layers}
            badge={{ text: 'Handcrafted', variant: 'neutral' }}
          />

          <StatCard
            label="Low Stock Warnings"
            value={summary.lowStockCount}
            icon={AlertTriangle}
            badge={{
              text: `${summary.outOfStockCount} Out of stock`,
              variant: summary.outOfStockCount > 0 ? 'danger' : 'warning',
            }}
          />
        </div>
      )}

      <div className={styles.lowerGrid}>
        <div className={styles.sectionCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Recent Orders</h2>
            <Link href="/orders" className={styles.cardLink}>
              View All Orders →
            </Link>
          </div>

          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '24px' }}>
                      No orders placed yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.slice(0, 6).map((o) => (
                    <tr key={o.id}>
                      <td>
                        <Link
                          href={`/orders/${o.id}`}
                          style={{
                            color: 'var(--color-forest)',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td>
                        <div>{o.customerName}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{o.customerEmail}</div>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {formatINR(o.totalAmount)}
                      </td>
                      <td>
                        <StockBadge status={mapStatusToBadge(o.status)} label={o.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.sectionCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Top Selling Items</h2>
            <Link href="/products" className={styles.cardLink}>
              Catalog →
            </Link>
          </div>

          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Units Sold</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {bestSelling.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '24px' }}>
                      No sales data yet.
                    </td>
                  </tr>
                ) : (
                  bestSelling.slice(0, 6).map((item) => (
                    <tr key={item.productId}>
                      <td>
                        <div className={styles.productCell}>
                          <div className={styles.productThumb}>
                            {item.productImage && (
                              <Image
                                src={item.productImage}
                                alt={item.productName}
                                fill
                                style={{ objectFit: 'cover' }}
                              />
                            )}
                          </div>
                          <div>
                            <div className={styles.productName}>{item.productName}</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                              {item.category}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{item.unitsSold}</td>
                      <td>
                        <StockBadge
                          status={
                            item.currentStock === 0
                              ? 'out-of-stock'
                              : item.currentStock <= 5
                              ? 'low-stock'
                              : 'in-stock'
                          }
                          label={`${item.currentStock} left`}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
