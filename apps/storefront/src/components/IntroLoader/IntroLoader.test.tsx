import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import IntroLoader from './IntroLoader';

const mockState = vi.hoisted(() => ({
  reducedMotion: false,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useReducedMotion: () => mockState.reducedMotion,
}));

vi.mock('next/image', () => ({
  default: ({ priority, ...props }: any) => <img {...props} alt={props.alt || ''} />,
}));

describe('IntroLoader Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    document.body.style.overflow = '';
    document.documentElement.className = '';
    mockState.reducedMotion = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs intro animation on first visit and cleans up upon completion', () => {
    document.documentElement.classList.add('intro-pending');
    render(<IntroLoader />);

    expect(screen.getByText('MEADOW MIST')).toBeDefined();
    expect(document.body.style.overflow).toBe('hidden');

    act(() => {
      vi.advanceTimersByTime(1600);
    });
    expect(document.documentElement.classList.contains('intro-pending')).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(screen.queryByText('MEADOW MIST')).toBeNull();
    expect(sessionStorage.getItem('meadow_mist_intro_seen')).toBe('true');
    expect(document.body.style.overflow).toBe('');
  });

  it('does not render intro when user has already seen it', () => {
    sessionStorage.setItem('meadow_mist_intro_seen', 'true');
    document.documentElement.classList.add('intro-pending');
    render(<IntroLoader />);

    expect(screen.queryByText('MEADOW MIST')).toBeNull();
    expect(document.documentElement.classList.contains('intro-pending')).toBe(false);
  });

  it('bypasses intro when user prefers reduced motion', () => {
    mockState.reducedMotion = true;
    document.documentElement.classList.add('intro-pending');
    render(<IntroLoader />);

    expect(screen.queryByText('MEADOW MIST')).toBeNull();
    expect(document.documentElement.classList.contains('intro-pending')).toBe(false);
  });

  it('dismisses intro immediately and persists seen state on user click', () => {
    document.documentElement.classList.add('intro-pending');
    render(<IntroLoader />);

    const emblem = screen.getByAltText('Meadow Mist Emblem');
    fireEvent.click(emblem);

    expect(sessionStorage.getItem('meadow_mist_intro_seen')).toBe('true');
    expect(document.documentElement.classList.contains('intro-pending')).toBe(false);
    expect(document.body.style.overflow).toBe('');
    expect(screen.queryByText('MEADOW MIST')).toBeNull();
  });
});
