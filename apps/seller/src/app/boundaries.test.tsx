import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import SellerLoading from './loading';
import SellerGlobalError from './global-error';

describe('Seller Root Boundaries', () => {
  it('renders loading skeleton shell with cards and table placeholders', () => {
    const { container } = render(<SellerLoading />);
    expect(container.firstChild).toBeDefined();
  });

  it('renders global-error with error message and triggers reload on click', () => {
    const reset = vi.fn();
    render(<SellerGlobalError error={new Error('Test failure')} reset={reset} />);
    expect(screen.getByText('Portal Error')).toBeDefined();
    const reloadBtn = screen.getByText('Reload Portal');
    fireEvent.click(reloadBtn);
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
