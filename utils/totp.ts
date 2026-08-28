/**
 * RFC 6238 TOTP (Time-based One-Time Password) Generator and Verifier
 * Uses standard Web Crypto API (crypto.subtle) for pure client-side HMAC-SHA1
 */

// Base32 Alphabet RFC 4648
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Decode Base32 string to Uint8Array
 */
export function base32ToUint8Array(base32: string): Uint8Array {
  const cleanBase32 = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (let i = 0; i < cleanBase32.length; i++) {
    const val = BASE32_ALPHABET.indexOf(cleanBase32.charAt(i));
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }

  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substring(i * 8, (i + 1) * 8), 2);
  }
  return bytes;
}

/**
 * Generate a random Base32 secret key (16 or 32 chars)
 */
export function generateBase32Secret(length = 16): string {
  let secret = '';
  const cryptoObj = window.crypto || (window as unknown as { msCrypto: Crypto }).msCrypto;
  const randomBytes = new Uint8Array(length);
  cryptoObj.getRandomValues(randomBytes);
  for (let i = 0; i < length; i++) {
    secret += BASE32_ALPHABET[randomBytes[i] % BASE32_ALPHABET.length];
  }
  return secret;
}

/**
 * Generate 6-digit TOTP token for given secret and optional timestamp
 */
export async function generateTOTP(secret: string, timeStepSeconds = 30, offsetSteps = 0): Promise<{ token: string; remainingSeconds: number }> {
  try {
    const keyBytes = base32ToUint8Array(secret);
    if (keyBytes.length === 0) {
      return { token: '000000', remainingSeconds: 30 };
    }

    const now = Math.floor(Date.now() / 1000);
    const counter = Math.floor(now / timeStepSeconds) + offsetSteps;
    const remainingSeconds = timeStepSeconds - (now % timeStepSeconds);

    // Convert counter to 8-byte big-endian buffer
    const counterBuffer = new ArrayBuffer(8);
    const counterView = new DataView(counterBuffer);
    counterView.setBigUint64(0, BigInt(counter), false);

    // Import HMAC-SHA1 key
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyBytes as unknown as BufferSource,
      { name: 'HMAC', hash: { name: 'SHA-1' } },
      false,
      ['sign']
    );

    // Sign counter buffer
    const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, counterBuffer);
    const signatureBytes = new Uint8Array(signature);

    // Dynamic truncation (RFC 4226)
    const offset = signatureBytes[signatureBytes.length - 1] & 0xf;
    const binary =
      ((signatureBytes[offset] & 0x7f) << 24) |
      ((signatureBytes[offset + 1] & 0xff) << 16) |
      ((signatureBytes[offset + 2] & 0xff) << 8) |
      (signatureBytes[offset + 3] & 0xff);

    const otp = binary % 1000000;
    const token = otp.toString().padStart(6, '0');

    return { token, remainingSeconds };
  } catch (err) {
    console.error('Error generating TOTP:', err);
    return { token: '000000', remainingSeconds: 30 };
  }
}

/**
 * Verify a 6-digit TOTP token against a secret with window tolerance (-1, 0, +1 step)
 */
export async function verifyTOTP(token: string, secret: string, windowTolerance = 1): Promise<boolean> {
  const cleanToken = token.trim().replace(/\s+/g, '');
  if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) {
    return false;
  }

  for (let offset = -windowTolerance; offset <= windowTolerance; offset++) {
    const { token: expectedToken } = await generateTOTP(secret, 30, offset);
    if (expectedToken === cleanToken) {
      return true;
    }
  }
  return false;
}

/**
 * Build standard otpauth URI for QR Code scanning
 */
export function buildOtpAuthUri(issuer: string, accountName: string, secret: string): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountName);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}
