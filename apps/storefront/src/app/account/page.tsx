'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import dynamic from 'next/dynamic';
import { OrderTimeline } from '@/components/OrderTimeline/OrderTimeline';

const OrderCancelModal = dynamic(
  () => import('@/components/OrderCancelModal/OrderCancelModal').then((mod) => mod.OrderCancelModal),
  { ssr: false }
);
const OrderReturnModal = dynamic(
  () => import('@/components/OrderReturnModal/OrderReturnModal').then((mod) => mod.OrderReturnModal),
  { ssr: false }
);
const OrderInvoiceModal = dynamic(
  () => import('@/components/OrderInvoiceModal/OrderInvoiceModal').then((mod) => mod.OrderInvoiceModal),
  { ssr: false }
);
import { FileText, RotateCcw, ShoppingBag, AlertCircle } from 'lucide-react';
import styles from './page.module.css';

interface OrderItem {
  id: string;
  productName: string;
  productImage: string;
  unitPrice: number;
  quantity: number;
  selectedFragrance?: string | null;
  selectedColor?: string | null;
  selectedSize?: string | null;
  lineTotal: number;
  product?: { slug: string; category: string };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  shippingCharges: number;
  discountAmount: number;
  totalAmount: number;
  promoCode?: string | null;
  paymentMethod: string;
  paymentStatus: string;
  paymentRef?: string | null;
  refundedAmount?: number;
  refundReason?: string | null;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  returnReason?: string | null;
  returnStatus?: string | null;
  returnRequestedAt?: string | null;
  trackingNumber?: string | null;
  courierPartner?: string | null;
  courierStatus?: string | null;
  shippingAddress: string;
  createdAt: string;
  items: OrderItem[];
}

interface Address {
  id: string;
  fullName: string;
  phone: string;
  streetAddress: string;
  apartment?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface WishlistItem {
  id: string;
  productId: string;
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    salePrice?: number | null;
    images: string;
    category: string;
    inStock: boolean;
  };
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

interface AccountReview {
  id: string;
  rating: number;
  title?: string | null;
  comment: string;
  isApproved: boolean;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    images: string;
    category: string;
  };
}

function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabQuery = searchParams.get('tab');
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);

  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'wishlist' | 'reviews' | 'profile'>('orders');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [myReviews, setMyReviews] = useState<AccountReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tabQuery && ['orders', 'addresses', 'wishlist', 'reviews', 'profile'].includes(tabQuery)) {
      setActiveTab(tabQuery as 'orders' | 'addresses' | 'wishlist' | 'reviews' | 'profile');
    }
  }, [tabQuery]);

  const handleTabChange = (tab: 'orders' | 'addresses' | 'wishlist' | 'reviews' | 'profile') => {
    setActiveTab(tab);
    router.replace(`/account?tab=${tab}`, { scroll: false });
  };

  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddr, setNewAddr] = useState({
    fullName: '',
    phone: '',
    streetAddress: '',
    apartment: '',
    city: '',
    state: '',
    postalCode: '',
    isDefault: false,
  });

  const fetchData = async () => {
    try {
      const [userRes, ordersRes, addrRes, wishRes, revRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/account/orders'),
        fetch('/api/account/addresses'),
        fetch('/api/wishlist'),
        fetch('/api/account/reviews'),
      ]);

      const userData = await userRes.json();
      if (!userData.user) {
        router.push('/login?redirect=/account');
        return;
      }

      setUser(userData.user);
      setProfileName(userData.user.name);
      setProfilePhone(userData.user.phone || '');

      const ordersData = await ordersRes.json();
      if (ordersData.orders) setOrders(ordersData.orders);

      const addrData = await addrRes.json();
      if (addrData.addresses) setAddresses(addrData.addresses);

      const wishData = await wishRes.json();
      if (wishData.items) setWishlist(wishData.items);

      if (revRes.ok) {
        const revData = await revRes.json();
        if (revData.reviews) setMyReviews(revData.reviews);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [returningOrder, setReturningOrder] = useState<Order | null>(null);
  const [invoicingOrder, setInvoicingOrder] = useState<Order | null>(null);

  const handleConfirmCancel = async (reason: string) => {
    if (!cancellingOrder) return;
    try {
      const res = await fetch(`/api/orders/${cancellingOrder.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        setCancellingOrder(null);
        fetchData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to cancel order');
      }
    } catch {
      alert('Error cancelling order');
    }
  };

  const handleConfirmReturn = async (data: {
    reason: string;
    resolutionPreference: 'REFUND' | 'REPLACEMENT';
    notes: string;
    selectedItems: string[];
    images?: string[];
  }) => {
    if (!returningOrder) return;
    try {
      const res = await fetch(`/api/orders/${returningOrder.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setReturningOrder(null);
        fetchData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to submit return request');
      }
    } catch {
      alert('Error submitting return request');
    }
  };

  const handleReorder = (order: Order) => {
    for (const item of order.items) {
      let firstImage = item.productImage;
      if (!firstImage) {
        firstImage = '/images/products/sunflower-wax-cluster-yellow.jpg';
      }
      addItem({
        productId: item.id,
        slug: item.product?.slug || 'sunflower-wax-cluster-candle',
        name: item.productName,
        price: item.unitPrice,
        image: firstImage,
        category: (item.product?.category as 'candle' | 'ceramic') || 'candle',
        selectedFragrance: item.selectedFragrance || undefined,
        selectedColor: item.selectedColor || undefined,
      });
    }
    openDrawer();
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/account/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddr),
      });
      if (res.ok) {
        setShowAddressForm(false);
        setNewAddr({
          fullName: '',
          phone: '',
          streetAddress: '',
          apartment: '',
          city: '',
          state: '',
          postalCode: '',
          isDefault: false,
        });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      await fetch(`/api/account/addresses/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          phone: profilePhone,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfileMsg('Profile updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        fetchData();
      } else {
        setProfileMsg(data.error || 'Failed to update profile.');
      }
    } catch {
      setProfileMsg('Error updating profile.');
    }
  };

  const handleMoveToBag = (item: WishlistItem) => {
    let images: string[] = [];
    try {
      images = JSON.parse(item.product.images);
    } catch {
      images = ['/images/products/sunflower-wax-cluster-yellow.jpg'];
    }

    addItem({
      productId: item.product.id,
      slug: item.product.slug,
      name: item.product.name,
      price: item.product.salePrice ?? item.product.price,
      image: images[0] || '/images/products/sunflower-wax-cluster-yellow.jpg',
      category: (item.product.category as 'candle' | 'ceramic') || 'candle',
    });

    openDrawer();
  };

  const handleRemoveWishlist = async (productId: string) => {
    try {
      await fetch('/api/wishlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className="container">
          <p>Loading your account details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Customer Portal</p>
            <h1 className={styles.title}>Hello, {user?.name || 'Friend'}</h1>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Sign Out
          </button>
        </header>

        <div className={styles.tabs} role="tablist">
          <button
            className={`${styles.tabBtn} ${activeTab === 'orders' ? styles.activeTab : ''}`}
            onClick={() => handleTabChange('orders')}
          >
            My Orders ({orders.length})
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'addresses' ? styles.activeTab : ''}`}
            onClick={() => handleTabChange('addresses')}
          >
            Saved Addresses ({addresses.length})
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'wishlist' ? styles.activeTab : ''}`}
            onClick={() => handleTabChange('wishlist')}
          >
            Wishlist ({wishlist.length})
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'reviews' ? styles.activeTab : ''}`}
            onClick={() => handleTabChange('reviews')}
          >
            My Reviews ({myReviews.length})
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.activeTab : ''}`}
            onClick={() => handleTabChange('profile')}
          >
            Profile Settings
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'orders' && (
            <div>
              {orders.length === 0 ? (
                <div className={styles.emptyState}>
                  <h2 className={styles.emptyTitle}>No Orders Yet</h2>
                  <p className={styles.emptyText}>
                    You haven&apos;t placed any orders yet. Discover our small-batch candles and ceramics.
                  </p>
                  <Link href="/candles" className={styles.shopBtn}>
                    Explore Candles
                  </Link>
                </div>
              ) : (
                orders.map((order) => {
                  const statusClass =
                    order.status === 'DELIVERED'
                      ? styles.statusDelivered
                      : order.status === 'SHIPPED'
                      ? styles.statusShipped
                      : order.status === 'PROCESSING'
                      ? styles.statusProcessing
                      : order.status === 'CANCELLED'
                      ? styles.statusCancelled
                      : styles.statusPending;

                  return (
                    <div key={order.id} className={styles.orderCard}>
                      <div className={styles.orderHeader}>
                        <div>
                          <p className={styles.orderNum}>Order #{order.orderNumber}</p>
                          <p className={styles.orderDate}>
                            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div>
                          <span className={`${styles.statusPill} ${statusClass}`}>
                            {order.status}
                          </span>
                          {order.returnStatus && order.returnStatus !== 'NONE' && (
                            <span
                              className={`${styles.statusPill} ${
                                order.returnStatus === 'REQUESTED'
                                  ? styles.statusReturnRequested
                                  : order.returnStatus === 'APPROVED'
                                  ? styles.statusReturnApproved
                                  : order.returnStatus === 'COMPLETED'
                                  ? styles.statusReturnCompleted
                                  : styles.statusReturnRejected
                              }`}
                              style={{ marginLeft: '8px' }}
                            >
                              Return: {order.returnStatus}
                            </span>
                          )}
                        </div>
                      </div>

                      {order.cancellationReason && (
                        <div className={styles.reasonNotice} style={{ background: '#fff5f5', borderColor: '#fed7d7', color: '#c53030' }}>
                          <AlertCircle size={14} />
                          <span><strong>Cancelled:</strong> {order.cancellationReason}</span>
                        </div>
                      )}

                      {order.returnReason && (
                        <div className={styles.reasonNotice} style={{ background: '#feebc8', borderColor: '#fbd38d', color: '#7b341e' }}>
                          <RotateCcw size={14} />
                          <span><strong>Return Request:</strong> {order.returnReason}</span>
                        </div>
                      )}

                      <OrderTimeline
                        status={order.status}
                        trackingNumber={order.trackingNumber}
                        courierPartner={order.courierPartner}
                        courierStatus={order.courierStatus}
                      />

                      <div className={styles.orderItems}>
                        {order.items.map((item) => (
                          <div key={item.id} className={styles.orderItem}>
                            <div className={styles.itemThumb}>
                              <Image
                                src={item.productImage || '/images/products/sunflower-wax-cluster-yellow.jpg'}
                                alt={item.productName}
                                fill
                                style={{ objectFit: 'cover' }}
                              />
                            </div>
                            <div className={styles.itemDetails}>
                              <p className={styles.itemName}>{item.productName}</p>
                              <p className={styles.itemMeta}>
                                Qty: {item.quantity}
                                {item.selectedFragrance && ` · Scent: ${item.selectedFragrance}`}
                                {item.selectedColor && ` · Shade: ${item.selectedColor}`}
                              </p>
                              {item.product?.slug && (
                                <Link
                                  href={`/product/${item.product.slug}`}
                                  style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--color-clay-600, #ad6e33)',
                                    marginTop: '4px',
                                    display: 'inline-block',
                                    textDecoration: 'underline',
                                  }}
                                >
                                  Leave a Review →
                                </Link>
                              )}
                            </div>
                            <div className={styles.itemPrice}>
                              ₹{item.lineTotal.toLocaleString('en-IN')}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className={styles.orderFooter}>
                        <div>
                          {order.trackingNumber ? (
                            <div className={styles.trackingBox}>
                              <span className={styles.trackingLabel}>
                                {order.courierPartner || 'Courier'}:{' '}
                              </span>
                              <span>{order.trackingNumber}</span>
                              {order.courierStatus && <span> ({order.courierStatus})</span>}
                            </div>
                          ) : (
                            <span className={styles.itemMeta}>
                              Payment: {order.paymentMethod} ({order.paymentStatus})
                            </span>
                          )}
                        </div>
                        <div className={styles.actionBtns}>
                          <button
                            onClick={() => setInvoicingOrder(order)}
                            className={styles.actionBtn}
                            title="View / Print Tax Invoice"
                          >
                            <FileText size={13} style={{ display: 'inline', marginRight: '4px' }} />
                            Invoice
                          </button>

                          <button
                            onClick={() => handleReorder(order)}
                            className={styles.actionBtn}
                            title="Add items back to bag"
                          >
                            <ShoppingBag size={13} style={{ display: 'inline', marginRight: '4px' }} />
                            Buy Again
                          </button>

                          {(order.status === 'PENDING' || order.status === 'PROCESSING') && !order.trackingNumber && (
                            <button
                              onClick={() => setCancellingOrder(order)}
                              className={`${styles.actionBtn} ${styles.cancelBtn}`}
                            >
                              Cancel Order
                            </button>
                          )}

                          {order.status === 'DELIVERED' && (!order.returnStatus || order.returnStatus === 'NONE') && (
                            <button
                              onClick={() => setReturningOrder(order)}
                              className={styles.actionBtn}
                            >
                              <RotateCcw size={13} style={{ display: 'inline', marginRight: '4px' }} />
                              Request Return
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'addresses' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <button
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className={styles.primaryBtn}
                >
                  {showAddressForm ? 'Close Form' : '+ Add New Address'}
                </button>
              </div>

              {showAddressForm && (
                <div className={styles.formCard}>
                  <h3 className={styles.formTitle}>Add Delivery Address</h3>
                  <form onSubmit={handleSaveAddress} className={styles.formGrid}>
                    <div className={styles.inputField}>
                      <label>Full Name</label>
                      <input
                        required
                        value={newAddr.fullName}
                        onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })}
                        placeholder="Aditi Verma"
                      />
                    </div>
                    <div className={styles.inputField}>
                      <label>Phone Number</label>
                      <input
                        required
                        value={newAddr.phone}
                        onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div className={`${styles.inputField} ${styles.formFull}`}>
                      <label>Street Address</label>
                      <input
                        required
                        value={newAddr.streetAddress}
                        onChange={(e) => setNewAddr({ ...newAddr, streetAddress: e.target.value })}
                        placeholder="House / Flat / Street name"
                      />
                    </div>
                    <div className={`${styles.inputField} ${styles.formFull}`}>
                      <label>Apartment / Landmark (Optional)</label>
                      <input
                        value={newAddr.apartment}
                        onChange={(e) => setNewAddr({ ...newAddr, apartment: e.target.value })}
                        placeholder="Near Lotus Park"
                      />
                    </div>
                    <div className={styles.inputField}>
                      <label>City</label>
                      <input
                        required
                        value={newAddr.city}
                        onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                        placeholder="Mumbai"
                      />
                    </div>
                    <div className={styles.inputField}>
                      <label>State</label>
                      <input
                        required
                        value={newAddr.state}
                        onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                        placeholder="Maharashtra"
                      />
                    </div>
                    <div className={styles.inputField}>
                      <label>Postal Code (PIN)</label>
                      <input
                        required
                        value={newAddr.postalCode}
                        onChange={(e) => setNewAddr({ ...newAddr, postalCode: e.target.value })}
                        placeholder="400001"
                      />
                    </div>
                    <div className={styles.inputField} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        id="isDefault"
                        checked={newAddr.isDefault}
                        onChange={(e) => setNewAddr({ ...newAddr, isDefault: e.target.checked })}
                      />
                      <label htmlFor="isDefault" style={{ cursor: 'pointer' }}>Make default address</label>
                    </div>
                    <div className={styles.formFull}>
                      <button type="submit" className={styles.primaryBtn}>
                        Save Address
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className={styles.addressGrid}>
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`${styles.addressCard} ${addr.isDefault ? styles.addressCardDefault : ''}`}
                  >
                    {addr.isDefault && <span className={styles.defaultBadge}>Default</span>}
                    <p className={styles.addressName}>{addr.fullName}</p>
                    <p className={styles.addressText}>
                      {addr.streetAddress}
                      {addr.apartment ? `, ${addr.apartment}` : ''}
                      <br />
                      {addr.city}, {addr.state} - {addr.postalCode}
                      <br />
                      Phone: {addr.phone}
                    </p>
                    <div className={styles.addressActions}>
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className={styles.actionBtn}
                        style={{ color: '#c53030' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'wishlist' && (
            <div>
              {wishlist.length === 0 ? (
                <div className={styles.emptyState}>
                  <h2 className={styles.emptyTitle}>Your Wishlist is Empty</h2>
                  <p className={styles.emptyText}>
                    Save pieces you love to revisit later or move them to your bag anytime.
                  </p>
                  <Link href="/candles" className={styles.shopBtn}>
                    Explore Collection
                  </Link>
                </div>
              ) : (
                <div className={styles.addressGrid}>
                  {wishlist.map((item) => {
                    let images: string[] = [];
                    try {
                      images = JSON.parse(item.product.images);
                    } catch {
                      images = ['/images/products/sunflower-wax-cluster-yellow.jpg'];
                    }

                    return (
                      <div key={item.id} className={styles.addressCard}>
                        <div className={styles.itemThumb} style={{ width: '100%', height: '180px', marginBottom: '16px' }}>
                          <Image
                            src={images[0] || '/images/products/sunflower-wax-cluster-yellow.jpg'}
                            alt={item.product.name}
                            fill
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                        <p className={styles.itemName}>{item.product.name}</p>
                        <p className={styles.itemPrice} style={{ margin: '8px 0 16px' }}>
                          ₹{(item.product.salePrice ?? item.product.price).toLocaleString('en-IN')}
                        </p>
                        <div className={styles.addressActions}>
                          <button
                            onClick={() => handleMoveToBag(item)}
                            className={styles.primaryBtn}
                            style={{ fontSize: '0.85rem', padding: '8px 16px' }}
                          >
                            Add to Bag
                          </button>
                          <button
                            onClick={() => handleRemoveWishlist(item.product.id)}
                            className={styles.actionBtn}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              {myReviews.length === 0 ? (
                <div className={styles.emptyState}>
                  <h2 className={styles.emptyTitle}>No Reviews Yet</h2>
                  <p className={styles.emptyText}>
                    You haven&apos;t reviewed any handcrafted pieces yet. Visit your completed orders or product pages to share your experience.
                  </p>
                </div>
              ) : (
                <div className={styles.addressGrid}>
                  {myReviews.map((r) => (
                    <div key={r.id} className={styles.addressCard}>
                      <div className={styles.addressHeader}>
                        <Link href={`/product/${r.product.slug}`} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 600 }}>
                          {r.product.name}
                        </Link>
                        <span className={r.isApproved ? styles.defaultBadge : styles.actionBtn}>
                          {r.isApproved ? 'Approved' : 'Pending Review'}
                        </span>
                      </div>
                      <p style={{ margin: '8px 0', fontSize: '0.9rem', color: 'var(--color-clay-600)' }}>
                        {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                      </p>
                      {r.title && <h4 style={{ margin: '4px 0', fontSize: '0.95rem' }}>{r.title}</h4>}
                      <p style={{ margin: '8px 0', fontSize: '0.9rem', color: 'var(--color-charcoal-700)', lineHeight: 1.5 }}>
                        {r.comment}
                      </p>
                      <span style={{ fontSize: '0.75rem', color: '#888' }}>
                        {new Date(r.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className={styles.formCard}>
              <h3 className={styles.formTitle}>Profile & Security</h3>
              {profileMsg && <div className={styles.successMsg}>{profileMsg}</div>}
              <form onSubmit={handleUpdateProfile} className={styles.formGrid}>
                <div className={`${styles.inputField} ${styles.formFull}`}>
                  <label>Full Name</label>
                  <input
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                  />
                </div>
                <div className={`${styles.inputField} ${styles.formFull}`}>
                  <label>Email Address</label>
                  <input value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
                </div>
                <div className={`${styles.inputField} ${styles.formFull}`}>
                  <label>Phone Number</label>
                  <input
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className={styles.inputField}>
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Leave blank to keep same"
                  />
                </div>
                <div className={styles.inputField}>
                  <label>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                  />
                </div>
                <div className={styles.formFull}>
                  <button type="submit" className={styles.primaryBtn}>
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
        <OrderCancelModal
          isOpen={!!cancellingOrder}
          orderNumber={cancellingOrder?.orderNumber || ''}
          paymentMethod={cancellingOrder?.paymentMethod || 'COD'}
          totalAmount={cancellingOrder?.totalAmount || 0}
          onClose={() => setCancellingOrder(null)}
          onConfirm={handleConfirmCancel}
        />

        <OrderReturnModal
          isOpen={!!returningOrder}
          orderNumber={returningOrder?.orderNumber || ''}
          items={returningOrder?.items || []}
          onClose={() => setReturningOrder(null)}
          onConfirm={handleConfirmReturn}
        />

        <OrderInvoiceModal
          isOpen={!!invoicingOrder}
          order={invoicingOrder}
          customerName={user?.name}
          customerEmail={user?.email}
          onClose={() => setInvoicingOrder(null)}
        />
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.page}>
          <div className="container">
            <p>Loading your account details...</p>
          </div>
        </div>
      }
    >
      <AccountContent />
    </Suspense>
  );
}
