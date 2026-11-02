/**
 * Playfair Cipher: Digraph Substitution via 5x5 Key Matrix
 *
 * Matrix Generation:
 * - Keyword normalized: uppercase, J -> I, non-alphabetic removed.
 * - Deduplicate letters while preserving order.
 * - Append remaining alphabet (excluding J).
 *
 * Plaintext Preparation:
 * - Filter A-Z, map J -> I.
 * - Split into digraphs.
 * - Insert filler 'X' (or 'Q' if the letter is 'X') for repeated letters in a pair.
 * - Pad final trailing letter with 'X' (or 'Q' if 'X').
 *
 * Transformations:
 * - Same row: shift right (+1) / left (-1) modulo 5.
 * - Same col: shift down (+1) / up (-1) modulo 5.
 * - Rectangle: exchange column coordinates.
 */

import { mod } from './common';
import { PlayfairResult } from './types';

export function generatePlayfairMatrix(keyword: string): { matrix: string[][]; coords: Map<string, { r: number; c: number }>; normalizedKey: string } {
  const cleanKey = keyword.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
  if (!cleanKey || cleanKey.length === 0) {
    throw new Error('Playfair keyword must contain at least one alphabetic letter.');
  }

  const seen = new Set<string>();
  const keyChars: string[] = [];

  for (const char of cleanKey) {
    if (!seen.has(char)) {
      seen.add(char);
      keyChars.push(char);
    }
  }

  const alphabet = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'; // 25 letters (J excluded)
  for (const char of alphabet) {
    if (!seen.has(char)) {
      seen.add(char);
      keyChars.push(char);
    }
  }

  const matrix: string[][] = [];
  const coords = new Map<string, { r: number; c: number }>();

  for (let r = 0; r < 5; r++) {
    const row: string[] = [];
    for (let c = 0; c < 5; c++) {
      const letter = keyChars[r * 5 + c];
      row.push(letter);
      coords.set(letter, { r, c });
    }
    matrix.push(row);
  }

  return { matrix, coords, normalizedKey: cleanKey };
}

export function preparePlayfairPlaintext(text: string): { preparedText: string; digraphs: [string, string][] } {
  const cleanText = text.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
  if (!cleanText || cleanText.length === 0) {
    throw new Error('Plaintext must contain at least one alphabetic letter.');
  }

  const digraphs: [string, string][] = [];
  let i = 0;

  while (i < cleanText.length) {
    const first = cleanText[i];
    if (i + 1 < cleanText.length) {
      const second = cleanText[i + 1];
      if (first === second) {
        const filler = first === 'X' ? 'Q' : 'X';
        digraphs.push([first, filler]);
        i += 1;
      } else {
        digraphs.push([first, second]);
        i += 2;
      }
    } else {
      const filler = first === 'X' ? 'Q' : 'X';
      digraphs.push([first, filler]);
      i += 1;
    }
  }

  const preparedText = digraphs.map(([a, b]) => a + b).join('');
  return { preparedText, digraphs };
}

export function playfairEncrypt(plaintext: string, keyword: string): PlayfairResult {
  const { matrix, coords, normalizedKey } = generatePlayfairMatrix(keyword);
  const { digraphs } = preparePlayfairPlaintext(plaintext);

  const cipherDigraphs: string[] = [];

  for (const [a, b] of digraphs) {
    const posA = coords.get(a)!;
    const posB = coords.get(b)!;

    if (posA.r === posB.r) {
      // Same row: shift right (+1)
      const encA = matrix[posA.r][mod(posA.c + 1, 5)];
      const encB = matrix[posB.r][mod(posB.c + 1, 5)];
      cipherDigraphs.push(encA + encB);
    } else if (posA.c === posB.c) {
      // Same column: shift down (+1)
      const encA = matrix[mod(posA.r + 1, 5)][posA.c];
      const encB = matrix[mod(posB.r + 1, 5)][posB.c];
      cipherDigraphs.push(encA + encB);
    } else {
      // Rectangle rule: swap columns
      const encA = matrix[posA.r][posB.c];
      const encB = matrix[posB.r][posA.c];
      cipherDigraphs.push(encA + encB);
    }
  }

  return {
    ciphertext: cipherDigraphs.join(' '),
    keyMatrix: matrix,
    preparedDigraphs: digraphs,
    normalizedKey,
  };
}

export function playfairDecrypt(ciphertext: string, keyword: string): PlayfairResult {
  const { matrix, coords, normalizedKey } = generatePlayfairMatrix(keyword);
  const cleanCipher = ciphertext.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');

  if (!cleanCipher || cleanCipher.length === 0) {
    throw new Error('Ciphertext must contain at least one alphabetic letter.');
  }

  if (cleanCipher.length % 2 !== 0) {
    throw new Error('Playfair ciphertext must contain an even number of letters.');
  }

  const digraphs: [string, string][] = [];
  for (let i = 0; i < cleanCipher.length; i += 2) {
    digraphs.push([cleanCipher[i], cleanCipher[i + 1]]);
  }

  const plainDigraphs: string[] = [];

  for (const [a, b] of digraphs) {
    const posA = coords.get(a);
    const posB = coords.get(b);

    if (!posA || !posB) {
      throw new Error(`Ciphertext contains invalid letter outside 5x5 matrix: ${!posA ? a : b}.`);
    }

    if (posA.r === posB.r) {
      // Same row: shift left (-1)
      const decA = matrix[posA.r][mod(posA.c - 1, 5)];
      const decB = matrix[posB.r][mod(posB.c - 1, 5)];
      plainDigraphs.push(decA + decB);
    } else if (posA.c === posB.c) {
      // Same column: shift up (-1)
      const decA = matrix[mod(posA.r - 1, 5)][posA.c];
      const decB = matrix[mod(posB.r - 1, 5)][posB.c];
      plainDigraphs.push(decA + decB);
    } else {
      // Rectangle rule: swap columns
      const decA = matrix[posA.r][posB.c];
      const decB = matrix[posB.r][posA.c];
      plainDigraphs.push(decA + decB);
    }
  }

  return {
    ciphertext: plainDigraphs.join(' '),
    keyMatrix: matrix,
    preparedDigraphs: digraphs,
    normalizedKey,
  };
}
