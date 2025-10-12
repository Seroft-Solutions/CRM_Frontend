import crypto from 'node:crypto';
import type { AccessInviteTokenPayload } from './types';

const TOKEN_SEPARATOR = '.';
const SECRET_BYTES = 16; // 128 bits of entropy

function hashSecret(secret: string): Buffer {
  return crypto.createHash('sha256').update(secret).digest();
}

export function generateInviteToken(payload: AccessInviteTokenPayload) {
  // Use crypto.randomBytes for cryptographically secure random secret (128 bits)
  const secret = crypto.randomBytes(SECRET_BYTES).toString('hex');
  const token = `${payload.inviteId}${TOKEN_SEPARATOR}${payload.userId}${TOKEN_SEPARATOR}${secret}`;
  const tokenHash = hashSecret(secret).toString('hex');

  return { token, tokenHash };
}

export function parseInviteToken(
  token: string
): {
  inviteId: string;
  userId: string;
  secret: string;
} {
  const [inviteId, userId, secret] = token.split(TOKEN_SEPARATOR);
  if (!inviteId || !userId || !secret) {
    throw new Error('Invalid invitation token');
  }
  return { inviteId, userId, secret };
}

/**
 * Validates token hash using constant-time comparison to prevent timing attacks
 * @returns true if the secret matches the stored hash
 */
export function validateTokenHash(secret: string, storedHash: string): boolean {
  try {
    const secretHash = hashSecret(secret);
    const storedHashBuffer = Buffer.from(storedHash, 'hex');

    // Ensure both buffers are the same length before comparison
    if (secretHash.length !== storedHashBuffer.length) {
      return false;
    }

    // Use crypto.timingSafeEqual for constant-time comparison
    // This prevents timing attacks by taking the same amount of time
    // regardless of where the mismatch occurs
    return crypto.timingSafeEqual(secretHash, storedHashBuffer);
  } catch (error) {
    // If any error occurs (invalid hex, etc.), return false
    return false;
  }
}
