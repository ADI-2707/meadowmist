import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { Skeleton } from './Skeleton';

describe('Skeleton Primitive Component', () => {
  it('renders with role status and aria-busy true', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild;
    expect(el).not.toBeNull();
    expect(el?.getAttribute('role')).toBe('status');
    expect(el?.getAttribute('aria-busy')).toBe('true');
  });

  it('applies custom width, height, and border radius as inline styles', () => {
    const { container } = render(
      <Skeleton width={120} height={40} borderRadius={10} data-testid="custom-skeleton" />
    );
    const el = container.querySelector('[data-testid="custom-skeleton"]') as HTMLElement;
    expect(el).not.toBeNull();
    expect(el.style.width).toBe('120px');
    expect(el.style.height).toBe('40px');
    expect(el.style.borderRadius).toBe('10px');
  });

  it('renders different variants properly', () => {
    const { container: textContainer } = render(<Skeleton variant="text" />);
    expect(textContainer.firstElementChild).not.toBeNull();

    const { container: circContainer } = render(<Skeleton variant="circular" width={50} height={50} />);
    expect(circContainer.firstElementChild).not.toBeNull();
  });
});
