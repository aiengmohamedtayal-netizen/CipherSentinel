# CipherSentinel

CipherSentinel is a **frontend-only security education web application** built with React, TypeScript, and Vite. It demonstrates classical ciphers, browser Web Crypto API operations, an in-browser phishing-risk classifier, and a session-only hybrid-encryption vault. It operates with zero backend requirements, no database dependencies, and no remote AI inference services.

The application is an academic demonstration workbench for computer security and cryptography. It is not a production messaging service or a replacement for managed key custody.

## Features

- **Dashboard** — links to the seven core workspaces and displays current-session activity metrics and vault counters.
- **Crypto Lab** — educational Caesar and Vigenère demonstrations, authenticated AES-256-GCM encryption/decryption, RSA-OAEP key wrapping, and SHA-256 operations. Caesar cipher input enforces strict integer shift validation, rejecting fractional numbers, NaN, ±Infinity, and invalid numeric strings to eliminate silent flooring and prevent NUL character corruption.
- **AI Phishing Detection** — runs custom TypeScript TF-IDF-style feature extraction and Logistic Regression inference directly in the browser (no Python or Scikit-learn runtime) and displays an advisory score, risk classification band, and contributing token indicators.
- **Hash & Integrity** — computes SHA-256 digests via Web Crypto API, compares expected digests, and demonstrates bit-level avalanche effect differences.
- **Hybrid Encryption** — encrypts a message payload with a fresh 256-bit AES data-encryption key (DEK), uses a fresh 96-bit GCM nonce, binds record and key identifiers as Additional Authenticated Data (AAD), and wraps the AES key for the active RSA-3072 OAEP/SHA-256 public key. The matching private key unwraps the DEK; AES-GCM verifies the 128-bit authentication tag before plaintext is returned.
- **Secure Vault** — lists and decrypts compatible hybrid envelopes, reports authentication failures with fail-closed behavior, and offers a simulated one-bit ciphertext tampering demonstration.
- **Key Manager** — generates session RSA-3072 key pairs and AES-256 keys, exports public keys, and creates a passphrase-protected private-key export using PBKDF2-HMAC-SHA-256 and authenticated AES-256-GCM.
- **Testing Center** — executes the automated in-browser verification matrix (tests T-01 through T-22) with real cryptographic assertions.
- **Bilingual Interface (English & Arabic)** — complete dual-language support featuring native RTL layout for Arabic, LTR layout for English, directional mirroring of navigation indicators, and local bundling of the Thmanyah font family (Thmanyah Sans, Thmanyah Serif Display, Thmanyah Serif Text).

The **Launch Hybrid Workflow** control in Crypto Lab and **Secure & Archive in Vault** in AI Phishing Detection both open the hybrid screen. The AI action stages the current subject and body in React memory; the user reviews and explicitly encrypts the message before it is added to the Vault.

## Data and Key Lifecycle

Vault records, active keys, staged AI messages, and decrypted output are held in React state in the current tab. CipherSentinel does not write these values to `localStorage`, `sessionStorage`, cookies, or a database. Refreshing or closing the tab loses the current records and active keys. Generating a replacement RSA key also makes records encrypted to the previous key undecryptable. An exported private key is encrypted as a file, but the current UI does not import an export to restore keys or recover old vault records.

The Key Manager exposes the active AES key for inspection and allows encrypted private-key export. Browser memory, visible keys, clipboard contents, and page scripts are not production-grade key custody. Use synthetic messages and keys only.

New hybrid messages use a versioned envelope with a generic visible subject (`"Encrypted message"`). The actual subject and body are encoded into the encrypted payload; they are not stored in clear text fields in the envelope metadata. Envelope decryption rejects malformed structures, wrong keys, modified AAD, ciphertext, or authentication tags. The maximum encrypted payload is 128 KiB.

The private-key export uses PBKDF2-HMAC-SHA-256 with 100,000 iterations, a random 16-byte salt, and AES-256-GCM with a random 12-byte nonce and 128-bit tag. New exports use the v2 envelope format, which authenticates the export metadata as AAD. The decryption helper retains bounded v1-format compatibility; v1 does not authenticate its metadata as AAD. Export passphrases must be at least 12 characters. This export feature is educational and the UI does not provide an active-key import/recovery workflow.

## AI Model and Limitations

The phishing threat evaluator is implemented entirely in **custom TypeScript** executing client-side in the browser. It does **not** execute a Scikit-learn or Python runtime, and does not communicate with any external inference API or backend service.

- **In-Browser Feature Processing**: Input text is processed through custom TypeScript tokenization that lowercases characters, filters non-alphanumeric punctuation, and generates word unigrams and adjacent bigrams.
- **TF-IDF-Style Feature Extraction**: Term frequencies are calculated for matching vocabulary tokens, scaled using sublinear weighting (`1 + ln(count)`), weighted by stored inverse document frequency (IDF) vectors, and normalized using Euclidean (L2) vector norms.
- **Logistic Regression Inference**: Inference calculates the linear logit using stored model coefficients and intercept (`logit = b + sum(w_i * x_i)`), and maps it to an advisory score via a standard logistic sigmoid (`P = 1 / (1 + e^-logit)`).

The included `src/data/phishing_model.json` artifact declares model version `TF-IDF-LogReg-v1.4`, 40 training samples, and 993 features. Fixed advisory score bands use cutoffs at 0.35 and 0.70:
- `< 0.35`: Lower detected risk
- `0.35 – 0.70`: Review recommended
- `> 0.70`: High phishing risk

The score is **not calibrated as a probability**. The offline training dataset, training pipeline, and independent precision/recall/F1 evaluation are not included in the repository. As such, training data provenance and Scikit-learn training parity cannot be independently verified. The model vocabulary is English-oriented; Arabic-only input has no matching vocabulary tokens and produces the intercept score (0.493), which must not be interpreted as reliable phishing detection. A lower-risk band does not certify safety. The AI input field is limited to 10,000 characters; inference runs synchronously on the browser’s main thread.

## Typography and RTL Localization

The application bundles all required font assets locally in `src/assets/fonts/` with zero external CDN dependencies:
- **English UI**: Plus Jakarta Sans (body), Fraunces and Newsreader (headings and display).
- **Arabic UI**: Thmanyah Sans (body and UI labels), Thmanyah Serif Display and Thmanyah Serif Text (headings and titles).
- **Directional Isolation**: Mixed-direction cryptographic values (hexadecimal hashes, Base64 ciphertext, PEM keys, nonces, tags) are enclosed within `dir="ltr"` or `<bdi>` elements to ensure correct character ordering under Arabic RTL display.
- **Language Switcher**: Located in the main navigation bar, allowing seamless toggling between English (LTR) and Arabic (RTL) without navigating away from the active tab. Language preference is persisted via `localStorage`.

## Requirements

- Node.js 18.18 or newer
- npm
- A modern browser with Web Crypto API support (Chrome, Edge, Firefox, Safari)

Web Crypto is available on `localhost`, `127.0.0.1`, and on HTTPS origins. No environment variables or API keys are required.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3000`.

## Automated Checks

```bash
npm run lint   # TypeScript compilation check (tsc --noEmit)
npm test       # Node test runner; executes 38 tests across 3 suites (T-01 to T-22 matrix, Caesar validation, AI vectorizer)
npm run build  # Production static bundle generated in dist/
```

The Testing Center inside the web application executes the same T-01 through T-22 assertion suite in the active browser.

## Static Deployment

`npm run build` creates a production static frontend in `dist/`. No server, database, runtime API, or environment variables are required. Host the contents of `dist/` at the site root and serve them over HTTPS so browser Web Crypto APIs remain active. The application uses in-memory tab navigation rather than URL routes, so root deployment does not require SPA route rewrites.

For a local production preview, run:

```bash
npm run preview
```

## Project Documentation

- `CIPHERSENTINEL_FINAL_REPORT.md` — comprehensive academic technical report (architecture, cryptography, AI pipeline, localization, testing).
- `CIPHERSENTINEL_PRESENTATION.md` — 12-slide project defense presentation with visual recommendations and presenter notes.
- `CIPHERSENTINEL_DEMO_SCRIPT.md` — step-by-step 5–7 minute live demonstration guide with inputs, expected outputs, and recovery procedures.
- `FINAL_QA_REPORT.md` — comprehensive quality assurance and verification report.
- `TARGETED_FIXES_REPORT.md` — implementation report on Caesar cipher validation and AI documentation fixes.
- `ARABIC_LOCALIZATION_REPORT.md` — detailed audit and report on Arabic localization, RTL implementation, and Thmanyah font integration.
