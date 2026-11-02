/**
 * CipherSentinel Core Domain & System Types
 * AI-Assisted Secure Message Protection Workbench
 */

export type NavigationTab =
  | 'crypto-lab'
  | 'hybrid'
  | 'phishing'
  | 'integrity'
  | 'vault'
  | 'keys'
  | 'testing'
  | 'dashboard';

export interface EncryptedRecord {
  record_id: string;
  schema_version: number;
  cipher_suite: string;
  key_id: string;
  nonce_b64: string;
  wrapped_dek_b64: string;
  ciphertext_b64: string;
  tag_b64: string;
  created_at: string;
  subject: string;
  isDemoFixture: boolean; // Explicitly distinguishes sample demonstration fixtures from active user session records
  status: 'Encrypted & Authenticated' | 'Tampered (Simulated)' | 'Integrity Verified';
  ai_risk_band?: 'Lower detected risk' | 'Review recommended' | 'High phishing risk';
  ai_risk_score?: number;
}

export interface TestCase {
  id: string;
  area: string;
  action: string;
  expected: string;
  status: 'Passed' | 'Failed' | 'Pending';
  duration_ms: number;
  evidence: string;
}

export interface ActiveRsaKeyPair {
  keyId: string;
  publicKeyPem: string;
  privateKeyPem: string;
  publicKeyFingerprint: string;
  modulusLength: number;
  createdAt: string;
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


export interface PhishingSample {
  id: string;
  label: string;
  sender: string;
  subject: string;
  body: string;
  expectedCategory: 'Phishing' | 'Suspicious' | 'Legitimate';
}

export interface SecurityTelemetry {
  year: string;
  suiteVersion: string;
  courseReference: string;
  standardsReference: string;
  supportedAlgorithmCount: number;
}
