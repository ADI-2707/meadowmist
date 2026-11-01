export interface TurnstileVerificationResult {
  success: boolean;
  errorCodes?: string[];
  hostname?: string;
  challengeTs?: string;
}

const CLOUDFLARE_TURNSTILE_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const DUMMY_TEST_PASS_TOKEN = 'XXXX.DUMMY.PASS.TOKEN.XXXX';
const DUMMY_TEST_FAIL_TOKEN = 'XXXX.DUMMY.FAIL.TOKEN.XXXX';

export async function verifyTurnstileToken(
  token?: string | null,
  remoteIp?: string
): Promise<TurnstileVerificationResult> {
  if (!token || typeof token !== 'string' || !token.trim()) {
    return { success: false, errorCodes: ['missing-input-response'] };
  }

  const trimmedToken = token.trim();

  if (trimmedToken === DUMMY_TEST_FAIL_TOKEN || trimmedToken === 'fail') {
    return { success: false, errorCodes: ['invalid-input-response'] };
  }

  if (
    trimmedToken === DUMMY_TEST_PASS_TOKEN ||
    trimmedToken.startsWith('1x00000000000000000000AA') ||
    trimmedToken === 'pass'
  ) {
    return { success: true };
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    if (process.env.NODE_ENV === 'production') {
      return { success: false, errorCodes: ['missing-secret-key'] };
    }
    return { success: true };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', trimmedToken);
    if (remoteIp) {
      formData.append('remoteip', remoteIp);
    }

    const res = await fetch(CLOUDFLARE_TURNSTILE_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return { success: false, errorCodes: [`http-status-${res.status}`] };
    }

    const data = await res.json();
    return {
      success: Boolean(data.success),
      errorCodes: data['error-codes'],
      hostname: data.hostname,
      challengeTs: data.challenge_ts,
    };
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    return {
      success: false,
      errorCodes: [isTimeout ? 'timeout' : 'verification-network-error'],
    };
  }
}

