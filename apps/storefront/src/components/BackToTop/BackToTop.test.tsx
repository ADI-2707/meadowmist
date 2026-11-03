import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BackToTop from './BackToTop';

describe('BackToTop Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders back to top button with accessible label and visible text', () => {
    render(<BackToTop />);
    const button = screen.getByRole('button', { name: /back to top of page/i });
    expect(button).toBeDefined();
    expect(screen.getByText('Back to top')).toBeDefined();
  });

  it('triggers window.scrollTo with smooth behavior on click', () => {
    const scrollToMock = vi.fn();
    window.scrollTo = scrollToMock;

    render(<BackToTop />);
    const button = screen.getByRole('button', { name: /back to top of page/i });
    fireEvent.click(button);

    expect(scrollToMock).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('renders decorative icon with aria-hidden attribute', () => {
    const { container } = render(<BackToTop />);
    const svgIcon = container.querySelector('svg');
    expect(svgIcon).toBeDefined();
    expect(svgIcon?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders with button class configured for flush dock with footer', () => {
    render(<BackToTop />);
    const button = screen.getByRole('button', { name: /back to top of page/i });
    expect(button.className).toContain('button');
  });
});
