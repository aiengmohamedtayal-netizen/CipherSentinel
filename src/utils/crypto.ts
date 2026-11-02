/**
 * CipherSentinel Cryptographic & Threat Intelligence Utilities
 *
 * Technical Standards Implemented:
 * - Caesar Cipher: Modular arithmetic monoalphabetic substitution (Educational only)
 * - Vigenère Cipher: Polyalphabetic keyword substitution (Educational only)
 * - SHA-256: One-way cryptographic hash function (NIST FIPS 180-4)
 * - AES-256-GCM: Non-deterministic authenticated symmetric cipher (NIST SP 800-38D)
 * - RSA-OAEP: Public-key key transport & DEK wrapping (RFC 8017 / PKCS #1 v2.2) via Web Crypto API
 * - TF-IDF + Logistic Regression: In-browser threat evaluator using custom TypeScript TF-IDF-style feature extraction and Logistic Regression inference with stored model coefficients
 */

import { TestCase, EncryptedRecord } from '../types';
import { PHISHING_MODEL } from '../data/phishing_model';

// Convert Uint8Array to Hex string
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert Uint8Array to Base64
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 to Uint8Array
export function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/-----[^\n]+-----|\s/g, '');
  const binary = window.atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Calculates the exact bit-level Hamming distance between two 64-character hex digests.
 * Used for genuine, live measurement of the SHA-256 avalanche effect.
 */
export function computeHexHammingDistance(
  hexA: string,
  hexB: string
): { bitsChanged: number; totalBits: number; percentChanged: number } {
  const cleanA = hexA.replace(/[^0-9a-fA-F]/g, '').toLowerCase();
  const cleanB = hexB.replace(/[^0-9a-fA-F]/g, '').toLowerCase();

  const minLen = Math.min(cleanA.length, cleanB.length, 64);
  let bitsChanged = 0;
  const totalBits = 256;

  for (let i = 0; i < minLen; i++) {
    const valA = parseInt(cleanA[i], 16) || 0;
    const valB = parseInt(cleanB[i], 16) || 0;
    let xor = valA ^ valB;
    while (xor > 0) {
      bitsChanged += xor & 1;
      xor >>= 1;
    }
  }

  // Account for length differences if any
  if (cleanA.length !== cleanB.length) {
    bitsChanged += Math.abs(cleanA.length - cleanB.length) * 4;
  }

  const percentChanged = Math.round((bitsChanged / totalBits) * 1000) / 10;
  return { bitsChanged, totalBits, percentChanged };
}

/* =====================================================================
 * 1. CLASSICAL CIPHERS (EDUCATIONAL DEMONSTRATION ONLY)
 * ===================================================================== */

/**
 * Validates a Caesar cipher shift value.
 * Shift must be a finite integer number. Rejects NaN, Infinity, -Infinity,
 * fractional values, and invalid numeric strings/types without silent coercion.
 */
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

/**
 * Caesar Cipher: E(x) = (x + k) mod 26
 * Preserves letter casing; non-alphabetic characters remain unshifted.
 */
export function caesarEncrypt(text: string, shift: number): string {
  const validShift = validateCaesarShift(shift);
  const normalizedShift = ((validShift % 26) + 26) % 26;
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

/**
 * Caesar Decrypt: D(x) = (x - k) mod 26
 */
export function caesarDecrypt(text: string, shift: number): string {
  const validShift = validateCaesarShift(shift);
  return caesarEncrypt(text, -validShift);
}

/**
 * Vigenère Cipher: C_i = (P_i + K_i) mod 26
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

/**
 * Vigenère Decrypt: P_i = (C_i - K_i) mod 26
 */
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

/* =====================================================================
 * 2. SHA-256 CRYPTOGRAPHIC HASH (NIST FIPS 180-4)
 * ===================================================================== */

/**
 * Generates a 256-bit digest (64 hex characters) using Web Crypto.
 * Note: SHA-256 is an irreversible one-way hash function used to check data
 * modification. It is not encryption and does not prove sender authenticity alone.
 */
export async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(hashBuffer));
}

/**
 * Verifies if input text matches an expected SHA-256 hex digest.
 */
export async function verifySha256(
  text: string,
  expectedHex: string
): Promise<{ matches: boolean; computedDigest: string; expectedDigest: string }> {
  if (typeof expectedHex !== 'string') {
    throw new Error('Expected SHA-256 digest must be exactly 64 hexadecimal characters.');
  }
  const normalizedExpected = expectedHex.trim();
  if (!/^[a-f0-9]{64}$/i.test(normalizedExpected)) {
    throw new Error('Expected SHA-256 digest must be exactly 64 hexadecimal characters.');
  }
  const computed = await sha256(text);
  const normalized = normalizedExpected.toLowerCase();
  return {
    matches: computed === normalized,
    computedDigest: computed,
    expectedDigest: normalized,
  };
}

/* =====================================================================
 * 3. AES-256-GCM AUTHENTICATED ENCRYPTION (NIST SP 800-38D)
 * ===================================================================== */

export interface AesGcmResult {
  ciphertextB64: string;
  tagB64: string;
  nonceB64: string;
  keyB64: string;
  fullCiphertextHex: string;
}

export const MAX_ENVELOPE_PLAINTEXT_BYTES = 128 * 1024;
export const RSA_3072_CIPHERTEXT_BYTES = 384;

/**
 * Generates a cryptographically secure 256-bit (32-byte) AES key.
 */
export function generateRandomAesKey(): { keyB64: string; keyRaw: Uint8Array } {
  const keyBytes = new Uint8Array(32);
  window.crypto.getRandomValues(keyBytes);
  return {
    keyB64: bytesToBase64(keyBytes),
    keyRaw: keyBytes,
  };
}

/**
 * Generates a cryptographically secure 96-bit (12-byte) GCM nonce.
 */
export function generateGcmNonce(): Uint8Array {
  const nonce = new Uint8Array(12);
  window.crypto.getRandomValues(nonce);
  return nonce;
}

/**
 * Encrypts payload with AES-256-GCM.
 * Note: AES-GCM is non-deterministic because a fresh, unique 96-bit (12-byte) nonce
 * is generated for each encryption operation.
 */
export async function aesGcmEncrypt(
  plaintext: string,
  providedKeyB64?: string,
  aadText?: string
): Promise<AesGcmResult> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // 1. Prepare 256-bit Key
  let cryptoKey: CryptoKey;
  let keyBytes: Uint8Array;
  if (providedKeyB64) {
    keyBytes = base64ToBytes(providedKeyB64);
    if (keyBytes.length !== 32) {
      throw new Error('AES-256 key must be exactly 32 bytes (256 bits).');
    }
    cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM' },
      true,
      ['encrypt', 'decrypt']
    );
  } else {
    cryptoKey = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    const exportedRaw = await window.crypto.subtle.exportKey('raw', cryptoKey);
    keyBytes = new Uint8Array(exportedRaw);
  }

  // Always generate a fresh nonce here. Reusing a caller-supplied GCM nonce is unsafe.
  const nonceBytes = generateGcmNonce();

  // 3. Authenticated Additional Data (AAD)
  const algorithm: AesGcmParams = {
    name: 'AES-GCM',
    iv: nonceBytes,
    tagLength: 128,
  };
  if (aadText) algorithm.additionalData = encoder.encode(aadText);

  // 4. Encrypt with 128-bit authentication tag
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    algorithm,
    cryptoKey,
    data
  );

  const encryptedArray = new Uint8Array(encryptedBuffer);
  // Last 16 bytes represent the authentication tag
  const tagStart = encryptedArray.length - 16;
  const rawCiphertext = encryptedArray.slice(0, tagStart);
  const tagBytes = encryptedArray.slice(tagStart);

  return {
    ciphertextB64: bytesToBase64(rawCiphertext),
    tagB64: bytesToBase64(tagBytes),
    nonceB64: bytesToBase64(nonceBytes),
    keyB64: bytesToBase64(keyBytes),
    fullCiphertextHex: bytesToHex(encryptedArray),
  };
}

/**
 * Decrypts AES-GCM ciphertext. Fails closed with an error if tag or AAD does not match.
 */
export async function aesGcmDecrypt(
  ciphertextB64: string,
  tagB64: string,
  keyB64: string,
  nonceB64: string,
  aadText?: string
): Promise<{ plaintext: string; verified: boolean }> {
  try {
    const rawCiphertext = base64ToBytes(ciphertextB64);
    const tagBytes = base64ToBytes(tagB64);
    const keyBytes = base64ToBytes(keyB64);
    const nonceBytes = base64ToBytes(nonceB64);

    const combined = new Uint8Array(rawCiphertext.length + tagBytes.length);
    combined.set(rawCiphertext, 0);
    combined.set(tagBytes, rawCiphertext.length);

    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const encoder = new TextEncoder();
    const algorithm: AesGcmParams = {
      name: 'AES-GCM',
      iv: nonceBytes,
      tagLength: 128,
    };
    if (aadText) algorithm.additionalData = encoder.encode(aadText);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      algorithm,
      cryptoKey,
      combined
    );

    const decoder = new TextDecoder();
    return {
      plaintext: decoder.decode(decryptedBuffer),
      verified: true,
    };
  } catch {
    throw new Error('Authentication failed: The ciphertext, tag, or AAD has been modified, or the key is incorrect.');
  }
}

/* =====================================================================
 * 4. REAL RSA-OAEP PUBLIC-KEY CRYPTOGRAPHY (RFC 8017 / WEB CRYPTO API)
 * ===================================================================== */

export interface RsaGeneratedKeyPair {
  keyId: string;
  publicKeyPem: string;
  privateKeyPem: string;
  publicKeyFingerprint: string;
  modulusLength: number;
  cryptoPublicKey: CryptoKey;
  cryptoPrivateKey: CryptoKey;
}

/**
 * Formats an SPKI or PKCS8 ArrayBuffer into a PEM formatted string.
 */
function arrayBufferToPem(buffer: ArrayBuffer, type: 'PUBLIC KEY' | 'PRIVATE KEY'): string {
  const b64 = bytesToBase64(new Uint8Array(buffer));
  const lines = b64.match(/.{1,64}/g) || [b64];
  return `-----BEGIN ${type}-----\n${lines.join('\n')}\n-----END ${type}-----`;
}

/**
 * Generates an authentic RSA-3072 OAEP Key Pair using Web Crypto API.
 * Modulus standard: 3072 bits (RFC 8017 / NIST SP 800-57 Part 1 Rev 5 recommendation).
 */
export async function generateRsaKeyPair(modulusLength: number = 3072): Promise<RsaGeneratedKeyPair> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength,
      publicExponent: new Uint8Array([1, 0, 1]), // 65537
      hash: 'SHA-256',
    },
    true,
    ['wrapKey', 'unwrapKey', 'encrypt', 'decrypt']
  );

  const spkiBuffer = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
  const pkcs8Buffer = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  const publicKeyPem = arrayBufferToPem(spkiBuffer, 'PUBLIC KEY');
  const privateKeyPem = arrayBufferToPem(pkcs8Buffer, 'PRIVATE KEY');

  // Compute SHA-256 fingerprint over raw SPKI
  const fpBuffer = await window.crypto.subtle.digest('SHA-256', spkiBuffer);
  const fingerprint = 'SHA256:' + bytesToHex(new Uint8Array(fpBuffer)).substring(0, 32);

  const keyId = 'rsa-cs-' + fingerprint.substring(7, 15);

  return {
    keyId,
    publicKeyPem,
    privateKeyPem,
    publicKeyFingerprint: fingerprint,
    modulusLength,
    cryptoPublicKey: keyPair.publicKey,
    cryptoPrivateKey: keyPair.privateKey,
  };
}

/**
 * Imports an RSA-OAEP public key from PEM string or base64 SPKI.
 */
export async function importRsaPublicKey(pemOrBase64: string): Promise<CryptoKey> {
  const rawBytes = base64ToBytes(pemOrBase64);
  return await window.crypto.subtle.importKey(
    'spki',
    rawBytes,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['encrypt', 'wrapKey']
  );
}

/**
 * Imports an RSA-OAEP private key from PEM string or base64 PKCS8.
 */
export async function importRsaPrivateKey(pemOrBase64: string): Promise<CryptoKey> {
  const rawBytes = base64ToBytes(pemOrBase64);
  return await window.crypto.subtle.importKey(
    'pkcs8',
    rawBytes,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['decrypt', 'unwrapKey']
  );
}

/**
 * Wraps a 256-bit AES DEK with an RSA-OAEP Public Key using Web Crypto.
 */
export async function wrapAesKeyWithRsa(
  aesKeyB64: string,
  rsaPublicKey: CryptoKey | string
): Promise<string> {
  const keyObj = typeof rsaPublicKey === 'string' ? await importRsaPublicKey(rsaPublicKey) : rsaPublicKey;
  const rawKeyBytes = base64ToBytes(aesKeyB64);

  // Encrypt the raw AES-256 key with RSA-OAEP
  const wrappedBuffer = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    keyObj,
    rawKeyBytes
  );

  return bytesToBase64(new Uint8Array(wrappedBuffer));
}

/**
 * Unwraps an encrypted AES DEK with the recipient's RSA-OAEP Private Key.
 */
export async function unwrapAesKeyWithRsa(
  wrappedDekB64: string,
  rsaPrivateKey: CryptoKey | string
): Promise<string> {
  try {
    const keyObj = typeof rsaPrivateKey === 'string' ? await importRsaPrivateKey(rsaPrivateKey) : rsaPrivateKey;
    const wrappedBytes = base64ToBytes(wrappedDekB64);

    const decryptedRawBuffer = await window.crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      keyObj,
      wrappedBytes
    );

    return bytesToBase64(new Uint8Array(decryptedRawBuffer));
  } catch {
    throw new Error('RSA-OAEP unwrap failure: Private key mismatch or corrupted key envelope.');
  }
}

export interface EncryptedPrivateKeyEnvelope {
  format: 'PKCS#8-PBKDF2-AES256GCM' | 'PKCS#8-PBKDF2-AES256GCM-v2';
  iterations: number;
  saltB64: string;
  nonceB64: string;
  ciphertextB64: string;
  tagB64: string;
  keyId: string;
  exportedAt: string;
}

const PRIVATE_KEY_EXPORT_ITERATIONS = 100_000;
const PRIVATE_KEY_EXPORT_FORMAT_V1 = 'PKCS#8-PBKDF2-AES256GCM';
const PRIVATE_KEY_EXPORT_FORMAT_V2 = 'PKCS#8-PBKDF2-AES256GCM-v2';
const MAX_PRIVATE_KEY_EXPORT_BYTES = 64 * 1024;

function privateKeyEnvelopeAad(envelope: EncryptedPrivateKeyEnvelope): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode([
    envelope.format,
    envelope.iterations,
    envelope.keyId,
    envelope.exportedAt,
    envelope.saltB64,
    envelope.nonceB64,
  ].join('\n'));
}

function decodePrivateKeyEnvelopeBase64(value: unknown, fieldName: string): Uint8Array {
  const canonicalBase64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  if (typeof value !== 'string' || value.length === 0 || !canonicalBase64.test(value)) {
    throw new Error(`Private key envelope has an invalid ${fieldName} field.`);
  }
  const bytes = base64ToBytes(value);
  if (bytesToBase64(bytes) !== value) {
    throw new Error(`Private key envelope has a non-canonical ${fieldName} field.`);
  }
  return bytes;
}

function validatePrivateKeyExportEnvelope(envelope: EncryptedPrivateKeyEnvelope) {
  if (!envelope || typeof envelope !== 'object') {
    throw new Error('Private key envelope must be an object.');
  }
  if (envelope.format !== PRIVATE_KEY_EXPORT_FORMAT_V1 && envelope.format !== PRIVATE_KEY_EXPORT_FORMAT_V2) {
    throw new Error('Unsupported private key envelope format.');
  }
  if (envelope.iterations !== PRIVATE_KEY_EXPORT_ITERATIONS) {
    throw new Error('Private key envelope uses an unsupported PBKDF2 iteration count.');
  }
  if (typeof envelope.keyId !== 'string' || !/^[A-Za-z0-9._-]{1,128}$/.test(envelope.keyId)) {
    throw new Error('Private key envelope has an invalid key identifier.');
  }
  if (typeof envelope.exportedAt !== 'string' || !Number.isFinite(Date.parse(envelope.exportedAt))) {
    throw new Error('Private key envelope has an invalid export timestamp.');
  }

  const saltBytes = decodePrivateKeyEnvelopeBase64(envelope.saltB64, 'salt');
  const nonceBytes = decodePrivateKeyEnvelopeBase64(envelope.nonceB64, 'nonce');
  const ciphertextBytes = decodePrivateKeyEnvelopeBase64(envelope.ciphertextB64, 'ciphertext');
  const tagBytes = decodePrivateKeyEnvelopeBase64(envelope.tagB64, 'authentication tag');
  if (saltBytes.byteLength !== 16 || nonceBytes.byteLength !== 12 || tagBytes.byteLength !== 16) {
    throw new Error('Private key envelope has an invalid salt, nonce, or authentication-tag length.');
  }
  if (ciphertextBytes.byteLength === 0 || ciphertextBytes.byteLength > MAX_PRIVATE_KEY_EXPORT_BYTES) {
    throw new Error('Private key envelope ciphertext has an invalid length.');
  }
  return { saltBytes, nonceBytes, ciphertextBytes, tagBytes };
}

/**
 * Encrypts a private key using PBKDF2-HMAC-SHA256 (100,000 iterations) + AES-256-GCM.
 * Protects exported keys against unauthorized extraction.
 */
export async function exportEncryptedPrivateKey(
  privateKeyPem: string,
  passphrase: string,
  keyId: string
): Promise<EncryptedPrivateKeyEnvelope> {
  if (typeof passphrase !== 'string' || passphrase.length < 12) {
    throw new Error('Export passphrase must be at least 12 characters in length.');
  }
  if (typeof privateKeyPem !== 'string' || privateKeyPem.length === 0 || privateKeyPem.length > MAX_PRIVATE_KEY_EXPORT_BYTES) {
    throw new Error('Private key data is empty or exceeds the supported export size.');
  }
  if (!/^[A-Za-z0-9._-]{1,128}$/.test(keyId)) {
    throw new Error('Private key export has an invalid key identifier.');
  }

  const encoder = new TextEncoder();
  const saltBytes = new Uint8Array(16);
  window.crypto.getRandomValues(saltBytes);

  const nonceBytes = new Uint8Array(12);
  window.crypto.getRandomValues(nonceBytes);

  // 1. Derive AES-256 Key via PBKDF2
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const derivedAesKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: PRIVATE_KEY_EXPORT_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  // 2. Encrypt PKCS#8 private key
  const envelope: EncryptedPrivateKeyEnvelope = {
    format: PRIVATE_KEY_EXPORT_FORMAT_V2,
    iterations: PRIVATE_KEY_EXPORT_ITERATIONS,
    saltB64: bytesToBase64(saltBytes),
    nonceB64: bytesToBase64(nonceBytes),
    ciphertextB64: '',
    tagB64: '',
    keyId,
    exportedAt: new Date().toISOString(),
  };
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonceBytes, additionalData: privateKeyEnvelopeAad(envelope), tagLength: 128 },
    derivedAesKey,
    encoder.encode(privateKeyPem)
  );

  const encryptedArray = new Uint8Array(encryptedBuffer);
  const tagStart = encryptedArray.length - 16;
  const ciphertextBytes = encryptedArray.slice(0, tagStart);
  const tagBytes = encryptedArray.slice(tagStart);

  return {
    ...envelope,
    ciphertextB64: bytesToBase64(ciphertextBytes),
    tagB64: bytesToBase64(tagBytes),
  };
}

/**
 * Decrypts a password-encrypted private key envelope. Fails closed upon wrong passphrase.
 */
export async function importEncryptedPrivateKey(
  envelope: EncryptedPrivateKeyEnvelope,
  passphrase: string
): Promise<string> {
  if (typeof passphrase !== 'string' || passphrase.length === 0) {
    throw new Error('Passphrase is required to decrypt the private key.');
  }

  const { saltBytes, nonceBytes, ciphertextBytes, tagBytes } = validatePrivateKeyExportEnvelope(envelope);

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const combined = new Uint8Array(ciphertextBytes.length + tagBytes.length);
  combined.set(ciphertextBytes, 0);
  combined.set(tagBytes, ciphertextBytes.length);

  try {
    const baseKey = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const derivedAesKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBytes,
        iterations: envelope.iterations,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      envelope.format === PRIVATE_KEY_EXPORT_FORMAT_V2
        ? { name: 'AES-GCM', iv: nonceBytes, additionalData: privateKeyEnvelopeAad(envelope), tagLength: 128 }
        : { name: 'AES-GCM', iv: nonceBytes, tagLength: 128 },
      derivedAesKey,
      combined
    );

    return decoder.decode(decryptedBuffer);
  } catch {
    throw new Error('Private key decryption failed: Incorrect passphrase or corrupted key envelope.');
  }
}


// Backward compatibility helpers
export const wrapDekWithRsa = wrapAesKeyWithRsa;
export const unwrapDekWithRsa = unwrapAesKeyWithRsa;


/* =====================================================================
 * 5. HYBRID ENCRYPTION WORKFLOW (AES-256-GCM + RSA-OAEP)
 * ===================================================================== */

/**
 * Produces a full encrypted envelope as defined in Report Section 7.6.
 * 1. Generates fresh AES-256 DEK
 * 2. Encrypts payload with AES-256-GCM (fresh 96-bit nonce)
 * 3. Wraps AES DEK with Recipient's RSA Public Key
 * 4. Outputs immutable JSON envelope
 */
export async function createEncryptedEnvelope(
  plaintext: string,
  recipientRsaPublicKey: CryptoKey | string,
  keyId: string
): Promise<EncryptedRecord> {
  if (!plaintext.trim()) {
    throw new Error('Message content is required before creating an encrypted envelope.');
  }
  if (new TextEncoder().encode(plaintext).byteLength > MAX_ENVELOPE_PLAINTEXT_BYTES) {
    throw new Error(`Message content must not exceed ${MAX_ENVELOPE_PLAINTEXT_BYTES / 1024} KB.`);
  }
  if (!keyId || !keyId.startsWith('rsa-cs-')) {
    throw new Error('A valid active RSA-3072 key identifier is required.');
  }

  // 1. Generate fresh AES DEK
  const { keyB64 } = generateRandomAesKey();

  // 2. Encrypt with AES-256-GCM
  const recordId = 'rec-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
  const aad = `record_id=${recordId};key_id=${keyId}`;
  const gcmResult = await aesGcmEncrypt(plaintext, keyB64, aad);

  // 3. Wrap DEK with RSA-OAEP
  const wrappedDekB64 = await wrapAesKeyWithRsa(keyB64, recipientRsaPublicKey);

  return {
    record_id: recordId,
    schema_version: 1,
    cipher_suite: 'AES-256-GCM + RSA-OAEP-3072',
    key_id: keyId,
    nonce_b64: gcmResult.nonceB64,
    wrapped_dek_b64: wrappedDekB64,
    ciphertext_b64: gcmResult.ciphertextB64,
    tag_b64: gcmResult.tagB64,
    created_at: new Date().toISOString(),
    subject: 'Encrypted message',
    isDemoFixture: false,
    status: 'Encrypted & Authenticated',
  };
}

/**
 * Decrypts a full encrypted envelope using matching recipient RSA private key.
 */
export async function decryptEncryptedEnvelope(
  record: EncryptedRecord,
  recipientRsaPrivateKey: CryptoKey | string
): Promise<{ plaintext: string; verified: boolean }> {
  validateEncryptedEnvelope(record);

  // 1. Unwrap DEK using RSA private key
  const unwrappedKeyB64 = await unwrapAesKeyWithRsa(record.wrapped_dek_b64, recipientRsaPrivateKey);

  // 2. Decrypt AES-GCM payload with AAD
  const aad = `record_id=${record.record_id};key_id=${record.key_id}`;
  const decrypted = await aesGcmDecrypt(
    record.ciphertext_b64,
    record.tag_b64,
    unwrappedKeyB64,
    record.nonce_b64,
    aad
  );

  return decrypted;
}

/** Validates the versioned browser vault envelope before any key operation. */
export function validateEncryptedEnvelope(value: unknown): asserts value is EncryptedRecord {
  if (!value || typeof value !== 'object') {
    throw new Error('Encrypted envelope must be a JSON object.');
  }

  const record = value as Partial<EncryptedRecord>;
  const requiredStrings: Array<keyof EncryptedRecord> = [
    'record_id',
    'cipher_suite',
    'key_id',
    'nonce_b64',
    'wrapped_dek_b64',
    'ciphertext_b64',
    'tag_b64',
    'created_at',
    'subject',
  ];

  for (const field of requiredStrings) {
    if (typeof record[field] !== 'string' || !record[field]) {
      throw new Error(`Encrypted envelope is missing a valid ${field} field.`);
    }
  }

  if (record.schema_version !== 1) {
    throw new Error('Unsupported encrypted envelope schema version.');
  }
  if (record.cipher_suite !== 'AES-256-GCM + RSA-OAEP-3072') {
    throw new Error('Unsupported encrypted envelope cipher suite.');
  }
  if (!/^rec-[A-Za-z0-9-]{1,96}$/.test(record.record_id!)) {
    throw new Error('Encrypted envelope record ID is malformed.');
  }
  if (!/^rsa-cs-[A-Za-z0-9-]{1,64}$/.test(record.key_id!)) {
    throw new Error('Encrypted envelope key ID is malformed.');
  }
  if (!Number.isFinite(Date.parse(record.created_at!))) {
    throw new Error('Encrypted envelope creation date is malformed.');
  }

  const decodeField = (field: 'nonce_b64' | 'wrapped_dek_b64' | 'ciphertext_b64' | 'tag_b64') => {
    const encoded = record[field]!;
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) {
      throw new Error(`Encrypted envelope ${field} is not valid Base64.`);
    }

    let decoded: Uint8Array;
    try {
      decoded = base64ToBytes(encoded);
    } catch {
      throw new Error(`Encrypted envelope ${field} is not valid Base64.`);
    }
    if (bytesToBase64(decoded) !== encoded) {
      throw new Error(`Encrypted envelope ${field} is not canonical Base64.`);
    }
    return decoded;
  };

  if (decodeField('nonce_b64').byteLength !== 12) {
    throw new Error('Encrypted envelope nonce must be exactly 12 bytes.');
  }
  if (decodeField('wrapped_dek_b64').byteLength !== RSA_3072_CIPHERTEXT_BYTES) {
    throw new Error('Encrypted envelope must contain a 3072-bit RSA-wrapped DEK.');
  }
  if (decodeField('ciphertext_b64').byteLength === 0) {
    throw new Error('Encrypted envelope ciphertext cannot be empty.');
  }
  if (decodeField('tag_b64').byteLength !== 16) {
    throw new Error('Encrypted envelope authentication tag must be exactly 16 bytes.');
  }

  if (record.isDemoFixture !== false) {
    throw new Error('Demo or unsupported records cannot be decrypted as real envelopes.');
  }
}

/* =====================================================================
 * 6. CUSTOM TYPESCRIPT TF-IDF-STYLE FEATURE EXTRACTION & LOGISTIC REGRESSION INFERENCE
 * ===================================================================== */

export interface PhishingIndicator {
  token: string;
  weight: number;
  description: string;
}

export interface PhishingAnalysis {
  riskScore: number;
  riskBand: 'Lower detected risk' | 'Review recommended' | 'High phishing risk';
  modelVersion: string;
  modelStatus: string;
  indicators: PhishingIndicator[];
  explanation: string;
  recommendations: string[];
  latencyMs: number;
}

export interface FeatureExtractionResult {
  tokens: string[];
  termFrequencies: Record<string, number>;
  matchedFeatures: Array<{ token: string; idx: number; val: number; normalizedVal: number }>;
  norm: number;
}

/**
 * Custom TypeScript tokenization for in-browser feature processing.
 * Tokenizes text into lowercase word unigrams and adjacent bigrams.
 * Note: Feature extraction is implemented entirely in custom TypeScript;
 * no Scikit-learn or Python runtime executes in the application.
 */
export function tokenizeText(text: string): string[] {
  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = clean.split(/\s+/).filter((w) => w.length > 1);
  const tokens: string[] = [...words];
  for (let i = 0; i < words.length - 1; i++) {
    tokens.push(`${words[i]} ${words[i + 1]}`);
  }
  return tokens;
}

/**
 * Custom TypeScript vectorizer: extracts TF-IDF-style feature representations
 * directly in the browser from input text using stored model vocabulary and IDF weights.
 */
export function extractTfidfFeatures(text: string): FeatureExtractionResult {
  const tokens = tokenizeText(text);
  const tf: Record<string, number> = {};
  for (const t of tokens) {
    if (PHISHING_MODEL.vocabulary[t] !== undefined) {
      tf[t] = (tf[t] || 0) + 1;
    }
  }

  const matchedEntries = Object.entries(tf);
  let normSq = 0;
  const rawWeighted: Array<{ token: string; idx: number; val: number }> = [];

  for (const [t, count] of matchedEntries) {
    const idx = PHISHING_MODEL.vocabulary[t];
    const sublinearTf = 1 + Math.log(count);
    const idfVal = PHISHING_MODEL.idf[idx];
    const val = sublinearTf * idfVal;
    normSq += val * val;
    rawWeighted.push({ token: t, idx, val });
  }

  const norm = Math.sqrt(normSq) || 1;
  const matchedFeatures = rawWeighted.map((item) => ({
    ...item,
    normalizedVal: item.val / norm,
  }));

  return {
    tokens,
    termFrequencies: tf,
    matchedFeatures,
    norm,
  };
}

/**
 * In-browser feature extraction and Logistic Regression inference.
 * - Custom TypeScript TF-IDF-style feature extraction (sublinear TF, IDF lookup, and L2 normalization).
 * - In-browser feature processing using bundled vocabulary and IDF vectors.
 * - Logistic Regression inference using stored model coefficients and intercept:
 *   logit = b + sum(w_i * x_i)
 *   P(Phishing) = 1 / (1 + e^-logit)
 *
 * No external API, Python backend, or Scikit-learn runtime is executed.
 */
export function analyzeMessageForPhishing(text: string): PhishingAnalysis {
  const startTime = performance.now();
  if (!text || !text.trim()) {
    return {
      riskScore: 0,
      riskBand: 'Lower detected risk',
      modelVersion: PHISHING_MODEL.modelVersion,
      modelStatus: 'Loaded (Local In-Memory)',
      indicators: [],
      explanation: 'Empty message text provided. No threat indicators detected.',
      recommendations: ['Provide email or message text to perform security evaluation.'],
      latencyMs: 0.1,
    };
  }

  const { matchedFeatures } = extractTfidfFeatures(text);

  let logit = PHISHING_MODEL.intercept;
  const indicators: PhishingIndicator[] = [];

  if (matchedFeatures.length > 0) {
    // Dot product with Logistic Regression weights
    for (const item of matchedFeatures) {
      const coef = PHISHING_MODEL.coefficients[item.idx];
      const contribution = item.normalizedVal * coef;
      logit += contribution;

      if (contribution > 0.04) {
        indicators.push({
          token: item.token,
          weight: Math.round(contribution * 1000) / 1000,
          description: `TF-IDF feature weight: +${contribution.toFixed(3)} toward phishing classification`,
        });
      }
    }
  }

  // 5. Sigmoid probability: P = 1 / (1 + e^-logit)
  const probability = 1 / (1 + Math.exp(-logit));
  const roundedScore = Math.round(probability * 1000) / 1000;

  // 6. Fixed advisory score bands; the score is not calibrated as a probability.
  let riskBand: 'Lower detected risk' | 'Review recommended' | 'High phishing risk';
  if (roundedScore < 0.35) {
    riskBand = 'Lower detected risk';
  } else if (roundedScore <= 0.7) {
    riskBand = 'Review recommended';
  } else {
    riskBand = 'High phishing risk';
  }

  // Sort indicators by contribution descending
  indicators.sort((a, b) => b.weight - a.weight);

  let explanation = '';
  const recommendations: string[] = [];

  if (riskBand === 'High phishing risk') {
    explanation = `The logistic regression model detected significant indicative tokens (${indicators.slice(0, 3).map((i) => `"${i.token}"`).join(', ')}). Classification indicates strong urgency or credential solicitation.`;
    recommendations.push('Do not follow embedded links or enter credentials on external landing pages.');
    recommendations.push('Do not download or open unsolicited attachments.');
    recommendations.push('Encrypt this dispatch before adding it to the current tab’s session-only vault.');
  } else if (riskBand === 'Review recommended') {
    explanation = 'The message contains moderate urgency or transactional signals. Manual human review is recommended before taking action.';
    recommendations.push('Confirm sender identity through a secondary, out-of-band communication channel.');
    recommendations.push('Inspect full email headers and destination domain names.');
  } else {
    explanation = 'The model identified low overall deceptive token density consistent with normal communication.';
    recommendations.push('Advisory only: Low detected risk does not certify absolute security.');
  }

  const latencyMs = Math.round((performance.now() - startTime) * 10) / 10;

  return {
    riskScore: roundedScore,
    riskBand,
    modelVersion: PHISHING_MODEL.modelVersion,
    modelStatus: 'Loaded & Active (Local In-Memory)',
    indicators: indicators.slice(0, 8),
    explanation,
    recommendations,
    latencyMs: Math.max(latencyMs, 0.1),
  };
}
