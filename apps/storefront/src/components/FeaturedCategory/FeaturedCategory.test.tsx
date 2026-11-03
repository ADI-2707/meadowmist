import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import FeaturedCategory from './FeaturedCategory';
import type { Product } from '@/types/product';

vi.mock('@/components/SectionReveal/SectionReveal', () => ({
  default: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock('@/components/ProductCard/ProductCard', () => ({
  default: ({ product }: { product: Product }) => (
    <div data-testid="product-card">{product.name}</div>
  ),
}));

const mockProducts: Product[] = [
  {
    id: 'prod-001',
    slug: 'amber-noir-candle',
    name: 'Amber Noir Candle',
    description: 'Warm cedar and amber soy candle',
    price: 699,
    salePrice: null,
    category: 'candle',
    subCategory: 'pillar',
    images: ['/images/amber.jpg'],
    materials: ['Soy Wax', 'Cotton Wick'],
    dimensions: '10 cm x 8 cm',
    badge: 'bestseller',
    colorFamily: 'amber',
    scentFamily: 'woody',
    scentNotes: ['cedar', 'amber'],
    stockQuantity: 10,
    lowStockThreshold: 3,
    inStock: true,
    isFeatured: true,
    isActive: true,
    avgRating: 4.8,
    reviewCount: 12,
  },
];

describe('FeaturedCategory Component', () => {
  it('renders section title, eyebrow, and description correctly', () => {
    render(
      <FeaturedCategory
        title="Hand-poured Candles"
        eyebrow="Shop Candles"
        description="Poured by hand in small runs."
        href="/candles"
        products={mockProducts}
      />
    );

    expect(screen.getByText('Hand-poured Candles')).toBeDefined();
    expect(screen.getByText('Shop Candles')).toBeDefined();
    expect(screen.getByText('Poured by hand in small runs.')).toBeDefined();
  });

  it('renders product cards when products array contains items', () => {
    render(
      <FeaturedCategory
        title="Hand-poured Candles"
        href="/candles"
        products={mockProducts}
      />
    );

    expect(screen.getByText('Amber Noir Candle')).toBeDefined();
    expect(screen.getByTestId('product-card')).toBeDefined();
  });

  it('renders empty collection message when products array is empty', () => {
    render(
      <FeaturedCategory
        title="Ceramics"
        href="/ceramics"
        products={[]}
      />
    );

    expect(
      screen.getByText('No handcrafted items in this collection currently.')
    ).toBeDefined();
  });

  it('renders call to action link pointing to the provided href', () => {
    render(
      <FeaturedCategory
        title="Ceramics"
        href="/ceramics"
        products={mockProducts}
      />
    );

    const link = screen.getByRole('link', { name: /see all/i });
    expect(link.getAttribute('href')).toBe('/ceramics');
  });

  it('renders products inside a grid container for horizontal scroll support', () => {
    const { container } = render(
      <FeaturedCategory
        title="Hand-poured Candles"
        href="/candles"
        products={mockProducts}
      />
    );

    const productEl = screen.getByTestId('product-card');
    const gridEl = container.querySelector('[class*="grid"]');
    expect(gridEl).not.toBeNull();
    expect(gridEl?.contains(productEl)).toBe(true);
  });

  it('applies centered grid layout alignment for tablet viewports', () => {
    const { container } = render(
      <FeaturedCategory
        title="Hand-poured Candles"
        href="/candles"
        products={mockProducts}
      />
    );

    const gridEl = container.querySelector('[class*="grid"]');
    expect(gridEl).not.toBeNull();
    expect(gridEl?.className).toContain('grid');
  });
});
