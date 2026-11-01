import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { OrderCancelModal } from './OrderCancelModal';

describe('OrderCancelModal Component', () => {
  it('returns null when isOpen is false', () => {
    const { container } = render(
      <OrderCancelModal
        isOpen={false}
        orderNumber="MM-ORD-1001"
        paymentMethod="COD"
        totalAmount={1499}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders order number, pre-shipping policy alert, and COD guidance', () => {
    render(
      <OrderCancelModal
        isOpen={true}
        orderNumber="MM-ORD-1001"
        paymentMethod="COD"
        totalAmount={1499}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText(/Cancel Order #MM-ORD-1001/i)).toBeDefined();
    expect(screen.getByText(/Pre-Shipping Policy/i)).toBeDefined();
    expect(screen.getByText(/No payment was collected/i)).toBeDefined();
  });

  it('renders prepaid refund amount guidance for online payments', () => {
    render(
      <OrderCancelModal
        isOpen={true}
        orderNumber="MM-ORD-2002"
        paymentMethod="RAZORPAY"
        totalAmount={2850}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText(/Refund Information/i)).toBeDefined();
    expect(screen.getByText(/₹2,850/i)).toBeDefined();
  });

  it('calls onConfirm with selected reason and custom notes on submit', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(
      <OrderCancelModal
        isOpen={true}
        orderNumber="MM-ORD-1001"
        paymentMethod="COD"
        totalAmount={1499}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    const select = screen.getByLabelText(/Reason for Cancellation/i);
    fireEvent.change(select, {
      target: { value: 'Delivery timeframe is too long' },
    });

    const notes = screen.getByLabelText(/Additional Comments/i);
    fireEvent.change(notes, {
      target: { value: 'Need it for an event tomorrow' },
    });

    const submitBtn = screen.getByRole('button', { name: /Confirm Cancellation/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(onConfirm).toHaveBeenCalledWith(
      'Delivery timeframe is too long: Need it for an event tomorrow'
    );
  });

  it('calls onClose when clicking Keep Order or Close button', () => {
    const onClose = vi.fn();
    render(
      <OrderCancelModal
        isOpen={true}
        orderNumber="MM-ORD-1001"
        paymentMethod="COD"
        totalAmount={1499}
        onClose={onClose}
        onConfirm={vi.fn()}
      />
    );

    const keepBtn = screen.getByRole('button', { name: /Keep Order/i });
    fireEvent.click(keepBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    const closeBtn = screen.getByLabelText(/Close dialog/i);
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
