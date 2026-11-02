# CipherSentinel — Final Technology Audit

**Audit date:** 2026-11-02  
**Repository state:** local `D:\CRYPT` checkout; no application source was changed for this audit.  
**Scope:** source and dependency tracing, documentation comparison, and current local checks. No deployment or push was performed.

## Method and Current Verification

The audit traced application entry points, imports, crypto/model utility calls, context providers, test harness, package dependencies, and documentation. A dependency declaration or interface label was not counted as evidence by itself.

Current checks executed in this checkout:

- `npm test` — **23 passed, 0 failed**: one T-01–T-22 ID/order assertion plus 22 scenario assertions. The harness invokes the shared scenario suite using Node's Web Crypto implementation through a `window.crypto` shim.
- `npm run lint` — **passed**: `tsc --noEmit`.
- `npm run build` — **passed**: Vite 6.4.5 emitted a production bundle. The minified JavaScript is 575.77 kB (158.89 kB gzip), above Vite's 500 kB warning threshold.
- Tool versions observed: Node.js 24.19.0, npm 11.17.0, TypeScript 5.8.3. `package.json` declares Node `>=18.18`; the minimum engine version was not tested in this audit.

The Node tests exercise the shared crypto/model functions, but they do not provide browser-component or cross-browser coverage. The implementation progress report records earlier manual browser checks and a 22/22 in-app Testing Center run; that browser run was not repeated as part of this technology audit.

## Technology Verification Matrix

| Technology | Status | Source Files | Actual Usage | Test Evidence | Notes |
| ---------- | ------ | ------------ | ------------ | ------------- | ----- |
| React | IMPLEMENTED & VERIFIED | `src/main.tsx:1-10`; `src/App.tsx:12-69`; React components under `src/components/` | `createRoot`, `StrictMode`, function components, and hooks render the workbench. `App` composes providers and selects the dashboard, crypto, AI, hash, vault, key, and testing views. | `npm run build` passed; earlier browser workflow checks are recorded in `IMPLEMENTATION_PROGRESS_REPORT.md`. | `npm test` is not a React component test suite; no React Testing Library/Vitest tests are configured. |
| React DOM | IMPLEMENTED & VERIFIED | `src/main.tsx:2,6` | `react-dom/client` mounts the React tree into `#root`. | Included in the successful production build. | Browser rendering is also recorded in the prior manual QA report, not re-run here. |
| TypeScript | IMPLEMENTED & VERIFIED | `src/App.tsx`; `src/components/**/*.tsx`; `src/context/*.tsx`; `src/utils/*.ts`; `tsconfig.json` | Application logic, UI, interfaces, and test utilities are written in `.ts`/`.tsx`. | `npm run lint` passed with TypeScript 5.8.3 (`tsc --noEmit`). | `tsconfig.json` does not enable `strict`; a successful check is not a strict-mode check. |
| Vite | IMPLEMENTED & VERIFIED | `vite.config.ts`; `index.html`; `src/main.tsx`; `package.json` | Vite serves the development app and bundles the React/Tailwind application. The React and Tailwind Vite plugins are registered. | `npm run build` passed with Vite 6.4.5 and emitted `dist/`. | Current production bundle triggers a non-blocking chunk-size warning. The previously observed local watcher `EBUSY` involved an unrelated untracked PDF in this workspace; it is documented in the implementation progress report. |
| CSS / Tailwind CSS | IMPLEMENTED & VERIFIED | `src/index.css:1-32`; `src/**/*.tsx`; `vite.config.ts:1,8`; `package.json` | Tailwind CSS v4 is imported through `@tailwindcss/vite` and utility classes are used throughout JSX. `src/index.css` also defines custom CSS variables, base rules, dark-mode variant, typography, and glass-panel classes. | Production build passed and generated CSS (`dist/assets/index-C57F9W69.css`). | It is both Tailwind utility styling and authored CSS, not Tailwind-only. |
| React Context API | IMPLEMENTED & VERIFIED | `src/context/SessionContext.tsx:34-167`; `src/context/ThemeContext.tsx:12-59`; `src/App.tsx:65-69` | `SessionProvider` shares tab selection, active RSA/AES keys, vault records, staged messages, test state, and operations across screens. `ThemeProvider` exposes light/dark state and applies the dark class to the document. | Earlier manual workflow checks recorded in `IMPLEMENTATION_PROGRESS_REPORT.md` exercised hybrid navigation, AI staging, and Vault state sharing; build passed. | No dedicated automated provider/hook tests. `ThemeContext` has an unused `THEME_STORAGE_KEY` constant and does not persist theme selection. |
| Caesar Cipher | IMPLEMENTED & VERIFIED | `src/utils/crypto.ts:85-115`; UI in `src/components/crypto/CryptoLabPage.tsx` | Implements alphabetic shift modulo 26, preserving case and leaving non-ASCII/non-letter characters unchanged; decryption negates the shift. | T-01 round trip and T-02 NaN rejection passed in `npm test`. | Validation gap: the function floors fractional shifts instead of rejecting them; `Infinity` returns NUL characters. This audit directly observed `caesarEncrypt('ABC', 1.5) === 'BCD'` and three NULs for `Infinity`. T-02 covers `NaN` only. See Documentation Inaccuracies. Educational cipher only. |
| Vigenère Cipher | IMPLEMENTED & VERIFIED | `src/utils/crypto.ts:118-169`; UI in `src/components/crypto/CryptoLabPage.tsx` | Repeats an A–Z keyword across alphabetic message characters; preserves case and leaves other characters unchanged. | T-03 round trip and T-04 rejection of a keyword with no A–Z letters passed in `npm test`. | The keyword is trimmed, uppercased, and stripped of non-A–Z characters; this is a classical educational cipher, not secure encryption. |
| AES-256-GCM | IMPLEMENTED & VERIFIED | `src/utils/crypto.ts:228-368`; hybrid use at `:722-788` | Uses a 32-byte key, fresh 12-byte random nonce per encryption, 128-bit tag, optional additional authenticated data (AAD), and Web Crypto encryption/decryption. Decryption returns plaintext only after tag verification. | T-05 round trip; T-06 wrong key; T-07 tampered ciphertext; T-08 tampered tag; T-21 hybrid round trip/tamper rejection all passed in `npm test`. | T-09 observes 30 distinct random nonces in one run; it cannot prove collisions will never occur. No dedicated test mutates only the AAD. |
| RSA-3072 | IMPLEMENTED & VERIFIED | `src/utils/crypto.ts:396-429`; `src/context/SessionContext.tsx:59,76` | Generates extractable RSA key pairs with 3072-bit modulus, exponent 65537, and SHA-256 OAEP parameters; application session initialization and regeneration request 3072 bits. | T-10/T-11 exercise matching and unrelated key behavior with 3072-bit pairs; T-21 exercises the envelope path. Earlier browser Key Manager workflow is recorded in the implementation report. | Tests verify successful key operations through the 3072-bit generator path, but there is no separate assertion that inspects the returned modulus length. Keys are extractable and private PEM is held in React state for this educational app. |
| RSA-OAEP | IMPLEMENTED & VERIFIED | `src/utils/crypto.ts:396-500`; envelope path `:722-788` | Imports and generates RSA-OAEP/SHA-256 keys; encrypts the raw 32-byte AES DEK with the public key and decrypts it with the private key. | T-10 wrap/unwrap round trip; T-11 wrong-private-key rejection; T-12 malformed key input; T-21 hybrid envelope all passed in `npm test`. | The implementation performs OAEP `subtle.encrypt`/`subtle.decrypt` on raw DEK bytes. It does not call Web Crypto's `wrapKey`/`unwrapKey` methods, despite helper names describing wrap/unwrap. |
| Hybrid Encryption | IMPLEMENTED & VERIFIED | `src/utils/crypto.ts:712-865`; `src/components/crypto/HybridEncryptionPage.tsx`; `src/components/vault/SecureVaultPage.tsx`; entry points in `src/App.tsx`, `CryptoLabPage.tsx`, `PhishingDetectionPage.tsx` | Serializes message payload, encrypts it with a newly generated AES DEK and GCM nonce, wraps that DEK to the active RSA public key, and stores a versioned envelope. Both Hybrid Workflow and Vault use common validation/decryption helpers and authenticated AAD. | T-20 malformed envelope; T-21 encrypted round trip and ciphertext tamper rejection; T-22 checks serialized envelope for raw plaintext; all passed in current `npm test`. Earlier manual navigation/Vault checks are in the implementation report. | Tests cover utility/envelope integration, not a browser-driven UI regression. Only the generic envelope subject is clear; content is encrypted. Keys/records remain session-only. |
| SHA-256 | IMPLEMENTED & VERIFIED | `src/utils/crypto.ts:180-215,414-417`; `src/components/integrity/HashIntegrityPage.tsx` | Uses `crypto.subtle.digest('SHA-256', ...)` for text digests and RSA key fingerprints; validates expected digest as 64 hex characters. | T-13 format/self-verification/malformed digest and T-14 changed-input avalanche demonstration passed in `npm test`. | T-13 compares `verifySha256` against the digest produced by the same implementation; no fixed known-answer test vector is asserted. The API algorithm is explicitly SHA-256, but independent conformance evidence is absent. Hashes alone do not authenticate a sender. |
| PBKDF2 | IMPLEMENTED & VERIFIED | `src/utils/crypto.ts:503-700`; UI in `src/components/keys/KeyManagerPage.tsx` | Imports passphrase material, derives a 256-bit AES key with PBKDF2-HMAC-SHA-256 at fixed 100,000 iterations and a random 16-byte salt, then encrypts PKCS#8 private-key text with AES-256-GCM. New v2 metadata is AAD; bounded v1 compatibility remains. | T-12 verifies an export/import round trip and rejects wrong passphrase, modified metadata, malformed key data, and unsafe iteration values. | This tests the helper's round trip and negative paths, not an independent PBKDF2 known-answer vector or a user-facing key-restore workflow. The UI does not restore the active key from the export. |
| Web Crypto API | IMPLEMENTED & VERIFIED | `src/utils/crypto.ts:180-700`; `src/context/SessionContext.tsx:59-80`; `tests/security.test.ts:2-14` | Browser app uses `window.crypto.subtle` and `window.crypto.getRandomValues` for digest, AES, RSA, PBKDF2, and random material. | Current Node tests inject `node:crypto` Web Crypto as `window.crypto`; crypto and envelope cases passed. Earlier browser crypto/Vault smoke checks are documented in implementation progress. | Node Web Crypto is a test stand-in. This audit did not test multiple browser engines or secure-context deployment. The app requires a modern browser and HTTPS or localhost. |
| TF-IDF | IMPLEMENTED & VERIFIED | `src/data/phishing_model.json`; `src/data/phishing_model.ts`; `src/utils/crypto.ts:888-959` | Custom TypeScript tokenization creates lowercased ASCII word unigrams and adjacent bigrams, counts matching vocabulary items, applies stored IDF with sublinear TF `(1 + ln(count))`, L2-normalizes, then supplies features to the classifier. Artifact reports 993 vocabulary/IDF/coefficient positions. | T-17/T-18 sample classifications and T-19 whitespace behavior passed in `npm test`. | Feature extraction is implemented locally. There is no included data provenance, training script, held-out evaluation, or evidence that this reproduces a specific external vectorizer configuration. |
| Logistic Regression | IMPLEMENTED & VERIFIED | `src/utils/crypto.ts:930-969`; coefficients and intercept in `src/data/phishing_model.json` | Computes coefficient dot product plus intercept and applies logistic sigmoid; fixed score thresholds map to advisory bands. | T-17/T-18 verify one fixed high-risk and one fixed lower-risk example; T-19 checks empty input. | These are example behavior checks, not model quality metrics. No calibration, precision, recall, F1, confusion matrix, or threshold validation is present. The artifact's `trainedSamples: 40` is metadata, not independently verifiable training evidence. |
| In-browser model inference | IMPLEMENTED, NOT FULLY VERIFIED | `src/components/ai/PhishingDetectionPage.tsx:22-55`; `src/utils/crypto.ts:904-1000`; model JSON import in `src/data/phishing_model.ts` | The AI page calls `analyzeMessageForPhishing` locally on message body text; the artifact is bundled and no remote inference endpoint is used. | T-17–T-19 execute the shared inference function under Node. Production build passed. Earlier manual AI-to-Hybrid staging is recorded in the implementation report. | The current audit did not run a browser-specific inference/UI test. Subject/sender/URL metadata are not model inputs; the UI caps body length at 10,000 characters. Results are advisory only. |
| Node.js | IMPLEMENTED & VERIFIED | `package.json`; `tests/security.test.ts`; `src/utils/securityTestSuite.ts` | Node is the development/test runtime, not a production app server. Current observed test runtime was Node 24.19.0. | `npm test` executed successfully; `node --version` returned `v24.19.0`. | `package.json` supports Node `>=18.18`, but the lower bound was not tested. |
| npm | IMPLEMENTED & VERIFIED | `package.json`; `package-lock.json` | npm installs the app/tool dependencies and exposes `test`, `lint`, `build`, `dev`, and `preview` scripts. Current observed npm was 11.17.0. | `npm test`, `npm run lint`, and `npm run build` all exited successfully. `npm ls --depth=0` resolved all declared direct dependencies. | This verifies the current checkout/runtime, not every supported npm/Node combination. |
| TypeScript Compiler | IMPLEMENTED & VERIFIED | `package.json` (`lint` script); `tsconfig.json` | `npm run lint` invokes `tsc --noEmit`, type-checking configured TS/TSX source and tests without output files. | `npm run lint` passed with TypeScript 5.8.3. | `strict` is not enabled; some type errors that strict mode would flag may not be reported. |
| Automated Testing Framework | IMPLEMENTED & VERIFIED | `tests/security.test.ts`; `src/utils/securityTestSuite.ts`; `package.json` | Node's built-in `node:test` (`describe`, `it`) and `node:assert/strict` host 22 shared behavioral assertions; `tsx` loads TS modules. | Current `npm test`: 23 tests passed, 0 failed. | This is a Node utility/integration suite plus an in-app shared test matrix, not Playwright/Cypress or a browser component suite. |
| Production Build Tool | IMPLEMENTED & VERIFIED | `vite.config.ts`; `package.json` | Vite compiles and bundles the frontend into `dist/`; Tailwind and React plugins participate in the build. | Current `npm run build` passed: Vite 6.4.5, 2,091 modules transformed. | Build emits a 575.77 kB minified JS chunk and a non-blocking >500 kB warning. |
| Motion (`motion/react`) | IMPLEMENTED, NOT FULLY VERIFIED | `src/App.tsx`; multiple page components under `src/components/`; `package.json` | Imported for page transitions, animated panels, and navigation/UI motion. | Imports compiled in the successful Vite build; earlier browser UI inspection is documented in the implementation report. | No motion-specific automated behavior/accessibility test. |
| Lucide React | IMPLEMENTED, NOT FULLY VERIFIED | `src/components/**/*.tsx`; `package.json` | Supplies icon components used throughout the interface, including Hybrid Workflow controls. | Imports compiled in the successful Vite build. | No icon-specific tests are applicable; rendering was not separately asserted. |
| Google Fonts | IMPLEMENTED, NOT FULLY VERIFIED | `index.html:8-10`; `src/index.css:5-6,30-38`; `README.md:42` | Loads Fraunces, Newsreader, and Plus Jakarta Sans from Google Fonts when network access is available; CSS defines fallback fonts. | Source inspected and local production build passed. | External font retrieval was not network-tested in this audit and is optional to core application function. |
| scikit-learn runtime/library | DOCUMENTATION ONLY | Comment in `src/utils/crypto.ts:867-890`; no package or import in `package.json`/source | The comment says tokenization is “matching Scikit-Learn TfidfVectorizer”; actual inference is custom TypeScript. No scikit-learn library runs in the browser or test harness. | No scikit-learn test evidence; T-17–T-19 test the custom TypeScript function. | Do not claim the scikit-learn library is included or that the exact scikit-learn pipeline/model training is reproducible. |

## A. Confirmed Technology Stack

The following have source-code evidence in the current checkout:

- React 19 and React DOM mount the component application; TypeScript 5.8 supplies TS/TSX source and type-checking.
- Vite 6.4.5 builds the static app. Tailwind CSS 4 runs through the Vite plugin; authored CSS supplements its utility classes.
- React Context holds session/workbench state and theme state.
- Browser Web Crypto APIs implement AES-GCM, RSA-OAEP, SHA-256, PBKDF2, and random byte generation.
- Caesar and Vigenère are locally implemented classical ciphers.
- Hybrid encryption is AES-256-GCM per-record data encryption plus RSA-OAEP wrapping of the AES DEK.
- The phishing feature bundles a coefficient artifact and uses custom in-browser TF-IDF-style feature extraction plus logistic-regression inference.
- Motion and Lucide React are used for presentation/animation and icons. Google Fonts are referenced externally with CSS fallback fonts.
- Node.js, npm, the TypeScript compiler, Node's built-in `node:test`, and Vite are development/test/build tools. Node is not a production backend.

No backend, database, remote AI service, Python runtime, or scikit-learn runtime was found in the active application path.

## B. Unused Dependencies

No unnecessary direct dependency was confirmed in the current `package.json` after comparing imports, configuration, and scripts with `npm ls --depth=0`:

- `react`, `react-dom`: app rendering.
- `motion`: imported from `motion/react` for UI motion.
- `lucide-react`: icons.
- `tailwindcss`, `@tailwindcss/vite`: CSS generation and Vite integration.
- `@vitejs/plugin-react`: Vite React transform/refresh integration.
- `vite`: development server and production build.
- `typescript`: compiler/type check.
- `tsx`: Node test loader for TypeScript.
- `@types/node`: typing for Node test imports and globals.

The project therefore has no current `DEPENDENCY ONLY` finding among direct dependencies. The absence of an `scikit-learn` package is intentional evidence that only the algorithmic inference logic—not that Python package—is present. This is a usage audit, not an npm vulnerability audit.

## C. Documentation Inaccuracies and Qualifications

1. **Scikit-learn parity is not established.** `src/utils/crypto.ts:867-890` labels the section Scikit-Learn TF-IDF and says tokenization is “matching” `TfidfVectorizer`, but the implementation is custom TypeScript and no scikit-learn dependency, training script, or vectorizer configuration is included. Qualify the claim as “custom TF-IDF-style unigram/bigram feature extraction” unless parity and artifact provenance are documented.
2. **Caesar shift validation is weaker than its error text.** The function says a valid integer is required, but floors fractional values and does not reject infinity. The audit directly observed a fractional input being silently rounded down and `Infinity` producing NUL characters. T-02 checks only `NaN`. The ordinary integer shift algorithm is implemented and tested; broader invalid-input handling is not.
3. **Random nonce wording should not imply collision-proof uniqueness.** The code obtains a fresh random 96-bit nonce for each encryption, but it keeps no history/counter. T-09 checks a sample of only 30 outputs. Descriptions should say “fresh random nonce” and avoid implying uniqueness is deterministically guaranteed.
4. **AI metadata is not model provenance.** README and the project report correctly say the artifact declares 40 samples and 993 features and that independent metrics are absent. In presentations, describe 40 as the artifact's declared count, not independently verified training evidence or a validated accuracy claim.
5. **Historical audit findings are time-bound.** `PRE_SUBMISSION_GAP_ANALYSIS.md` describes the pre-implementation repository state and includes findings since fixed (hybrid routing, T-16, missing `npm test`, and prior documentation gaps). It is correctly named as a pre-submission snapshot; do not cite its findings as the final code state without this audit/implementation report.
6. **Verification results have different scopes.** The implementation report records an earlier browser Testing Center run of 22/22. This audit re-ran Node `npm test`, `tsc`, and Vite build, but did not re-run the browser matrix or a multi-browser/device matrix. Do not present the prior browser result as newly executed in this audit.
7. **TypeScript check qualification.** README accurately calls `npm run lint` a TypeScript check, but `tsconfig.json` has no `strict: true`; do not describe the current check as strict-mode type safety.

Other key architectural descriptions in `README.md` and `CipherSentinel_Web_Application_Project_Report.docx` match the active source: this is a frontend-only web app, the Vault/key state is volatile, the AI score is advisory and uncalibrated, and the static Vite build has no backend requirement. `index.html` also references Google Fonts, which the README discloses as an optional network dependency.

## D. Academic Explanation of Major Algorithms

### Caesar Cipher

Caesar shifts each A–Z letter by a constant key modulo 26; decryption applies the negative shift. CipherSentinel uses it to illustrate substitution and modular arithmetic in Crypto Lab. It is implemented by `caesarEncrypt`/`caesarDecrypt` in `src/utils/crypto.ts` and tested by T-01/T-02. It is not suitable for confidentiality because its tiny key space is trivially searched. Current input handling has the fractional/infinity limitation noted above.

### Vigenère Cipher

Vigenère repeats a keyword so each plaintext letter receives a varying Caesar shift. CipherSentinel uses it to demonstrate a polyalphabetic classical cipher. `vigenereEncrypt`/`vigenereDecrypt` in `src/utils/crypto.ts` advance the keyword over letters and preserve punctuation/case. T-03/T-04 test a round trip and invalid keyword. It remains breakable and is educational only.

### AES-256-GCM

AES is a symmetric block cipher; GCM combines counter-mode encryption with an authentication tag. CipherSentinel uses a 256-bit data key, random 96-bit nonce, and 128-bit tag. Optional AAD binds envelope metadata without encrypting it. The Web Crypto implementation is in `aesGcmEncrypt`/`aesGcmDecrypt`; T-05–T-08 and T-21 verify round trips and rejection after wrong-key/ciphertext/tag modification. GCM requires nonce discipline; randomness makes collisions unlikely, not impossible.

### RSA-3072 OAEP

RSA is the public-key component. CipherSentinel generates 3072-bit RSA-OAEP/SHA-256 key pairs and uses OAEP to protect only the small AES DEK, not the whole message. `generateRsaKeyPair`, `wrapAesKeyWithRsa`, and `unwrapAesKeyWithRsa` in `src/utils/crypto.ts` implement those operations. T-10/T-11 test matching-key recovery and wrong-key rejection; T-21 incorporates the same flow into a message envelope. Keeping RSA for key transport and AES for payload data is the hybrid design. Keys are currently extractable and session-held.

### Hybrid Encryption

Hybrid encryption combines symmetric bulk encryption with public-key key transport: create a random AES DEK and GCM nonce, encrypt the serialized subject/body, then encrypt (wrap) the DEK to the recipient's RSA public key. The recipient unwraps it with the private key and AES-GCM authenticates before returning plaintext. `createEncryptedEnvelope`, `validateEncryptedEnvelope`, and `decryptEncryptedEnvelope` are shared by Hybrid Workflow and Secure Vault. T-20–T-22 test schema validation, round trip/tampering, and plaintext-marker absence in envelope serialization. Current records and keys exist only in React memory.

### SHA-256

SHA-256 maps input bytes to a fixed 256-bit digest. CipherSentinel uses it for integrity comparisons, model-independent hash demonstrations, and RSA public-key fingerprints. `sha256` and `verifySha256` call Web Crypto `digest('SHA-256')`; T-13/T-14 check format, self-consistent verification, malformed digest rejection, and a sample avalanche effect. SHA-256 is not encryption and a plain digest does not authenticate who supplied a message. A known-answer test vector would make the automated correctness evidence stronger.

### PBKDF2-HMAC-SHA-256

PBKDF2 repeatedly derives key material from a passphrase and random salt, making passphrase guessing more expensive than a single hash. CipherSentinel derives the AES key that encrypts an exported PKCS#8 private-key file. The current code fixes the count at 100,000 and uses a random 16-byte salt; AES-GCM protects the file contents. `exportEncryptedPrivateKey`/`importEncryptedPrivateKey` are in `src/utils/crypto.ts`; T-12 tests matching/wrong passphrases and malformed/altered parameters. The current UI can export and verify an encrypted file but cannot restore the session key from it.

### TF-IDF Feature Extraction

TF-IDF weights terms by their frequency in a message and their inverse document frequency in a reference corpus. Here the code counts vocabulary-matched unigrams and bigrams, applies stored IDF values with sublinear term frequency, and L2-normalizes the vector. This converts message text into the numeric input consumed by the classifier. It is implemented in `tokenizeText` and `analyzeMessageForPhishing` in `src/utils/crypto.ts`, using arrays and vocabulary from `src/data/phishing_model.json`. T-17–T-19 cover only three fixed input conditions. No corpus or training process is supplied to reproduce the IDF values.

### Logistic Regression

Logistic regression forms a linear score from feature weights and an intercept, then applies a sigmoid to map the result to a bounded score. CipherSentinel uses this to rank message text into three fixed advisory bands. `analyzeMessageForPhishing` applies the stored coefficients/intercept and thresholds. T-17/T-18 check one high and one lower example, while T-19 checks empty input. No independent evaluation shows that the numeric score is calibrated or that these bands predict real-world outcomes.

## E. Final Conclusion

The team can confidently present CipherSentinel as a **frontend-only React/TypeScript/Vite educational web application** that uses Tailwind plus custom CSS, React Context, and browser Web Crypto APIs. Source and current automated runs support the claim that Caesar/Vigenère demonstrations, AES-256-GCM, RSA-3072 OAEP key wrapping, hybrid envelope encryption/decryption, SHA-256, and PBKDF2-based private-key export are implemented. Explain that the Vault and keys are session-only and that the Web Crypto use is not a security certification.

The team can also present a **small custom in-browser TF-IDF-style plus logistic-regression phishing-risk demo**, with carefully qualified limitations: the artifact declares 40 training samples, the implementation's scikit-learn parity/training provenance is not established, and no independent metrics or calibration exist. Do not claim production-grade, universally accurate, or scikit-learn-backed inference.

Testing claims should say that the current Node test command passed 23 checks (ID order plus T-01–T-22 scenarios), TypeScript checking passed, and Vite build passed with a chunk-size warning. Distinguish this from browser E2E coverage; the browser Testing Center result was recorded in the earlier implementation report and was not re-run in this audit. Do not claim the project is deployed, cross-browser certified, cryptographically certified, or supported by model-quality metrics.
