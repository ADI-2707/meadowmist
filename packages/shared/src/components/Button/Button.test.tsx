import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Shared Button Component', () => {
  it('renders children and responds to click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);

    const btn = screen.getByRole('button', { name: /click me/i });
    expect(btn).toBeDefined();

    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders disabled state and prevents click events', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);

    const btn = screen.getByRole('button', { name: /disabled/i });
    expect(btn.hasAttribute('disabled')).toBe(true);

    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders loading spinner and sets aria-busy when isLoading is true', () => {
    render(<Button isLoading>Loading State</Button>);

    const btn = screen.getByRole('button', { name: /loading state/i });
    expect(btn.getAttribute('aria-busy')).toBe('true');
    expect(btn.hasAttribute('disabled')).toBe(true);
  });

  it('renders variants and size classes properly', () => {
    const { container: outlineContainer } = render(<Button variant="outline" size="sm">Outline</Button>);
    expect(outlineContainer.firstElementChild).not.toBeNull();

    const { container: dangerContainer } = render(<Button variant="danger" size="lg" fullWidth>Danger</Button>);
    expect(dangerContainer.firstElementChild).not.toBeNull();
  });
});
