'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Search, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import MobileCategoryDrawer from './MobileCategoryDrawer';
const ProductSearchModal = dynamic(
  () => import('@/components/ProductSearchModal/ProductSearchModal'),
  { ssr: false }
);
import styles from './MobileBottomNav.module.css';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const items = useCartStore((s) => s.items);
  const openCartDrawer = useCartStore((s) => s.openDrawer);
  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);

  const isHomeActive = pathname === '/';
  const isCategoryActive = pathname.startsWith('/candles') || pathname.startsWith('/ceramics');

  return (
    <>
      <nav className={styles.navBar} aria-label="Mobile navigation dock">
        <Link
          href="/"
          className={`${styles.navItem} ${isHomeActive ? styles.navItemActive : ''}`}
          aria-label="Home"
        >
          {isHomeActive && <span className={styles.activeIndicator} aria-hidden="true" />}
          <span className={styles.iconWrap}>
            <Home size={20} />
          </span>
          <span className={styles.label}>Home</span>
        </Link>

        <button
          type="button"
          className={`${styles.navItem} ${isCategoryActive ? styles.navItemActive : ''}`}
          onClick={() => setCategoryOpen(true)}
          aria-label="Browse categories"
        >
          {isCategoryActive && <span className={styles.activeIndicator} aria-hidden="true" />}
          <span className={styles.iconWrap}>
            <LayoutGrid size={20} />
          </span>
          <span className={styles.label}>Categories</span>
        </button>

        <button
          type="button"
          className={styles.navItem}
          onClick={() => setSearchOpen(true)}
          aria-label="Search handcrafted catalog"
        >
          <span className={styles.iconWrap}>
            <Search size={20} />
          </span>
          <span className={styles.label}>Search</span>
        </button>

        <button
          type="button"
          className={styles.navItem}
          onClick={openCartDrawer}
          aria-label={`Open shopping bag (${itemCount} items)`}
        >
          <span className={styles.iconWrap}>
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <span className={styles.badge} aria-hidden="true">
                {itemCount}
              </span>
            )}
          </span>
          <span className={styles.label}>Bag</span>
        </button>
      </nav>

      <MobileCategoryDrawer
        isOpen={categoryOpen}
        onClose={() => setCategoryOpen(false)}
      />

      <ProductSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
}
