# CipherSentinel — Pre-Submission Gap Analysis

**Audit date:** 2026-11-02  
**Repository:** `aiengmohamedtayal-netizen/CipherSentinel` (checked-out workspace `D:\CRYPT`)  
**Scope:** Source, documentation, configuration, existing test runner, and static production build. No application source was changed and nothing was deployed or pushed.

## Rating guide

- **CRITICAL** — core project flow is unavailable or a claim creates a serious trust/security problem.
- **HIGH** — substantial correctness, security, or submission-evidence gap.
- **MEDIUM** — material limitation or incomplete supporting behavior.
- **LOW** — cleanup or deployment/documentation improvement with limited direct impact.
- **COMPLETE** — implemented and confirmed by the available code or checks; does not imply production certification.

“Blocks final submission” refers to an academic submission that claims the described behavior and results. A finding can be blocking even where a limited demo still runs.

## 1. Executive Summary

CipherSentinel is a browser-based React + TypeScript + Vite application. Its main cryptographic primitives are implemented with the browser Web Crypto API, and the core GUI contains the seven named screens. The TypeScript check and Vite production build passed during this audit. A direct one-time execution of the in-app T-01–T-22 test runner, using Node’s Web Crypto API through a browser-global shim, returned 22 Passed statuses.

The repository is **not ready for final academic submission as currently described**. The principal user journey is broken: the hybrid launch and AI “Secure & Archive” actions select a `hybrid` tab, but `App.tsx` does not render a view for that tab. In addition, the vault’s UI decryption path does not unwrap RSA-wrapped DEKs or supply the AAD used when creating hybrid envelopes. The test screen overstates what its matrix proves: T-16 hard-codes a pass for an empty-input case, the runtime cases do not match the checked-in T-01–T-22 descriptions, and there is no conventional test command or automated browser coverage.

Several README statements are inconsistent with the implementation. This is a **web application**, not a desktop application. Vault records and keys are held in React state and are lost on refresh; this is volatile session state, not persistent encrypted storage. Three demo records contain plaintext fields and illustrative, non-authentic cryptographic values in the shipped source. The bundled AI model performs local inference, but its artifact declares only 40 training samples and no independent evaluation metrics are supplied; “calibrated” and broad reliability claims are unsupported.

The supplied course handout requires classical and modern cryptography, hashing, public-key cryptography, a functional GUI, one working AI security feature, positive and negative tests with correctness/performance evaluation, a report, and a presentation. The repo covers the algorithm categories and has an actual advisory classifier, but the end-to-end GUI workflow is incomplete, evidence is not submission-ready, the report is explicitly a plan with placeholders, and no presentation file was found.

## 2. Repository Health

### Findings

#### [HIGH] Project README describes the product as a desktop application

- **Evidence:** `README.md:1-11` calls CipherSentinel a “desktop security workbench”; `src/App.tsx:1-4` and `package.json:5-12` identify a React/Vite frontend and Vite dev/build/preview scripts. The supplied project report describes the app as browser-based.
- **Why it matters:** This contradicts the actual deliverable and the report, and can mislead assessors about installation, runtime, and architecture.
- **Recommended action:** Rewrite the README around a browser-based, frontend-only web app. Remove claims of server, desktop, or offline behavior unless each is carefully qualified and demonstrated.
- **Blocks final submission:** Yes, until the README and report describe the same implemented product.

#### [HIGH] README and in-product copy overstate vault storage, confidentiality, and workflow behavior

- **Evidence:** `README.md:17` claims messages are archived in encrypted envelopes containing only cryptographic fields. `src/data/reportData.ts:282-332` initializes three records with a `decryptedPlaintext` field and illustrative ciphertext/tag/key data. `src/context/SessionContext.tsx:45,100-109` keeps records only in React state. `src/components/vault/SecureVaultPage.tsx:145` does say records disappear on refresh, but its “Zero Plaintext In Storage” heading is broader than the actual fixture behavior.
- **Why it matters:** The user-facing product does not persist user records, and bundled demo fixtures contain plaintext in the application source/bundle. The current wording conflates volatile UI state with encrypted-at-rest storage and makes an inaccurate zero-plaintext claim.
- **Recommended action:** Clearly label fixtures as illustrative and non-decryptable; do not present them as real protected records. Describe user-created records as in-memory session records and limit any no-plaintext claim to the actual user-record envelope fields. Align the README, UI labels, report, and demo script.
- **Blocks final submission:** Yes if the submission claims persistent encrypted storage or zero plaintext in the shipped application.

#### [MEDIUM] Repository contains unrelated legacy application content and unused packages

- **Evidence:** The active shell in `src/App.tsx:7-15,26-32` imports only the dashboard, crypto, AI, integrity, vault, key, and testing screens. Unreferenced top-level components include `HeroSection.tsx`, `LondonPollinatorMap.tsx`, `FoodSharingSection.tsx`, `RooftopCalculator.tsx`, and several pollinator/climate sections; the root listing also contains unrelated pollinator imagery. `package.json:14-35` declares `@google/genai`, `express`, `dotenv`, `@types/express`, and `tsx`, with no corresponding application/server/test script usage found. Vite is listed in both dependencies and devDependencies.
- **Why it matters:** This resembles a mixed or repurposed repository, increases review noise and bundle/supply-chain surface, and leaves confusing unused configuration.
- **Recommended action:** Identify and remove unrelated legacy files and dependencies in a separately reviewed cleanup; retain only packages required by this app. Do not remove any code until its use is confirmed.
- **Blocks final submission:** No by itself; yes if the assessor interprets the repository as containing another project or expects a focused deliverable.

#### [LOW] Package and development metadata are generic or stale

- **Evidence:** `package.json:2-4` identifies the project as `react-example` version `0.0.0`; `.env.example:1-8` says Gemini and `APP_URL` are required and injected by AI Studio, while no app source reads those variables or imports the GenAI SDK. `vite.config.ts:10-17` contains AI Studio-specific HMR behavior. `index.css` at repository root is empty; the app imports `src/index.css` in `src/main.tsx`.
- **Why it matters:** Generic metadata and unused AI Studio setup confuse installation and make the project appear to require secrets or a backend when it does not.
- **Recommended action:** Set the package name/version to the project’s actual identity; remove or accurately document unused environment variables and AI Studio-specific comments/configuration. Remove the empty root stylesheet if it is not intentionally retained.
- **Blocks final submission:** No.

#### [COMPLETE] Core frontend build and type check succeed

- **Evidence:** `package.json:7-12` defines `npm run lint` as `tsc --noEmit` and `npm run build` as `vite build`. Audit execution: `npm run lint` exited 0; `npm run build` exited 0 with 2,090 modules transformed and output emitted to `dist/`.
- **Why it matters:** The checked-in application is type-checkable and can produce a static frontend bundle in this environment.
- **Recommended action:** Keep these commands in the submission verification record. Address or consciously accept the large-chunk warning described in section 8.
- **Blocks final submission:** No.

## 3. Functional Completeness Matrix

| Module | Implemented and verified by source | Missing, broken, or limited behavior | Rating / blocks? |
|---|---|---|---|
| **Dashboard** | Registered in the app shell; dashboard cards link to the other modules and show session/demo data (`src/App.tsx:26-32`; `src/components/dashboard/DashboardPage.tsx:22-55,150-306`). | It is a session/demo overview, not durable telemetry. Dashboard claims and counts should distinguish demo fixtures from actual user activity. No browser viewport or interaction acceptance pass was performed. | **MEDIUM** — clarify data provenance; not independently blocking. |
| **Crypto Lab** | Caesar, Vigenère, AES-GCM, RSA-OAEP key wrapping, and SHA-256 operations are wired to utility functions; inputs, outputs, tamper, copy/export controls exist (`src/components/crypto/CryptoLabPage.tsx:151-320,554-765`). | “Launch Hybrid Workflow” selects an unrendered `hybrid` tab (`:348`); there is no integrated archive flow from this screen. AES permits a user-supplied nonce, so safe nonce reuse is not enforced. Clipboard/download errors are not handled. | **CRITICAL** hybrid action blocks the advertised workflow. Other issues **MEDIUM**. |
| **AI Phishing Detection** | Calls local `analyzeMessageForPhishing`, offers samples, shows score/band/indicators, and has a Secure & Archive control (`src/components/ai/PhishingDetectionPage.tsx:21-63`). | “Secure & Archive” stages message text and selects `hybrid`; the tab is not rendered and the staged value is not consumed by any screen (`src/context/SessionContext.tsx:49,113-114`; `src/App.tsx:26-32`). Thus it does not archive a message. Empty text is silently ignored; no maximum length or prediction error boundary is present. | **CRITICAL** archive action blocks advertised AI-to-vault workflow. Model quality limits are in section 5. |
| **Hash & Integrity** | SHA-256 generation and comparison, plus avalanche/tamper demonstrations, are connected to Web Crypto (`src/components/integrity/HashIntegrityPage.tsx:19-99`; `src/utils/crypto.ts:190-216`). | Expected digests are normalized by stripping non-hex characters and are not required to be exactly 64 hex characters (`src/utils/crypto.ts:200-213`). Clipboard errors are unhandled. “Avalanche” on a sample illustrates one measurement; it is not a general integrity/authenticity guarantee. | **MEDIUM** — clarify and validate digest input. |
| **Secure Vault** | Lists/searches/filters records, simulates ciphertext modification, reveals plaintext after a local decrypt call for compatible records, supports delete (`src/components/vault/SecureVaultPage.tsx:25-110,145-197,206-316`). User records live in React state. | The decrypt handler calls raw AES-GCM with the active standalone AES key (`:54-75`), while `createEncryptedEnvelope` creates a fresh DEK, RSA-wraps it, and binds record/key IDs as AAD (`src/utils/crypto.ts:670-727`). Vault UI does not unwrap the DEK or pass AAD. Preloaded fixtures are illustrative and not valid real envelopes. No record survives refresh. | **CRITICAL** does not implement the documented hybrid archive/decrypt workflow; **HIGH** if claimed as persistent encrypted vault. |
| **Key Manager** | Generates RSA-3072 pair, exports public PEM, encrypts private PEM using PBKDF2-HMAC-SHA-256 + AES-GCM, downloads JSON, and tests passphrase decryption (`src/components/keys/KeyManagerPage.tsx:52-135`; `src/utils/crypto.ts:405-438,526-642`). AES session key is displayed/copyable (`KeyManagerPage.tsx:378-430`). | No UI flow imports an encrypted private-key export into the active key state; test decrypt only stores/displays the recovered PEM. The export passphrase is not explicitly cleared after use, and decrypted PEM remains in component state until replaced/unmounted. Error handling around clipboard and downloads is missing. | **HIGH** for recoverable key lifecycle; **MEDIUM** for secret lifetime/UI exposure. |
| **Testing Center** | Shows pending/executed status and has a button that calls the runtime test suite (`src/components/testing/TestingCenterPage.tsx:21-80`; `src/context/SessionContext.tsx:116-127`). The runner executed in this audit; see section 6. | Runner test labels/expectations differ from the checked-in initial matrix; T-16 is an unconditional pass; T-22 evidence overstates its timing method/runtime. No browser UI automation or persistent test reports exist. | **HIGH** — correct the false pass and submit reproducible evidence. |

### Cross-module interaction findings

#### [CRITICAL] Hybrid navigation and AI-to-vault “Secure & Archive” route to a blank/unrendered view

- **Evidence:** `src/types.ts:8` includes `'hybrid'`; `src/context/SessionContext.tsx:113-114` stages the message and sets that tab; `src/components/crypto/CryptoLabPage.tsx:348` does the same from “Launch Hybrid Workflow”; `src/App.tsx:26-32` has no `activeTab === 'hybrid'` branch.
- **Why it matters:** Two visible primary controls navigate away from all rendered page content. The AI message is never encrypted or added to the vault, so the advertised project journey is not functional.
- **Recommended action:** Implement the intended in-app hybrid screen and consume staged input, or redirect the actions to an existing complete workflow; then verify the encrypt → add record → vault decrypt round trip in a browser. Keep the existing visual design.
- **Blocks final submission:** Yes.

#### [HIGH] Error and input handling are uneven across feature controls

- **Evidence:** AI handler returns without feedback for blank body (`src/components/ai/PhishingDetectionPage.tsx:42-52`); there is no message-size guard in `analyzeMessageForPhishing` (`src/utils/crypto.ts:764-868`). Clipboard calls lack rejection handling in `KeyManagerPage.tsx:52-56`, `CryptoLabPage.tsx:307-311`, `SecureVaultPage.tsx:99-104`, and `HashIntegrityPage.tsx:95-99`. `SecureVaultPage.tsx:78-97` catches tamper errors and silently ignores them.
- **Why it matters:** Users may not know an operation failed, oversized content can consume UI/model resources, and browser permission failures can create unhandled promise rejections.
- **Recommended action:** Add user-visible, bounded validation and consistent errors; handle clipboard/download capability failures; make tamper simulation report failures instead of swallowing them.
- **Blocks final submission:** No alone; some are required to substantiate “reliable error handling.”

#### [MEDIUM] Responsive styles exist, but responsive behavior has not been verified

- **Evidence:** Screen components use Tailwind breakpoints (`sm:`, `md:`, `lg:`), e.g. `src/components/crypto/CryptoLabPage.tsx:350-385,525-554` and `src/components/testing/TestingCenterPage.tsx:66-80,180-220`. No browser automation or viewport test configuration is present in `package.json` or tracked files.
- **Why it matters:** Responsive classes are evidence of intent, not proof that seven screens, menus, dialogs, long ciphertext, and tables work at phone/tablet widths.
- **Recommended action:** Perform and record manual browser checks at phone, tablet, and desktop widths; include screenshots for the report/presentation. Do not claim verified responsive behavior before doing so.
- **Blocks final submission:** No, but GUI usability evidence is expected.

## 4. Security Findings

#### [COMPLETE] Web Crypto implementations for the core primitives are present

- **Evidence:** AES-GCM uses 32-byte keys, a default random 12-byte nonce, a 128-bit tag, and Web Crypto encrypt/decrypt (`src/utils/crypto.ts:228-240,251-325,329-375`). RSA-OAEP uses modulus length 3072, exponent 65537, and SHA-256 (`:405-438`). SHA-256 uses `crypto.subtle.digest` (`:190-197`). Private export uses a random 16-byte salt, random 12-byte nonce, PBKDF2-HMAC-SHA-256 at 100,000 iterations, and AES-256-GCM (`:526-589`). GCM decryption rejects errors before returning plaintext (`:329-375`).
- **Why it matters:** These are real browser cryptographic APIs and the source establishes the selected algorithms/parameters. This confirms implementation presence, not independent certification or complete application security.
- **Recommended action:** Preserve these source implementations during this audit; document their actual scope and limitations. Add the parameter/negative-case evidence to the final project report.
- **Blocks final submission:** No.

#### [CRITICAL] Vault UI decryption does not match the hybrid envelope construction

- **Evidence:** `src/utils/crypto.ts:670-727` generates a fresh AES DEK, encrypts with AAD `record_id=…;key_id=…`, RSA-wraps the DEK, and later unwraps it and reuses that AAD. `src/components/vault/SecureVaultPage.tsx:54-75` instead passes `activeAesKeyB64` directly to `aesGcmDecrypt` and does not supply AAD or RSA unwrap.
- **Why it matters:** The UI cannot correctly decrypt envelopes produced by the advertised hybrid function. The implemented test T-11 calls `decryptEncryptedEnvelope` directly and therefore does not exercise the vault UI path. Its pass is not proof that the visible vault works.
- **Recommended action:** Make the vault’s actual decrypt path use the envelope’s wrapped DEK, matching private key, and authenticated AAD, and add a browser-level round trip using a real record. Do not describe the vault flow as verified before that.
- **Blocks final submission:** Yes.

#### [HIGH] Private and symmetric key material is extractable and exposed in frontend memory/UI

- **Evidence:** RSA key generation requests extractable keys and exports private PKCS#8 PEM (`src/utils/crypto.ts:405-423`). AES keys are generated/exported as raw Base64 (`:228-237,276-282`); key manager renders the active AES key and offers copy (`src/components/keys/KeyManagerPage.tsx:378-430`). `ActiveRsaKeyPair` stores `privateKeyPem` in React state (`src/types.ts:42-51`; `src/context/SessionContext.tsx:28-80`).
- **Why it matters:** “Volatile” does not mean protected from scripts, extensions, devtools, screenshots, shoulder-surfing, or component-state exposure. The implementation intentionally makes secrets inspectable for an educational demo, so it should not be described as suitable for production secret custody.
- **Recommended action:** State clearly that key protection is demonstrative and browser-local; avoid production-security claims. Document key exposure and lifecycle limitations, and clear sensitive UI state where feasible after use.
- **Blocks final submission:** Yes if claiming production-grade or protected key management; otherwise disclose as a limitation.

#### [HIGH] AES-GCM nonce reuse is not prevented when users supply a nonce

- **Evidence:** `src/utils/crypto.ts:251-296` accepts `providedNonceB64` and uses it after checking only its 12-byte length; `CryptoLabPage.tsx:641-659` exposes editable nonce input and allows encryption with it.
- **Why it matters:** The default path generates a random nonce, but the GUI can encrypt repeatedly with the same key and manually reused nonce. GCM nonce reuse under one key can compromise confidentiality and authentication.
- **Recommended action:** Keep manual nonce input explicitly educational and warn/block duplicate reuse, or make fresh random generation mandatory for encryption. Add a negative/UI test for repeat use under a key.
- **Blocks final submission:** Yes if the lab is presented as safe message encryption; disclose or correct before demonstrating.

#### [HIGH] Protected private-key envelope accepts unvalidated attacker-controlled parameters

- **Evidence:** `src/utils/crypto.ts:591-642` imports an envelope without schema/size/iteration bounds and uses `envelope.iterations || 100000` directly in PBKDF2; `format`, salt/nonce lengths, ciphertext/tag lengths, and iteration range are not validated. Export accepts any passphrase of eight characters (`:531-533`) and fixes PBKDF2 to 100,000 (`:548-559`).
- **Why it matters:** A tampered export may request an extreme PBKDF2 cost and freeze or exhaust browser resources, or use a reduced iteration count. An eight-character minimum alone does not establish passphrase strength. The unauthenticated format/key metadata can also be altered.
- **Recommended action:** Validate exact envelope format and binary field lengths; enforce an accepted iteration range before derivation; authenticate relevant metadata; select and justify a current work factor and passphrase policy. Keep compatibility behavior documented.
- **Blocks final submission:** Yes if claiming a robust protected-key export feature; otherwise report as a known limitation.

#### [HIGH] Plaintext appears in shipped demonstration fixtures

- **Evidence:** `src/data/reportData.ts:282-332` initializes fixtures with `decryptedPlaintext` containing a wire instruction, credential-harvesting description, and compliance claim. `src/types.ts:31` permits that property. The records are imported into the initial vault state (`src/context/SessionContext.tsx:3,45`).
- **Why it matters:** The README’s assertion that plaintext is never stored at rest is not literally true for shipped source/bundle data, and the demo fixtures’ ciphertext/tag/base64 fields are not evidence of real encryption. A user may mistake seeded sample content for authenticated protected records.
- **Recommended action:** Mark fixtures as synthetic and non-cryptographic or replace them with real envelopes generated for the demo; remove sensitive-sounding realistic account/transfer content. Correct storage claims.
- **Blocks final submission:** Yes if making a zero-plaintext or real-encrypted-fixture claim.

#### [MEDIUM] Key lifecycle has no import/recovery path and no explicit memory clearing

- **Evidence:** `src/context/SessionContext.tsx:48-80` creates fresh keys on app start and stores PEM strings in state; `src/components/keys/KeyManagerPage.tsx:94-135` encrypts/decrypts an export only to test it; no handler imports the recovered key into active state. Vault state is initialized from fixtures and is in-memory (`SessionContext.tsx:45`).
- **Why it matters:** After refresh, the previous private key and records are lost, so an exported key cannot restore prior records through the UI. Sensitive strings and decrypted output persist in React state for the lifetime of the component/session.
- **Recommended action:** Document that exports are demonstrative and current records cannot be recovered after refresh; for a functional key lifecycle, implement and verify a key import/selection/recovery flow without adding a backend or database.
- **Blocks final submission:** Yes if claims key recovery or durable archive; otherwise disclose.

#### [MEDIUM] Helper validation is permissive for digest and key encodings

- **Evidence:** `verifySha256` strips all non-hex characters from supplied expected digest and does not require exactly 64 hex characters (`src/utils/crypto.ts:200-213`). `hexToBytes` silently removes non-hex input (`:24-31`); `base64ToBytes` delegates to `atob` after whitespace/header removal (`:43-54`).
- **Why it matters:** Invalid inputs can be silently transformed into different values, weakening user understanding and making malformed input behavior inconsistent.
- **Recommended action:** Validate format and length explicitly at UI and utility boundaries and show a clear error for malformed digests/encodings.
- **Blocks final submission:** No alone.

#### [COMPLETE] No backend, database, localStorage, or sessionStorage use was found in the active app

- **Evidence:** Active app behavior is wired through React state (`src/context/SessionContext.tsx:45-49,100-127`); the only storage-key constant is declared but unused in `src/context/ThemeContext.tsx:13-38`; source scan found no application `localStorage` or `sessionStorage` reads/writes. No backend service entry point or database configuration is present in tracked source.
- **Why it matters:** This matches the user’s frontend-only constraint, but means vault persistence must not be implied.
- **Recommended action:** Describe the app as in-memory/browser-local. Keep secrets out of browser persistence unless a future, separately designed frontend-only storage feature is explicitly added.
- **Blocks final submission:** No.

## 5. AI Feature Findings

#### [COMPLETE] The AI screen executes an actual local inference path

- **Evidence:** `src/components/ai/PhishingDetectionPage.tsx:21-27,42-52` calls `analyzeMessageForPhishing`; `src/utils/crypto.ts:727-868` tokenizes lowercased ASCII text into unigrams/bigrams, looks up vocabulary indices and IDF values, L2-normalizes weighted features, computes a coefficient dot product plus intercept, then applies a logistic sigmoid and maps the score to three bands. Model data is statically imported from `src/data/phishing_model.json` via `src/data/phishing_model.ts`.
- **Why it matters:** This is implemented browser-side inference, not a placeholder or remote API call.
- **Recommended action:** Describe it precisely as a small local, advisory TF-IDF/logistic-regression classifier and include its test/data limitations.
- **Blocks final submission:** No; the implementation satisfies the minimum “working AI feature” category, subject to workflow and evidence gaps below.

#### [HIGH] Model quality and “calibrated” thresholds are unsupported by evaluation evidence

- **Evidence:** `src/data/phishing_model.json` declares `trainedSamples: 40`, `numFeatures: 993`, a vocabulary, IDF values, coefficients, and intercept. `src/utils/crypto.ts:833-845` hard-codes bands at `<0.35`, `<=0.70`, and `>0.70`; no training script, dataset, held-out split, calibration routine, confusion matrix, precision/recall/F1, or validation report was found. README calls the thresholds “calibrated” (`README.md:26`).
- **Why it matters:** Logistic sigmoid output is not by itself a calibrated probability. A few hand-picked examples cannot support claims of accuracy or zero false alarms, and the small declared training set limits generalization.
- **Recommended action:** Remove “calibrated” and accuracy-like claims; document training-data provenance and the model’s narrow scope. Evaluate on a documented held-out labeled set and report precision, recall, F1, confusion matrix, and threshold rationale if available. Call the value an estimated score until calibration is demonstrated.
- **Blocks final submission:** Yes if the report claims measured quality or reliable general detection; otherwise disclose it as an educational prototype.

#### [MEDIUM] Inference has narrow text handling and no size/model integrity validation

- **Evidence:** `tokenizeText` replaces everything except ASCII letters/digits/whitespace and only forms adjacent word bigrams (`src/utils/crypto.ts:748-757`). `analyzeMessageForPhishing` accepts arbitrary-length text and trusts imported arrays/indices (`:764-868`). Whitespace-only input is treated like a low-risk result (`:765-780`), while the UI silently declines empty-body analysis (`PhishingDetectionPage.tsx:42-43`).
- **Why it matters:** Non-English text, Unicode/obfuscation, URLs and punctuation patterns are poorly represented; a low score can mean “no known token matched,” not “safe.” Large pasted content can block the main UI thread.
- **Recommended action:** State supported input and model limits; distinguish empty/unsupported input from low risk; add a reasonable input limit and artifact consistency checks; keep the classifier advisory and require human review.
- **Blocks final submission:** No by itself; the warning and documented limitations are required.

## 6. Testing Assessment

#### [HIGH] Runtime test matrix and documented T-01–T-22 matrix do not describe the same cases

- **Evidence:** `src/data/reportData.ts:337-536` initializes the UI matrix with items such as T-09 “generate 30 successive nonces,” T-12 malformed RSA key, T-13 digest length, T-15 empty input, and T-16 oversized input. `src/utils/crypto.ts:882-1361` instead runs T-09 RSA wrap/unwrap, T-12 a SHA-256 known vector, T-15 one benign AI sample, T-16 empty AES input, and other shifted/redefined cases. The Testing Center initially shows the former and replaces them with the latter after a run (`src/context/SessionContext.tsx:45-46,116-127`).
- **Why it matters:** Test IDs and expected results are not stable. Assessors cannot map the visible run to the project report, and some report requirements appear tested when a different scenario was actually run.
- **Recommended action:** Choose one authoritative matrix, align test IDs/actions/expectations/evidence across report and code, and make the UI describe actual executions only.
- **Blocks final submission:** Yes.

#### [CRITICAL] T-16 always reports Passed, even when empty plaintext encryption succeeds

- **Evidence:** `src/utils/crypto.ts:1210-1224` attempts `aesGcmEncrypt('')` and sets `errorCaught`, but does not use that value; result status is the literal `'Passed'`. AES-GCM accepts empty plaintext, so the function does not reject the case. The evidence string says validation occurred when none exists.
- **Why it matters:** This is a fabricated pass and directly conflicts with the requirement not to misrepresent test outcomes. The runner’s 22/22 result includes a false-positive status.
- **Recommended action:** Change the expected behavior/test to match the intended empty-input policy and compute the status from an assertion that actually checks it. Re-run and retain the output.
- **Blocks final submission:** Yes.

#### [MEDIUM] Some tests are narrow, weak, or mislabeled

- **Evidence:** T-14/T-15 are single fixed phishing examples (`src/utils/crypto.ts:1171-1207`); T-13 accepts 40–60% avalanche change while its text says ~45–55% (`:1148-1168`); T-22 sums prior `duration_ms` values then measures only the reduction operation and writes “WebAssembly/Web Crypto runtime” (`:1339-1355`). T-16’s empty-input behavior is separately described above. The test suite has no parameterized/property-based runs.
- **Why it matters:** These cases do not establish classifier performance, comprehensive correctness, or stable end-to-end latency. Timing labels are not a reproducible benchmark methodology.
- **Recommended action:** Add meaningful assertion coverage for empty/malformed/oversized input, malformed RSA/envelope inputs, vault UI workflow, and broader AI examples. Report environment, repeated-run method, distributions, and actual timing source. Do not imply that these test cases alone establish security.
- **Blocks final submission:** Yes for test/performance claims; not for a clearly labeled demo.

#### [COMPLETE] The in-app test runner executed successfully once in this audit, with a qualification

- **Evidence:** `src/utils/crypto.ts:882-1361` defines the runner. Audit command `node --import tsx --input-type=module -e …` supplied `window.crypto` from Node Web Crypto plus `btoa`/`atob` globals and invoked `executeSecurityTestSuite()`. It returned 22 records, 22 labeled Passed, no thrown error; RSA and random nonce values/durations varied as expected. This is one local Node shim run, not a browser run or CI result. T-16 is a false pass as noted above.
- **Why it matters:** Confirms the code path can execute outside the UI in a compatible Web Crypto environment; does not verify button wiring, visual behavior, browser-specific behavior, or honest assertions.
- **Recommended action:** After correcting the matrix and assertions, add a documented repeatable test command and run the suite in the target browser; capture truthful output in the report.
- **Blocks final submission:** No for this limited execution claim; yes if presented as 22 valid passing tests.

#### [HIGH] No standard automated test framework or browser acceptance suite is configured

- **Evidence:** `package.json:6-12` defines `dev`, `build`, `preview`, `clean`, and a TypeScript-only `lint`; there is no `test` script. No tracked unit-test, Playwright, Cypress, Vitest, Jest, or Testing Library configuration/files were found.
- **Why it matters:** The only test runner is an application feature, so there is no routine CI-friendly regression check, and UI flows such as the broken hybrid navigation are not tested.
- **Recommended action:** Add a repeatable test command and separate pure utility assertions from browser interaction checks. Keep a clear distinction between automated tests and manual browser checks in the submission.
- **Blocks final submission:** Yes for a claim of automated application-wide coverage; course expects valid and invalid scenarios, not necessarily a named framework.

#### [MEDIUM] Reported test coverage does not match the course report’s plan

- **Evidence:** The supplied `CipherSentinel_Web_Application_Project_Report.docx` contains a planned T-01–T-27 matrix, including oversized input, malformed keys, model-unavailable, schema validation, storage leakage, XSS-safe rendering, and API checks. The checked-in UI/runtime matrix has 22 entries and no backend/API tests. The report itself marks results as `[Not run]` and measurements as placeholders.
- **Why it matters:** A 22-case UI matrix cannot be presented as complete coverage of the 27-case plan or as evidence of backend/API checks that do not exist in this frontend-only project.
- **Recommended action:** Revise the report matrix to the implemented frontend scope, remove backend-only items or mark them out of scope, add real browser and storage inspection evidence, and accurately explain unimplemented cases.
- **Blocks final submission:** Yes if the current report is submitted as an implementation/results report.

## 7. Documentation Gaps

#### [HIGH] The supplied project report is a design plan with explicit placeholders, not a final results report

- **Evidence:** `CipherSentinel_Web_Application_Project_Report.docx` calls itself an “updated web-application design and implementation plan,” explicitly says it does not claim the proposed model, key workflow, or matrix are fully implemented/executed, and contains `[Not run]`, `[Insert measured value]`, and blank compliance/evidence fields in its test, results, and compliance tables. The repository contains this report and the course handout PDF, but no presentation/slides file was found.
- **Why it matters:** The handout explicitly asks for a report and presentation explaining algorithms, AI, GUI, testing results, and security. The current report cannot be represented as a completed implementation report, and presentation is a missing deliverable.
- **Recommended action:** Update the report to describe actual frontend architecture, actual workflow limitations, actual model provenance/limitations, and verified results; complete the course-compliance evidence table. Create the required presentation and prepare a live-demo script with truthful expected behavior.
- **Blocks final submission:** Yes.

#### [MEDIUM] README omits key setup, limitations, and deployment instructions

- **Evidence:** `README.md` ends after local npm install/dev/build instructions (`README.md:34-51`); it does not explain the seven modules, frontend-only in-memory vault semantics, browser Web Crypto secure-context needs, model limitations, deployment to a static host, or known broken flows.
- **Why it matters:** A reviewer cannot determine the actual support boundary or reliably run/deploy the app from the README, and the omitted caveats contradict claims earlier in that file.
- **Recommended action:** Replace inaccurate claims and document prerequisites, browser support assumptions, static build/preview steps, session-only data semantics, advisory AI limitations, and known limitations until corrected.
- **Blocks final submission:** No alone.

## 8. Deployment Readiness

#### [COMPLETE] Static frontend production bundle builds without environment variables

- **Evidence:** `vite.config.ts:1-21` configures React and Tailwind plugins with no backend proxy or required runtime environment variables. `index.html:1-` is the Vite entry document; `src/main.tsx` imports the active app and `src/index.css`. `npm run build` succeeded and emitted `dist/index.html` plus hashed assets. No runtime API server is configured or required by the active source.
- **Why it matters:** The application can be hosted as static frontend assets and satisfies the no-backend constraint.
- **Recommended action:** Deploy the `dist/` output only after functional blockers and documentation are addressed; use HTTPS because Web Crypto and clipboard APIs require a secure context outside localhost.
- **Blocks final submission:** No, as a build/deployment property.

#### [MEDIUM] Deployment path and static-host behavior are not documented or tested

- **Evidence:** `vite.config.ts` does not set `base`; assets therefore assume root-relative hosting by default. The app has no URL router (`src/App.tsx:18-40` uses in-memory `activeTab` state), so there are no deep links to rewrite, but no hosting instructions or static-host smoke test are included.
- **Why it matters:** A subpath deployment can produce incorrect asset URLs without a configured Vite base. Root deployment is straightforward; any future direct routes would require SPA fallback rules.
- **Recommended action:** Document root-path static deployment, set `base` for any subdirectory target, and smoke-test the built output at the chosen host/path over HTTPS. No backend environment values are currently required.
- **Blocks final submission:** No if hosted at the domain root; yes only for a planned subpath deployment until configured/tested.

#### [LOW] Production bundle exceeds Vite’s default 500 kB warning threshold

- **Evidence:** Audit build emitted `dist/assets/index-DAqtAOrd.js` at 574.32 kB minified (158.22 kB gzip); Vite warned about chunks larger than 500 kB.
- **Why it matters:** This is not a build failure, but increases initial download/parse cost, especially on mobile connections.
- **Recommended action:** Consider lazy-loading the seven modules or splitting large dependencies after preserving behavior and visual design. Recheck the bundle and navigation after any change.
- **Blocks final submission:** No.

#### [LOW] Development server binds to all interfaces by default

- **Evidence:** `package.json:7` runs `vite --port=3000 --host=0.0.0.0`.
- **Why it matters:** This exposes the development server to the local network when the host firewall/network allows it; it is not a production deployment setting.
- **Recommended action:** Document that this is for local development/demo networking, or bind to localhost by default if network access is not required. Never publish the Vite development server as the production site.
- **Blocks final submission:** No.

## 9. Academic Requirements Coverage

| Course requirement | Audit status | Evidence and gap |
|---|---|---|
| Classical cryptography | **COMPLETE** | Caesar and Vigenère implementations and GUI controls exist (`src/utils/crypto.ts:95-177`; `src/components/crypto/CryptoLabPage.tsx:47-70`). Correctness has limited runner coverage; algorithms are appropriately labeled educational. |
| Modern cryptography | **COMPLETE / HIGH caveat** | AES-256-GCM implemented through Web Crypto (`crypto.ts:228-375`); custom nonce reuse is possible through UI input (`CryptoLabPage.tsx:641-659`). |
| Hashing | **COMPLETE** | SHA-256 digest and comparison use Web Crypto (`crypto.ts:190-213`); digest-format validation needs tightening. |
| Public-key cryptography | **COMPLETE / HIGH caveat** | RSA-3072 OAEP/SHA-256 and DEK wrapping exist (`crypto.ts:405-518`); key import/recovery UI is absent and the vault does not use the hybrid decrypt helper. |
| Interactive GUI | **MEDIUM** | Seven screens and responsive breakpoint classes exist. Two visible hybrid actions navigate to an unrendered tab; no browser usability evidence was found. |
| At least one AI security feature | **COMPLETE / HIGH caveat** | Real local TF-IDF/logistic-regression inference is wired to the UI; only 40 training samples are declared and no evaluation evidence supports accuracy/calibration claims. AI archive action is broken. |
| Positive and negative testing | **HIGH** | The in-app runner has successful round-trip and wrong-key/tamper cases, but T-16 is a false pass, descriptions mismatch, no app-wide test framework/browser suite exists, and only one shim run was verified. |
| Correctness and performance evaluation | **HIGH** | One test run produced timings, but T-22’s method and runtime label are misleading; no repeatable benchmark or AI quality metrics exist. |
| Project report | **HIGH** | A DOCX report exists, but it describes a proposed plan and contains explicit not-run/placeholders rather than final implementation evidence. |
| Presentation | **HIGH** | No slide/presentation file was found in the repository. Must be produced as a separate submission deliverable. |

**Overall academic status:** Core subject coverage exists, but implementation evidence and submission artifacts are incomplete. The required final report and presentation should not claim features or measurements beyond verified behavior.

## 10. Prioritized Action Plan

### P0 — Required before demonstrating or submitting the advertised workflow

1. **Repair the hybrid workflow routing.** Implement/route the `hybrid` tab so “Launch Hybrid Workflow” and AI “Secure & Archive” reach an actual screen and consume the staged message.
2. **Connect the hybrid envelope to the vault.** Add actual encrypted envelopes to vault state and have the vault unwrap the DEK with the matching private key, authenticate the same AAD, and display plaintext only after successful GCM verification. Verify correct-key, wrong-key, and modified-ciphertext flows through the visible UI.
3. **Fix T-16 and align all test matrices.** Replace the unconditional pass with a real assertion; make the initial matrix, executed cases, project report, and displayed expected/evidence fields use the same stable IDs and scenarios. Rerun and record actual results.
4. **Correct public claims.** Replace “desktop” with “browser-based web application”; remove unsupported claims of persistent/zero-plaintext vault storage, calibrated AI thresholds, complete report-matrix coverage, and verified archive behavior. Clearly label sample fixtures as synthetic/non-decryptable unless replaced by real test envelopes.

### P1 — Required for credible academic evidence and safe interpretation

5. **Finish the report.** Convert the current plan into an implementation report with actual frontend-only architecture, implemented-vs-missing scope, security limitations, verified test output, and a completed requirements/evidence matrix. Remove backend/database/API promises that are out of scope.
6. **Create the presentation and demo evidence.** Include the algorithm roles, AI pipeline and caveats, GUI workflow, genuine positive/negative test evidence, security assumptions, and known limitations. Capture browser screenshots and test at phone/tablet/desktop widths.
7. **Make the test suite repeatable and honest.** Add a standard test command and meaningful unit/browser tests for malformed keys/envelopes, empty and oversized input, nonce handling, AI samples, vault archive/decrypt, and failure behavior. Separate automated from manual testing; use repeated benchmark measurements for performance claims.
8. **Document AI provenance and limits.** Provide model/data origin, training procedure, held-out evaluation methodology and metrics if available. Otherwise state that the classifier is an educational small-sample demo and remove all accuracy/calibration implications.

### P2 — Security and usability hardening before any production-style claims

9. **Restrict unsafe nonce reuse in the GUI.** Avoid repeated manual AES-GCM encryption with the same key/nonce; add explicit UX and a test for this boundary.
10. **Harden encrypted private-key import.** Validate envelope schema/field lengths/iteration range and justify work factor/passphrase policy; implement actual import/recovery if the UI claims key lifecycle support.
11. **Reduce secret exposure.** Document that browser state, visible AES keys, exported PEM, clipboard, and decrypted component state are not production-grade custody; clear sensitive state after use where practical.
12. **Tighten validation and browser errors.** Enforce digest/Base64 formats, bound AI input length, distinguish unsupported/empty text from low risk, and handle clipboard/download errors with visible feedback.

### P3 — Repository and deployment cleanup

13. **Clean project metadata and unused artifacts.** Rename `react-example`, remove unused AI Studio environment settings and verified-unreferenced packages, and isolate/remove unrelated pollinator assets/components without deleting anything still relied on.
14. **Document static hosting.** Explain root-path Vite deployment and HTTPS; configure `base` only if deploying below a domain root; smoke-test the built `dist/` output on the intended host.
15. **Review the bundle warning.** Optionally split/lazy-load large app screens and recheck initial load, keeping the current design system intact.

**Submission gate:** Do not submit until P0 items are complete, the project report and presentation are present and evidence-based, and P1 test/AI limitations are represented honestly. P2/P3 items determine whether the work is presented strictly as an educational prototype or as a more robust security application.
