'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import styles from './page.module.css';

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

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phone: '',
    streetAddress: '',
    apartment: '',
    city: '',
    state: '',
    postalCode: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [customerNotes, setCustomerNotes] = useState('');
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [shippingRate, setShippingRate] = useState(99);
  const [freeThreshold, setFreeThreshold] = useState(1499);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const shippingCharges = subtotal >= freeThreshold || subtotal === 0 ? 0 : shippingRate;
  const discountAmount = appliedPromo ? appliedPromo.discount : 0;
  const totalAmount = Math.max(0, subtotal + shippingCharges - discountAmount);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setShippingRate(Number(data.settings.shippingFlatRate) || 99);
          setFreeThreshold(Number(data.settings.freeShippingThreshold) || 1499);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchAddresses = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/account/addresses');
        if (!res.ok) {
          setIsGuest(true);
          setShowNewAddress(true);
          return;
        }
        const data = await res.json();
        if (data.addresses && data.addresses.length > 0) {
          setAddresses(data.addresses);
          const def = data.addresses.find((a: Address) => a.isDefault);
          if (def) {
            setSelectedAddressId(def.id);
          } else {
            setSelectedAddressId(data.addresses[0].id);
          }
        } else {
          setShowNewAddress(true);
        }
      } catch {
        setIsGuest(true);
        setShowNewAddress(true);
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [router]);

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return;
    setPromoError(null);
    setPromoSuccess(null);

    try {
      const res = await fetch('/api/promotions/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCodeInput.trim(),
          orderAmount: subtotal,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPromoError(data.error || 'Invalid promo code');
        setAppliedPromo(null);
      } else {
        setAppliedPromo({ code: data.code, discount: data.discount });
        setPromoSuccess(`Applied: ₹${data.discount} discount!`);
      }
    } catch {
      setPromoError('Failed to verify promo code');
    }
  };

  const handleCreateNewAddress = async () => {
    const { fullName, phone, streetAddress, city, state, postalCode } = newAddress;
    if (!fullName || !phone || !streetAddress || !city || !state || !postalCode) {
      alert('Please fill all required address fields');
      return null;
    }

    try {
      const res = await fetch('/api/account/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddress),
      });
      const data = await res.json();
      if (res.ok && data.address) {
        setAddresses((prev) => [...prev, data.address]);
        setSelectedAddressId(data.address.id);
        setShowNewAddress(false);
        return data.address;
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      alert('Your cart is empty');
      return;
    }

    let addressToUse: Address | undefined;

    if (isGuest) {
      const { fullName, phone, streetAddress, city, state, postalCode, apartment } = newAddress;
      if (!guestEmail || !guestEmail.includes('@')) {
        alert('Please provide a valid email address for order confirmation');
        return;
      }
      if (!fullName || !phone || !streetAddress || !city || !state || !postalCode) {
        alert('Please fill all required address fields');
        return;
      }
      addressToUse = {
        id: 'guest_addr',
        fullName,
        phone,
        streetAddress,
        apartment,
        city,
        state,
        postalCode,
        country: 'India',
        isDefault: false,
      };
    } else if (showNewAddress || !selectedAddressId) {
      const created = await handleCreateNewAddress();
      if (!created) return;
      addressToUse = created;
    } else {
      addressToUse = addresses.find((a) => a.id === selectedAddressId);
    }

    if (!addressToUse) {
      alert('Please select or provide a delivery address');
      return;
    }

    setPlacingOrder(true);

    try {
      const res = await fetch('/api/orders/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            qty: i.qty,
            image: i.image,
            selectedFragrance: i.selectedFragrance,
            selectedColor: i.selectedColor,
            selectedSize: i.selectedSize,
            customNotes: i.customNotes,
          })),
          shippingAddress: {
            fullName: addressToUse.fullName,
            phone: addressToUse.phone,
            streetAddress: addressToUse.streetAddress,
            apartment: addressToUse.apartment,
            city: addressToUse.city,
            state: addressToUse.state,
            postalCode: addressToUse.postalCode,
            country: addressToUse.country,
          },
          guestEmail: isGuest ? guestEmail.trim() : undefined,
          guestPhone: isGuest ? addressToUse.phone.trim() : undefined,
          paymentMethod,
          promoCode: appliedPromo?.code,
          customerNotes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Failed to place order');
        setPlacingOrder(false);
        return;
      }

      clearCart();
      router.push(`/order-confirmation/${data.order.orderNumber}`);
    } catch {
      alert('An unexpected error occurred while placing your order.');
      setPlacingOrder(false);
    }
  };

  if (items.length === 0 && !placingOrder) {
    return (
      <div className={styles.page}>
        <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
          <h1 className={styles.title}>Your Bag is Empty</h1>
          <p style={{ margin: '16px 0 24px' }}>Add pieces to your bag before proceeding to checkout.</p>
          <Link href="/candles" className={styles.promoBtn} style={{ textDecoration: 'none', display: 'inline-block' }}>
            Shop Candles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <header className={styles.header}>
          <p className={styles.eyebrow}>Secure Artisan Checkout</p>
          <h1 className={styles.title}>Finalize Your Order</h1>
        </header>

        <div className={styles.layout}>
          <div>
            {isGuest && (
              <div className={styles.guestBanner}>
                <div>
                  <strong>Checking out as Guest</strong>
                  <p>Want to track orders and save addresses for next time?</p>
                </div>
                <Link href="/login?redirect=/checkout" className={styles.guestSignInLink}>
                  Sign In
                </Link>
              </div>
            )}

            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>1. Delivery Address</h2>

              {!isGuest && !showNewAddress && addresses.length > 0 && (
                <div className={styles.addressList}>
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`${styles.addressOption} ${selectedAddressId === addr.id ? styles.addressOptionActive : ''}`}
                    >
                      <input
                        type="radio"
                        name="addressSelection"
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                      />
                      <div>
                        <p className={styles.addressName}>
                          {addr.fullName} · {addr.phone}
                        </p>
                        <p className={styles.addressDetail}>
                          {addr.streetAddress}
                          {addr.apartment ? `, ${addr.apartment}` : ''}, {addr.city}, {addr.state} - {addr.postalCode}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {!isGuest && (
                <button
                  type="button"
                  onClick={() => setShowNewAddress(!showNewAddress)}
                  className={styles.addAddressBtn}
                >
                  {showNewAddress ? 'Select from Saved Addresses' : '+ Deliver to a New Address'}
                </button>
              )}

              {(isGuest || showNewAddress) && (
                <div className={styles.formGrid}>
                  {isGuest && (
                    <div className={`${styles.inputField} ${styles.formFull}`}>
                      <label>Email Address (for order updates and receipts)</label>
                      <input
                        type="email"
                        required
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="collector@example.com"
                      />
                    </div>
                  )}
                  <div className={styles.inputField}>
                    <label>Recipient Name</label>
                    <input
                      required
                      value={newAddress.fullName}
                      onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                      placeholder="Priya Verma"
                    />
                  </div>
                  <div className={styles.inputField}>
                    <label>Phone Number</label>
                    <input
                      required
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div className={`${styles.inputField} ${styles.formFull}`}>
                    <label>Street Address</label>
                    <input
                      required
                      value={newAddress.streetAddress}
                      onChange={(e) => setNewAddress({ ...newAddress, streetAddress: e.target.value })}
                      placeholder="Flat, building, street, area"
                    />
                  </div>
                  <div className={`${styles.inputField} ${styles.formFull}`}>
                    <label>Apartment / Landmark (Optional)</label>
                    <input
                      value={newAddress.apartment}
                      onChange={(e) => setNewAddress({ ...newAddress, apartment: e.target.value })}
                      placeholder="Opposite City Library"
                    />
                  </div>
                  <div className={styles.inputField}>
                    <label>City</label>
                    <input
                      required
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      placeholder="Mumbai"
                    />
                  </div>
                  <div className={styles.inputField}>
                    <label>State</label>
                    <input
                      required
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      placeholder="Maharashtra"
                    />
                  </div>
                  <div className={styles.inputField}>
                    <label>Postal Code (PIN)</label>
                    <input
                      required
                      value={newAddress.postalCode}
                      onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                      placeholder="400001"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>2. Payment Method</h2>
              <div className={styles.paymentOptions}>
                <label
                  className={`${styles.paymentOption} ${paymentMethod === 'COD' ? styles.paymentOptionActive : ''}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                  />
                  <div>
                    <p className={styles.paymentTitle}>Cash on Delivery (COD)</p>
                    <p className={styles.paymentDesc}>Pay in cash upon doorstep delivery. No extra fee.</p>
                  </div>
                </label>

                <label
                  className={`${styles.paymentOption} ${paymentMethod === 'ONLINE' ? styles.paymentOptionActive : ''}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="ONLINE"
                    checked={paymentMethod === 'ONLINE'}
                    onChange={() => setPaymentMethod('ONLINE')}
                  />
                  <div>
                    <p className={styles.paymentTitle}>Online Payment (UPI, Cards, NetBanking)</p>
                    <p className={styles.paymentDesc}>Safe instant online checkout simulation.</p>
                  </div>
                </label>
              </div>
            </div>

            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>3. Special Instructions or Gift Note</h2>
              <div className={styles.inputField}>
                <input
                  type="text"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="e.g., Leave package with security guard, or wrap for birthday gift"
                />
              </div>
            </div>
          </div>

          <div className={styles.summaryCol}>
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>Order Summary</h2>

              <div>
                {items.map((item) => (
                  <div key={item.productId} className={styles.orderItemRow}>
                    <div className={styles.itemThumb}>
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="52px"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <div className={styles.itemInfo}>
                      <p className={styles.itemName}>{item.name}</p>
                      <p className={styles.itemMeta}>
                        Qty: {item.qty}
                        {item.selectedFragrance ? ` · ${item.selectedFragrance}` : ''}
                        {item.selectedColor ? ` · ${item.selectedColor}` : ''}
                      </p>
                    </div>
                    <p className={styles.itemPrice}>
                      ₹{(item.price * item.qty).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>

              <div className={styles.promoRow}>
                <input
                  type="text"
                  className={styles.promoInput}
                  placeholder="Promo Code (e.g. MEADOW10)"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className={styles.promoBtn}
                >
                  Apply
                </button>
              </div>

              {promoSuccess && <p className={styles.promoSuccess}>{promoSuccess}</p>}
              {promoError && <p className={styles.promoError}>{promoError}</p>}

              <div className={styles.calcRow}>
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              <div className={styles.calcRow}>
                <span>Shipping</span>
                <span>{shippingCharges === 0 ? 'FREE' : `₹${shippingCharges}`}</span>
              </div>

              {discountAmount > 0 && (
                <div className={styles.calcRow} style={{ color: '#2f855a' }}>
                  <span>Discount ({appliedPromo?.code})</span>
                  <span>−₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className={styles.calcTotal}>
                <span>Total</span>
                <span>₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={placingOrder || loading}
                className={styles.placeOrderBtn}
              >
                {placingOrder ? 'Confirming Order...' : 'Place Order Now'}
              </button>

              <p className={styles.orderNote}>
                By placing your order, you agree to Meadow Mist small-batch fulfillment terms.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
