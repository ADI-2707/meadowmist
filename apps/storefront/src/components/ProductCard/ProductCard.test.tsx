import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductCard from './ProductCard';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import type { Product } from '@/types/product';

vi.mock('next/image', () => ({
  default: ({ fill, ...props }: any) => <img {...props} alt={props.alt || ''} />,
}));

const mockProduct: Product = {
  id: 'prod_amber_mug',
  name: 'Amber Stoneware Mug',
  slug: 'amber-stoneware-mug',
  category: 'ceramic',
  subCategory: 'mugs',
  price: 1100,
  salePrice: 950,
  images: ['/images/amber-mug.jpg'],
  materials: ['River Clay', 'Iron Glaze'],
  story: 'Handcrafted stoneware mug wheel-thrown in our Himalayan foothills studio.',
  inStock: true,
  stockQuantity: 12,
  colorFamily: 'clay',
  badge: 'bestseller',
  burnTime: null,
  volume: '300ml',
  weight: '350g',
  leadTimeDays: 2,
};

describe('ProductCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.matchMedia = window.matchMedia || vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    useCartStore.setState({ items: [] });
    useWishlistStore.setState({ items: [] });
  });

  it('renders product details, badge, price, and add button', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Amber Stoneware Mug')).toBeDefined();
    expect(screen.getByText('Bestseller')).toBeDefined();
    expect(screen.getByText('₹950')).toBeDefined();
    expect(screen.getByText('₹1,100')).toBeDefined();
    expect(screen.getByRole('button', { name: /Add Amber Stoneware Mug to bag/i })).toBeDefined();
  });

  it('renders out of stock state when item is sold out', () => {
    const outOfStockProduct: Product = {
      ...mockProduct,
      inStock: false,
      stockQuantity: 0,
    };

    render(<ProductCard product={outOfStockProduct} />);

    expect(screen.getByText('Out of Stock')).toBeDefined();
    expect(screen.getByRole('button', { name: /out of stock/i })).toBeDefined();
  });

  it('adds product to cart when Add to bag is clicked', () => {
    const addItemSpy = vi.spyOn(useCartStore.getState(), 'addItem');

    render(<ProductCard product={mockProduct} />);

    const addBtn = screen.getByRole('button', { name: /Add Amber Stoneware Mug to bag/i });
    fireEvent.click(addBtn);

    expect(addItemSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'prod_amber_mug',
        name: 'Amber Stoneware Mug',
        price: 950,
      })
    );
  });

  it('toggles wishlist status when wishlist button is clicked', () => {
    const toggleSpy = vi.spyOn(useWishlistStore.getState(), 'toggle');

    render(<ProductCard product={mockProduct} />);

    const wishlistBtn = screen.getByRole('button', { name: /Save Amber Stoneware Mug to wishlist/i });
    fireEvent.click(wishlistBtn);

    expect(toggleSpy).toHaveBeenCalledWith('prod_amber_mug');
  });
});
