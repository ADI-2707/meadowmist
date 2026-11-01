import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkLoginAttempt,
  recordFailedAttempt,
  resetFailedAttempts,
  _clearRateLimitStore,
} from './rateLimit';

describe('Incremental Account Lockout Engine', () => {
  beforeEach(() => {
    _clearRateLimitStore();
  });

  const ip = '192.168.1.50';
  const email = 'artisan@meadowmist.in';

  it('allows attempts 1 through 4 without lockout', () => {
    for (let i = 1; i <= 4; i++) {
      const res = recordFailedAttempt(ip, email);
      expect(res.allowed).toBe(true);
      expect(res.remainingSeconds).toBe(0);
      expect(res.attemptCount).toBe(i);

      const check = checkLoginAttempt(ip, email);
      expect(check.allowed).toBe(true);
      expect(check.remainingSeconds).toBe(0);
    }
  });

  it('locks for 30 seconds on 5th failure from same IP', () => {
    for (let i = 1; i <= 4; i++) {
      recordFailedAttempt(ip, email);
    }

    const fifth = recordFailedAttempt(ip, email);
    expect(fifth.allowed).toBe(false);
    expect(fifth.remainingSeconds).toBe(30);
    expect(fifth.attemptCount).toBe(5);

    const check = checkLoginAttempt(ip, email);
    expect(check.allowed).toBe(false);
    expect(check.remainingSeconds).toBeGreaterThan(0);
    expect(check.remainingSeconds).toBeLessThanOrEqual(30);
  });

  it('scales lock to 60 seconds on 6th consecutive failure', () => {
    for (let i = 1; i <= 5; i++) {
      recordFailedAttempt(ip, email);
    }

    const sixth = recordFailedAttempt(ip, email);
    expect(sixth.allowed).toBe(false);
    expect(sixth.remainingSeconds).toBe(60);
    expect(sixth.attemptCount).toBe(6);
  });

  it('scales lock to 300 seconds on 7th failure and 900 seconds on 8th failure', () => {
    for (let i = 1; i <= 6; i++) {
      recordFailedAttempt(ip, email);
    }

    const seventh = recordFailedAttempt(ip, email);
    expect(seventh.allowed).toBe(false);
    expect(seventh.remainingSeconds).toBe(300);

    const eighth = recordFailedAttempt(ip, email);
    expect(eighth.allowed).toBe(false);
    expect(eighth.remainingSeconds).toBe(900);

    const ninth = recordFailedAttempt(ip, email);
    expect(ninth.allowed).toBe(false);
    expect(ninth.remainingSeconds).toBe(3600);
  });

  it('resets lockout on successful login', () => {
    for (let i = 1; i <= 5; i++) {
      recordFailedAttempt(ip, email);
    }

    expect(checkLoginAttempt(ip, email).allowed).toBe(false);

    resetFailedAttempts(ip, email);

    const check = checkLoginAttempt(ip, email);
    expect(check.allowed).toBe(true);
    expect(check.attemptCount).toBe(0);
    expect(check.remainingSeconds).toBe(0);
  });

  it('detects distributed bot attacks across multiple distinct IPs targeting same email', () => {
    const targetEmail = 'victim@example.com';

    for (let i = 1; i <= 5; i++) {
      const res = recordFailedAttempt(`10.0.0.${i}`, targetEmail);
      expect(res.allowed).toBe(true);
      expect(res.requireStepUp).toBe(false);
      expect(res.targetAttemptCount).toBe(i);
    }

    const sixth = recordFailedAttempt('10.0.0.6', targetEmail);
    expect(sixth.allowed).toBe(true);
    expect(sixth.requireStepUp).toBe(true);
    expect(sixth.targetAttemptCount).toBe(6);

    const check = checkLoginAttempt('10.0.0.99', targetEmail);
    expect(check.allowed).toBe(true);
    expect(check.requireStepUp).toBe(true);
  });

  it('locks IP across different email targets after 5 failures to stop spraying', () => {
    const attackerIp = '203.0.113.42';

    for (let i = 1; i <= 4; i++) {
      recordFailedAttempt(attackerIp, `user${i}@example.com`);
    }

    const fifth = recordFailedAttempt(attackerIp, 'user5@example.com');
    expect(fifth.allowed).toBe(false);
    expect(fifth.remainingSeconds).toBe(30);

    const checkDifferentTarget = checkLoginAttempt(attackerIp, 'another_victim@example.com');
    expect(checkDifferentTarget.allowed).toBe(false);
  });

  it('enforces safety cap on target email after 15 distributed failures', () => {
    const targetEmail = 'admin@meadowmist.in';

    for (let i = 1; i <= 14; i++) {
      recordFailedAttempt(`198.51.100.${i}`, targetEmail);
    }

    const fifteenth = recordFailedAttempt('198.51.100.15', targetEmail);
    expect(fifteenth.allowed).toBe(false);
    expect(fifteenth.remainingSeconds).toBe(300);

    const checkNewIp = checkLoginAttempt('198.51.100.99', targetEmail);
    expect(checkNewIp.allowed).toBe(false);
    expect(checkNewIp.remainingSeconds).toBeGreaterThan(0);
  });
});
