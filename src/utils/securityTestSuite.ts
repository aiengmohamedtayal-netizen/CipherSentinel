import { EncryptedRecord, TestCase } from '../types';
import {
  analyzeMessageForPhishing,
  aesGcmDecrypt,
  aesGcmEncrypt,
  base64ToBytes,
  bytesToBase64,
  caesarDecrypt,
  caesarEncrypt,
  computeHexHammingDistance,
  createEncryptedEnvelope,
  decryptEncryptedEnvelope,
  generateGcmNonce,
  generateRandomAesKey,
  generateRsaKeyPair,
  exportEncryptedPrivateKey,
  importEncryptedPrivateKey,
  importRsaPrivateKey,
  sha256,
  unwrapAesKeyWithRsa,
  validateEncryptedEnvelope,
  verifySha256,
  vigenereDecrypt,
  vigenereEncrypt,
  wrapAesKeyWithRsa,
  MAX_ENVELOPE_PLAINTEXT_BYTES,
} from './crypto';

type TestAssertion = () => Promise<string> | string;

const requireCondition = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};

const requireThrows = (action: () => unknown, message: string): void => {
  try {
    action();
  } catch {
    return;
  }
  throw new Error(message);
};

const requireRejects = async (action: () => Promise<unknown>, message: string): Promise<void> => {
  try {
    await action();
  } catch {
    return;
  }
  throw new Error(message);
};

const roundTripMessage = (body: string): string => JSON.stringify({
  format: 'ciphersentinel-message-v1',
  subject: 'Test subject',
  body,
});

/** Runs the same 22 scenarios shown in the Testing Center and records real assertions. */
export async function executeSecurityTestSuite(): Promise<TestCase[]> {
  const results: TestCase[] = [];
  let rsaKeyA: Awaited<ReturnType<typeof generateRsaKeyPair>> | undefined;

  const getRsaKeyA = async () => {
    if (!rsaKeyA) rsaKeyA = await generateRsaKeyPair(3072);
    return rsaKeyA;
  };

  const run = async (
    id: string,
    area: string,
    action: string,
    expected: string,
    assertion: TestAssertion
  ): Promise<void> => {
    const startedAt = performance.now();
    let status: TestCase['status'] = 'Passed';
    let evidence: string;
    try {
      evidence = await assertion();
    } catch (error) {
      status = 'Failed';
      evidence = error instanceof Error ? `Assertion failed: ${error.message}` : 'Assertion failed with an unknown error.';
    }
    const durationMs = Math.round((performance.now() - startedAt) * 100) / 100;
    results.push({ id, area, action, expected, status, duration_ms: durationMs, evidence });
  };

  await run('T-01', 'Caesar Cipher', 'Encrypt sample string with shift 7, then decrypt with shift 7', 'Recovered plaintext exactly matches original', () => {
    const original = 'ATTACK AT DAWN';
    const encrypted = caesarEncrypt(original, 7);
    const decrypted = caesarDecrypt(encrypted, 7);
    requireCondition(decrypted === original, `Round-trip returned ${JSON.stringify(decrypted)}.`);
    return `Round-trip verified: ${JSON.stringify(original)} -> ${JSON.stringify(encrypted)} -> ${JSON.stringify(decrypted)}.`;
  });

  await run('T-02', 'Caesar Cipher', 'Submit a non-finite shift value (NaN)', 'Validation error raised; application does not crash', () => {
    requireThrows(() => caesarEncrypt('SAMPLE', Number.NaN), 'NaN shift was not rejected.');
    requireThrows(() => caesarEncrypt('SAMPLE', Infinity), 'Infinity shift was not rejected.');
    requireThrows(() => caesarEncrypt('SAMPLE', -Infinity), '-Infinity shift was not rejected.');
    requireThrows(() => caesarEncrypt('SAMPLE', 3.5), 'Fractional shift was not rejected.');
    return 'Non-finite (NaN, Infinity, -Infinity) and fractional shifts rejected with a validation error; no NUL characters produced.';
  });

  await run('T-03', 'Vigenère Cipher', 'Encrypt and decrypt using normalized keyword "KEY"', 'Recovered plaintext matches original', () => {
    const original = 'CRYPTOGRAPHY';
    const encrypted = vigenereEncrypt(original, 'KEY');
    const decrypted = vigenereDecrypt(encrypted, 'KEY');
    requireCondition(decrypted === original, `Round-trip returned ${JSON.stringify(decrypted)}.`);
    return `Vigenère round-trip verified: ${JSON.stringify(original)} -> ${JSON.stringify(encrypted)} -> ${JSON.stringify(decrypted)}.`;
  });

  await run('T-04', 'Vigenère Cipher', 'Submit a keyword containing no alphabetic characters', 'Input rejected with a validation message', () => {
    requireThrows(() => vigenereEncrypt('TEXT', '123!@#'), 'Non-alphabetic keyword was not rejected.');
    return 'Keyword containing no A-Z letters was rejected.';
  });

  await run('T-05', 'AES-256-GCM', 'Encrypt and decrypt using a fresh 256-bit DEK, 96-bit nonce, and AAD', 'Original payload recovered after successful GCM tag verification', async () => {
    const message = 'AES-GCM round-trip payload';
    const key = generateRandomAesKey().keyB64;
    const aad = 'record_id=test-05;key_id=test-key';
    const encrypted = await aesGcmEncrypt(message, key, aad);
    const decrypted = await aesGcmDecrypt(encrypted.ciphertextB64, encrypted.tagB64, key, encrypted.nonceB64, aad);
    requireCondition(decrypted.verified && decrypted.plaintext === message, 'Authenticated round-trip did not recover the original payload.');
    requireCondition(base64ToBytes(encrypted.nonceB64).byteLength === 12, 'Generated nonce was not 96 bits.');
    return `AES-GCM authenticated round-trip succeeded; tag ${encrypted.tagB64}.`;
  });

  await run('T-06', 'AES-256-GCM', 'Attempt decryption with an unrelated DEK', 'Tag verification fails; zero partial plaintext released', async () => {
    const key = generateRandomAesKey().keyB64;
    const ciphertext = await aesGcmEncrypt('wrong-key negative case', key);
    const wrongKey = generateRandomAesKey().keyB64;
    await requireRejects(() => aesGcmDecrypt(ciphertext.ciphertextB64, ciphertext.tagB64, wrongKey, ciphertext.nonceB64), 'Wrong AES key unexpectedly decrypted the payload.');
    return 'Wrong AES key rejected before plaintext was returned.';
  });

  await run('T-07', 'AES-256-GCM', 'Flip one bit in ciphertext before decryption', 'GCM authentication fails; payload remains inaccessible', async () => {
    const key = generateRandomAesKey().keyB64;
    const encrypted = await aesGcmEncrypt('ciphertext tamper negative case', key);
    const modified = base64ToBytes(encrypted.ciphertextB64);
    modified[0] ^= 0x01;
    await requireRejects(() => aesGcmDecrypt(bytesToBase64(modified), encrypted.tagB64, key, encrypted.nonceB64), 'Modified ciphertext unexpectedly authenticated.');
    return 'One-bit ciphertext change was rejected by GCM authentication.';
  });

  await run('T-08', 'AES-256-GCM', 'Corrupt one byte in the 128-bit authentication tag', 'Decryption rejected before plaintext release', async () => {
    const key = generateRandomAesKey().keyB64;
    const encrypted = await aesGcmEncrypt('tag tamper negative case', key);
    const modifiedTag = base64ToBytes(encrypted.tagB64);
    modifiedTag[0] ^= 0x01;
    await requireRejects(() => aesGcmDecrypt(encrypted.ciphertextB64, bytesToBase64(modifiedTag), key, encrypted.nonceB64), 'Modified authentication tag unexpectedly passed verification.');
    return 'One-byte authentication-tag change was rejected.';
  });

  await run('T-09', 'AES-256-GCM', 'Generate 30 successive nonces and check for collisions', 'All generated nonces are distinct', () => {
    const nonces = Array.from({ length: 30 }, () => bytesToBase64(generateGcmNonce()));
    requireCondition(nonces.every((nonce) => base64ToBytes(nonce).byteLength === 12), 'A generated nonce was not 96 bits.');
    requireCondition(new Set(nonces).size === nonces.length, 'A collision occurred in the 30 generated nonces.');
    return 'Generated 30 96-bit nonces; no collision observed in this run.';
  });

  await run('T-10', 'RSA-OAEP', 'Wrap AES DEK with a public key, then unwrap with its matching private key', 'Recovered DEK matches original DEK exactly', async () => {
    const keyPair = await getRsaKeyA();
    const dek = generateRandomAesKey().keyB64;
    const wrapped = await wrapAesKeyWithRsa(dek, keyPair.cryptoPublicKey);
    const recovered = await unwrapAesKeyWithRsa(wrapped, keyPair.cryptoPrivateKey);
    requireCondition(recovered === dek, 'Matching private key did not recover the original DEK.');
    return `RSA-OAEP wrap/unwrap succeeded for ${keyPair.modulusLength}-bit key ${keyPair.keyId}.`;
  });

  await run('T-11', 'RSA-OAEP', 'Attempt to unwrap a DEK using an unrelated private key', 'Unwrapping rejected; no DEK returned', async () => {
    const keyA = await getRsaKeyA();
    const keyB = await generateRsaKeyPair(3072);
    const dek = generateRandomAesKey().keyB64;
    const wrapped = await wrapAesKeyWithRsa(dek, keyA.cryptoPublicKey);
    await requireRejects(() => unwrapAesKeyWithRsa(wrapped, keyB.cryptoPrivateKey), 'Unrelated RSA private key unexpectedly unwrapped the DEK.');
    return 'Unrelated RSA private key was rejected.';
  });

  await run('T-12', 'RSA-OAEP', 'Verify encrypted private-key export; reject malformed keys and unsafe envelope parameters', 'Matching passphrase recovers the key; malformed data, metadata changes, and unsafe parameters are rejected', async () => {
    await requireRejects(() => importRsaPrivateKey('not a valid private key'), 'Malformed RSA private key data was accepted.');
    const keyPair = await getRsaKeyA();
    const passphrase = 'academic-demo-passphrase';
    const envelope = await exportEncryptedPrivateKey(keyPair.privateKeyPem, passphrase, keyPair.keyId);
    const recovered = await importEncryptedPrivateKey(envelope, passphrase);
    requireCondition(recovered === keyPair.privateKeyPem, 'Encrypted export did not recover the matching private key.');
    await requireRejects(() => importEncryptedPrivateKey(envelope, 'incorrect-academic-passphrase'), 'Incorrect export passphrase was accepted.');
    await requireRejects(
      () => importEncryptedPrivateKey({ ...envelope, iterations: Number.MAX_SAFE_INTEGER }, passphrase),
      'Unsafe PBKDF2 iteration count was accepted.'
    );
    await requireRejects(
      () => importEncryptedPrivateKey({ ...envelope, keyId: `${keyPair.keyId}-changed` }, passphrase),
      'Modified authenticated key metadata was accepted.'
    );
    return 'Malformed key data and unsafe parameters were rejected; matching passphrase recovered the key, while wrong passphrase and modified authenticated metadata were rejected.';
  });

  await run('T-13', 'SHA-256 Hashing', 'Compute and verify a SHA-256 digest; reject malformed expected digest input', 'Valid 64-character digest matches; malformed digest is rejected', async () => {
    const digest = await sha256('CipherSentinel-2026');
    requireCondition(/^[a-f0-9]{64}$/.test(digest), `Digest has invalid format or length: ${digest.length}.`);
    const verification = await verifySha256('CipherSentinel-2026', digest);
    requireCondition(verification.matches, 'Correct expected digest did not verify.');
    await requireRejects(() => verifySha256('CipherSentinel-2026', digest.slice(1)), 'Malformed expected digest length was accepted.');
    return `Computed and verified a ${digest.length}-character digest; malformed expected digest input was rejected.`;
  });

  await run('T-14', 'SHA-256 Hashing', 'Flip one character in the input and compare digests', 'Digests differ significantly (avalanche effect observed)', async () => {
    const original = 'CipherSentinel-2026';
    const modified = 'CipherSentinel-2027';
    const originalDigest = await sha256(original);
    const modifiedDigest = await sha256(modified);
    const distance = computeHexHammingDistance(originalDigest, modifiedDigest);
    requireCondition(originalDigest !== modifiedDigest, 'One-character input change produced the same digest.');
    requireCondition(distance.percentChanged >= 40 && distance.percentChanged <= 60, `Hamming distance was ${distance.percentChanged}%, outside the expected demonstration range.`);
    return `One-character change altered ${distance.bitsChanged}/256 digest bits (${distance.percentChanged}%).`;
  });

  await run('T-15', 'Input Validation', 'Submit an empty message to the hybrid encryption handler', 'Required-field validation triggered; no operation executed', async () => {
    const keyPair = await getRsaKeyA();
    await requireRejects(() => createEncryptedEnvelope('', keyPair.cryptoPublicKey, keyPair.keyId), 'Empty message was accepted for envelope encryption.');
    return 'Empty message rejected before encryption or vault insertion.';
  });

  await run('T-16', 'Input Validation', 'Submit payload exceeding the 128 KB maximum', 'Length boundary check enforced safely', async () => {
    const keyPair = await getRsaKeyA();
    const oversized = 'x'.repeat(MAX_ENVELOPE_PLAINTEXT_BYTES + 1);
    await requireRejects(() => createEncryptedEnvelope(oversized, keyPair.cryptoPublicKey, keyPair.keyId), 'Oversized message was accepted for envelope encryption.');
    return `Payload larger than ${MAX_ENVELOPE_PLAINTEXT_BYTES} bytes rejected before cryptographic work.`;
  });

  await run('T-17', 'AI Threat Evaluator', 'Evaluate a sample containing urgency and credential tokens', 'Categorized under "High phishing risk" band', () => {
    const analysis = analyzeMessageForPhishing('URGENT: Your account has been suspended due to unauthorized login. Click here to verify password immediately.');
    requireCondition(analysis.riskBand === 'High phishing risk', `Expected high risk; got ${analysis.riskBand} (${analysis.riskScore}).`);
    requireCondition(analysis.indicators.length > 0, 'Expected at least one positive contributing indicator.');
    return `Sample classified ${analysis.riskBand} (${analysis.riskScore}); ${analysis.indicators.length} indicators returned.`;
  });

  await run('T-18', 'AI Threat Evaluator', 'Evaluate a benign conversational message', 'Categorized under "Lower detected risk" band', () => {
    const analysis = analyzeMessageForPhishing('Team meeting agenda for Thursday afternoon at 2 PM. Please review attached slides.');
    requireCondition(analysis.riskBand === 'Lower detected risk', `Expected lower risk; got ${analysis.riskBand} (${analysis.riskScore}).`);
    return `Benign sample classified ${analysis.riskBand} (${analysis.riskScore}); this single sample is not an accuracy metric.`;
  });

  await run('T-19', 'AI Threat Evaluator', 'Evaluate whitespace-only text', 'Handled safely without error or false indicator triggers', () => {
    const analysis = analyzeMessageForPhishing('   \n\t  ');
    requireCondition(analysis.indicators.length === 0, 'Whitespace-only input produced threat indicators.');
    requireCondition(analysis.riskBand === 'Lower detected risk' && analysis.riskScore === 0, 'Whitespace-only input did not return the documented empty-input result.');
    return 'Whitespace-only input returned the empty-input advisory response with no indicators.';
  });

  await run('T-20', 'Envelope Schema', 'Validate required envelope fields and reject malformed envelope data', 'Envelope structure conforms to schema requirements; malformed records are rejected', async () => {
    const keyPair = await getRsaKeyA();
    const valid = await createEncryptedEnvelope('schema validation payload', keyPair.cryptoPublicKey, keyPair.keyId);
    validateEncryptedEnvelope(valid);
    requireThrows(() => validateEncryptedEnvelope({ ...valid, nonce_b64: '' }), 'Envelope with a missing nonce was accepted.');
    requireThrows(() => validateEncryptedEnvelope({ ...valid, schema_version: 99 }), 'Unsupported envelope version was accepted.');
    return 'Version 1 envelope accepted; missing nonce and unsupported schema version rejected.';
  });

  await run('T-21', 'End-to-End Vault', 'Encrypt, package, authenticate, decrypt, and reject a tampered envelope', 'Round-trip recovers the original; ciphertext tampering is rejected before plaintext release', async () => {
    const keyPair = await getRsaKeyA();
    const message = roundTripMessage('End-to-end vault integration payload');
    const envelope = await createEncryptedEnvelope(message, keyPair.cryptoPublicKey, keyPair.keyId);
    validateEncryptedEnvelope(envelope);
    const decrypted = await decryptEncryptedEnvelope(envelope, keyPair.cryptoPrivateKey);
    requireCondition(decrypted.verified && decrypted.plaintext === message, 'End-to-end hybrid workflow did not recover the original payload.');
    const tamperedCiphertext = base64ToBytes(envelope.ciphertext_b64);
    tamperedCiphertext[0] ^= 0x01;
    await requireRejects(
      () => decryptEncryptedEnvelope({ ...envelope, ciphertext_b64: bytesToBase64(tamperedCiphertext) }, keyPair.cryptoPrivateKey),
      'Tampered hybrid envelope ciphertext unexpectedly authenticated.'
    );
    return `Hybrid envelope ${envelope.record_id} round-tripped; one-bit ciphertext tampering was rejected.`;
  });

  await run('T-22', 'Plaintext Leakage Audit', 'Inspect encrypted envelope fields for raw plaintext', 'Zero raw plaintext discovered in envelope fields', async () => {
    const keyPair = await getRsaKeyA();
    const marker = 'PLAINTEXT_SENTINEL_93a24e5f';
    const envelope = await createEncryptedEnvelope(marker, keyPair.cryptoPublicKey, keyPair.keyId);
    const serialized = JSON.stringify(envelope);
    requireCondition(!serialized.includes(marker), 'Raw plaintext marker was present in the serialized encrypted envelope.');
    requireCondition(!Object.prototype.hasOwnProperty.call(envelope, 'decryptedPlaintext'), 'Envelope contains a decryptedPlaintext property.');
    requireCondition(envelope.subject === 'Encrypted message', 'Sensitive plaintext metadata was copied into the visible envelope subject.');
    return 'Marker string, decryptedPlaintext field, and sensitive subject were absent from the envelope JSON.';
  });

  return results;
}
