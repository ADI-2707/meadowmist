'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export function useThrottle<T>(value: T, intervalMs: number = 200): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastExecuted = useRef<number>(0);

  useEffect(() => {
    if (lastExecuted.current === 0) {
      lastExecuted.current = Date.now();
      return;
    }

    const elapsed = Date.now() - lastExecuted.current;
    if (elapsed >= intervalMs) {
      lastExecuted.current = Date.now();
      setThrottledValue(value);
    } else {
      const timer = setTimeout(() => {
        lastExecuted.current = Date.now();
        setThrottledValue(value);
      }, intervalMs - elapsed);

      return () => clearTimeout(timer);
    }
  }, [value, intervalMs]);

  return throttledValue;
}

export function useRafThrottle<T extends (...args: unknown[]) => void>(callback: T): T {
  const callbackRef = useRef(callback);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttled = useCallback((...args: Parameters<T>) => {
    if (rafId.current !== null) return;
    rafId.current = window.requestAnimationFrame(() => {
      rafId.current = null;
      callbackRef.current(...args);
    });
  }, []) as T;

  useEffect(() => {
    return () => {
      if (rafId.current !== null) {
        window.cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return throttled;
}
