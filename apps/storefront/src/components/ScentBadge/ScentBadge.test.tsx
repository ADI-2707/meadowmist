import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScentBadge from './ScentBadge';

describe('ScentBadge Component', () => {
  it('renders family label for known scent types', () => {
    render(<ScentBadge family="woody" color="forest" />);

    expect(screen.getByText('Woody')).toBeDefined();
  });

  it('renders family label for ceramic items', () => {
    render(<ScentBadge family="planter" color="clay" />);

    expect(screen.getByText('Planter')).toBeDefined();
  });
});
