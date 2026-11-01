import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CartToast from './CartToast';
import { useCartStore } from '@/store/cartStore';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('next/image', () => ({
  default: ({ fill, ...props }: any) => <img {...props} alt={props.alt || ''} />,
}));

describe('CartToast Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCartStore.setState({
      toast: null,
      isDrawerOpen: false,
    });
  });

  it('renders nothing inside toast container when no toast is active', () => {
    const { container } = render(<CartToast />);
    expect(screen.queryByRole('status')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });

  it('renders product toast and triggers drawer open when clicked', () => {
    useCartStore.setState({
      toast: {
        name: 'Lavender Candle',
        price: 750,
        image: '/images/candle.jpg',
        action: 'added',
        showViewBag: true,
        id: 101,
      },
      isDrawerOpen: false,
    });

    render(<CartToast />);

    expect(screen.getByText(/Added to your bag/i)).toBeDefined();
    expect(screen.getByText(/Lavender Candle/i)).toBeDefined();
    expect(screen.getByText('₹750')).toBeDefined();

    const viewBagBtn = screen.getByRole('button', { name: /View Bag/i });
    fireEvent.click(viewBagBtn);

    expect(useCartStore.getState().isDrawerOpen).toBe(true);
  });
});
