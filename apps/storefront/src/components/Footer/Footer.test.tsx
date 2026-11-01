import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from './Footer';

vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} alt={props.alt || ''} />,
}));

describe('Footer Component', () => {
  it('renders brand vision and navigation section links', () => {
    render(<Footer />);

    expect(screen.getByText(/Hand-poured candles/i)).toBeDefined();
    expect(screen.getByText('All Candles')).toBeDefined();
    expect(screen.getByText('All Ceramics')).toBeDefined();
    expect(screen.getByText('Our Story')).toBeDefined();
    expect(screen.getByText('Journal')).toBeDefined();
    expect(screen.getByPlaceholderText('your@email.com')).toBeDefined();
  });
});
