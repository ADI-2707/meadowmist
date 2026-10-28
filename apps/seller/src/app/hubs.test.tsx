import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import InventoryRedirectPage from './inventory/page';
import ReviewsRedirectPage from './reviews/page';
import EnquiriesRedirectPage from './enquiries/page';
import PromotionsRedirectPage from './promotions/page';
import ContentRedirectPage from './content/page';
import AdminProductsPage from './products/page';
import AdminOrdersPage from './orders/page';
import AdminCustomersPage from './customers/page';
import AdminMarketingPage from './marketing/page';

const mockRedirect = vi.fn();

vi.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/products',
  useSearchParams: () => new URLSearchParams(''),
}));

vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} alt={props.alt || ''} />,
}));

describe('Seller Hub Redirect Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects /inventory to /products?tab=inventory', () => {
    InventoryRedirectPage();
    expect(mockRedirect).toHaveBeenCalledWith('/products?tab=inventory');
  });

  it('redirects /reviews to /customers?tab=reviews', () => {
    ReviewsRedirectPage();
    expect(mockRedirect).toHaveBeenCalledWith('/customers?tab=reviews');
  });

  it('redirects /enquiries to /customers?tab=inbox', () => {
    EnquiriesRedirectPage();
    expect(mockRedirect).toHaveBeenCalledWith('/customers?tab=inbox');
  });

  it('redirects /promotions to /marketing?tab=promotions', () => {
    PromotionsRedirectPage();
    expect(mockRedirect).toHaveBeenCalledWith('/marketing?tab=promotions');
  });

  it('redirects /content to /marketing?tab=banners', () => {
    ContentRedirectPage();
    expect(mockRedirect).toHaveBeenCalledWith('/marketing?tab=banners');
  });
});

describe('Seller Domain Hubs Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ products: [], orders: [], customers: [], promotions: [], summary: {} }),
        })
      )
    );
  });

  it('renders Catalog & Stock Hub with tabs and header', () => {
    render(<AdminProductsPage />);
    expect(screen.getByText('Catalog & Stock')).toBeDefined();
    expect(screen.getByText('Products Catalog')).toBeDefined();
    expect(screen.getByText('Live Stock & Batches')).toBeDefined();
    expect(screen.getByText('Stock Movement Logs')).toBeDefined();
  });

  it('renders Orders & Logistics Hub with tabs and header', () => {
    render(<AdminOrdersPage />);
    expect(screen.getByText('Orders & Logistics')).toBeDefined();
    expect(screen.getByText('Active Orders')).toBeDefined();
    expect(screen.getByText('Dispatched & Tracking')).toBeDefined();
    expect(screen.getByText('Returns & Refunds')).toBeDefined();
  });

  it('renders Customers & Support Hub with tabs and header', () => {
    render(<AdminCustomersPage />);
    expect(screen.getByText('Customers & Support')).toBeDefined();
    expect(screen.getByText('Clientele Directory')).toBeDefined();
    expect(screen.getByText('Support Inquiries')).toBeDefined();
    expect(screen.getByText('Customer Reviews')).toBeDefined();
  });

  it('renders Marketing & Storefront Hub with tabs and header', () => {
    render(<AdminMarketingPage />);
    expect(screen.getByText('Marketing & Storefront')).toBeDefined();
    expect(screen.getByText('Promotions & Discounts')).toBeDefined();
    expect(screen.getByText('Hero & Showcase Banners')).toBeDefined();
    expect(screen.getByText('Studio Journal')).toBeDefined();
    expect(screen.getByText('Store FAQs')).toBeDefined();
  });
});
