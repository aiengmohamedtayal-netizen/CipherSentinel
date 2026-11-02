/**
 * Vigenère Cipher: Polyalphabetic Substitution with Periodic Keyword
 * Formula: C_i = (P_i + K_i) mod 26, P_i = (C_i - K_i) mod 26
 *
 * Preserves letter casing; non-alphabetic characters remain unshifted.
 * Key index advances only when processing English alphabetic characters.
 */

export function vigenereEncrypt(text: string, key: string): string {
  const cleanKey = key.trim().toUpperCase().replace(/[^A-Z]/g, '');
  if (!cleanKey || cleanKey.length === 0) {
    throw new Error('Vigenère keyword must contain at least one alphabetic letter.');
  }

  let keyIndex = 0;
  return text
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      const isUpper = code >= 65 && code <= 90;
      const isLower = code >= 97 && code <= 122;

      if (isUpper || isLower) {
        const base = isUpper ? 65 : 97;
        const shift = cleanKey.charCodeAt(keyIndex % cleanKey.length) - 65;
        keyIndex++;
        return String.fromCharCode(((code - base + shift) % 26) + base);
      }
      return char;
    })
    .join('');
}

export function vigenereDecrypt(text: string, key: string): string {
  const cleanKey = key.trim().toUpperCase().replace(/[^A-Z]/g, '');
  if (!cleanKey || cleanKey.length === 0) {
    throw new Error('Vigenère keyword must contain at least one alphabetic letter.');
  }

  let keyIndex = 0;
  return text
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      const isUpper = code >= 65 && code <= 90;
      const isLower = code >= 97 && code <= 122;

      if (isUpper || isLower) {
        const base = isUpper ? 65 : 97;
        const shift = cleanKey.charCodeAt(keyIndex % cleanKey.length) - 65;
        keyIndex++;
        return String.fromCharCode(((code - base - shift + 26) % 26) + base);
      }
      return char;
    })
    .join('');
}
