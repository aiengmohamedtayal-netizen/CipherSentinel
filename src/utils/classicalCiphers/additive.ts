/**
 * Additive Cipher: General Integer Shift Substitution
 * Formula: E(x) = (x + k) mod 26, D(x) = (x - k) mod 26
 *
 * Mathematically equivalent to the generalized Caesar Cipher.
 * Accepts finite integer keys (positive, negative, zero, large integers).
 * Rejects non-finite values (NaN, Infinity, -Infinity), fractional values, and invalid strings.
 */

import { caesarEncrypt, caesarDecrypt } from './caesar';

export function validateAdditiveKey(key: unknown): number {
  if (typeof key === 'number') {
    if (!Number.isFinite(key) || !Number.isInteger(key)) {
      throw new Error('Additive key must be a valid integer.');
    }
    return key;
  }

  if (typeof key === 'string') {
    const trimmed = key.trim();
    if (!/^-?\d+$/.test(trimmed)) {
      throw new Error('Additive key must be a valid integer.');
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || !Number.isSafeInteger(parsed)) {
      throw new Error('Additive key must be a valid integer.');
    }
    return parsed;
  }

  throw new Error('Additive key must be a valid integer.');
}

export function additiveEncrypt(text: string, key: number | string): string {
  const validKey = validateAdditiveKey(key);
  return caesarEncrypt(text, validKey);
}

export function additiveDecrypt(text: string, key: number | string): string {
  const validKey = validateAdditiveKey(key);
  return caesarDecrypt(text, validKey);
}
