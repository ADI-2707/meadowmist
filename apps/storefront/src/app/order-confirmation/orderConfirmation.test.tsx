import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OrderConfirmationPage from './[id]/page';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { notFound, redirect } from 'next/navigation';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('@/lib/session', () => ({
  getSessionUser: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn().mockImplementation(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  redirect: vi.fn().mockImplementation((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

describe('OrderConfirmationPage Access Control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockParams = Promise.resolve({ id: 'MM-ORD-5555' });

  it('calls notFound when order does not exist', async () => {
    vi.mocked(prisma.order.findFirst).mockResolvedValue(null);

    await expect(OrderConfirmationPage({ params: mockParams })).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });

  it('redirects to login when order has userId and user is not logged in', async () => {
    vi.mocked(prisma.order.findFirst).mockResolvedValue({
      id: 'ord_1',
      orderNumber: 'MM-ORD-5555',
      userId: 'user_owner',
      items: [],
      shippingAddress: '{}',
      createdAt: new Date(),
      subtotal: 500,
      shippingCharges: 0,
      discountAmount: 0,
      totalAmount: 500,
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
    } as any);

    vi.mocked(getSessionUser).mockResolvedValue(null);

    await expect(OrderConfirmationPage({ params: mockParams })).rejects.toThrow(
      'NEXT_REDIRECT:/login?redirect=/order-confirmation/MM-ORD-5555'
    );
    expect(redirect).toHaveBeenCalledWith('/login?redirect=/order-confirmation/MM-ORD-5555');
  });

  it('calls notFound when order belongs to another user and caller is not admin', async () => {
    vi.mocked(prisma.order.findFirst).mockResolvedValue({
      id: 'ord_1',
      orderNumber: 'MM-ORD-5555',
      userId: 'user_owner',
      items: [],
      shippingAddress: '{}',
      createdAt: new Date(),
      subtotal: 500,
      shippingCharges: 0,
      discountAmount: 0,
      totalAmount: 500,
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
    } as any);

    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'user_other',
      email: 'other@example.com',
      name: 'Other User',
      role: 'CUSTOMER',
    });

    await expect(OrderConfirmationPage({ params: mockParams })).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });

  it('renders successfully when logged in user is the owner', async () => {
    vi.mocked(prisma.order.findFirst).mockResolvedValue({
      id: 'ord_1',
      orderNumber: 'MM-ORD-5555',
      userId: 'user_owner',
      items: [
        {
          id: 'item_1',
          productName: 'Lotus Candle',
          productImage: '/img.jpg',
          quantity: 1,
          lineTotal: 500,
        },
      ],
      shippingAddress: JSON.stringify({ fullName: 'Owner User', city: 'Bilaspur' }),
      createdAt: new Date(),
      subtotal: 500,
      shippingCharges: 0,
      discountAmount: 0,
      totalAmount: 500,
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
    } as any);

    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'user_owner',
      email: 'owner@example.com',
      name: 'Owner User',
      role: 'CUSTOMER',
    });

    const jsx = await OrderConfirmationPage({ params: mockParams });
    expect(jsx).toBeDefined();
  });

  it('renders successfully when caller is an admin', async () => {
    vi.mocked(prisma.order.findFirst).mockResolvedValue({
      id: 'ord_1',
      orderNumber: 'MM-ORD-5555',
      userId: 'user_owner',
      items: [],
      shippingAddress: JSON.stringify({ fullName: 'Owner User', city: 'Bilaspur' }),
      createdAt: new Date(),
      subtotal: 500,
      shippingCharges: 0,
      discountAmount: 0,
      totalAmount: 500,
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
    } as any);

    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'admin_1',
      email: 'admin@meadowmist.in',
      name: 'Admin',
      role: 'ADMIN',
    });

    const jsx = await OrderConfirmationPage({ params: mockParams });
    expect(jsx).toBeDefined();
  });
});
