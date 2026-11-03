import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HeaderSearchBar from './HeaderSearchBar';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('HeaderSearchBar Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders search input with placeholder and keyboard hint', () => {
    render(<HeaderSearchBar />);
    expect(screen.getByPlaceholderText(/search candles, ceramics, scents/i)).toBeDefined();
    expect(screen.getByText('⌘K')).toBeDefined();
  });

  it('fetches and displays live search results when query is typed', async () => {
    const mockProducts = [
      {
        id: 'prod_1',
        slug: 'lotus-ceramic-bowl',
        name: 'Handmade Lotus Bowl',
        price: 1250,
        salePrice: null,
        category: 'ceramic',
        images: JSON.stringify(['/images/products/lotus.jpg']),
        inStock: true,
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ products: mockProducts }),
    } as Response);

    render(<HeaderSearchBar />);

    const input = screen.getByPlaceholderText(/search candles, ceramics, scents/i);
    fireEvent.change(input, { target: { value: 'Lotus' } });

    await waitFor(() => {
      expect(screen.getByText('Handmade Lotus Bowl')).toBeDefined();
      expect(screen.getByText('₹1250')).toBeDefined();
    });
  });

  it('clears query when clear button is clicked', async () => {
    render(<HeaderSearchBar />);

    const input = screen.getByPlaceholderText(/search candles, ceramics, scents/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Candle' } });

    expect(input.value).toBe('Candle');

    const clearBtn = screen.getByRole('button', { name: /clear search query/i });
    fireEvent.click(clearBtn);

    expect(input.value).toBe('');
  });

  it('passes abort signal to fetch requests', async () => {
    let capturedSignal: AbortSignal | undefined;
    global.fetch = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      capturedSignal = init?.signal as AbortSignal;
      return Promise.resolve({
        ok: true,
        json: async () => ({ products: [] }),
      });
    });

    render(<HeaderSearchBar />);
    const input = screen.getByPlaceholderText(/search candles, ceramics, scents/i);
    fireEvent.change(input, { target: { value: 'Rose' } });

    await waitFor(() => {
      expect(capturedSignal).toBeDefined();
    });
  });
});
