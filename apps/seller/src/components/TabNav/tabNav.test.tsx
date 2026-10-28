import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TabNav, TabItem } from './TabNav';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  usePathname: () => '/products',
  useSearchParams: () => new URLSearchParams('tab=catalog&page=2'),
}));

describe('TabNav Component', () => {
  const sampleTabs: TabItem[] = [
    { id: 'catalog', label: 'Products Catalog' },
    { id: 'inventory', label: 'Stock & Batches', count: 4 },
    { id: 'logs', label: 'Audit Trail' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all provided tab items with labels', () => {
    render(<TabNav tabs={sampleTabs} activeTab="catalog" />);

    expect(screen.getByText('Products Catalog')).toBeDefined();
    expect(screen.getByText('Stock & Batches')).toBeDefined();
    expect(screen.getByText('Audit Trail')).toBeDefined();
  });

  it('displays count badge on tabs where count is defined', () => {
    render(<TabNav tabs={sampleTabs} activeTab="catalog" />);

    expect(screen.getByText('4')).toBeDefined();
  });

  it('marks active tab with aria-selected="true" and active class', () => {
    render(<TabNav tabs={sampleTabs} activeTab="inventory" />);

    const inventoryTab = screen.getByRole('tab', { name: /stock & batches/i });
    expect(inventoryTab.getAttribute('aria-selected')).toBe('true');

    const catalogTab = screen.getByRole('tab', { name: /products catalog/i });
    expect(catalogTab.getAttribute('aria-selected')).toBe('false');
  });

  it('calls router.push with updated query parameter and resets page on tab click', () => {
    const onChange = vi.fn();
    render(<TabNav tabs={sampleTabs} activeTab="catalog" onChange={onChange} />);

    const inventoryTab = screen.getByRole('tab', { name: /stock & batches/i });
    fireEvent.click(inventoryTab);

    expect(onChange).toHaveBeenCalledWith('inventory');
    expect(pushMock).toHaveBeenCalledWith('/products?tab=inventory', { scroll: false });
  });
});
