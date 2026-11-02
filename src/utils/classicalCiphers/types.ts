/**
 * Classical Ciphers Types & Interfaces
 */

export interface PlayfairResult {
  ciphertext: string;
  keyMatrix: string[][];
  preparedDigraphs: [string, string][];
  normalizedKey: string;
}

export type HillMatrix2x2 = [[number, number], [number, number]];

export interface HillResult {
  ciphertext: string;
  keyMatrix: HillMatrix2x2;
  inverseMatrix: HillMatrix2x2;
  determinant: number;
  determinantInverse: number;
  paddedLength: number;
}
