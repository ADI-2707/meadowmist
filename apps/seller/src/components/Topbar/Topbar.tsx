'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import {
  Menu,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import styles from './Topbar.module.css';

interface TopbarProps {
  onOpenMobile: () => void;
  onLogout: () => void;
}

export const PAGE_TITLES: Record<string, string> = {
  '/': 'Overview & Analytics',
  '/products': 'Product Catalog',
  '/products/new': 'Add New Product',
  '/inventory': 'Inventory Stock Management',
  '/orders': 'Orders & Fulfillment',
  '/customers': 'Customer Directory',
  '/enquiries': 'Customer Enquiries Inbox',
  '/content': 'Store Content CMS',
  '/promotions': 'Promotions & Coupons',
  '/marketing': 'Marketing & Storefront',
  '/settings': 'Store Settings',
};

export function getSellerPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/products/') && pathname.endsWith('/edit')) return 'Edit Product';
  if (pathname.startsWith('/orders/')) return 'Order Details';
  return 'Seller Management';
}

export function Topbar({
  onOpenMobile,
  onLogout,
}: TopbarProps) {
  const pathname = usePathname();
  const storefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3000';

  return (
    <header className={styles.topbar}>
      <div className={styles.topbarInner}>
        <div className={styles.leftGroup}>
          <button
            type="button"
            onClick={onOpenMobile}
            className={styles.menuBtn}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <h1 className={styles.pageTitle}>{getSellerPageTitle(pathname)}</h1>

          <div className={styles.statusIndicator}>
            <span className={styles.statusDot} />
            <span>Live Sync</span>
          </div>
        </div>

        <div className={styles.rightGroup}>
          <a
            href={storefrontUrl}
            target="_blank"
            rel="noreferrer"
            className={styles.storeLink}
          >
            <ExternalLink size={14} />
            <span>Storefront</span>
          </a>

          <div className={styles.profilePill}>
            <div className={styles.profileAvatar}>MM</div>
            <span>Single Seller</span>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className={styles.logoutBtn}
            aria-label="Sign Out"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
