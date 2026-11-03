import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CheckoutPage from './page';
import { useCartStore } from '@/store/cartStore';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('Checkout Mutex Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCartStore.setState({
      items: [
        {
          productId: 'prod_1',
          slug: 'lavender-mist',
          name: 'Lavender Mist',
          price: 500,
          qty: 1,
          image: '/img.jpg',
        },
      ],
    });

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/settings') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ settings: { shippingFlatRate: 99, freeShippingThreshold: 1499 } }),
        });
      }
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: 'u1', name: 'Tester', email: 't@e.com' } }),
        });
      }
      if (url === '/api/account/addresses') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              addresses: [
                {
                  id: 'addr_1',
                  fullName: 'Tester',
                  phone: '1234567890',
                  streetAddress: '123 Test St',
                  city: 'Mumbai',
                  state: 'Maharashtra',
                  postalCode: '400001',
                  country: 'India',
                  isDefault: true,
                },
              ],
            }),
        });
      }
      if (url === '/api/orders/place') {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({ order: { orderNumber: 'ORD-101' } }),
            });
          }, 50);
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }) as any;
  });

  it('prevents double-order creation on rapid repeated clicks', async () => {
    render(<CheckoutPage />);

    await waitFor(() => {
      expect(screen.getByText('Place Order Now')).toBeDefined();
    });

    const button = screen.getByText('Place Order Now');
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/order-confirmation/ORD-101');
    });

    const placeCalls = (global.fetch as any).mock.calls.filter(
      (call: any[]) => call[0] === '/api/orders/place'
    );
    expect(placeCalls).toHaveLength(1);
  });
});
