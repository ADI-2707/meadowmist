'use client';

import React, { useEffect } from 'react';
import { initPostHog } from '@meadowmist/shared';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  return <>{children}</>;
}
