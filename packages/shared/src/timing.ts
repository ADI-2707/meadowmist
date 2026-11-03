export interface CancellableFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): CancellableFunction<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;

  const debounced = function (this: any, ...args: Parameters<T>) {
    lastArgs = args;
    lastThis = this;
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      if (lastArgs !== null) {
        fn.apply(lastThis, lastArgs);
        lastArgs = null;
        lastThis = null;
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
    lastThis = null;
  };

  debounced.flush = () => {
    if (timer !== null && lastArgs !== null) {
      clearTimeout(timer);
      timer = null;
      fn.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
    }
  };

  return debounced;
}

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  intervalMs: number
): CancellableFunction<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;
  let lastExecTime = 0;

  const throttled = function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = intervalMs - (now - lastExecTime);

    lastArgs = args;
    lastThis = this;

    if (remaining <= 0 || remaining > intervalMs) {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      lastExecTime = now;
      fn.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
    } else if (timer === null) {
      timer = setTimeout(() => {
        lastExecTime = Date.now();
        timer = null;
        if (lastArgs !== null) {
          fn.apply(lastThis, lastArgs);
          lastArgs = null;
          lastThis = null;
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
    lastThis = null;
  };

  throttled.flush = () => {
    if (timer !== null && lastArgs !== null) {
      clearTimeout(timer);
      timer = null;
      lastExecTime = Date.now();
      fn.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
    }
  };

  return throttled;
}
