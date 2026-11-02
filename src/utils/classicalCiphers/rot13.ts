/**
 * ROT13 Cipher: Fixed Shift of 13 Positions
 * Formula: E(x) = (x + 13) mod 26, D(x) = (x + 13) mod 26
 *
 * An involution cipher (self-reciprocal): applying ROT13 twice returns the original text.
 * Preserves letter casing; non-alphabetic characters remain unshifted.
 */

import { caesarEncrypt } from './caesar';

export function rot13(text: string): string {
  return caesarEncrypt(text, 13);
}

export function rot13Encrypt(text: string): string {
  return rot13(text);
}

export function rot13Decrypt(text: string): string {
  return rot13(text);
}
