/**
 * Autokey Cipher (Plaintext-Autokey Variant)
 *
 * Distinct from Ciphertext Autokey:
 * The keystream begins with the initial keyword and is extended using the PLAINTEXT itself.
 *
 * Encryption:
 * - Keystream: KEYWORD + PLAINTEXT
 * - C_i = (P_i + K_i) mod 26
 *
 * Decryption:
 * - Begins with the initial KEYWORD.
 * - For positions beyond the keyword length, each newly recovered PLAINTEXT character
 *   dynamically extends the keystream to decrypt subsequent characters:
 *   P_i = (C_i - P_{i-m}) mod 26
 *
 * Preserves letter casing; non-alphabetic characters remain unshifted.
 */

import { mod } from './common';

export function autokeyEncrypt(text: string, keyword: string): string {
  const cleanKey = keyword.trim().toUpperCase().replace(/[^A-Z]/g, '');
  if (!cleanKey || cleanKey.length === 0) {
    throw new Error('Autokey keyword must contain at least one alphabetic letter.');
  }

  const keyLen = cleanKey.length;
  const keyChars = cleanKey.split('').map((c) => c.charCodeAt(0) - 65);
  const plainAlpha: number[] = [];
  let alphaIndex = 0;

  return text
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      const isUpper = code >= 65 && code <= 90;
      const isLower = code >= 97 && code <= 122;

      if (isUpper || isLower) {
        const base = isUpper ? 65 : 97;
        const pVal = code - base;

        // Keystream character: from keyword first, then from previous plaintext
        const shift = alphaIndex < keyLen ? keyChars[alphaIndex] : plainAlpha[alphaIndex - keyLen];
        plainAlpha.push(pVal);
        alphaIndex++;

        return String.fromCharCode(mod(pVal + shift, 26) + base);
      }
      return char;
    })
    .join('');
}

export function autokeyDecrypt(text: string, keyword: string): string {
  const cleanKey = keyword.trim().toUpperCase().replace(/[^A-Z]/g, '');
  if (!cleanKey || cleanKey.length === 0) {
    throw new Error('Autokey keyword must contain at least one alphabetic letter.');
  }

  const keyLen = cleanKey.length;
  const keyChars = cleanKey.split('').map((c) => c.charCodeAt(0) - 65);
  const recoveredPlainAlpha: number[] = [];
  let alphaIndex = 0;

  return text
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      const isUpper = code >= 65 && code <= 90;
      const isLower = code >= 97 && code <= 122;

      if (isUpper || isLower) {
        const base = isUpper ? 65 : 97;
        const cVal = code - base;

        // Keystream character: from initial keyword, then from dynamically recovered plaintext
        const shift = alphaIndex < keyLen ? keyChars[alphaIndex] : recoveredPlainAlpha[alphaIndex - keyLen];
        const pVal = mod(cVal - shift, 26);
        recoveredPlainAlpha.push(pVal);
        alphaIndex++;

        return String.fromCharCode(pVal + base);
      }
      return char;
    })
    .join('');
}
