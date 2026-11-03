'use client';

import React, { useEffect } from 'react';
import { initPostHog } from '../../posthog';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  return <>{children}</>;
}

export default PostHogProvider;
