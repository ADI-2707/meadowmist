import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initPostHog, posthog } from './posthog';

vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
  },
}));

describe('initPostHog', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
    (globalThis as any).window = {};
  });

  afterEach(() => {
    process.env = originalEnv;
    delete (globalThis as any).window;
  });

  it('returns null if no token is provided or configured', () => {
    delete process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;

    const result = initPostHog();
    expect(result).toBeNull();
    expect(posthog.init).not.toHaveBeenCalled();
  });

  it('initializes posthog when token is provided in env', () => {
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN = 'test_token';
    process.env.NEXT_PUBLIC_POSTHOG_HOST = 'https://us.i.posthog.com';

    const result = initPostHog();
    expect(result).toBe(posthog);
    expect(posthog.init).toHaveBeenCalledWith(
      'test_token',
      expect.objectContaining({
        api_host: 'https://us.i.posthog.com',
        person_profiles: 'identified_only',
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: true,
      })
    );
  });

  it('initializes posthog with custom options and apiKey parameter', () => {
    const result = initPostHog('param_key', 'https://custom.posthog.host', {
      capture_pageview: false,
    });
    expect(result).toBe(posthog);
    expect(posthog.init).toHaveBeenCalledWith(
      'param_key',
      expect.objectContaining({
        api_host: 'https://custom.posthog.host',
        capture_pageview: false,
      })
    );
  });

  it('returns null when window is not defined', () => {
    delete (globalThis as any).window;
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN = 'test_token';
    const result = initPostHog();
    expect(result).toBeNull();
    expect(posthog.init).not.toHaveBeenCalled();
  });
});
