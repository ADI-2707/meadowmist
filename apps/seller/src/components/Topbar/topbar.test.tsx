import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Topbar, getSellerPageTitle, PAGE_TITLES } from './Topbar';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/products'),
}));

describe('Seller Topbar Page Title Resolution', () => {
  it('resolves standard mapped page titles correctly', () => {
    Object.entries(PAGE_TITLES).forEach(([route, expectedTitle]) => {
      expect(getSellerPageTitle(route)).toBe(expectedTitle);
    });
  });

  it('resolves dynamic order detail routes', () => {
    expect(getSellerPageTitle('/orders/ord_9999')).toBe('Order Details');
    expect(getSellerPageTitle('/orders/12345/fulfillment')).toBe('Order Details');
  });

  it('resolves dynamic product edit routes', () => {
    expect(getSellerPageTitle('/products/amber-candle-123/edit')).toBe('Edit Product');
    expect(getSellerPageTitle('/products/ceramic-pot/edit')).toBe('Edit Product');
  });

  it('returns fallback title for unknown or arbitrary routes', () => {
    expect(getSellerPageTitle('/unknown-route')).toBe('Seller Management');
    expect(getSellerPageTitle('/reports/custom')).toBe('Seller Management');
  });
});

describe('Seller Topbar Component Rendering & Interactions', () => {
  const onOpenMobile = vi.fn();
  const onLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title and live sync status', () => {
    render(<Topbar onOpenMobile={onOpenMobile} onLogout={onLogout} />);

    expect(screen.getByText('Product Catalog')).toBeDefined();
    expect(screen.getByText('Live Sync')).toBeDefined();
  });

  it('renders storefront link with external attributes', () => {
    render(<Topbar onOpenMobile={onOpenMobile} onLogout={onLogout} />);

    const storefrontLink = screen.getByRole('link', { name: /storefront/i });
    expect(storefrontLink).toBeDefined();
    expect(storefrontLink.getAttribute('target')).toBe('_blank');
  });

  it('renders mobile menu button and calls onOpenMobile when clicked', () => {
    render(<Topbar onOpenMobile={onOpenMobile} onLogout={onLogout} />);

    const menuBtn = screen.getByRole('button', { name: /open menu/i });
    expect(menuBtn).toBeDefined();

    fireEvent.click(menuBtn);
    expect(onOpenMobile).toHaveBeenCalledTimes(1);
  });

  it('renders sign out button and triggers onLogout callback', () => {
    render(<Topbar onOpenMobile={onOpenMobile} onLogout={onLogout} />);

    const logoutBtn = screen.getByRole('button', { name: /sign out/i });
    expect(logoutBtn).toBeDefined();

    fireEvent.click(logoutBtn);
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('does not render any sidebar collapse/expand toggle button in topbar', () => {
    render(<Topbar onOpenMobile={onOpenMobile} onLogout={onLogout} />);

    const expandBtn = screen.queryByRole('button', { name: /expand sidebar/i });
    const collapseBtn = screen.queryByRole('button', { name: /collapse sidebar/i });

    expect(expandBtn).toBeNull();
    expect(collapseBtn).toBeNull();
  });

  it('renders with topbarInner container for centered layout alignment', () => {
    const { container } = render(<Topbar onOpenMobile={onOpenMobile} onLogout={onLogout} />);
    const inner = container.querySelector('[class*="topbarInner"]');
    expect(inner).toBeDefined();
    expect(inner).not.toBeNull();
  });
});
