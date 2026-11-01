import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { TopLoader } from './TopLoader';

const mockSearchParams = new URLSearchParams('');

vi.mock('next/navigation', () => ({
  usePathname: () => '/products',
  useSearchParams: () => mockSearchParams,
}));

describe('TopLoader Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initially with zero opacity when idle', () => {
    const { container } = render(<TopLoader />);
    const bar = container.querySelector('[style*="width"]') as HTMLElement;
    expect(bar).toBeDefined();
    expect(bar.style.opacity).toBe('0');
  });

  it('displays active progress bar when seller:loading:start event is dispatched', () => {
    const { container } = render(<TopLoader />);

    act(() => {
      window.dispatchEvent(new Event('seller:loading:start'));
    });

    const bar = container.querySelector('[style*="width"]') as HTMLElement;
    expect(bar.style.opacity).toBe('1');
    expect(bar.style.width).toBe('25%');
  });
});
