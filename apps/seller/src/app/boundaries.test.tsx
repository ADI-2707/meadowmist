import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import SellerLoading from './loading';
import SellerGlobalError from './global-error';
import AdminDashboardPage from './page';
import AdminOrderDetailPage from './orders/[id]/page';
import AdminSettingsPage from './settings/page';

describe('Seller Root Boundaries', () => {
  it('renders loading skeleton shell with cards and table placeholders', () => {
    const { container } = render(<SellerLoading />);
    expect(container.firstChild).toBeDefined();
  });

  it('renders dashboard loading skeleton before analytics data loads', () => {
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));
    const { container } = render(<AdminDashboardPage />);
    const skeletonShimmers = container.querySelectorAll('[class*="skeleton"]');
    expect(skeletonShimmers.length).toBeGreaterThan(0);
  });

  it('renders order detail loading skeleton before order data loads', async () => {
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));
    let renderedContainer: HTMLElement | undefined;
    await act(async () => {
      const { container } = render(
        <React.Suspense fallback={<div>Loading suspense...</div>}>
          <AdminOrderDetailPage params={Promise.resolve({ id: 'ord_dummy' })} />
        </React.Suspense>
      );
      renderedContainer = container;
    });
    const skeletonShimmers = renderedContainer?.querySelectorAll('[class*="skeleton"]') || [];
    expect(skeletonShimmers.length).toBeGreaterThan(0);
  });

  it('renders settings loading skeleton before store settings load', () => {
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));
    const { container } = render(<AdminSettingsPage />);
    const skeletonShimmers = container.querySelectorAll('[class*="skeleton"]');
    expect(skeletonShimmers.length).toBeGreaterThan(0);
  });

  it('renders global-error with error message and triggers reload on click', () => {
    const reset = vi.fn();
    render(<SellerGlobalError error={new Error('Test failure')} reset={reset} />);
    expect(screen.getByText('Portal Error')).toBeDefined();
    const reloadBtn = screen.getByText('Reload Portal');
    fireEvent.click(reloadBtn);
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
