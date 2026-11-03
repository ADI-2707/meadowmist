import { useRef, useCallback } from 'react';

export function useAsyncLock() {
  const isLockedRef = useRef(false);

  const runWithLock = useCallback(async <T>(action: () => Promise<T>): Promise<T | null> => {
    if (isLockedRef.current) {
      return null;
    }
    isLockedRef.current = true;
    try {
      return await action();
    } finally {
      isLockedRef.current = false;
    }
  }, []);

  const tryLock = useCallback((): boolean => {
    if (isLockedRef.current) {
      return false;
    }
    isLockedRef.current = true;
    return true;
  }, []);

  const unlock = useCallback(() => {
    isLockedRef.current = false;
  }, []);

  const isLocked = useCallback(() => isLockedRef.current, []);

  return { runWithLock, tryLock, unlock, isLocked, isLockedRef };
}
