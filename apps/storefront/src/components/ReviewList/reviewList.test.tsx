import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReviewList from './ReviewList';
import type { Review } from '@meadowmist/shared';

describe('ReviewList Component', () => {
  it('renders empty state message when review array is empty', () => {
    render(<ReviewList reviews={[]} />);

    expect(
      screen.getByText(/no reviews yet for this handcrafted piece/i)
    ).toBeDefined();
  });

  it('renders review card with user name, verified badge, rating, title, and comment', () => {
    const mockReviews: Review[] = [
      {
        id: 'rev-1',
        productId: 'prod-1',
        userId: 'usr-1',
        rating: 5,
        title: 'Exquisite Fragrance',
        comment: 'The scent fills the room beautifully without being overpowering.',
        isVerifiedPurchase: true,
        isApproved: true,
        createdAt: '2026-09-10T12:00:00.000Z',
        user: {
          name: 'Priya Sharma',
          email: 'priya@example.com',
        },
      },
    ];

    render(<ReviewList reviews={mockReviews} />);

    expect(screen.getByText('Priya Sharma')).toBeDefined();
    expect(screen.getByText(/verified collector/i)).toBeDefined();
    expect(screen.getByText('Exquisite Fragrance')).toBeDefined();
    expect(
      screen.getByText('The scent fills the room beautifully without being overpowering.')
    ).toBeDefined();
  });

  it('renders fallback author name and omits verified badge when not verified', () => {
    const mockReviews: Review[] = [
      {
        id: 'rev-2',
        productId: 'prod-1',
        userId: 'usr-2',
        rating: 4,
        comment: 'Nice handcrafted packaging.',
        isVerifiedPurchase: false,
        isApproved: true,
        createdAt: '2026-09-12T12:00:00.000Z',
      },
    ];

    render(<ReviewList reviews={mockReviews} />);

    expect(screen.getByText('Artisan Collector')).toBeDefined();
    expect(screen.queryByText(/verified collector/i)).toBeNull();
    expect(screen.getByText('Nice handcrafted packaging.')).toBeDefined();
  });

  it('renders aspect pills, images, and artisan reply box', () => {
    const onPhotoClick = vi.fn();
    const mockReviews: Review[] = [
      {
        id: 'rev-3',
        productId: 'prod-1',
        userId: 'usr-3',
        rating: 5,
        comment: 'Exceptional craftsmanship and smooth burn.',
        isVerifiedPurchase: true,
        isApproved: true,
        createdAt: '2026-09-15T12:00:00.000Z',
        images: ['/uploads/reviews/photo-1.jpg'],
        aspectRatings: { scentThrow: 5, burnLongevity: 5 },
        sellerReply: 'Thank you for supporting our handmade studio!',
        sellerRepliedAt: '2026-09-16T10:00:00.000Z',
      },
    ];

    render(<ReviewList reviews={mockReviews} onPhotoClick={onPhotoClick} />);

    expect(screen.getByText(/Scent Throw:/)).toBeDefined();
    expect(screen.getByText(/Burn Longevity:/)).toBeDefined();
    expect(screen.getByText(/Artisan Response — Meadow Mist Studio/)).toBeDefined();
    expect(screen.getByText('Thank you for supporting our handmade studio!')).toBeDefined();

    const photoBtn = screen.getByLabelText('View full customer image 1');
    fireEvent.click(photoBtn);
    expect(onPhotoClick).toHaveBeenCalledWith('/uploads/reviews/photo-1.jpg', mockReviews[0]);
  });

  it('interacts with helpful voting button', async () => {
    const mockReviews: Review[] = [
      {
        id: 'rev-4',
        productId: 'prod-1',
        userId: 'usr-4',
        rating: 5,
        comment: 'Very helpful review details here.',
        isVerifiedPurchase: true,
        isApproved: true,
        createdAt: '2026-09-15T12:00:00.000Z',
        helpfulCount: 3,
        userVotedHelpful: false,
      },
    ];

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ helpfulCount: 4, userVotedHelpful: true }),
    } as any);

    render(<ReviewList reviews={mockReviews} productId="prod-1" />);

    const helpfulBtn = screen.getByLabelText(/Mark review as helpful/);
    expect(screen.getByText('Helpful (3)')).toBeDefined();

    fireEvent.click(helpfulBtn);

    await waitFor(() => {
      expect(screen.getByText('Helpful (4)')).toBeDefined();
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/products/prod-1/reviews/rev-4/helpful',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
