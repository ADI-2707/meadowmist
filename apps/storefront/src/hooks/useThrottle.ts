import { useState, useEffect, useRef, useCallback } from 'react';

export function useThrottle<T>(value: T, intervalMs: number = 200): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastExecuted = useRef<number>(Date.now());

  useEffect(() => {
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

export function useRafThrottle<T extends (...args: any[]) => void>(callback: T): T {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  const rafId = useRef<number | null>(null);

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
