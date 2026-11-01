import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReviewFilterBar, { ReviewFilters } from './ReviewFilterBar';

describe('ReviewFilterBar Component', () => {
  const defaultFilters: ReviewFilters = {
    sort: 'recent',
    rating: null,
    verified: false,
    withPhotos: false,
    search: '',
  };

  it('renders filter controls and summary count', () => {
    const onChange = vi.fn();
    render(
      <ReviewFilterBar
        filters={defaultFilters}
        onChange={onChange}
        totalCount={15}
      />
    );

    expect(screen.getByPlaceholderText('Search customer reviews...')).toBeDefined();
    expect(screen.getByLabelText('Sort by:')).toBeDefined();
    expect(screen.getByText('All')).toBeDefined();
    expect(screen.getByText('5★')).toBeDefined();
    expect(screen.getByText('Verified Purchase')).toBeDefined();
    expect(screen.getByText('With Photos')).toBeDefined();
    expect(screen.getByText('Showing 15 reviews')).toBeDefined();
  });

  it('handles sort select change', () => {
    const onChange = vi.fn();
    render(
      <ReviewFilterBar
        filters={defaultFilters}
        onChange={onChange}
        totalCount={5}
      />
    );

    fireEvent.change(screen.getByLabelText('Sort by:'), {
      target: { value: 'helpful' },
    });

    expect(onChange).toHaveBeenCalledWith({
      ...defaultFilters,
      sort: 'helpful',
    });
  });

  it('toggles star rating filter when star chip clicked', () => {
    const onChange = vi.fn();
    render(
      <ReviewFilterBar
        filters={defaultFilters}
        onChange={onChange}
        totalCount={5}
      />
    );

    fireEvent.click(screen.getByText('4★'));

    expect(onChange).toHaveBeenCalledWith({
      ...defaultFilters,
      rating: 4,
    });
  });

  it('toggles verified purchase filter', () => {
    const onChange = vi.fn();
    render(
      <ReviewFilterBar
        filters={defaultFilters}
        onChange={onChange}
        totalCount={5}
      />
    );

    fireEvent.click(screen.getByText('Verified Purchase'));

    expect(onChange).toHaveBeenCalledWith({
      ...defaultFilters,
      verified: true,
    });
  });

  it('toggles with photos filter', () => {
    const onChange = vi.fn();
    render(
      <ReviewFilterBar
        filters={defaultFilters}
        onChange={onChange}
        totalCount={5}
      />
    );

    fireEvent.click(screen.getByText('With Photos'));

    expect(onChange).toHaveBeenCalledWith({
      ...defaultFilters,
      withPhotos: true,
    });
  });

  it('clears all filters when clear all button is clicked', () => {
    const onChange = vi.fn();
    const activeFilters: ReviewFilters = {
      sort: 'highest',
      rating: 5,
      verified: true,
      withPhotos: true,
      search: 'lavender',
    };

    render(
      <ReviewFilterBar
        filters={activeFilters}
        onChange={onChange}
        totalCount={2}
      />
    );

    const clearBtn = screen.getByText('Clear all filters');
    fireEvent.click(clearBtn);

    expect(onChange).toHaveBeenCalledWith({
      sort: 'highest',
      rating: null,
      verified: false,
      withPhotos: false,
      search: '',
    });
  });

  it('clears search input when clear search button is clicked', () => {
    const onChange = vi.fn();
    const filtersWithSearch: ReviewFilters = {
      ...defaultFilters,
      search: 'scent',
    };

    render(
      <ReviewFilterBar
        filters={filtersWithSearch}
        onChange={onChange}
        totalCount={3}
      />
    );

    const clearBtn = screen.getByLabelText('Clear search');
    fireEvent.click(clearBtn);

    expect(onChange).toHaveBeenCalledWith({
      ...defaultFilters,
      search: '',
    });
  });
});
