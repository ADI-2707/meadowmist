'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Megaphone,
  Settings,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import styles from './Sidebar.module.css';

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  exact?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/products', label: 'Catalog & Stock', icon: Package },
  { href: '/orders', label: 'Orders & Logistics', icon: ShoppingBag },
  { href: '/customers', label: 'Customers & Support', icon: Users },
  { href: '/marketing', label: 'Marketing & Store', icon: Megaphone },
];

export function isSidebarItemActive(item: NavItem, pathname: string): boolean {
  if (item.exact) {
    return pathname === item.href;
  }
  if (item.href === '/products') {
    return pathname.startsWith('/products') || pathname.startsWith('/inventory');
  }
  if (item.href === '/customers') {
    return (
      pathname.startsWith('/customers') ||
      pathname.startsWith('/reviews') ||
      pathname.startsWith('/enquiries')
    );
  }
  if (item.href === '/marketing') {
    return (
      pathname.startsWith('/marketing') ||
      pathname.startsWith('/content') ||
      pathname.startsWith('/promotions')
    );
  }
  return pathname.startsWith(item.href);
}

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const storefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3000';
  const isSettingsActive = pathname.startsWith('/settings');

  return (
    <>
      <div
        className={`${styles.backdrop} ${mobileOpen ? styles.backdropVisible : ''}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside
        className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''} ${
          mobileOpen ? styles.sidebarMobileOpen : ''
        }`}
      >
        <div className={styles.brand}>
          <Link
            href="/"
            onClick={onCloseMobile}
            className={styles.brandLink}
            title={collapsed && !mobileOpen ? 'Meadow Mist Seller Portal' : undefined}
          >
            <Image
              src="/images/logo.jpg"
              alt="Meadow Mist"
              width={30}
              height={30}
              className={styles.brandLogo}
            />
            {(!collapsed || mobileOpen) && (
              <div className={styles.brandText}>
                <span className={styles.brandName}>Meadow Mist</span>
                <span className={styles.brandBadge}>Seller Portal</span>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={onToggleCollapse}
            className={styles.topCollapseBtn}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={16} />}
          </button>

          <button
            type="button"
            className={styles.mobileCloseBtn}
            onClick={onCloseMobile}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = isSidebarItemActive(item, pathname);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                title={collapsed && !mobileOpen ? item.label : undefined}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
              >
                <span className={styles.navIcon}>
                  <Icon size={18} />
                </span>
                {(!collapsed || mobileOpen) && (
                  <span className={styles.navLabel}>{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link
            href="/settings"
            onClick={onCloseMobile}
            title={collapsed && !mobileOpen ? 'Store Settings' : undefined}
            className={`${styles.navLink} ${isSettingsActive ? styles.navLinkActive : ''}`}
          >
            <span className={styles.navIcon}>
              <Settings size={18} />
            </span>
            {(!collapsed || mobileOpen) && (
              <span className={styles.navLabel}>Store Settings</span>
            )}
          </Link>

          <a
            href={storefrontUrl}
            target="_blank"
            rel="noreferrer"
            className={styles.viewStoreBtn}
            title={collapsed && !mobileOpen ? 'View Storefront' : undefined}
          >
            <ExternalLink size={14} />
            {(!collapsed || mobileOpen) && <span>View Storefront</span>}
          </a>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
