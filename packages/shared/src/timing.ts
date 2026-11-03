export interface CancellableFunction<T extends (...args: unknown[]) => unknown> {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delayMs: number
): CancellableFunction<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debounced = (...args: Parameters<T>) => {
    lastArgs = args;
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      if (lastArgs !== null) {
        fn(...lastArgs);
        lastArgs = null;
      }
      timer = null;
    }, delayMs);
  };

  debounced.cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    lastArgs = null;
  };

  debounced.flush = () => {
    if (timer !== null && lastArgs !== null) {
      clearTimeout(timer);
      timer = null;
      fn(...lastArgs);
      lastArgs = null;
    }
  };

  return debounced;
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  intervalMs: number
): CancellableFunction<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastExecTime = 0;

  const throttled = (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = intervalMs - (now - lastExecTime);

    lastArgs = args;

    if (remaining <= 0 || remaining > intervalMs) {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      lastExecTime = now;
      fn(...lastArgs);
      lastArgs = null;
    } else if (timer === null) {
      timer = setTimeout(() => {
        lastExecTime = Date.now();
        timer = null;
        if (lastArgs !== null) {
          fn(...lastArgs);
          lastArgs = null;
        }
      }, remaining);
    }
  };

  throttled.cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    lastArgs = null;
  };

  throttled.flush = () => {
    if (timer !== null && lastArgs !== null) {
      clearTimeout(timer);
      timer = null;
      lastExecTime = Date.now();
      fn(...lastArgs);
      lastArgs = null;
    }
  };

  return throttled;
}
