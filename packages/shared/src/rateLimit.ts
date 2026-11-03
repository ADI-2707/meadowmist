export interface AttemptRecord {
  count: number;
  lockedUntil: number;
  lastAttemptAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  requireStepUp: boolean;
  remainingSeconds: number;
  attemptCount: number;
  targetAttemptCount: number;
}

export interface RateLimitStore {
  get(key: string): AttemptRecord | undefined;
  set(key: string, record: AttemptRecord): void;
  delete(key: string): void;
  clear(): void;
}

export class MemoryRateLimitStore implements RateLimitStore {
  private map = new Map<string, AttemptRecord>();

  get(key: string): AttemptRecord | undefined {
    return this.map.get(key);
  }

  set(key: string, record: AttemptRecord): void {
    this.map.set(key, record);
  }

  delete(key: string): void {
    this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }
}

export class UpstashRedisRateLimitStore {
  private url: string;
  private token: string;
  private keyPrefix: string;

  constructor(url: string, token: string, keyPrefix: string = 'meadowmist:') {
    this.url = url.replace(/\/$/, '');
    this.token = token;
    this.keyPrefix = keyPrefix;
  }

  private formatKey(key: string): string {
    if (key.startsWith(this.keyPrefix)) return key;
    return `${this.keyPrefix}${key}`;
  }

  async get(key: string): Promise<AttemptRecord | undefined> {
    try {
      const fullKey = this.formatKey(key);
      const res = await fetch(`${this.url}/get/${encodeURIComponent(fullKey)}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      if (!res.ok) return undefined;
      const data = await res.json();
      if (!data.result) return undefined;
      return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
    } catch {
      return undefined;
    }
  }

  async set(key: string, record: AttemptRecord, ttlSeconds: number = 3600): Promise<void> {
    try {
      const fullKey = this.formatKey(key);
      await fetch(
        `${this.url}/set/${encodeURIComponent(fullKey)}/${encodeURIComponent(JSON.stringify(record))}?ex=${ttlSeconds}`,
        {
          headers: { Authorization: `Bearer ${this.token}` },
        }
      );
    } catch {}
  }

  async delete(key: string): Promise<void> {
    try {
      const fullKey = this.formatKey(key);
      await fetch(`${this.url}/del/${encodeURIComponent(fullKey)}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
    } catch {}
  }
}

let store: RateLimitStore = new MemoryRateLimitStore();

export function getRateLimitStore(): RateLimitStore {
  return store;
}

export function setRateLimitStore(newStore: RateLimitStore): void {
  store = newStore;
}

function getIpLockDurationSeconds(failureCount: number): number {
  if (failureCount < 5) return 0;
  if (failureCount === 5) return 30;
  if (failureCount === 6) return 60;
  if (failureCount === 7) return 300;
  if (failureCount === 8) return 900;
  return 3600;
}

export function makeIpKey(ip: string): string {
  const safeIp = ip.trim().toLowerCase() || 'unknown-ip';
  return `ip:${safeIp}`;
}

export function makeTargetKey(email: string): string {
  const safeEmail = email.trim().toLowerCase() || 'unknown-target';
  return `target:${safeEmail}`;
}

export function checkLoginAttempt(ip: string, email: string): RateLimitResult {
  const now = Date.now();
  const ipKey = makeIpKey(ip);
  const targetKey = makeTargetKey(email);

  const ipRecord = store.get(ipKey);
  const targetRecord = store.get(targetKey);

  const ipAttempts = ipRecord?.count || 0;
  const targetAttempts = targetRecord?.count || 0;

  if (ipRecord && ipRecord.lockedUntil > now) {
    const remainingSeconds = Math.ceil((ipRecord.lockedUntil - now) / 1000);
    return {
      allowed: false,
      requireStepUp: true,
      remainingSeconds,
      attemptCount: ipAttempts,
      targetAttemptCount: targetAttempts,
    };
  }

  if (targetRecord && targetRecord.lockedUntil > now) {
    const remainingSeconds = Math.ceil((targetRecord.lockedUntil - now) / 1000);
    return {
      allowed: false,
      requireStepUp: true,
      remainingSeconds,
      attemptCount: ipAttempts,
      targetAttemptCount: targetAttempts,
    };
  }

  const requireStepUp = targetAttempts >= 6 || ipAttempts >= 3;

  return {
    allowed: true,
    requireStepUp,
    remainingSeconds: 0,
    attemptCount: ipAttempts,
    targetAttemptCount: targetAttempts,
  };
}

export function recordFailedAttempt(ip: string, email: string): RateLimitResult {
  const now = Date.now();
  const ipKey = makeIpKey(ip);
  const targetKey = makeTargetKey(email);

  const ipRecord = store.get(ipKey);
  const targetRecord = store.get(targetKey);

  const nextIpCount = (ipRecord?.count || 0) + 1;
  const ipLockDuration = getIpLockDurationSeconds(nextIpCount);
  const ipLockedUntil = ipLockDuration > 0 ? now + ipLockDuration * 1000 : 0;

  store.set(ipKey, {
    count: nextIpCount,
    lockedUntil: ipLockedUntil,
    lastAttemptAt: now,
  });

  const nextTargetCount = (targetRecord?.count || 0) + 1;
  const targetLockDuration = nextTargetCount >= 15 ? 300 : 0;
  const targetLockedUntil = targetLockDuration > 0 ? now + targetLockDuration * 1000 : 0;

  store.set(targetKey, {
    count: nextTargetCount,
    lockedUntil: targetLockedUntil,
    lastAttemptAt: now,
  });

  const isAllowed = ipLockDuration === 0 && targetLockDuration === 0;
  const remainingSeconds = Math.max(ipLockDuration, targetLockDuration);
  const requireStepUp = nextTargetCount >= 6 || nextIpCount >= 3;

  return {
    allowed: isAllowed,
    requireStepUp,
    remainingSeconds,
    attemptCount: nextIpCount,
    targetAttemptCount: nextTargetCount,
  };
}

export async function checkLoginAttemptDistributed(
  ip: string,
  email: string,
  redisClient?: UpstashRedisRateLimitStore
): Promise<RateLimitResult> {
  if (!redisClient) {
    return checkLoginAttempt(ip, email);
  }

  const now = Date.now();
  const ipKey = makeIpKey(ip);
  const targetKey = makeTargetKey(email);

  const [ipRecord, targetRecord] = await Promise.all([
    redisClient.get(ipKey),
    redisClient.get(targetKey),
  ]);

  const ipAttempts = ipRecord?.count || 0;
  const targetAttempts = targetRecord?.count || 0;

  if (ipRecord && ipRecord.lockedUntil > now) {
    const remainingSeconds = Math.ceil((ipRecord.lockedUntil - now) / 1000);
    return {
      allowed: false,
      requireStepUp: true,
      remainingSeconds,
      attemptCount: ipAttempts,
      targetAttemptCount: targetAttempts,
    };
  }

  if (targetRecord && targetRecord.lockedUntil > now) {
    const remainingSeconds = Math.ceil((targetRecord.lockedUntil - now) / 1000);
    return {
      allowed: false,
      requireStepUp: true,
      remainingSeconds,
      attemptCount: ipAttempts,
      targetAttemptCount: targetAttempts,
    };
  }

  return {
    allowed: true,
    requireStepUp: targetAttempts >= 6 || ipAttempts >= 3,
    remainingSeconds: 0,
    attemptCount: ipAttempts,
    targetAttemptCount: targetAttempts,
  };
}

export function resetFailedAttempts(ip: string, email: string): void {
  store.delete(makeIpKey(ip));
  store.delete(makeTargetKey(email));
}

export function _clearRateLimitStore(): void {
  store.clear();
}

export interface EndpointRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

const memoryCounters = new Map<string, { count: number; expiresAt: number }>();

export async function checkEndpointRateLimit(
  identifier: string,
  maxRequests: number = 30,
  windowSeconds: number = 60
): Promise<EndpointRateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      const redis = new UpstashRedisRateLimitStore(url, token);
      const key = `ratelimit:${identifier}`;
      const existing = await redis.get(key);
      const now = Date.now();

      if (existing && existing.lockedUntil > now) {
        if (existing.count >= maxRequests) {
          return {
            allowed: false,
            remaining: 0,
            resetSeconds: Math.ceil((existing.lockedUntil - now) / 1000),
          };
        }
        const updatedCount = existing.count + 1;
        await redis.set(
          key,
          {
            count: updatedCount,
            lockedUntil: existing.lockedUntil,
            lastAttemptAt: now,
          },
          Math.max(1, Math.ceil((existing.lockedUntil - now) / 1000))
        );
        return {
          allowed: true,
          remaining: Math.max(0, maxRequests - updatedCount),
          resetSeconds: Math.ceil((existing.lockedUntil - now) / 1000),
        };
      } else {
        const lockedUntil = now + windowSeconds * 1000;
        await redis.set(
          key,
          {
            count: 1,
            lockedUntil,
            lastAttemptAt: now,
          },
          windowSeconds
        );
        return {
          allowed: true,
          remaining: maxRequests - 1,
          resetSeconds: windowSeconds,
        };
      }
    } catch {}
  }

  const now = Date.now();
  const entry = memoryCounters.get(identifier);
  if (entry && entry.expiresAt > now) {
    if (entry.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetSeconds: Math.ceil((entry.expiresAt - now) / 1000),
      };
    }
    entry.count += 1;
    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - entry.count),
      resetSeconds: Math.ceil((entry.expiresAt - now) / 1000),
    };
  }

  const expiresAt = now + windowSeconds * 1000;
  memoryCounters.set(identifier, { count: 1, expiresAt });
  return {
    allowed: true,
    remaining: maxRequests - 1,
    resetSeconds: windowSeconds,
  };
}
