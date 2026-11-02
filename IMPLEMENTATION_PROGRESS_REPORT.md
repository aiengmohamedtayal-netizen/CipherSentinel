# CipherSentinel — Implementation Progress Report

**Date:** 2026-11-02  
**Workspace:** `D:\CRYPT`  
**Scope:** Audit-driven implementation only. Nothing was deployed or pushed.

## Summary

The critical hybrid workflow now renders and runs from both existing entry points. Hybrid envelopes use one schema and are decrypted by both the Hybrid Workflow and Secure Vault using RSA-OAEP key unwrap, the matching AES-GCM AAD, and tag verification. Modified ciphertext and malformed envelopes fail closed.

The T-01 through T-22 matrix now runs real assertions. T-16 checks the 128 KiB boundary, the displayed matrix and runtime cases are aligned, and the Node test command fails when any matrix assertion fails. Documentation now describes the actual frontend-only architecture, session-only storage, AI model limitations, static build, and key lifecycle. Unreferenced pollinator/rooftop content and unused dependencies were removed after import/reference checks.

**Ready for final QA:** Yes, for the implemented educational workflows.  
**Ready for final academic submission:** Not yet; presentation, broader viewport evidence, and empirical evaluation work remain.

## Audit Findings Addressed

| Audit finding | Changes and source files | Verification |
|---|---|---|
| **CRITICAL — Hybrid navigation reached an unrendered tab** | Added `HybridEncryptionPage` and rendered it for the `hybrid` tab. Crypto Lab’s “Launch Hybrid Workflow” and AI’s “Secure & Archive in Vault” now route to the screen; AI subject/body are staged for explicit user encryption. Files: `src/App.tsx`, `src/components/crypto/HybridEncryptionPage.tsx`, `src/components/crypto/CryptoLabPage.tsx`, `src/components/ai/PhishingDetectionPage.tsx`, `src/context/SessionContext.tsx`. | Browser checked both entry points. Empty required inputs keep encryption disabled. The AI action opens the workflow with its message fields prefilled. Automated T-21 verifies the hybrid round trip. |
| **CRITICAL — Vault decrypt did not match hybrid envelope construction** | Centralized envelope validation and RSA unwrap/AES-GCM decrypt in `src/utils/crypto.ts`; Vault now checks key ID, uses the matching private key and AAD, and shows errors instead of swallowing tamper failures. Files: `src/components/vault/SecureVaultPage.tsx`, `src/components/crypto/HybridEncryptionPage.tsx`, `src/utils/crypto.ts`. | Browser verified direct Hybrid decrypt, Vault decrypt, and rejection of a one-bit ciphertext modification with no plaintext shown. T-20 and T-21 cover malformed schema and hybrid tampering. |
| **HIGH — Vault data and shipped fixtures were described inaccurately** | Vault initial state is empty; the plaintext fixture field was removed from the record type; the Vault and Dashboard state explicitly that records are session-only. Files: `src/data/reportData.ts`, `src/types.ts`, `src/context/SessionContext.tsx`, `src/components/vault/SecureVaultPage.tsx`, `src/components/dashboard/DashboardPage.tsx`. | Browser showed the session-only notice, one real user envelope, and reset behavior after a fresh page load. T-22 checks that a raw plaintext marker and sensitive subject are absent from serialized envelope fields. |
| **CRITICAL — T-16 passed without an assertion; matrix text drifted from execution** | Replaced the old runner with `src/utils/securityTestSuite.ts`; aligned actions and expected results in `src/data/reportData.ts`; added `tests/security.test.ts` and `npm test`. Every case records failure on a thrown assertion. T-16 rejects payloads over 128 KiB. | Final `npm test`: 23/23 Node test cases passed (one ID-order assertion plus T-01 through T-22), 0 failed. Browser Testing Center: 22/22 passed, 0 failed. |
| **HIGH — AES-GCM nonce could be manually reused in Crypto Lab** | `aesGcmEncrypt` always creates a fresh 96-bit nonce; Crypto Lab makes the nonce read-only for encryption and retains it as an input for decryption. Optional AAD is omitted from Web Crypto parameters when absent, fixing browser failures in T-06–T-08. Files: `src/utils/crypto.ts`, `src/components/crypto/CryptoLabPage.tsx`. | T-05 and T-09 passed. Browser Testing Center passed wrong-key, modified-ciphertext, and altered-tag tests T-06–T-08 after the optional-AAD fix. |
| **HIGH — Private-key export accepted unsafe envelope parameters** | Added strict format, Base64, field-length, key-ID, payload-size, and fixed-iteration validation. New v2 exports authenticate metadata as AAD; bounded v1 decoding is retained. Export passphrases require 12 characters; the UI clears passphrases and compares recovered PEM without retaining it in React state. Files: `src/utils/crypto.ts`, `src/types.ts`, `src/components/keys/KeyManagerPage.tsx`. | T-12 verifies a matching-passphrase round trip and rejects malformed key data, wrong passphrase, excessive iteration values, and modified authenticated metadata. Browser checked export, v2 output, decrypt confirmation, and clearing both passphrase fields. |
| **HIGH — Sensitive-key and plaintext handling could be misread as production protection** | Key Manager copy now states that the AES key is visible, browser memory is not protected custody, and refresh or RSA-key regeneration makes existing records undecryptable. README and project report document no persistence or UI restore/import path. Files: `src/components/keys/KeyManagerPage.tsx`, `README.md`, `CipherSentinel_Web_Application_Project_Report.docx`. | Reviewed against React state, export, and Vault implementation. This is a disclosure and lifecycle improvement; keys remain extractable and visible by design for the educational demo. |
| **HIGH — AI quality and “calibrated” claims were unsupported** | Replaced “probability” and benchmark wording with uncalibrated score and example wording; documented 40 declared training samples, 993 features, fixed advisory thresholds, ASCII feature limits, and missing independent metrics. Added a 10,000-character UI limit and changed the archive recommendation to session-only wording. Files: `src/components/ai/PhishingDetectionPage.tsx`, `src/utils/crypto.ts`, `src/data/reportData.ts`, `src/components/dashboard/DashboardPage.tsx`, `README.md`, project report. | Source and artifact reviewed. T-17–T-19 verify only fixed sample behavior; documentation explicitly says these are not model-quality measurements. |
| **MEDIUM — SHA-256 expected digest validation was permissive** | `verifySha256` now requires exactly 64 hexadecimal characters (allowing surrounding whitespace) and rejects malformed input. Removed the unused permissive `hexToBytes` helper. Files: `src/utils/crypto.ts`, `src/data/reportData.ts`, `src/utils/securityTestSuite.ts`. | T-13 verifies a matching digest and rejects a 63-character expected value. |
| **MEDIUM — Testing descriptions overstated model performance** | Testing Center description now names the actual coverage: crypto negatives, envelope validation, and example phishing classifications. File: `src/components/testing/TestingCenterPage.tsx`. | Browser run showed the updated T-01–T-22 descriptions and results. |
| **MEDIUM — Compact navigation hid Key Manager and Testing Center at medium widths** | Kept the compact five-item navigation and moved the hamburger/dropdown breakpoint to `xl`, exposing all seven workspaces at medium widths. File: `src/components/Navbar.tsx`. | At the medium-width browser viewport, the menu exposed both Key Manager and Testing Center; the Testing Center opened and ran. A full phone/tablet/desktop matrix is still pending. |
| **LOW/MEDIUM — Stale metadata, environment settings, and unrelated content** | Renamed the npm package to `ciphersentinel` v1.0.0, moved Vite plugins to dev dependencies, removed confirmed-unused GenAI, Express, dotenv, d3-geo and related packages, removed the stale Bun lockfile and unused `.env.example`, deleted the empty root `index.css`, and simplified Vite config. Removed unreferenced pollinator/rooftop components and assets plus an unreachable settings modal that contained mock key metadata. Files: `package.json`, `package-lock.json`, `metadata.json`, `vite.config.ts`, `src/data/reportData.ts`, `src/components/Navbar.tsx`, and deleted unreferenced components/assets. | Confirmed no active imports/references before deletion. `npm run lint`, `npm test`, and `npm run build` pass after cleanup. The untracked `Thmanyah-Font-Family/` directory was not modified; it is not referenced by the application. |
| **HIGH — README and course report described a different architecture** | Rewrote README for the frontend-only application and updated `CipherSentinel_Web_Application_Project_Report.docx` from a proposed backend plan into a factual implementation report with tested behavior and remaining work. | Searched the updated docs for stale FastAPI/SQLite, not-run, and placeholder results; none remain. |

## Implemented Behavior

- Hybrid plaintext payload is validated and limited to 128 KiB, encrypted with a fresh AES-256-GCM DEK and nonce, then the DEK is wrapped to the active RSA-3072 OAEP/SHA-256 public key.
- The versioned envelope uses a generic visible subject and binds record/key identifiers as AES-GCM AAD. The matching private key must be active to decrypt.
- Hybrid screen and Secure Vault use the same envelope validator and decrypt helper. Authentication failure returns no plaintext.
- AI “Secure & Archive” stages the message in React memory; the user then explicitly encrypts and adds it to the session vault.
- The Vault is empty at startup. Records and keys remain in current-tab memory and disappear on refresh or close. Regenerating the RSA key also makes existing records undecryptable.
- T-01–T-22 are stable across the initial matrix, runtime runner, Node tests, and browser Testing Center. The Node suite uses Node’s built-in test runner; it is not a browser E2E framework.

## Verification Results

- `npm test` — **23 passed, 0 failed**. This includes one test verifying matrix IDs/order plus 22 scenario assertions. Final observed run completed in about 0.63 seconds; timing varies.
- `npm run lint` — **passed** (`tsc --noEmit`).
- `npm run build` — **passed**. Vite emitted `dist/`; the main JavaScript chunk is 575.77 kB minified (158.89 kB gzip), above Vite’s 500 kB warning threshold.
- Browser Testing Center — **22/22 passed, 0 failed** in the latest local run.
- Manual browser smoke checks — hybrid launch, required-field behavior, encrypt/decrypt, Vault decrypt, tamper rejection, AI staging, Key Manager export/decrypt, and medium-width navigation were observed.
- `git diff --check` — no whitespace errors. Git emitted only line-ending normalization warnings for edited text files.

An early browser run failed T-06–T-08 because the optional AES-GCM `additionalData` property was passed as `undefined`. The crypto parameter object now adds AAD only when present; the final Node and browser matrix runs pass those cases.

## Remaining Issues and Limitations

1. **Presentation:** the course presentation and demo slides remain to be created in a separate phase.
2. **AI evaluation:** model dataset provenance and independent precision, recall, F1, confusion-matrix, and threshold evaluation are not in the repository. The current classifier is a small educational advisory model only.
3. **Final GUI evidence:** inspect and capture screenshots at phone, tablet, and desktop widths. Only the affected medium-width navigation and workflow controls were manually checked here.
4. **Browser automation:** `npm test` and the in-app matrix are automated, but no persistent Playwright/Cypress browser regression suite or CI workflow is configured. The browser workflow checks above were manual interactions.
5. **Key lifecycle and storage:** there is no durable Vault, key import/restore UI, or recovery of records after refresh. Browser memory, visible keys, clipboard contents, and scripts are not production-grade secret custody.
6. **Error polish:** clipboard/download permission failures and some lower-priority validation/error states in other modules remain for final QA.
7. **Deployment smoke test:** static build readiness was verified, but no host/path was selected or tested. Root hosting over HTTPS is the documented deployment target; subdirectory hosting needs a Vite `base` setting.
8. **Bundle size:** the build succeeds with a non-blocking chunk-size warning; code splitting can be considered after final behavior QA.
9. **Workspace-specific dev server issue:** during shutdown of the local Vite session, its watcher exited with `EBUSY` on `Thmanyah-Font-Family/دليل جماليات خط ثمانية.pdf`, a pre-existing untracked folder with no application references. The folder was left untouched as user data. This did not affect the production build; verify `npm run dev` in the submission checkout if that folder is copied alongside the repository.

## Final QA Readiness

The application is ready for a focused final QA pass of its implemented educational workflows. It is not ready for final academic submission until the presentation, full viewport evidence, and the course-required evaluation evidence are addressed or explicitly scoped with the instructor. No deployment or GitHub push was performed.
