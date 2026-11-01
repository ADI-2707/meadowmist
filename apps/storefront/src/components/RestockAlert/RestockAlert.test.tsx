import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import RestockAlert from './RestockAlert';

describe('RestockAlert Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders out of stock alert and waitlist submission form', () => {
    render(
      <RestockAlert
        productId="prod_1"
        productName="Wild Lavender Candle"
      />
    );

    expect(screen.getByText(/Notify Me When Restocked/i)).toBeDefined();
    expect(screen.getByPlaceholderText('your-email@example.com')).toBeDefined();
    expect(screen.getByRole('button', { name: /Notify Me/i })).toBeDefined();
  });

  it('renders selected variant name in alert description', () => {
    render(
      <RestockAlert
        productId="prod_1"
        productName="Wild Lavender Candle"
        variantId="var_1"
        variantName="250g Stoneware Vessel"
      />
    );

    expect(screen.getByText(/250g Stoneware Vessel/i)).toBeDefined();
  });

  it('submits email notification request successfully', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, message: "You're on the list!" }),
      })
    );

    render(
      <RestockAlert
        productId="prod_1"
        productName="Wild Lavender Candle"
      />
    );

    const input = screen.getByPlaceholderText('your-email@example.com');
    fireEvent.change(input, { target: { value: 'artisan.collector@example.com' } });

    const submitBtn = screen.getByRole('button', { name: /Notify Me/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(screen.getByText(/You're on the list!/i)).toBeDefined();
  });
});
