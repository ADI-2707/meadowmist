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

  constructor(url: string, token: string) {
    this.url = url.replace(/\/$/, '');
    this.token = token;
  }

  async get(key: string): Promise<AttemptRecord | undefined> {
    try {
      const res = await fetch(`${this.url}/get/${encodeURIComponent(key)}`, {
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
      await fetch(
        `${this.url}/set/${encodeURIComponent(key)}/${encodeURIComponent(JSON.stringify(record))}?ex=${ttlSeconds}`,
        {
          headers: { Authorization: `Bearer ${this.token}` },
        }
      );
    } catch {}
  }

  async delete(key: string): Promise<void> {
    try {
      await fetch(`${this.url}/del/${encodeURIComponent(key)}`, {
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
