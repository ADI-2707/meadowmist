import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AddToCartButton from './AddToCartButton';
import { useCartStore } from '@/store/cartStore';
import type { Product } from '@/types/product';

const mockProductWithVariants: Product = {
  id: 'prod_multi',
  name: 'Aura Stoneware Candle',
  slug: 'aura-stoneware-candle',
  category: 'candle',
  subCategory: 'scented',
  price: 1200,
  salePrice: null,
  images: ['/images/aura.jpg'],
  materials: ['Soy Wax'],
  story: 'Artisan hand-poured candle in handcrafted vessel.',
  inStock: true,
  stockQuantity: 15,
  colorFamily: 'clay',
  variants: [
    {
      id: 'var_small',
      productId: 'prod_multi',
      sku: 'AURA-200G',
      name: '200g Classic',
      price: 1200,
      salePrice: null,
      stockQuantity: 10,
      inStock: true,
      optionValues: JSON.stringify({ size: '200g' }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'var_large',
      productId: 'prod_multi',
      sku: 'AURA-450G',
      name: '450g Grande',
      price: 1800,
      salePrice: 1650,
      stockQuantity: 5,
      inStock: true,
      optionValues: JSON.stringify({ size: '450g' }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};

describe('AddToCartButton Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCartStore.setState({ items: [] });
  });

  it('renders default variant pricing, SKU, and variant pills', () => {
    render(<AddToCartButton product={mockProductWithVariants} />);

    expect(screen.getByText('SKU: AURA-200G')).toBeDefined();
    expect(screen.getByText('200g Classic')).toBeDefined();
    expect(screen.getByText('450g Grande')).toBeDefined();
    expect(screen.getByRole('button', { name: /Add Aura Stoneware Candle to bag/i })).toBeDefined();
  });

  it('switches price and SKU when clicking another variant pill', () => {
    render(<AddToCartButton product={mockProductWithVariants} />);

    const largePill = screen.getByText('450g Grande');
    fireEvent.click(largePill);

    expect(screen.getByText('SKU: AURA-450G')).toBeDefined();
    expect(screen.getByText('₹1,650')).toBeDefined();
    expect(screen.getByText('₹1,800')).toBeDefined();
  });

  it('adds selected variant to cart store when clicked', () => {
    const addItemSpy = vi.spyOn(useCartStore.getState(), 'addItem');

    render(<AddToCartButton product={mockProductWithVariants} />);

    const largePill = screen.getByText('450g Grande');
    fireEvent.click(largePill);

    const addBtn = screen.getByRole('button', { name: /Add Aura Stoneware Candle to bag/i });
    fireEvent.click(addBtn);

    expect(addItemSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'prod_multi',
        variantId: 'var_large',
        sku: 'AURA-450G',
        price: 1650,
      })
    );
  });
});

