import posthog, { PostHogConfig } from 'posthog-js';

export const POSTHOG_DEFAULT_OPTIONS: Partial<PostHogConfig> = {
  person_profiles: 'identified_only',
  capture_pageview: true,
  capture_pageleave: true,
  autocapture: true,
  defaults: '2026-08-30',
};

export function initPostHog(apiKey?: string, host?: string, customOptions?: Partial<PostHogConfig>) {
  const token = apiKey || process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const apiHost = host || process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  if (!token || typeof window === 'undefined') {
    return null;
  }

  posthog.init(token, {
    api_host: apiHost,
    ...POSTHOG_DEFAULT_OPTIONS,
    ...customOptions,
  });

  return posthog;
}

export { posthog };
