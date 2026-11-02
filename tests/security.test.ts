import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { describe, it } from 'node:test';
import { executeSecurityTestSuite } from '../src/utils/securityTestSuite';
import {
  caesarEncrypt,
  caesarDecrypt,
  validateCaesarShift,
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
