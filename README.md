# CipherSentinel — AI-Assisted Secure Message Protection System

> **Course Project**: Computer Security and Cryptography  
> **Architecture**: Offline-First Cryptographic Security Workbench  
> **Standards Compliance**: NIST SP 800-38D (AES-GCM), RFC 8017 (RSA-OAEP), NIST FIPS 180-4 (SHA-256)

---

## 1. Overview

**CipherSentinel** is a desktop security workbench that unifies an advisory AI-based phishing risk assessment workflow with authenticated cryptographic message protection and tamper-evident data integrity verification.

The application allows users to:
1. **Analyze Suspicious Messages**: Inspect text using a local TF-IDF & Logistic Regression model to detect phishing indicators and receive advisory risk bands without sending data to external APIs.
2. **Execute Cryptographic Operations**: Experiment with classical educational ciphers (Caesar and Vigenère) or execute modern authenticated symmetric encryption (AES-256-GCM) and public-key key wrapping (RSA-3072 OAEP).
3. **Verify Data Integrity**: Generate deterministic SHA-256 hashes and compare them against trusted expected digests to detect unauthorized bit-level tampering.
4. **Archive to Secure Vault**: Package messages in encrypted envelopes containing only ciphertext, 96-bit nonces, 128-bit authentication tags, and wrapped data-encryption keys (DEKs). Plaintext secrets are never stored at rest or written to application logs.
5. **Inspect Test Matrix**: Validate system security across 22 functional and negative test cases (T-01 to T-22), confirming fail-closed behavior upon key mismatch or ciphertext tampering.

---

## 2. Key Modules

- **Security Dashboard**: Global telemetry, scanned message volume, data integrity rate, and cryptographic bit strength.
- **Security Architecture Flow**: Interactive graph and specification matrix detailing data flow from untrusted ingestion to zero-plaintext vault storage.
- **AI Phishing Detection Lab**: Real-time n-gram feature extraction, calibrated decision thresholds (Low < 0.35, Review 0.35–0.70, High > 0.70), explainability indicators, and "Secure & Archive" action.
- **Cryptography Operations Lab**: Modular workbench for Caesar, Vigenère, AES-256-GCM, RSA-OAEP, and SHA-256 hashing.
- **Data Integrity Lab**: Bit-level SHA-256 hash comparison and avalanche effect verification.
- **Secure Message Vault**: Protected envelope archive with on-demand in-memory decryption and fail-closed tamper demonstration.
- **Key Manager & Settings**: RSA-3072 key pair management, public key PEM export, SHA-256 fingerprints, and local model parameters.
- **Test Console & Verification Matrix**: Complete coverage of test cases T-01 through T-22 from the project report.

---

## 3. Running Locally

### Prerequisites
- Node.js v18+ (tested on Node v24.19)
- npm or equivalent package manager

### Instructions
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run development server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```
