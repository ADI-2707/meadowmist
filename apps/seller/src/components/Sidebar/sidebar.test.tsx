import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar, NAV_ITEMS, isSidebarItemActive } from './Sidebar';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/products'),
}));

vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} alt={props.alt || ''} />,
}));

describe('Seller Sidebar Navigation Helpers', () => {
  it('contains the 5 consolidated seller domain hub navigation items', () => {
    expect(NAV_ITEMS.length).toBe(5);

    const labels = NAV_ITEMS.map((i) => i.label);
    expect(labels).toContain('Dashboard');
    expect(labels).toContain('Catalog & Stock');
    expect(labels).toContain('Orders & Logistics');
    expect(labels).toContain('Customers & Support');
    expect(labels).toContain('Marketing & Store');
  });

  it('matches Dashboard only on exact root pathname', () => {
    const dashboardItem = NAV_ITEMS.find((i) => i.href === '/')!;
    expect(dashboardItem.exact).toBe(true);

    expect(isSidebarItemActive(dashboardItem, '/')).toBe(true);
    expect(isSidebarItemActive(dashboardItem, '/products')).toBe(false);
    expect(isSidebarItemActive(dashboardItem, '/orders/123')).toBe(false);
  });

  it('matches section routes and their nested or alias child paths by prefix', () => {
    const productsItem = NAV_ITEMS.find((i) => i.href === '/products')!;
    expect(isSidebarItemActive(productsItem, '/products')).toBe(true);
    expect(isSidebarItemActive(productsItem, '/products/new')).toBe(true);
    expect(isSidebarItemActive(productsItem, '/products/candle-123/edit')).toBe(true);
    expect(isSidebarItemActive(productsItem, '/inventory')).toBe(true);

    const ordersItem = NAV_ITEMS.find((i) => i.href === '/orders')!;
    expect(isSidebarItemActive(ordersItem, '/orders')).toBe(true);
    expect(isSidebarItemActive(ordersItem, '/orders/ord_456')).toBe(true);
    expect(isSidebarItemActive(ordersItem, '/customers')).toBe(false);

    const customersItem = NAV_ITEMS.find((i) => i.href === '/customers')!;
    expect(isSidebarItemActive(customersItem, '/customers')).toBe(true);
    expect(isSidebarItemActive(customersItem, '/reviews')).toBe(true);
    expect(isSidebarItemActive(customersItem, '/enquiries')).toBe(true);

    const marketingItem = NAV_ITEMS.find((i) => i.href === '/marketing')!;
    expect(isSidebarItemActive(marketingItem, '/marketing')).toBe(true);
    expect(isSidebarItemActive(marketingItem, '/content')).toBe(true);
    expect(isSidebarItemActive(marketingItem, '/promotions')).toBe(true);
  });
});

describe('Seller Sidebar Component Rendering & Interactions', () => {
  const onToggleCollapse = vi.fn();
  const onCloseMobile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders brand details and navigation items when expanded', () => {
    render(
      <Sidebar
        collapsed={false}
        onToggleCollapse={onToggleCollapse}
        mobileOpen={false}
        onCloseMobile={onCloseMobile}
      />
    );

    expect(screen.getByText('Meadow Mist')).toBeDefined();
    expect(screen.getByText('Seller Portal')).toBeDefined();
    expect(screen.getByText('Dashboard')).toBeDefined();
    expect(screen.getByText('Catalog & Stock')).toBeDefined();
    expect(screen.getByText('Orders & Logistics')).toBeDefined();
    expect(screen.getByText('Customers & Support')).toBeDefined();
    expect(screen.getByText('Marketing & Store')).toBeDefined();
    expect(screen.getByText('Store Settings')).toBeDefined();
  });

  it('renders collapse toggle button with "Collapse sidebar" aria-label when expanded and toggles on click', () => {
    render(
      <Sidebar
        collapsed={false}
        onToggleCollapse={onToggleCollapse}
        mobileOpen={false}
        onCloseMobile={onCloseMobile}
      />
    );

    const toggleBtn = screen.getByRole('button', { name: /collapse sidebar/i });
    expect(toggleBtn).toBeDefined();

    fireEvent.click(toggleBtn);
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it('renders collapse toggle button with "Expand sidebar" aria-label when collapsed and toggles on click', () => {
    render(
      <Sidebar
        collapsed={true}
        onToggleCollapse={onToggleCollapse}
        mobileOpen={false}
        onCloseMobile={onCloseMobile}
      />
    );

    const toggleBtn = screen.getByRole('button', { name: /expand sidebar/i });
    expect(toggleBtn).toBeDefined();

    fireEvent.click(toggleBtn);
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it('calls onCloseMobile when mobile backdrop or close button is clicked', () => {
    render(
      <Sidebar
        collapsed={false}
        onToggleCollapse={onToggleCollapse}
        mobileOpen={true}
        onCloseMobile={onCloseMobile}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /close sidebar/i });
    fireEvent.click(closeBtn);
    expect(onCloseMobile).toHaveBeenCalledTimes(1);
  });

  it('renders portal and store versions in sidebar footer when expanded and collapsed', () => {
    const { rerender } = render(
      <Sidebar
        collapsed={false}
        onToggleCollapse={onToggleCollapse}
        mobileOpen={false}
        onCloseMobile={onCloseMobile}
      />
    );

    const versionInfo = screen.getByTestId('sidebar-version-info');
    expect(versionInfo).toBeDefined();
    expect(versionInfo.textContent).toContain('Portal v');
    expect(versionInfo.textContent).toContain('Store v');

    rerender(
      <Sidebar
        collapsed={true}
        onToggleCollapse={onToggleCollapse}
        mobileOpen={false}
        onCloseMobile={onCloseMobile}
      />
    );

    const versionCollapsed = screen.getByTestId('sidebar-version-collapsed');
    expect(versionCollapsed).toBeDefined();
    expect(versionCollapsed.textContent).toContain('v');
  });
});
