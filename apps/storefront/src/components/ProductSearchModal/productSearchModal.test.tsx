import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProductSearchModal from './ProductSearchModal';

describe('ProductSearchModal Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders modal when open and fetches results with abort signal', async () => {
    let capturedSignal: AbortSignal | undefined;
    global.fetch = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      capturedSignal = init?.signal as AbortSignal;
      return Promise.resolve({
        ok: true,
        json: async () => ({
          products: [
            {
              id: 'p1',
              slug: 'amber-glow',
              name: 'Amber Glow Candle',
              price: 850,
              salePrice: null,
              category: 'candle',
              subCategory: 'pillar',
              images: '[]',
              scentFamily: 'woody',
              inStock: true,
            },
          ],
        }),
      });
    });

    render(<ProductSearchModal isOpen={true} onClose={vi.fn()} />);

    const input = screen.getByPlaceholderText(/search candles, ceramics, notes/i);
    fireEvent.change(input, { target: { value: 'Amber' } });

    await waitFor(() => {
      expect(screen.getByText('Amber Glow Candle')).toBeDefined();
      expect(capturedSignal).toBeDefined();
    });
  });
});
