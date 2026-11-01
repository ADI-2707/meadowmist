import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReviewsModerationTab } from './ReviewsModerationTab';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

describe('ReviewsModerationTab Component', () => {
  const mockReviews = [
    {
      id: 'rev-1',
      rating: 5,
      title: 'Amazing Lavender Glow',
      comment: 'Calming and lasts over 40 hours of burn.',
      images: JSON.stringify(['/uploads/reviews/glow.jpg']),
      aspectRatings: JSON.stringify({ scentThrow: 5, burnLongevity: 5 }),
      helpfulCount: 6,
      sellerReply: 'Thank you for your appreciation!',
      sellerRepliedAt: '2026-10-10T12:00:00.000Z',
      isVerifiedPurchase: true,
      isApproved: true,
      createdAt: '2026-10-09T10:00:00.000Z',
      user: {
        id: 'usr-1',
        name: 'Aanya Sen',
        email: 'aanya@example.com',
      },
      product: {
        id: 'prod-1',
        name: 'Lavender Soy Candle',
        slug: 'lavender-soy-candle',
        images: JSON.stringify(['/images/candle.jpg']),
      },
    },
    {
      id: 'rev-2',
      rating: 4,
      title: null,
      comment: 'Lovely piece for my desk.',
      images: null,
      aspectRatings: null,
      helpfulCount: 0,
      sellerReply: null,
      sellerRepliedAt: null,
      isVerifiedPurchase: false,
      isApproved: false,
      createdAt: '2026-10-12T10:00:00.000Z',
      user: {
        id: 'usr-2',
        name: 'Dev Patel',
        email: 'dev@example.com',
      },
      product: {
        id: 'prod-2',
        name: 'Wheel-thrown Mug',
        slug: 'wheel-thrown-mug',
        images: JSON.stringify(['/images/mug.jpg']),
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(global, 'fetch').mockImplementation((url: any) => {
      if (typeof url === 'string' && url.includes('/api/reviews')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ reviews: mockReviews }),
        } as any);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true }),
      } as any);
    });
  });

  it('renders reviews table with customer photos, aspect scores, helpful badges, and artisan reply', async () => {
    render(<ReviewsModerationTab />);

    await waitFor(() => {
      expect(screen.getByText('Aanya Sen')).toBeDefined();
      expect(screen.getByText('Dev Patel')).toBeDefined();
    });

    expect(screen.getByText('Amazing Lavender Glow')).toBeDefined();
    expect(screen.getByText(/Calming and lasts over 40 hours/)).toBeDefined();
    expect(screen.getByText('6 helpful')).toBeDefined();
    expect(screen.getByText(/Scent Throw: 5★/)).toBeDefined();
    expect(screen.getByText(/Burn Longevity: 5★/)).toBeDefined();
    expect(screen.getByText('Artisan Response')).toBeDefined();
    expect(screen.getByText('Thank you for your appreciation!')).toBeDefined();
    expect(screen.getByText('+ Reply as Artisan')).toBeDefined();
  });

  it('handles editing and publishing an artisan reply', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation((url: any, init: any) => {
      if (typeof url === 'string' && url.endsWith('/reply') && init?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            review: {
              id: 'rev-2',
              sellerReply: 'Thank you Dev, delighted to hear!',
              sellerRepliedAt: new Date().toISOString(),
            },
          }),
        } as any);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ reviews: mockReviews }),
      } as any);
    });

    render(<ReviewsModerationTab />);

    await waitFor(() => {
      expect(screen.getByText('+ Reply as Artisan')).toBeDefined();
    });

    fireEvent.click(screen.getByText('+ Reply as Artisan'));

    const textarea = screen.getByPlaceholderText(/Write official artisan response/);
    fireEvent.change(textarea, { target: { value: 'Thank you Dev, delighted to hear!' } });

    fireEvent.click(screen.getByText('Publish Reply'));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/reviews/rev-2/reply',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ reply: 'Thank you Dev, delighted to hear!' }),
        })
      );
    });
  });

  it('handles deleting an artisan reply', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation((url: any, init: any) => {
      if (typeof url === 'string' && url.endsWith('/reply') && init?.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        } as any);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ reviews: mockReviews }),
      } as any);
    });

    render(<ReviewsModerationTab />);

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/reviews/rev-1/reply',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
});

