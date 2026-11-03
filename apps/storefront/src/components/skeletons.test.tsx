import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProductCardSkeleton from './ProductCard/ProductCardSkeleton';
import SearchItemSkeleton from './SiteHeader/SearchItemSkeleton';
import ModalResultSkeleton from './ProductSearchModal/ModalResultSkeleton';
import ReviewItemSkeleton from './ReviewList/ReviewItemSkeleton';

describe('Storefront Skeleton Loaders', () => {
  it('renders ProductCardSkeleton with aria-hidden and status role', () => {
    const { container } = render(<ProductCardSkeleton />);
    const el = screen.getByTestId('product-card-skeleton');
    expect(el).toBeDefined();
    expect(el.getAttribute('aria-hidden')).toBe('true');
    const statusEl = container.querySelector('[role="status"]');
    expect(statusEl).not.toBeNull();
    expect(statusEl?.getAttribute('aria-busy')).toBe('true');
  });

  it('renders SearchItemSkeleton with aria-hidden and status role', () => {
    const { container } = render(<SearchItemSkeleton />);
    const el = screen.getByTestId('search-item-skeleton');
    expect(el).toBeDefined();
    expect(el.getAttribute('aria-hidden')).toBe('true');
    const statusEl = container.querySelector('[role="status"]');
    expect(statusEl).not.toBeNull();
  });

  it('renders ModalResultSkeleton with aria-hidden and status role', () => {
    const { container } = render(<ModalResultSkeleton />);
    const el = screen.getByTestId('modal-result-skeleton');
    expect(el).toBeDefined();
    expect(el.getAttribute('aria-hidden')).toBe('true');
    const statusEl = container.querySelector('[role="status"]');
    expect(statusEl).not.toBeNull();
  });

  it('renders ReviewItemSkeleton with aria-hidden and status role', () => {
    const { container } = render(<ReviewItemSkeleton />);
    const el = screen.getByTestId('review-item-skeleton');
    expect(el).toBeDefined();
    expect(el.getAttribute('aria-hidden')).toBe('true');
    const statusEl = container.querySelector('[role="status"]');
    expect(statusEl).not.toBeNull();
  });
});
