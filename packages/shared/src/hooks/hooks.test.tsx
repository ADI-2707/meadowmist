import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce, useDebouncedCallback } from './useDebounce';
import { useAsyncLock } from './useAsyncLock';
import { useThrottle } from './useThrottle';

describe('Shared Custom Hooks', () => {
  it('useDebounce delays value updates', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ val }) => useDebounce(val, 300), {
      initialProps: { val: 'initial' },
    });

    expect(result.current).toBe('initial');

    rerender({ val: 'updated' });
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('updated');
    vi.useRealTimers();
  });

  it('useDebouncedCallback debounces callback execution', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(fn, 200));

    act(() => {
      result.current.debounced('arg1');
      result.current.debounced('arg2');
    });

    expect(fn).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('arg2');
    vi.useRealTimers();
  });

  it('useAsyncLock prevents concurrent async execution', async () => {
    const { result } = renderHook(() => useAsyncLock());

    let resolveAction: () => void = () => {};
    const promise = new Promise<string>((res) => {
      resolveAction = () => res('done');
    });

    const call1 = result.current.runWithLock(() => promise);
    const call2 = result.current.runWithLock(async () => 'should be skipped');

    expect(result.current.isLocked()).toBe(true);
    expect(await call2).toBeNull();

    resolveAction();
    expect(await call1).toBe('done');
    expect(result.current.isLocked()).toBe(false);
  });

  it('useThrottle throttles value changes', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ val }) => useThrottle(val, 200), {
      initialProps: { val: 1 },
    });

    expect(result.current).toBe(1);

    rerender({ val: 2 });
    expect(result.current).toBe(1);

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe(2);
    vi.useRealTimers();
  });
});
