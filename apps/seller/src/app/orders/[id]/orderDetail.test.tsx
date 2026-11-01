import React, { Suspense } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import AdminOrderDetailPage from './page';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

describe('AdminOrderDetailPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.alert = vi.fn();
  });

  const renderComponent = async (paramsPromise = Promise.resolve({ id: 'ord_101' })) => {
    await act(async () => {
      render(
        <Suspense fallback={<div>Loading suspense...</div>}>
          <AdminOrderDetailPage params={paramsPromise} />
        </Suspense>
      );
    });
  };

  it('renders order details, ordered items, and shipping info', async () => {
    const mockOrder = {
      id: 'ord_101',
      orderNumber: 'MM-ORD-2026-101',
      createdAt: '2026-11-01T10:00:00.000Z',
      status: 'PROCESSING',
      subtotal: 1500,
      shippingCharges: 0,
      discountAmount: 0,
      totalAmount: 1500,
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      refundedAmount: 0,
      shippingAddress: JSON.stringify({
        fullName: 'Meera Rao',
        streetAddress: '42 Bloom Street',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        phone: '9876543210',
      }),
      user: { name: 'Meera Rao', email: 'meera@example.com' },
      items: [
        {
          id: 'item_1',
          productName: 'Ceramic Stoneware Mug',
          productImage: '/images/mug.jpg',
          unitPrice: 1500,
          quantity: 1,
          selectedColor: 'Sage Green',
          lineTotal: 1500,
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ order: mockOrder }),
    } as any);

    await renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /MM-ORD-2026-101/ })).toBeDefined();
    });

    expect(screen.getAllByText('Ceramic Stoneware Mug').length).toBeGreaterThan(0);
    expect(screen.getByText('Shade: Sage Green')).toBeDefined();
    expect(screen.getAllByText('42 Bloom Street').length).toBeGreaterThan(0);
  });

  it('renders cancellation banner with customer reason when order is cancelled', async () => {
    const mockCancelledOrder = {
      id: 'ord_101',
      orderNumber: 'MM-ORD-2026-101',
      createdAt: '2026-11-01T10:00:00.000Z',
      status: 'CANCELLED',
      cancellationReason: 'Found another gift for my mother in time',
      cancelledAt: '2026-11-01T11:30:00.000Z',
      subtotal: 1200,
      shippingCharges: 100,
      discountAmount: 0,
      totalAmount: 1300,
      paymentMethod: 'CARD',
      paymentStatus: 'PAID',
      refundedAmount: 0,
      shippingAddress: JSON.stringify({ fullName: 'Rohan Verma', streetAddress: '12 Hill Rd' }),
      items: [],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ order: mockCancelledOrder }),
    } as any);

    await renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('cancellation-banner')).toBeDefined();
    });

    expect(screen.getByText(/Found another gift for my mother in time/)).toBeDefined();
  });

  it('renders damage photo evidence gallery when returnImages are present', async () => {
    const mockReturnOrder = {
      id: 'ord_101',
      orderNumber: 'MM-ORD-2026-101',
      createdAt: '2026-11-01T10:00:00.000Z',
      status: 'DELIVERED',
      returnStatus: 'REQUESTED',
      returnReason: 'Transit Damage (Broken Ceramics) [Preference: REPLACEMENT] - Handle broken',
      returnImages: JSON.stringify(['/uploads/broken1.jpg', '/uploads/broken2.jpg']),
      subtotal: 2000,
      shippingCharges: 0,
      discountAmount: 0,
      totalAmount: 2000,
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      refundedAmount: 0,
      shippingAddress: JSON.stringify({ fullName: 'Kavita Iyer', streetAddress: '7 Garden Ave' }),
      items: [],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ order: mockReturnOrder }),
    } as any);

    await renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('damage-photo-gallery')).toBeDefined();
    });

    expect(screen.getByAltText('Transit damage evidence 1')).toBeDefined();
    expect(screen.getByAltText('Transit damage evidence 2')).toBeDefined();
    expect(screen.getByText('Approve Return')).toBeDefined();
    expect(screen.getByText('Decline Return')).toBeDefined();
  });

  it('sends PATCH request to update return status when Approve Return is clicked', async () => {
    const mockReturnOrder = {
      id: 'ord_101',
      orderNumber: 'MM-ORD-2026-101',
      createdAt: '2026-11-01T10:00:00.000Z',
      status: 'DELIVERED',
      returnStatus: 'REQUESTED',
      returnReason: 'Transit Damage',
      subtotal: 2000,
      shippingCharges: 0,
      discountAmount: 0,
      totalAmount: 2000,
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      refundedAmount: 0,
      shippingAddress: JSON.stringify({ fullName: 'Kavita Iyer', streetAddress: '7 Garden Ave' }),
      items: [],
    };

    global.fetch = vi.fn().mockImplementation((url: string, init?: any) => {
      if (init?.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ order: { ...mockReturnOrder, returnStatus: 'APPROVED' } }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ order: mockReturnOrder }),
      });
    });

    await renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Approve Return')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Approve Return'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/orders/ord_101',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ returnStatus: 'APPROVED' }),
        })
      );
    });
  });

  it('processes refund and updates return status to COMPLETED', async () => {
    const mockOrder = {
      id: 'ord_101',
      orderNumber: 'MM-ORD-2026-101',
      createdAt: '2026-11-01T10:00:00.000Z',
      status: 'DELIVERED',
      returnStatus: 'APPROVED',
      returnReason: 'Transit Damage Verified',
      subtotal: 1000,
      shippingCharges: 0,
      discountAmount: 0,
      totalAmount: 1000,
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      refundedAmount: 0,
      shippingAddress: JSON.stringify({ fullName: 'Arjun Das', streetAddress: '15 Lake View' }),
      items: [],
    };

    global.fetch = vi.fn().mockImplementation((url: string, init?: any) => {
      if (init?.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            order: {
              ...mockOrder,
              refundedAmount: 1000,
              returnStatus: 'COMPLETED',
              paymentStatus: 'REFUNDED',
            },
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ order: mockOrder }),
      });
    });

    await renderComponent();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Max ₹1000')).toBeDefined();
    });

    fireEvent.change(screen.getByPlaceholderText('Max ₹1000'), {
      target: { value: '1000' },
    });

    fireEvent.change(screen.getByPlaceholderText('Damaged in transit / Customer return approved'), {
      target: { value: 'Transit damage photo verified' },
    });

    fireEvent.click(screen.getByText('Process & Record Refund'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/orders/ord_101',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            refundedAmount: 1000,
            refundReason: 'Transit damage photo verified',
            returnStatus: 'COMPLETED',
          }),
        })
      );
    });
  });
});
