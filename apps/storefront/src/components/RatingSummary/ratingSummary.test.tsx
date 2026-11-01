import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RatingSummary from './RatingSummary';
import type { RatingDistribution, AspectScore } from '@meadowmist/shared';

describe('RatingSummary Component', () => {
  it('renders overall average score and review count pluralization', () => {
    const distribution: RatingDistribution = {
      average: 4.666,
      total: 3,
      counts: { 5: 2, 4: 1, 3: 0, 2: 0, 1: 0 },
    };

    render(<RatingSummary distribution={distribution} />);

    expect(screen.getByText('4.7')).toBeDefined();
    expect(screen.getByText('3 reviews')).toBeDefined();
  });

  it('renders singular review label when total is 1', () => {
    const distribution: RatingDistribution = {
      average: 5.0,
      total: 1,
      counts: { 5: 1, 4: 0, 3: 0, 2: 0, 1: 0 },
    };

    render(<RatingSummary distribution={distribution} />);

    expect(screen.getByText('5.0')).toBeDefined();
    expect(screen.getByText('1 review')).toBeDefined();
  });

  it('renders star breakdown rows from 5 down to 1 with counts', () => {
    const distribution: RatingDistribution = {
      average: 4.0,
      total: 10,
      counts: { 5: 5, 4: 3, 3: 1, 2: 1, 1: 0 },
    };

    render(<RatingSummary distribution={distribution} />);

    expect(screen.getByText('5 stars')).toBeDefined();
    expect(screen.getByText('4 stars')).toBeDefined();
    expect(screen.getByText('3 stars')).toBeDefined();
    expect(screen.getByText('2 stars')).toBeDefined();
    expect(screen.getByText('1 stars')).toBeDefined();

    expect(screen.getByText('5')).toBeDefined();
    expect(screen.getByText('3')).toBeDefined();
  });

  it('handles 0 reviews gracefully', () => {
    const distribution: RatingDistribution = {
      average: 0,
      total: 0,
      counts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };

    render(<RatingSummary distribution={distribution} />);

    expect(screen.getByText('0.0')).toBeDefined();
    expect(screen.getByText('0 reviews')).toBeDefined();
  });

  it('triggers onSelectRating when clicking a star row', () => {
    const distribution: RatingDistribution = {
      average: 4.0,
      total: 5,
      counts: { 5: 3, 4: 2, 3: 0, 2: 0, 1: 0 },
    };
    const onSelect = vi.fn();

    render(
      <RatingSummary
        distribution={distribution}
        selectedRating={null}
        onSelectRating={onSelect}
      />
    );

    fireEvent.click(screen.getByLabelText('Filter by 5 star reviews (3)'));
    expect(onSelect).toHaveBeenCalledWith(5);
  });

  it('toggles rating off when clicking currently selected star row', () => {
    const distribution: RatingDistribution = {
      average: 4.0,
      total: 5,
      counts: { 5: 3, 4: 2, 3: 0, 2: 0, 1: 0 },
    };
    const onSelect = vi.fn();

    render(
      <RatingSummary
        distribution={distribution}
        selectedRating={5}
        onSelectRating={onSelect}
      />
    );

    fireEvent.click(screen.getByLabelText('Filter by 5 star reviews (3)'));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('renders aspect score meters when aspectScores are provided', () => {
    const distribution: RatingDistribution = {
      average: 4.8,
      total: 4,
      counts: { 5: 4, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
    const aspectScores: AspectScore[] = [
      { name: 'Scent Throw', key: 'scentThrow', average: 4.9, count: 4 },
      { name: 'Burn Longevity', key: 'burnLongevity', average: 4.7, count: 4 },
    ];

    render(
      <RatingSummary
        distribution={distribution}
        aspectScores={aspectScores}
      />
    );

    expect(screen.getByText('Rated by Feature')).toBeDefined();
    expect(screen.getByText('Scent Throw')).toBeDefined();
    expect(screen.getByText('4.9')).toBeDefined();
    expect(screen.getByText('Burn Longevity')).toBeDefined();
    expect(screen.getByText('4.7')).toBeDefined();
  });
});
