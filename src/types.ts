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
  decryptedPlaintext?: string;
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
  format: 'PKCS#8-PBKDF2-AES256GCM';
  iterations: number;
  saltB64: string;
  nonceB64: string;
  ciphertextB64: string;
  tagB64: string;
  keyId: string;
  exportedAt: string;
}


export interface ArchitectureNode {
  id: string;
  name: string;
  category: 'Ingestion' | 'AI Intelligence' | 'Symmetric Crypto' | 'Asymmetric Wrap' | 'Integrity' | 'Storage' | 'Key Management' | 'Classical Sandbox';
  algorithm: string;
  standard: string;
  description: string;
  securityRole: string;
  parameters: string;
  highlights: string[];
  x: number;
  y: number;
}

export interface AlgorithmSpec {
  id: string;
  name: string;
  category: 'Modern Symmetric' | 'Public Key' | 'Cryptographic Hash' | 'Classical Educational';
  standard: string;
  keySize: string;
  nonceSize: string;
  tagSize: string;
  securityLevel: string;
  implementationBasis: string;
  description: string;
  mathematicalFormula: string;
  educationalNotice?: string;
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
  heldOutModelPrecision?: number;
  integrityVerifiedCount?: number;
  complianceSpec?: string;
}
