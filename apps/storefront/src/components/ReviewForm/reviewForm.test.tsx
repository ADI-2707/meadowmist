import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReviewForm from './ReviewForm';

describe('ReviewForm Component', () => {
  const onReviewSubmitted = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login prompt when user is not logged in', () => {
    render(
      <ReviewForm
        productId="amber-candle-123"
        productSlug="amber-candle-123"
        isLoggedIn={false}
        onReviewSubmitted={onReviewSubmitted}
      />
    );

    const loginLink = screen.getByRole('link', { name: /sign in to leave a review/i });
    expect(loginLink).toBeDefined();
    expect(loginLink.getAttribute('href')).toBe('/login?redirect=/product/amber-candle-123');

    expect(screen.queryByRole('button', { name: /submit review/i })).toBeNull();
  });

  it('renders star selector, category aspects, and form fields when user is logged in', () => {
    render(
      <ReviewForm
        productId="amber-candle-123"
        category="Candles"
        isLoggedIn={true}
        onReviewSubmitted={onReviewSubmitted}
      />
    );

    expect(screen.getByText('Leave an Artisan Review')).toBeDefined();
    expect(screen.getByText('Overall Rating')).toBeDefined();
    expect(screen.getByText('Rate Product Features')).toBeDefined();
    expect(screen.getByText('Scent Throw')).toBeDefined();
    expect(screen.getByText('Burn Longevity')).toBeDefined();
    expect(screen.getByText('Packaging Quality')).toBeDefined();
    expect(screen.getByLabelText(/your thoughts & experience/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /submit review/i })).toBeDefined();
  });

  it('renders ceramics aspect sliders when category is ceramics', () => {
    render(
      <ReviewForm
        productId="clay-vase-456"
        category="Ceramics"
        isLoggedIn={true}
        onReviewSubmitted={onReviewSubmitted}
      />
    );

    expect(screen.getByText('Craftsmanship')).toBeDefined();
    expect(screen.getByText('Glaze Finish')).toBeDefined();
    expect(screen.getByText('Durability')).toBeDefined();
  });

  it('shows validation error when submitting with less than 5 characters', async () => {
    render(
      <ReviewForm
        productId="amber-candle-123"
        isLoggedIn={true}
        onReviewSubmitted={onReviewSubmitted}
      />
    );

    const textarea = screen.getByLabelText(/your thoughts & experience/i);
    const submitBtn = screen.getByRole('button', { name: /submit review/i });

    fireEvent.change(textarea, { target: { value: 'Good' } });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText(/please write at least 5 characters in your review/i)
    ).toBeDefined();
  });

  it('submits rating, aspects, and comment successfully when valid', async () => {
    const mockNewReview = {
      id: 'new-rev-1',
      productId: 'amber-candle-123',
      rating: 5,
      title: 'Soothing aroma',
      comment: 'Authentic pure soy wax candle. Highly recommended!',
      isVerifiedPurchase: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ review: mockNewReview }),
    } as any);

    render(
      <ReviewForm
        productId="amber-candle-123"
        category="Candles"
        isLoggedIn={true}
        onReviewSubmitted={onReviewSubmitted}
      />
    );

    const titleInput = screen.getByLabelText(/headline/i);
    const textarea = screen.getByLabelText(/your thoughts & experience/i);
    const submitBtn = screen.getByRole('button', { name: /submit review/i });

    fireEvent.change(titleInput, { target: { value: 'Soothing aroma' } });
    fireEvent.change(textarea, {
      target: { value: 'Authentic pure soy wax candle. Highly recommended!' },
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onReviewSubmitted).toHaveBeenCalledWith(mockNewReview);
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/products/amber-candle-123/reviews',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('rejects photo exceeding 5MB limit before making network request', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    const { container } = render(
      <ReviewForm
        productId="amber-candle-123"
        category="Candles"
        isLoggedIn={true}
        onReviewSubmitted={onReviewSubmitted}
      />
    );

    const fileInput = container.querySelector('#review-photo-input') as HTMLInputElement;
    const largeFile = new File(['a'.repeat(100)], 'large-photo.jpg', {
      type: 'image/jpeg',
    });
    Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 });

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    expect(await screen.findByText(/exceeds 5MB limit/i)).toBeDefined();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects photo with invalid file format before making network request', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    const { container } = render(
      <ReviewForm
        productId="amber-candle-123"
        category="Candles"
        isLoggedIn={true}
        onReviewSubmitted={onReviewSubmitted}
      />
    );

    const fileInput = container.querySelector('#review-photo-input') as HTMLInputElement;
    const invalidFile = new File(['content'], 'document.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(await screen.findByText(/invalid file format/i)).toBeDefined();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
