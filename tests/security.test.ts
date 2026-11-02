import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { describe, it } from 'node:test';
import { executeSecurityTestSuite } from '../src/utils/securityTestSuite';
import {
  caesarEncrypt,
  caesarDecrypt,
  validateCaesarShift,
  rot13,
  rot13Encrypt,
  rot13Decrypt,
  additiveEncrypt,
  additiveDecrypt,
  validateAdditiveKey,
  multiplicativeEncrypt,
  multiplicativeDecrypt,
  validateMultiplicativeKey,
  VALID_MULTIPLICATIVE_KEYS,
  playfairEncrypt,
  playfairDecrypt,
  generatePlayfairMatrix,
  preparePlayfairPlaintext,
  hillEncrypt,
  hillDecrypt,
  validateHillMatrix,
  vigenereEncrypt,
  vigenereDecrypt,
  autokeyEncrypt,
  autokeyDecrypt,
  gcd,
  modInverse,
  tokenizeText,
  extractTfidfFeatures,
  analyzeMessageForPhishing,
} from '../src/utils/crypto';
import { PHISHING_MODEL } from '../src/data/phishing_model';

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    crypto: webcrypto,
    btoa: (value: string) => Buffer.from(value, 'binary').toString('base64'),
    atob: (value: string) => Buffer.from(value, 'base64').toString('binary'),
  },
});

const results = await executeSecurityTestSuite();
const expectedIds = Array.from({ length: 22 }, (_, index) => `T-${String(index + 1).padStart(2, '0')}`);

describe('CipherSentinel T-01 through T-22 security matrix', () => {
  it('returns exactly the documented test IDs in order', () => {
    assert.deepEqual(results.map((result) => result.id), expectedIds);
  });

  for (const result of results) {
    it(`${result.id} ${result.action}`, () => {
      assert.equal(result.status, 'Passed', result.evidence);
    });
  }
});

describe('Caesar Cipher Strict Input Validation & Integrity Suite', () => {
  it('accepts valid integer shifts and preserves case and non-alphabetic characters', () => {
    const plaintext = 'Attack at Dawn! 123';
    const encrypted = caesarEncrypt(plaintext, 7);
    assert.equal(encrypted, 'Haahjr ha Khdu! 123');
    const decrypted = caesarDecrypt(encrypted, 7);
    assert.equal(decrypted, plaintext);
  });

  it('accepts zero shift and returns unchanged text', () => {
    const text = 'CipherSentinel-2026';
    assert.equal(caesarEncrypt(text, 0), text);
    assert.equal(caesarDecrypt(text, 0), text);
  });

  it('accepts negative integer shifts symmetrically', () => {
    const original = 'HELLO WORLD';
    const shiftedBack = caesarEncrypt(original, -3);
    assert.equal(shiftedBack, 'EBIIL TLOIA');
    const recovered = caesarDecrypt(shiftedBack, -3);
    assert.equal(recovered, original);
  });

  it('accepts large integer shifts with correct modulo-26 normalization', () => {
    const sample = 'Cryptography';
    const shift55 = caesarEncrypt(sample, 55); // 55 % 26 = 3
    const shift3 = caesarEncrypt(sample, 3);
    assert.equal(shift55, shift3);
    assert.equal(caesarDecrypt(shift55, 55), sample);

    const shiftNeg55 = caesarEncrypt(sample, -55); // -55 mod 26 = 23 (-3)
    const shiftNeg3 = caesarEncrypt(sample, -3);
    assert.equal(shiftNeg55, shiftNeg3);
    assert.equal(caesarDecrypt(shiftNeg55, -55), sample);

    // Multiples of 26
    assert.equal(caesarEncrypt(sample, 2600), sample);
    assert.equal(caesarDecrypt(sample, 2600), sample);
  });

  it('rejects fractional shift values without silent coercion or flooring', () => {
    assert.throws(() => caesarEncrypt('ABC', 1.5), {
      name: 'Error',
      message: 'Caesar shift must be a valid integer.',
    });
    assert.throws(() => caesarEncrypt('ABC', 0.1), {
      name: 'Error',
      message: 'Caesar shift must be a valid integer.',
    });
    assert.throws(() => caesarEncrypt('ABC', -2.7), {
      name: 'Error',
      message: 'Caesar shift must be a valid integer.',
    });
    assert.throws(() => caesarDecrypt('ABC', 3.14159), {
      name: 'Error',
      message: 'Caesar shift must be a valid integer.',
    });
  });

  it('rejects NaN shift value', () => {
    assert.throws(() => caesarEncrypt('SAMPLE', Number.NaN), {
      name: 'Error',
      message: 'Caesar shift must be a valid integer.',
    });
    assert.throws(() => caesarDecrypt('SAMPLE', NaN), {
      name: 'Error',
      message: 'Caesar shift must be a valid integer.',
    });
  });

  it('rejects Infinity shift value without producing NUL characters', () => {
    assert.throws(() => caesarEncrypt('INFINITY_CHECK', Infinity), {
      name: 'Error',
      message: 'Caesar shift must be a valid integer.',
    });
    assert.throws(() => caesarDecrypt('INFINITY_CHECK', Infinity), {
      name: 'Error',
      message: 'Caesar shift must be a valid integer.',
    });
  });

  it('rejects -Infinity shift value without producing NUL characters', () => {
    assert.throws(() => caesarEncrypt('NEG_INFINITY_CHECK', -Infinity), {
      name: 'Error',
      message: 'Caesar shift must be a valid integer.',
    });
    assert.throws(() => caesarDecrypt('NEG_INFINITY_CHECK', -Infinity), {
      name: 'Error',
      message: 'Caesar shift must be a valid integer.',
    });
  });

  it('rejects invalid numeric strings and accepts valid integer strings where applicable', () => {
    // Valid integer strings parsed safely
    assert.equal(validateCaesarShift('7'), 7);
    assert.equal(validateCaesarShift('-5'), -5);
    assert.equal(validateCaesarShift('  12  '), 12);

    // Invalid strings rejected
    assert.throws(() => validateCaesarShift('abc'), {
      name: 'Error',
      message: 'Caesar shift must be a valid integer.',
    });
    assert.throws(() => validateCaesarShift('3.5'), {
      name: 'Error',
      message: 'Caesar shift must be a valid integer.',
    });
    assert.throws(() => validateCaesarShift('NaN'), {
      name: 'Error',
      message: 'Caesar shift must be a valid integer.',
    });
    assert.throws(() => validateCaesarShift('Infinity'), {
      name: 'Error',
      message: 'Caesar shift must be a valid integer.',
    });
    assert.throws(() => validateCaesarShift('-Infinity'), {
      name: 'Error',
      message: 'Caesar shift must be a valid integer.',
    });
    assert.throws(() => validateCaesarShift(''), {
      name: 'Error',
      message: 'Caesar shift must be a valid integer.',
    });
    assert.throws(() => validateCaesarShift('   '), {
      name: 'Error',
      message: 'Caesar shift must be a valid integer.',
    });

    // caesarEncrypt with string or invalid types
    assert.throws(() => caesarEncrypt('TEST', 'invalid' as unknown as number), {
      name: 'Error',
      message: 'Caesar shift must be a valid integer.',
    });
    assert.throws(() => caesarEncrypt('TEST', '3.5' as unknown as number), {
      name: 'Error',
      message: 'Caesar shift must be a valid integer.',
    });
    assert.throws(() => caesarEncrypt('TEST', null as unknown as number), {
      name: 'Error',
      message: 'Caesar shift must be a valid integer.',
    });
    assert.throws(() => caesarEncrypt('TEST', undefined as unknown as number), {
      name: 'Error',
      message: 'Caesar shift must be a valid integer.',
    });
  });

  it('completes encryption and decryption round trips across diverse character sets', () => {
    const testCases = [
      { text: 'The Quick Brown Fox Jumps Over 13 Lazy Dogs!', shift: 13 },
      { text: 'Security & Cryptography 2026: Confidentiality!', shift: 25 },
      { text: 'Mixed UPPERCASE, lowercase, and symbols: [{}];:\'"<>?,./', shift: -7 },
      { text: 'Modular arithmetic wrap around test: ZZZaaaZZZ', shift: 1 },
      { text: 'Arabic text: مرحبًا بك 123 (remains unshifted)', shift: 10 },
    ];

    for (const { text, shift } of testCases) {
      const encrypted = caesarEncrypt(text, shift);
      const decrypted = caesarDecrypt(encrypted, shift);
      assert.equal(decrypted, text);
    }
  });

  it('guarantees invalid inputs never produce NUL characters or corrupted ciphertext', () => {
    const invalidInputs: unknown[] = [
      NaN,
      Infinity,
      -Infinity,
      1.5,
      -2.7,
      0.001,
      'Infinity',
      '-Infinity',
      'NaN',
      '3.14',
      'abc',
      '',
      null,
      undefined,
      {},
      [],
    ];

    for (const invalid of invalidInputs) {
      let threw = false;
      let output: string | undefined;
      try {
        output = caesarEncrypt('ABCXYZ123', invalid as number);
      } catch (err: unknown) {
        threw = true;
        assert.ok(err instanceof Error);
        assert.equal(err.message, 'Caesar shift must be a valid integer.');
      }
      assert.ok(threw, `Expected error for invalid input: ${String(invalid)}`);
      assert.equal(output, undefined, `Output should remain undefined for: ${String(invalid)}`);
    }

    // Verify valid outputs across all shifts for normal printable characters never produce NUL characters
    const printableAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 !?@#$%^&*()_+-=[]{}|;:,.<>/~`';
    for (let shift = -52; shift <= 52; shift++) {
      const enc = caesarEncrypt(printableAlphabet, shift);
      assert.ok(!enc.includes('\0'), `Ciphertext contained NUL character for shift ${shift}`);
    }
  });
});

describe('AI Custom TypeScript Vectorizer & In-Browser Inference Suite', () => {
  it('executes custom TypeScript tokenizer into unigrams and adjacent bigrams', () => {
    const text = 'Urgent: Verify your password immediately!';
    const tokens = tokenizeText(text);

    // Unigrams (length > 1)
    assert.ok(tokens.includes('urgent'));
    assert.ok(tokens.includes('verify'));
    assert.ok(tokens.includes('your'));
    assert.ok(tokens.includes('password'));
    assert.ok(tokens.includes('immediately'));

    // Adjacent bigrams
    assert.ok(tokens.includes('urgent verify'));
    assert.ok(tokens.includes('verify your'));
    assert.ok(tokens.includes('your password'));
    assert.ok(tokens.includes('password immediately'));

    // Punctuation stripped, lowercase
    assert.ok(!tokens.includes('urgent:'));
    assert.ok(!tokens.includes('!'));
  });

  it('extracts expected TF-IDF-style features using in-memory model vocabulary and IDF', () => {
    const sample = 'urgent account suspended verify password';
    const features = extractTfidfFeatures(sample);

    assert.ok(features.tokens.length > 0);
    assert.ok(features.matchedFeatures.length > 0);
    assert.ok(features.norm > 0);

    for (const feat of features.matchedFeatures) {
      assert.ok(feat.idx >= 0 && feat.idx < PHISHING_MODEL.numFeatures);
      assert.ok(feat.val > 0, `Feature val should be positive for token "${feat.token}"`);
      assert.ok(feat.normalizedVal > 0, `Normalized val should be positive for token "${feat.token}"`);
      assert.ok(PHISHING_MODEL.vocabulary[feat.token] !== undefined);
    }

    // L2 norm verification: sum of squares of normalizedVal equals 1.0 (within epsilon)
    const sumNormalizedSq = features.matchedFeatures.reduce((acc, f) => acc + f.normalizedVal * f.normalizedVal, 0);
    assert.ok(Math.abs(sumNormalizedSq - 1.0) < 1e-6, `L2 normalized feature sum of squares was ${sumNormalizedSq}`);
  });

  it('executes in-browser Logistic Regression inference returning valid scores, bands, and indicators', () => {
    const phishingSample = 'URGENT: Your account has been suspended due to unauthorized login. Click here to verify password immediately.';
    const result = analyzeMessageForPhishing(phishingSample);

    assert.equal(result.riskBand, 'High phishing risk');
    assert.ok(result.riskScore > 0.7 && result.riskScore <= 1.0, `Score ${result.riskScore} outside high risk range`);
    assert.ok(result.indicators.length > 0);
    assert.ok(result.explanation.includes('logistic regression'));
    assert.ok(result.recommendations.length > 0);
    assert.ok(result.latencyMs >= 0.1);
    assert.equal(result.modelVersion, PHISHING_MODEL.modelVersion);

    const benignSample = 'Team meeting agenda for Thursday afternoon at 2 PM. Please review attached slides.';
    const benignResult = analyzeMessageForPhishing(benignSample);

    assert.equal(benignResult.riskBand, 'Lower detected risk');
    assert.ok(benignResult.riskScore < 0.35 && benignResult.riskScore >= 0.0);
    assert.ok(benignResult.latencyMs >= 0.1);
  });

  it('handles empty, whitespace-only, and non-ASCII inputs consistently without exceptions', () => {
    const emptyResult = analyzeMessageForPhishing('');
    assert.equal(emptyResult.riskScore, 0);
    assert.equal(emptyResult.riskBand, 'Lower detected risk');
    assert.deepEqual(emptyResult.indicators, []);
    assert.ok(emptyResult.explanation.includes('Empty message text'));

    const whitespaceResult = analyzeMessageForPhishing('   \t\n\r  ');
    assert.equal(whitespaceResult.riskScore, 0);
    assert.equal(whitespaceResult.riskBand, 'Lower detected risk');
    assert.deepEqual(whitespaceResult.indicators, []);

    // Non-ASCII text with no English vocabulary matches produces no indicators and uses intercept logit (0.493 -> 'Review recommended')
    const nonAsciiResult = analyzeMessageForPhishing('رسالة تجريبية باللغة العربية');
    assert.equal(nonAsciiResult.riskBand, 'Review recommended');
    assert.equal(nonAsciiResult.riskScore, 0.493);
    assert.deepEqual(nonAsciiResult.indicators, []);
    assert.ok(Number.isFinite(nonAsciiResult.riskScore));
    assert.ok(nonAsciiResult.riskScore >= 0 && nonAsciiResult.riskScore <= 1.0);
  });
});

describe('Eight Classical Ciphers Comprehensive Verification Suite', () => {
  // 1. Caesar Cipher
  describe('1. Caesar Cipher Suite', () => {
    it('encrypts and decrypts with positive, negative, zero, and large shifts', () => {
      const text = 'Attack at Dawn! 123';
      assert.equal(caesarEncrypt(text, 7), 'Haahjr ha Khdu! 123');
      assert.equal(caesarDecrypt('Haahjr ha Khdu! 123', 7), text);

      // Negative shift
      assert.equal(caesarEncrypt('HELLO', -3), 'EBIIL');
      assert.equal(caesarDecrypt('EBIIL', -3), 'HELLO');

      // Zero shift
      assert.equal(caesarEncrypt(text, 0), text);
      assert.equal(caesarDecrypt(text, 0), text);

      // Large shift (55 % 26 = 3)
      assert.equal(caesarEncrypt('ABC', 55), caesarEncrypt('ABC', 3));
      assert.equal(caesarDecrypt(caesarEncrypt('ABC', 55), 55), 'ABC');
    });

    it('rejects invalid shifts strictly without silent truncation', () => {
      assert.throws(() => caesarEncrypt('ABC', 1.5), /Caesar shift must be a valid integer/);
      assert.throws(() => caesarEncrypt('ABC', Number.NaN), /Caesar shift must be a valid integer/);
      assert.throws(() => caesarEncrypt('ABC', Infinity), /Caesar shift must be a valid integer/);
      assert.throws(() => caesarEncrypt('ABC', 'xyz'), /Caesar shift must be a valid integer/);
    });
  });

  // 2. ROT13 Cipher
  describe('2. ROT13 Cipher Suite', () => {
    it('encrypts and decrypts using fixed shift of 13 positions as an involution', () => {
      const sample = 'HELLO WORLD';
      const encrypted = rot13(sample);
      assert.equal(encrypted, 'URYYB JBEYQ');
      // Involution: rot13(rot13(x)) === x
      assert.equal(rot13(encrypted), sample);
      assert.equal(rot13Encrypt(sample), 'URYYB JBEYQ');
      assert.equal(rot13Decrypt(encrypted), sample);
    });

    it('preserves letter casing, numbers, punctuation, and Unicode in ROT13', () => {
      const mixed = 'Hello, World! 2026. رسالة';
      const enc = rot13(mixed);
      assert.equal(enc, 'Uryyb, Jbeyq! 2026. رسالة');
      assert.equal(rot13(enc), mixed);
    });
  });

  // 3. Additive Cipher
  describe('3. Additive Cipher Suite', () => {
    it('performs modular additive shift equivalent to generalized Caesar', () => {
      const sample = 'CONFIDENTIAL DATA 2026';
      const key = 15;
      const enc = additiveEncrypt(sample, key);
      assert.equal(enc, caesarEncrypt(sample, key));
      assert.equal(additiveDecrypt(enc, key), sample);

      // Negative and large integer keys
      assert.equal(additiveEncrypt('XYZ', -2), 'VWX');
      assert.equal(additiveDecrypt('VWX', -2), 'XYZ');
      assert.equal(additiveEncrypt('ABC', 2605), additiveEncrypt('ABC', 5));
    });

    it('validates integer keys and rejects invalid values in Additive Cipher', () => {
      assert.equal(validateAdditiveKey(10), 10);
      assert.equal(validateAdditiveKey(' -4 '), -4);
      assert.throws(() => validateAdditiveKey(3.14), /Additive key must be a valid integer/);
      assert.throws(() => validateAdditiveKey(NaN), /Additive key must be a valid integer/);
      assert.throws(() => validateAdditiveKey('invalid'), /Additive key must be a valid integer/);
    });
  });

  // 4. Multiplicative Cipher
  describe('4. Multiplicative Cipher Suite', () => {
    it('correctly validates coprime keys and computes modular inverse', () => {
      for (const validKey of VALID_MULTIPLICATIVE_KEYS) {
        const { normalizedKey, inverseKey } = validateMultiplicativeKey(validKey);
        assert.equal((normalizedKey * inverseKey) % 26, 1);
      }
      assert.equal(gcd(5, 26), 1);
      assert.equal(modInverse(5, 26), 21);
      assert.equal(modInverse(7, 26), 15);
      assert.equal(modInverse(9, 26), 3);
    });

    it('encrypts and decrypts with known reference vectors in Multiplicative Cipher', () => {
      // Known vector: "HELLO" with key 5 -> "JUDDS"
      const sample = 'HELLO';
      const enc = multiplicativeEncrypt(sample, 5);
      assert.equal(enc, 'JUDDS');
      const dec = multiplicativeDecrypt(enc, 5);
      assert.equal(dec, sample);

      // Case preservation and punctuation
      const mixed = 'Hello, World! 99';
      const encMixed = multiplicativeEncrypt(mixed, 7);
      const decMixed = multiplicativeDecrypt(encMixed, 7);
      assert.equal(decMixed, mixed);
    });

    it('rejects keys that are not coprime with 26 or are invalid in Multiplicative Cipher', () => {
      // Non-coprime keys
      assert.throws(() => validateMultiplicativeKey(0), /must be coprime with 26/);
      assert.throws(() => validateMultiplicativeKey(2), /must be coprime with 26/);
      assert.throws(() => validateMultiplicativeKey(4), /must be coprime with 26/);
      assert.throws(() => validateMultiplicativeKey(13), /must be coprime with 26/);
      assert.throws(() => validateMultiplicativeKey(26), /must be coprime with 26/);

      // Non-finite and fractions
      assert.throws(() => validateMultiplicativeKey(3.5), /Multiplicative key must be a valid integer/);
      assert.throws(() => validateMultiplicativeKey(NaN), /Multiplicative key must be a valid integer/);
      assert.throws(() => validateMultiplicativeKey('abc'), /Multiplicative key must be a valid integer/);
    });
  });

  // 5. Playfair Cipher
  describe('5. Playfair Cipher Suite', () => {
    it('generates correct 5x5 key matrix omitting J and deduplicating keyword', () => {
      const { matrix, normalizedKey } = generatePlayfairMatrix('MONARCHY');
      assert.equal(normalizedKey, 'MONARCHY');
      assert.equal(matrix.length, 5);
      assert.equal(matrix[0].length, 5);
      assert.deepEqual(matrix[0], ['M', 'O', 'N', 'A', 'R']);
      assert.deepEqual(matrix[1], ['C', 'H', 'Y', 'B', 'D']);
      assert.deepEqual(matrix[2], ['E', 'F', 'G', 'I', 'K']);
      assert.deepEqual(matrix[3], ['L', 'P', 'Q', 'S', 'T']);
      assert.deepEqual(matrix[4], ['U', 'V', 'W', 'X', 'Z']);

      // 25 distinct letters, J is excluded
      const flattened = matrix.flat();
      assert.equal(flattened.length, 25);
      assert.equal(new Set(flattened).size, 25);
      assert.ok(!flattened.includes('J'));
      assert.ok(flattened.includes('I'));
    });

    it('prepares digraphs with identical-letter filler insertion and odd padding', () => {
      const { digraphs } = preparePlayfairPlaintext('BALLOON');
      // B A | L L -> L X | L O | O N
      assert.deepEqual(digraphs, [
        ['B', 'A'],
        ['L', 'X'],
        ['L', 'O'],
        ['O', 'N'],
      ]);

      // Repeated X uses Q as filler
      const xxDigraphs = preparePlayfairPlaintext('XX');
      assert.deepEqual(xxDigraphs.digraphs, [
        ['X', 'Q'],
        ['X', 'Q'],
      ]);
    });

    it('encrypts and decrypts with known reference vectors and preserves raw decrypted output', () => {
      const result = playfairEncrypt('INSTRUMENTS', 'MONARCHY');
      assert.equal(result.ciphertext, 'GA TL MZ CL RQ XA');

      const decrypted = playfairDecrypt(result.ciphertext, 'MONARCHY');
      // Decrypted digraphs: IN ST RU ME NT SX (retains filler X)
      assert.equal(decrypted.ciphertext, 'IN ST RU ME NT SX');
    });

    it('rejects empty keywords and odd-length ciphertext during decryption', () => {
      assert.throws(() => playfairEncrypt('HELLO', ''), /Playfair keyword must contain at least one alphabetic letter/);
      assert.throws(() => playfairDecrypt('ABC', 'KEY'), /Playfair ciphertext must contain an even number of letters/);
    });
  });

  // 6. Hill Cipher (2x2 Matrix Modulo 26)
  describe('6. Hill Cipher Suite', () => {
    it('validates 2x2 key matrix and calculates modular determinant and inverse', () => {
      // Matrix [[3, 3], [2, 5]], det = 15 - 6 = 9. gcd(9, 26) = 1.
      // detInv = 3 (since 9 * 3 = 27 = 1 mod 26).
      // Adjoint = [[5, -3], [-2, 3]].
      // Inverse matrix = 3 * [[5, 23], [24, 3]] = [[15, 69], [72, 9]] mod 26 = [[15, 17], [20, 9]].
      const { validMatrix, inverseMatrix, determinant, determinantInverse } = validateHillMatrix([
        [3, 3],
        [2, 5],
      ]);
      assert.equal(determinant, 9);
      assert.equal(determinantInverse, 3);
      assert.deepEqual(validMatrix, [[3, 3], [2, 5]]);
      assert.deepEqual(inverseMatrix, [[15, 17], [20, 9]]);

      // Verify K * K⁻¹ ≡ I mod 26
      const [[a, b], [c, d]] = validMatrix;
      const [[ia, ib], [ic, id]] = inverseMatrix;
      assert.equal((a * ia + b * ic) % 26, 1);
      assert.equal((a * ib + b * id) % 26, 0);
      assert.equal((c * ia + d * ic) % 26, 0);
      assert.equal((c * ib + d * id) % 26, 1);
    });

    it('encrypts and decrypts with known reference vectors in Hill Cipher', () => {
      // Known vector: "HELP" with [[3, 3], [2, 5]] -> "HIAT"
      const matrix = [
        [3, 3],
        [2, 5],
      ];
      const enc = hillEncrypt('HELP', matrix);
      assert.equal(enc.ciphertext, 'HIAT');

      const dec = hillDecrypt('HIAT', matrix);
      assert.equal(dec.ciphertext, 'HELP');
    });

    it('pads odd-length plaintext with X in Hill Cipher', () => {
      const matrix = [
        [3, 3],
        [2, 5],
      ];
      const enc = hillEncrypt('ABC', matrix); // Padded to "ABCX"
      assert.equal(enc.ciphertext.length, 4);
      const dec = hillDecrypt(enc.ciphertext, matrix);
      assert.equal(dec.ciphertext, 'ABCX');
    });

    it('rejects non-invertible matrices and malformed inputs in Hill Cipher', () => {
      // Determinant = 0
      assert.throws(() => validateHillMatrix([[2, 4], [4, 8]]), /not coprime with 26/);

      // Determinant = 2 (not coprime with 26, gcd = 2)
      assert.throws(() => validateHillMatrix([[2, 3], [4, 7]]), /not coprime with 26/); // det = 14 - 12 = 2

      // Non-integer inputs
      assert.throws(() => validateHillMatrix([[1.5, 2], [3, 4]]), /must be a valid integer/);
      assert.throws(() => hillDecrypt('ABC', [[3, 3], [2, 5]]), /even number of letters/);
    });
  });

  // 7. Vigenère Cipher
  describe('7. Vigenère Cipher Suite', () => {
    it('encrypts and decrypts with known reference vector', () => {
      // Known vector: "ATTACKATDAWN" with "LEMON" -> "LXFOPVEFRNHR"
      const plain = 'ATTACKATDAWN';
      const key = 'LEMON';
      const enc = vigenereEncrypt(plain, key);
      assert.equal(enc, 'LXFOPVEFRNHR');
      const dec = vigenereDecrypt(enc, key);
      assert.equal(dec, plain);
    });

    it('preserves letter casing, punctuation, and non-alphabetic characters in Vigenère', () => {
      const mixed = 'Attack at Dawn, 06:00! رسالة';
      const key = 'SECRET';
      const enc = vigenereEncrypt(mixed, key);
      const dec = vigenereDecrypt(enc, key);
      assert.equal(dec, mixed);
    });

    it('rejects keywords without alphabetic letters', () => {
      assert.throws(() => vigenereEncrypt('TEST', '12345'), /must contain at least one alphabetic letter/);
      assert.throws(() => vigenereDecrypt('TEST', ''), /must contain at least one alphabetic letter/);
    });
  });

  // 8. Autokey Cipher (Plaintext Autokey)
  describe('8. Autokey Cipher Suite (Plaintext Autokey)', () => {
    it('encrypts with known reference vector using plaintext keystream extension', () => {
      // Known vector: "ATTACKATDAWN" with keyword "QUEENLY"
      // Plaintext:  A  T  T  A  C  K  A  T  D  A  W  N
      // Keystream:  Q  U  E  E  N  L  Y  A  T  T  A  C
      // Ciphertext: Q  N  X  E  P  V  Y  T  W  T  W  P
      const plain = 'ATTACKATDAWN';
      const keyword = 'QUEENLY';
      const enc = autokeyEncrypt(plain, keyword);
      assert.equal(enc, 'QNXEPVYTWTWP');

      // Decryption dynamically extends keystream from recovered plaintext
      const dec = autokeyDecrypt('QNXEPVYTWTWP', keyword);
      assert.equal(dec, plain);
    });

    it('completes encryption and decryption round trips across casing and punctuation in Autokey', () => {
      const message = 'The Eagle has Landed at 04:00 AM! Proceed with caution.';
      const key = 'CIPHERSENTINEL';
      const encrypted = autokeyEncrypt(message, key);
      const decrypted = autokeyDecrypt(encrypted, key);
      assert.equal(decrypted, message);
    });

    it('verifies implementation is Plaintext-Autokey and not Ciphertext-Autokey', () => {
      // In Ciphertext Autokey, keystream after QUEENLY would be QNXEP...
      // producing a different ciphertext for letter 8 ("A" + "N" = "N", not "A" + "A" = "T").
      const plain = 'ATTACKATDAWN';
      const keyword = 'QUEENLY';
      const enc = autokeyEncrypt(plain, keyword);
      // Letter at index 7 is 'T' (plain 'T' + plain 'A' = 'T')
      assert.equal(enc[7], 'T');
      // Letter at index 8 is 'W' (plain 'D' + plain 'T' = 'W')
      assert.equal(enc[8], 'W');
      assert.equal(enc, 'QNXEPVYTWTWP');
    });

    it('rejects empty or non-alphabetic keywords in Autokey', () => {
      assert.throws(() => autokeyEncrypt('TEST', '   '), /must contain at least one alphabetic letter/);
      assert.throws(() => autokeyDecrypt('TEST', '123!@#'), /must contain at least one alphabetic letter/);
    });
  });
});
