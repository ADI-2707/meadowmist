import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProductCardSkeleton from './ProductCard/ProductCardSkeleton';
import SearchItemSkeleton from './SiteHeader/SearchItemSkeleton';
import ModalResultSkeleton from './ProductSearchModal/ModalResultSkeleton';
import ReviewItemSkeleton from './ReviewList/ReviewItemSkeleton';

describe('Storefront Skeleton Loaders', () => {
  it('renders ProductCardSkeleton with aria-hidden', () => {
    render(<ProductCardSkeleton />);
    const el = screen.getByTestId('product-card-skeleton');
    expect(el).toBeDefined();
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders SearchItemSkeleton with aria-hidden', () => {
    render(<SearchItemSkeleton />);
    const el = screen.getByTestId('search-item-skeleton');
    expect(el).toBeDefined();
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders ModalResultSkeleton with aria-hidden', () => {
    render(<ModalResultSkeleton />);
    const el = screen.getByTestId('modal-result-skeleton');
    expect(el).toBeDefined();
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders ReviewItemSkeleton with aria-hidden', () => {
    render(<ReviewItemSkeleton />);
    const el = screen.getByTestId('review-item-skeleton');
    expect(el).toBeDefined();
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });
});
