/**
 * Hill Cipher: Polygraphic Block Encryption via 2x2 Matrix Modulo 26
 *
 * Matrix: K = [[a, b], [c, d]]
 * Determinant: det(K) = (ad - bc) mod 26
 * Condition: gcd(det(K), 26) = 1
 *
 * Adjoint: adj(K) = [[d, -b], [-c, a]]
 * Inverse: K⁻¹ = det⁻¹ * adj(K) mod 26
 *
 * Vectors: P = [[x1], [x2]]
 * Encryption: C = K * P mod 26
 * Decryption: P = K⁻¹ * C mod 26
 *
 * Plaintext is padded with 'X' if odd length.
 */

import { mod, gcd, modInverse } from './common';
import { HillMatrix2x2, HillResult } from './types';

export function validateHillMatrix(matrix: number[][]): {
  validMatrix: HillMatrix2x2;
  inverseMatrix: HillMatrix2x2;
  determinant: number;
  determinantInverse: number;
} {
  if (!Array.isArray(matrix) || matrix.length !== 2 || !Array.isArray(matrix[0]) || !Array.isArray(matrix[1]) || matrix[0].length !== 2 || matrix[1].length !== 2) {
    throw new Error('Hill cipher key must be a 2x2 numeric matrix: [[a, b], [c, d]].');
  }

  const [[a, b], [c, d]] = matrix;

  for (const [val, name] of [[a, 'a'], [b, 'b'], [c, 'c'], [d, 'd']] as const) {
    if (typeof val !== 'number' || !Number.isFinite(val) || !Number.isInteger(val)) {
      throw new Error(`Matrix cell ${name} must be a valid integer.`);
    }
  }

  const an = mod(a, 26);
  const bn = mod(b, 26);
  const cn = mod(c, 26);
  const dn = mod(d, 26);

  const rawDet = an * dn - bn * cn;
  const det = mod(rawDet, 26);

  const divisor = gcd(det, 26);
  if (divisor !== 1 || det === 0) {
    throw new Error(
      `Hill matrix determinant (det=${det}) is not coprime with 26 (gcd=${divisor}). The matrix has no modular inverse modulo 26 and cannot decrypt.`
    );
  }

  const detInv = modInverse(det, 26);

  // Adjoint matrix: [[d, -b], [-c, a]]
  const invA = mod(dn * detInv, 26);
  const invB = mod(-bn * detInv, 26);
  const invC = mod(-cn * detInv, 26);
  const invD = mod(an * detInv, 26);

  const validMatrix: HillMatrix2x2 = [[an, bn], [cn, dn]];
  const inverseMatrix: HillMatrix2x2 = [[invA, invB], [invC, invD]];

  return { validMatrix, inverseMatrix, determinant: det, determinantInverse: detInv };
}

export function hillEncrypt(plaintext: string, matrix: number[][]): HillResult {
  const { validMatrix, inverseMatrix, determinant, determinantInverse } = validateHillMatrix(matrix);
  const clean = plaintext.toUpperCase().replace(/[^A-Z]/g, '');

  if (!clean || clean.length === 0) {
    throw new Error('Plaintext must contain at least one alphabetic letter.');
  }

  // Pad odd length with 'X'
  const padded = clean.length % 2 !== 0 ? clean + 'X' : clean;
  const [[a, b], [c, d]] = validMatrix;

  const cipherChars: string[] = [];
  for (let i = 0; i < padded.length; i += 2) {
    const x1 = padded.charCodeAt(i) - 65;
    const x2 = padded.charCodeAt(i + 1) - 65;

    const c1 = mod(a * x1 + b * x2, 26);
    const c2 = mod(c * x1 + d * x2, 26);

    cipherChars.push(String.fromCharCode(c1 + 65));
    cipherChars.push(String.fromCharCode(c2 + 65));
  }

  return {
    ciphertext: cipherChars.join(''),
    keyMatrix: validMatrix,
    inverseMatrix,
    determinant,
    determinantInverse,
    paddedLength: padded.length,
  };
}

export function hillDecrypt(ciphertext: string, matrix: number[][]): HillResult {
  const { validMatrix, inverseMatrix, determinant, determinantInverse } = validateHillMatrix(matrix);
  const clean = ciphertext.toUpperCase().replace(/[^A-Z]/g, '');

  if (!clean || clean.length === 0) {
    throw new Error('Ciphertext must contain at least one alphabetic letter.');
  }

  if (clean.length % 2 !== 0) {
    throw new Error('Hill ciphertext must contain an even number of letters (blocks of 2).');
  }

  const [[invA, invB], [invC, invD]] = inverseMatrix;

  const plainChars: string[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    const c1 = clean.charCodeAt(i) - 65;
    const c2 = clean.charCodeAt(i + 1) - 65;

    const p1 = mod(invA * c1 + invB * c2, 26);
    const p2 = mod(invC * c1 + invD * c2, 26);

    plainChars.push(String.fromCharCode(p1 + 65));
    plainChars.push(String.fromCharCode(p2 + 65));
  }

  return {
    ciphertext: plainChars.join(''),
    keyMatrix: validMatrix,
    inverseMatrix,
    determinant,
    determinantInverse,
    paddedLength: clean.length,
  };
}
