/**
 * Classical Ciphers Common Mathematical & Modular Arithmetic Helpers
 */

/**
 * Standard positive modulo operation: ((n % m) + m) % m
 */
export function mod(n: number, m: number = 26): number {
  return ((n % m) + m) % m;
}

/**
 * Greatest Common Divisor (Euclidean algorithm)
 */
export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

/**
 * Modular Multiplicative Inverse modulo m: finds x such that (a * x) % m === 1
 * Throws an informative error if gcd(a, m) !== 1.
 */
export function modInverse(a: number, m: number = 26): number {
  const normA = mod(a, m);
  const divisor = gcd(normA, m);
  if (divisor !== 1) {
    throw new Error(`Value ${normA} has no modular inverse modulo ${m} (gcd=${divisor}).`);
  }
  for (let x = 1; x < m; x++) {
    if ((normA * x) % m === 1) {
      return x;
    }
  }
  throw new Error(`Value ${normA} has no modular inverse modulo ${m}.`);
}
