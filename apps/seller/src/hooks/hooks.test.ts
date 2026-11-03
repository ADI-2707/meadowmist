import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce, useDebouncedCallback } from './useDebounce';
import { useAsyncLock } from './useAsyncLock';

describe('seller useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debounces value updates', () => {
    const { result, rerender } = renderHook(({ val }) => useDebounce(val, 350), {
      initialProps: { val: 'a' },
    });

    expect(result.current).toBe('a');

    rerender({ val: 'b' });
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(result.current).toBe('b');
  });

  it('cancels pending debounced callback', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(fn, 350));

    act(() => {
      result.current.debounced('run');
      result.current.cancel();
      vi.advanceTimersByTime(400);
    });

    expect(fn).not.toHaveBeenCalled();
  });
});

describe('seller useAsyncLock', () => {
  it('synchronously locks and unlocks', () => {
    const { result } = renderHook(() => useAsyncLock());

    expect(result.current.tryLock()).toBe(true);
    expect(result.current.tryLock()).toBe(false);

    result.current.unlock();
    expect(result.current.tryLock()).toBe(true);
  });
});
