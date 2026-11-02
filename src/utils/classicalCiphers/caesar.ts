/**
 * Caesar Cipher: Monoalphabetic Modular Substitution
 * Formula: E(x) = (x + k) mod 26, D(x) = (x - k) mod 26
 *
 * Strict integer shift validation enforces rejection of NaN, Infinity, -Infinity,
 * fractional values, and invalid numeric strings without silent coercion.
 */

import { mod } from './common';

export function validateCaesarShift(shift: unknown): number {
  if (typeof shift === 'number') {
    if (!Number.isFinite(shift) || !Number.isInteger(shift)) {
      throw new Error('Caesar shift must be a valid integer.');
    }
    return shift;
  }

  if (typeof shift === 'string') {
    const trimmed = shift.trim();
    if (!/^-?\d+$/.test(trimmed)) {
      throw new Error('Caesar shift must be a valid integer.');
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || !Number.isSafeInteger(parsed)) {
      throw new Error('Caesar shift must be a valid integer.');
    }
    return parsed;
  }

  throw new Error('Caesar shift must be a valid integer.');
}

export function caesarEncrypt(text: string, shift: number | string): string {
  const validShift = validateCaesarShift(shift);
  const normalizedShift = mod(validShift, 26);
  return text
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        return String.fromCharCode(((code - 65 + normalizedShift) % 26) + 65);
      }
      if (code >= 97 && code <= 122) {
        return String.fromCharCode(((code - 97 + normalizedShift) % 26) + 97);
      }
      return char;
    })
    .join('');
}

export function caesarDecrypt(text: string, shift: number | string): string {
  const validShift = validateCaesarShift(shift);
  return caesarEncrypt(text, -validShift);
}
