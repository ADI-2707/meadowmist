import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { CollectorReviews } from './CollectorReviews';

vi.mock('@/components/SectionReveal/SectionReveal', () => ({
  default: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

describe('CollectorReviews Component', () => {
  const mockReviews = [
    {
      id: 'rev-1',
      rating: 5,
      title: 'A fragrant reverie',
      comment: 'Burns cleanly and creates the most calming environment in our library.',
      isVerifiedPurchase: true,
      user: { name: 'Priya Sharma' },
      product: {
        name: 'Himalayan Cedarwood Candle',
        slug: 'himalayan-cedarwood-candle',
        category: 'candle',
      },
    },
    {
      id: 'rev-2',
      rating: 5,
      title: null,
      comment: 'The glaze finish on this vessel is extraordinary.',
      isVerifiedPurchase: false,
      user: null,
      product: null,
    },
  ];

  it('renders null when reviews array is empty', () => {
    const { container } = render(<CollectorReviews reviews={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders section title, subtitle, and review cards', () => {
    render(<CollectorReviews reviews={mockReviews} />);

    expect(screen.getByText('Cherished In Everyday Sanctuaries')).toBeDefined();
    expect(screen.getByText('Words From Collectors')).toBeDefined();
    expect(screen.getByText('Priya Sharma')).toBeDefined();
    expect(screen.getByText('A fragrant reverie')).toBeDefined();
    expect(
      screen.getByText('Burns cleanly and creates the most calming environment in our library.')
    ).toBeDefined();
  });

  it('renders verified collector badge for verified purchases', () => {
    render(<CollectorReviews reviews={mockReviews} />);

    expect(screen.getByText('✓ Verified Collector')).toBeDefined();
  });

  it('renders fallback collector name when user name is not provided', () => {
    render(<CollectorReviews reviews={mockReviews} />);

    expect(screen.getByText('Collector')).toBeDefined();
  });

  it('renders product link when associated product exists', () => {
    render(<CollectorReviews reviews={mockReviews} />);

    const link = screen.getByRole('link', {
      name: /regarding: himalayan cedarwood candle →/i,
    });
    expect(link.getAttribute('href')).toBe('/product/himalayan-cedarwood-candle');
  });
});
