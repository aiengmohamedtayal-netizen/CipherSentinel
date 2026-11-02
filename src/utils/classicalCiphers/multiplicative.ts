/**
 * Multiplicative Cipher: Modular Multiplication
 * Formula: E(x) = (x * k) mod 26, D(x) = (x * k⁻¹) mod 26
 *
 * The key k must be coprime with 26 (gcd(k, 26) = 1).
 * Valid normalized keys modulo 26: 1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25.
 * Rejects non-coprime numbers, fractional values, non-finite values (NaN, Infinity), and invalid strings.
 */

import { mod, gcd, modInverse } from './common';

export const VALID_MULTIPLICATIVE_KEYS = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25] as const;

export function validateMultiplicativeKey(key: unknown): { normalizedKey: number; inverseKey: number } {
  let numericKey: number;

  if (typeof key === 'number') {
    if (!Number.isFinite(key) || !Number.isInteger(key)) {
      throw new Error('Multiplicative key must be a valid integer.');
    }
    numericKey = key;
  } else if (typeof key === 'string') {
    const trimmed = key.trim();
    if (!/^-?\d+$/.test(trimmed)) {
      throw new Error('Multiplicative key must be a valid integer.');
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || !Number.isSafeInteger(parsed)) {
      throw new Error('Multiplicative key must be a valid integer.');
    }
    numericKey = parsed;
  } else {
    throw new Error('Multiplicative key must be a valid integer.');
  }

  const normalized = mod(numericKey, 26);
  const divisor = gcd(normalized, 26);
  if (divisor !== 1 || normalized === 0) {
    throw new Error(
      `Multiplicative key (${numericKey} ≡ ${normalized} mod 26) must be coprime with 26 (gcd=${divisor}). Valid keys are: ${VALID_MULTIPLICATIVE_KEYS.join(', ')}.`
    );
  }

  const inverseKey = modInverse(normalized, 26);
  return { normalizedKey: normalized, inverseKey };
}

export function multiplicativeEncrypt(text: string, key: number | string): string {
  const { normalizedKey } = validateMultiplicativeKey(key);
  return text
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        return String.fromCharCode(mod((code - 65) * normalizedKey, 26) + 65);
      }
      if (code >= 97 && code <= 122) {
        return String.fromCharCode(mod((code - 97) * normalizedKey, 26) + 97);
      }
      return char;
    })
    .join('');
}

export function multiplicativeDecrypt(text: string, key: number | string): string {
  const { inverseKey } = validateMultiplicativeKey(key);
  return text
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        return String.fromCharCode(mod((code - 65) * inverseKey, 26) + 65);
      }
      if (code >= 97 && code <= 122) {
        return String.fromCharCode(mod((code - 97) * inverseKey, 26) + 97);
      }
      return char;
    })
    .join('');
}
