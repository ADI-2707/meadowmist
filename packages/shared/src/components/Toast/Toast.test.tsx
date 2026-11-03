import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { ToastProvider, toast } from './Toast';

describe('Shared Toast Notification System', () => {
  beforeEach(() => {
    toast.clear();
  });

  it('renders success toast when triggered', () => {
    render(<ToastProvider />);

    act(() => {
      toast.success('Profile updated successfully');
    });

    expect(screen.getByText('Profile updated successfully')).toBeDefined();
    const alertEl = screen.getByRole('status');
    expect(alertEl).toBeDefined();
  });

  it('renders error toast with alert role', () => {
    render(<ToastProvider />);

    act(() => {
      toast.error('Failed to save changes');
    });

    expect(screen.getByText('Failed to save changes')).toBeDefined();
    const alertEl = screen.getByRole('alert');
    expect(alertEl).toBeDefined();
  });

  it('dismisses toast when close button is clicked', () => {
    render(<ToastProvider />);

    act(() => {
      toast.info('Temporary notice');
    });

    expect(screen.getByText('Temporary notice')).toBeDefined();

    const closeBtn = screen.getByRole('button', { name: /dismiss notification/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByText('Temporary notice')).toBeNull();
  });

  it('automatically dismisses toast after timeout', () => {
    vi.useFakeTimers();
    render(<ToastProvider />);

    act(() => {
      toast.success('Auto dismiss test');
    });

    expect(screen.getByText('Auto dismiss test')).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.queryByText('Auto dismiss test')).toBeNull();
    vi.useRealTimers();
  });
});
