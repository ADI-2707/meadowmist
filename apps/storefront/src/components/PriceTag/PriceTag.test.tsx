import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PriceTag from './PriceTag';

describe('PriceTag Component', () => {
  it('renders regular price in Indian Rupee format', () => {
    render(<PriceTag price={1250} />);

    expect(screen.getByText('₹1,250')).toBeDefined();
  });

  it('renders discounted sale price and strikethrough original price', () => {
    render(<PriceTag price={1800} salePrice={1450} />);

    expect(screen.getByText('₹1,450')).toBeDefined();
    expect(screen.getByText('₹1,800')).toBeDefined();
  });
});

