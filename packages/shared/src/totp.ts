import crypto from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(base32: string): Buffer {
  const clean = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = '';
  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_ALPHABET.indexOf(clean[i]);
    if (val === -1) {
      throw new Error(`Invalid Base32 character: ${clean[i]}`);
    }
    bits += val.toString(2).padStart(5, '0');
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }

  return Buffer.from(bytes);
}

export function generateTotpSecret(length: number = 20): string {
  const buffer = crypto.randomBytes(length);
  let result = '';
  let bits = '';

  for (let i = 0; i < buffer.length; i++) {
    bits += buffer[i].toString(2).padStart(8, '0');
  }

  for (let i = 0; i + 5 <= bits.length; i += 5) {
    const index = parseInt(bits.substring(i, i + 5), 2);
    result += BASE32_ALPHABET[index];
  }

  return result;
}

export function generateTotpToken(secret: string, timestamp: number = Date.now()): string {
  const key = base32Decode(secret);
  const epoch = Math.floor(timestamp / 1000);
  const timeStep = Math.floor(epoch / 30);

  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(timeStep));

  const hmac = crypto.createHmac('sha1', key);
  hmac.update(counterBuffer);
  const hash = hmac.digest();

  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

export function verifyTotpCode(
  secret: string,
  code: string,
  timestamp: number = Date.now(),
  window: number = 1
): boolean {
  if (!secret || !code) return false;
  const cleanCode = code.trim().replace(/\s+/g, '');
  if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
    return false;
  }

  try {
    for (let i = -window; i <= window; i++) {
      const stepTime = timestamp + i * 30 * 1000;
      const expected = generateTotpToken(secret, stepTime);
      if (crypto.timingSafeEqual(Buffer.from(cleanCode), Buffer.from(expected))) {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
}

export function generateTotpUri(
  secret: string,
  accountName: string,
  issuer: string = 'Meadow Mist'
): string {
  const encIssuer = encodeURIComponent(issuer);
  const encAccount = encodeURIComponent(accountName);
  return `otpauth://totp/${encIssuer}:${encAccount}?secret=${secret}&issuer=${encIssuer}&algorithm=SHA1&digits=6&period=30`;
}
