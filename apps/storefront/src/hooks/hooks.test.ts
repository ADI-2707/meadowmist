import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce, useDebouncedCallback } from './useDebounce';
import { useThrottle, useRafThrottle } from './useThrottle';
import { useAsyncLock } from './useAsyncLock';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('updates debounced value only after specified delay', () => {
    const { result, rerender } = renderHook(({ val }) => useDebounce(val, 200), {
      initialProps: { val: 'initial' },
    });

    expect(result.current).toBe('initial');

    rerender({ val: 'updated' });
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(199);
    });
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('updated');
  });

  it('cancels pending callback execution', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(fn, 200));

    act(() => {
      result.current.debounced('call 1');
      result.current.cancel();
      vi.advanceTimersByTime(300);
    });

    expect(fn).not.toHaveBeenCalled();
  });
});

describe('useThrottle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throttles rapid value changes', () => {
    const { result, rerender } = renderHook(({ val }) => useThrottle(val, 200), {
      initialProps: { val: 1 },
    });

    expect(result.current).toBe(1);

    rerender({ val: 2 });
    rerender({ val: 3 });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toBe(3);
  });

  it('coalesces raf throttled callback executions', () => {
    const fn = vi.fn();
    let rafCallback: FrameRequestCallback | null = null;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      rafCallback = cb;
      return 1;
    });

    const { result } = renderHook(() => useRafThrottle(fn));

    act(() => {
      result.current('first');
      result.current('second');
    });

    expect(fn).not.toHaveBeenCalled();

    act(() => {
      if (rafCallback) rafCallback(0);
    });

    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('useAsyncLock', () => {
  it('prevents concurrent executions of locked actions', async () => {
    const { result } = renderHook(() => useAsyncLock());

    let resolveFirst: (val: string) => void = () => {};
    const firstPromise = new Promise<string>((resolve) => {
      resolveFirst = resolve;
    });

    let firstExecuted = false;
    let secondExecuted = false;

    const p1 = result.current.runWithLock(async () => {
      firstExecuted = true;
      return await firstPromise;
    });

    const p2 = result.current.runWithLock(async () => {
      secondExecuted = true;
      return 'second';
    });

    expect(firstExecuted).toBe(true);
    expect(secondExecuted).toBe(false);

    resolveFirst('done');
    const r1 = await p1;
    const r2 = await p2;

    expect(r1).toBe('done');
    expect(r2).toBeNull();
  });

  it('supports synchronous tryLock and unlock', () => {
    const { result } = renderHook(() => useAsyncLock());

    expect(result.current.tryLock()).toBe(true);
    expect(result.current.tryLock()).toBe(false);
    expect(result.current.isLocked()).toBe(true);

    result.current.unlock();
    expect(result.current.isLocked()).toBe(false);
    expect(result.current.tryLock()).toBe(true);
  });
});

