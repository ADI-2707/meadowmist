'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';
import CartDrawer from '@/components/CartDrawer/CartDrawer';
import HeaderSearchBar from './HeaderSearchBar';
import AccountDropdown from './AccountDropdown';
import styles from './SiteHeader.module.css';

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const items = useCartStore((s) => s.items);
  const isDrawerOpen = useCartStore((s) => s.isDrawerOpen);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const closeDrawer = useCartStore((s) => s.closeDrawer);
  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 24);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`} role="banner">
        <div className={`container ${styles.inner}`}>
          <div className={styles.leftGroup}>
            <Link href="/" className={styles.logo} aria-label="Meadow Mist — Home">
              <Image
                src="/images/logo.jpg"
                alt="Meadow Mist Logo"
                width={40}
                height={40}
                className={styles.logoImg}
                priority
              />
              <span className={styles.logoWordmark}>
                <span className={styles.logoMeadow}>MEADOW</span>
                <span className={styles.logoMist}>Mist</span>
              </span>
            </Link>
          </div>

          <div className={styles.searchSection}>
            <HeaderSearchBar />
          </div>

          <div className={styles.actions}>
            <AccountDropdown />

            <button
              id="cart-button"
              type="button"
              className={`${styles.cartButton} ${styles.bagButton}`}
              onClick={openDrawer}
              aria-label={`Open cart — ${itemCount} item${itemCount !== 1 ? 's' : ''}`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                width="20"
                height="20"
              >
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              {itemCount > 0 && (
                <span className={styles.cartBadge} aria-hidden="true">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <CartDrawer open={isDrawerOpen} onClose={closeDrawer} />
    </>
  );
}
