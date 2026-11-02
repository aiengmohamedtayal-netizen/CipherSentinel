# CipherSentinel: Live Demonstration Script & Defense Guide
## 5–7 Minute Interactive Defense Walkthrough

**Target Duration:** 5 to 7 Minutes  
**Audience:** Course Instructor, Academic Evaluation Committee  
**Environment:** Local Development Host (`http://127.0.0.1:3000`) or Static Preview  
**Safety Protocol:** Strictly synthetic sample inputs; zero personal credentials or production keys.

---

### 1. Pre-Demonstration Checklist

Before starting the presentation, verify that:
- [ ] Local web server is active on `http://127.0.0.1:3000` (`npm run dev` or `npm run preview`).
- [ ] Browser window is opened, zoomed to ~110% for projection clarity.
- [ ] Developer Console (F12) is open or accessible to prove zero network requests during operations.
- [ ] Default starting screen displays the application cleanly in light or dark theme.
- [ ] Key Manager shows active RSA-3072 key pair as initialized (green status pill).

---

### 2. Demonstration Timeline Overview (6 Minutes Total)

| Phase | Duration | Screen / Feature | Primary Objective |
|---|---|---|---|
| **Step 1** | 0:00 – 0:45 | Dashboard & Language Switcher | Introduce UI, session metrics, and demonstrate native Arabic RTL layout |
| **Step 2** | 0:45 – 1:45 | Crypto Lab (Caesar & AES-GCM) | Show hardened Caesar shift validation, then live AES-256-GCM encryption |
| **Step 3** | 1:45 – 2:45 | Hybrid Encryption & Vault Archive | Encrypt dispatch using ephemeral AES DEK wrapped under RSA-3072 |
| **Step 4** | 2:45 – 3:45 | Secure Vault & Tamper Detection | Decrypt envelope; simulate 1-bit ciphertext tampering; show fail-closed rejection |
| **Step 5** | 3:45 – 4:30 | Hash & Integrity (SHA-256) | Demonstrate cryptographic digest and avalanche effect (Hamming distance) |
| **Step 6** | 4:30 – 5:30 | AI Phishing Threat Intelligence | Run local in-browser inference on synthetic email; explain feature weights |
| **Step 7** | 5:30 – 6:15 | Testing Center Execution | Run the automated 22-test verification suite live with 100% pass rate |

---

### 3. Step-by-Step Live Demonstration Walkthrough

---

#### Step 1: Dashboard Overview & Native Arabic RTL Transition (0:00 – 0:45)

##### Action & Navigation
1. Start on the **Dashboard** in English (`http://127.0.0.1:3000`).
2. Point out the real-time session counters: "Session Operations", "Active Cryptographic Algorithms", and "Vault Records".
3. Click the **Language Switcher** button in the top navigation bar (`العربية`).

##### Exact UI Behavior
- The entire page layout immediately transitions from Left-to-Right (LTR) to Right-to-Left (RTL).
- Arabic typography immediately adopts the locally bundled **Thmanyah Sans** and **Thmanyah Serif Display** fonts.
- Navigation arrows mirror directionally (`.rtl-mirror`).
- Technical labels, nonces, and algorithm identifiers remain correctly oriented in LTR isolation.

##### What to Explain
> *"We begin on the Dashboard. CipherSentinel is built from the ground up for full bilingual accessibility. By clicking the language toggle, the application immediately shifts into native Arabic RTL mode without reloading the page or resetting state. Notice the typography: we bundled the Thmanyah font family locally, meaning the application has zero external CDN font dependencies. Mixed-direction values like algorithm names and hex numbers are isolated using bidirectional markers so they never render in reverse order."*

*(Click `English` to return to English for the remainder of the technical explanation, or stay in Arabic if requested by the committee).*

---

#### Step 2: Classical Ciphers Suite & Authenticated AES-256-GCM (0:45 – 1:45)

##### Action & Navigation
1. Click **Crypto Lab** in the top navigation bar.
2. Note the category filter buttons: **All Algorithms (11)**, **Classical (8)**, and **Modern (3)**.
3. Select **Playfair Cipher**:
   - In **Playfair Keyword**, enter `MONARCHY`.
   - Observe the live **5×5 Key Matrix** rendered instantly in the UI with `J` mapped to `I`.
   - Enter plaintext: `INSTRUMENTS` $\rightarrow$ Click **Encrypt**.
   - Observe prepared digraphs `['IN', 'ST', 'RU', 'ME', 'NT', 'SX']` and ciphertext `GA TL MZ CL RQ XA`.
4. Select **Hill Cipher**:
   - Point out the $2 \times 2$ matrix controls ($a=3, b=3, c=2, d=5$).
   - Note the live determinant display ($\det = 9$) and modular inverse matrix $\begin{pmatrix} 15 & 17 \\ 20 & 9 \end{pmatrix}$.
   - Click **Encrypt with Hill Cipher** to encrypt `HELP` into `HIAT`.
5. Select **Caesar Cipher** to demonstrate strict validation:
   - Enter an invalid shift like `3.5` or `invalid`.
   - Click **Encrypt**. Observe the red validation error banner: *"Caesar shift must be a valid integer."*
6. Switch to **AES-256-GCM**:
   - In the Message field, enter:  
   `CONFIDENTIAL FLIGHT DISPATCH #402`
   - Click **Encrypt with AES-GCM**.

##### Exact UI Behavior
- A fresh 96-bit nonce and 128-bit authentication tag are generated instantly.
- The ciphertext is displayed in Base64 format inside an LTR-isolated code box.
- Click **Decrypt**: Plaintext `CONFIDENTIAL FLIGHT DISPATCH #402` reappears with green checkmark: *"Authenticated decryption verified."*

##### What to Explain
> *"In the Crypto Lab, we examine the full spectrum of eight classical ciphers alongside modern standards. We feature interactive visual tools: for Playfair, the 5x5 matrix is rendered live and prepared digraphs are isolated. For Hill, 2x2 matrix determinants and modular inverses are calculated in real time. We strictly enforce mathematical constraints such as coprimality and integer boundaries. Moving to modern symmetric encryption, AES-256-GCM demonstrates authenticated encryption with fresh 96-bit nonces and 128-bit tags that prevent undetectable tampering."*

---

#### Step 3: End-to-End Hybrid Encryption Workflow (1:45 – 2:45)

##### Action & Navigation
1. From Crypto Lab, click the button: **"Launch Hybrid Workflow"** (or click **Hybrid Encryption** in the navbar).
2. Point out the recipient key status card: *"Recipient key ready: KEY-RSA3072-... (3072-bit RSA)"*.
3. In **Message Subject**, enter:  
   `Urgent Server Configuration Dispatch`
4. In **Message Content**, enter:  
   `Primary database migration scheduled for 02:00 UTC. Ensure dual-auth tokens are active.`
5. Click **"Encrypt & Add to Session Vault"**.

##### Exact UI Behavior
- The system generates an ephemeral 256-bit AES Data Encryption Key (DEK).
- The subject and content are encoded into payload object `ciphersentinel-message-v1` and encrypted with AES-GCM.
- The DEK is wrapped under the active RSA-3072 public key via RSA-OAEP.
- The green success notification displays: *"Message encrypted with AES-256-GCM, its DEK wrapped with RSA-OAEP, and the envelope added to this session’s vault."*

##### What to Explain
> *"Asymmetric encryption like RSA is too slow for large payloads, while symmetric AES requires secure key distribution. Here we demonstrate standard KEM/DEM Hybrid Encryption. An ephemeral 256-bit AES key encrypts the payload, and that AES key is encapsulated under the recipient's RSA-3072 public key. Crucially, the envelope metadata only exposes a generic subject, ensuring zero subject-line metadata leakage."*

---

#### Step 4: Secure Vault & Fail-Closed Tamper Detection (2:45 – 3:45)

##### Action & Navigation
1. Click **Secure Vault** in the navbar (or click "Open Secure Vault").
2. Highlight the warning banner explaining that the vault operates strictly in **session-only volatile memory (React state)** with zero disk persistence.
3. Locate the freshly archived envelope at the top of the list (`REC-...`).
4. Click **"Decrypt Envelope"**: The plaintext subject and body appear with a green authenticated shield.
5. Now, click the **"Simulate Tamper"** button on this envelope.

##### Exact UI Behavior
- The record status immediately updates to red: *"Tampered (Simulated)"* (1 bit in the Base64 ciphertext has been inverted).
- Click **"Decrypt Envelope"** again.
- **Result:** The system deterministicly rejects decryption, displaying the error message:  
  *"The operation failed closed. Authentication tag or Additional Authenticated Data mismatch."*
- Zero partial plaintext is returned or revealed.

##### What to Explain
> *"In the Secure Vault, we store versioned cryptographic envelopes. When we click Decrypt, the private key unwraps the AES DEK, and AES-GCM authenticates the tag. Now, watch what happens when we simulate an attacker tampering with the transmission: clicking 'Simulate Tamper' flips exactly one bit in the ciphertext. When we attempt decryption again, the Web Crypto GCM authentication tag check fails immediately. The system fails closed—zero partial plaintext is leaked. This proves the essential role of authenticated encryption."*

---

#### Step 5: Hash & Integrity Verification (3:45 – 4:30)

##### Action & Navigation
1. Click **Hash & Integrity** in the navbar.
2. In the input message box, enter:  
   `CipherSentinel-2026`
3. Point out the computed 64-character hex digest:  
   `fa2c792943e8ea961e5f8f5333dfd201cff3be508ebaa901ad36e1c2d96c1df8`
4. Look at the **Avalanche Effect** card below:
   - Input 1: `Message A100` vs Input 2: `Message A101` $\rightarrow$ **140 / 256 bits changed (54.7%)**.
   - Input 1: `The quick brown fox jumps over the lazy dog` vs trailing period `.` $\rightarrow$ **124 / 256 bits changed (48.4%)**.

##### What to Explain
> *"In Hash & Integrity, we explore SHA-256. Notice the avalanche effect: changing a single character between two messages flips approximately 50% of the output bits in the digest. We also reinforce a key theoretical distinction for students: a hash function provides integrity verification, but without an HMAC key or digital signature, it does not prove the sender's identity."*

---

#### Step 6: In-Browser AI Phishing Threat Intelligence (4:30 – 5:30)

##### Action & Navigation
1. Click **AI Phishing Detection** in the navbar.
2. Under "Load Example Messages", click the preset button: **"Urgent Security Alert"**.
   - Subject: `URGENT: Suspicious Login Detected - Action Required Immediately`
   - Body: Synthetic message containing phrases like *"suspended"*, *"unauthorized activity"*, *"click here immediately"*, *"verify your password"*.
3. Click **"Analyze Message for Phishing"**.
4. Observe the results card:
   - **Risk Classification Band:** `High phishing risk` (Rose badge).
   - **Score:** High advisory percentage (e.g. `96%`).
   - **Contributing Feature Tokens:** Badges showing matched n-grams with exact positive weights:  
     `action required: +3.04`, `login: +1.98`, `suspended: +2.85`, `unauthorized: +2.11`.
5. Point out the language limitation note below the text box.

##### What to Explain
> *"Next is our AI Phishing Threat Evaluator. Unlike typical security tools that send email contents to a remote LLM API, CipherSentinel performs the entire analysis locally inside the browser. We wrote a custom tokenizer, sublinear TF-IDF vectorizer, and Logistic Regression inference engine in pure TypeScript. It extracts unigrams and bigrams, computes dot products against pre-extracted model weights, and outputs an advisory score with explainable token badges. Notice the note: the model was trained on an English vocabulary; Arabic text matches zero features, so we explicitly inform the user that Arabic phishing detection is uncalibrated and unsupported."*

---

#### Step 7: Live Execution of the Testing Center (5:30 – 6:15)

##### Action & Navigation
1. Click **Testing Center** in the navbar.
2. Review the 22 pre-loaded security scenarios (T-01 through T-22).
3. Click the primary button: **"Run All Security Tests"**.
4. Watch the live execution progress bar as all 22 tests execute in real time.

##### Exact UI Behavior
- The progress bar sweeps to 100% in under 500 ms.
- A summary card appears:  
  **22 Passed / 0 Failed (100% Pass Rate)**.
- Expanding any test accordion reveals the empirical evidence string, execution timestamp, and latency in milliseconds.

##### What to Explain
> *"Finally, we open the Testing Center. Rather than asking the committee to take our word for cryptographic correctness, we built an automated assertion runner directly into the UI. When I click 'Run All Security Tests', the browser executes tests T-01 through T-22 live—testing AES-GCM tag tampering, RSA key mismatches, PBKDF2 iteration bounds, Caesar non-integer rejection, and envelope schema validation. As you can see: 22 passed, 0 failed, completed in under 400 milliseconds."*

---

### 4. Recovery Steps for Potential Demonstration Issues

| Potential Scenario | Cause | Immediate Recovery Action |
|---|---|---|
| **RSA Key Shows "Generating..."** | Initial Web Crypto keygen still computing on slow CPU | Wait 2–3 seconds; navigate to Key Manager and click "Generate New RSA Key". |
| **Tamper Simulation Fails to Reject** | Decrypting cached plaintext without re-running verification | Click the record's "Tamper" button again, then verify that the ciphertext string has altered before clicking "Decrypt". |
| **Accidental Page Refresh** | Browser refreshed; volatile session memory cleared | The application reinitializes with default demo fixtures in ~1 second. Continue demo using the default sample fixtures. |
| **Language Switcher Doesn't Toggle** | Accidental double-click | Click the toggle once and verify `document.documentElement.dir` updates. |
| **Browser Console Shows Red Error on Decrypt** | Intended behavior when demonstrating tampering | Explain to the committee: *"That console error is the Web Crypto API throwing an `OperationError`, which proves that AES-GCM rejected the tampered ciphertext."* |

---

### 5. Closing Demonstration Statement

> *"This concludes our live demonstration of CipherSentinel. We have shown that modern authenticated cryptography, classical cipher education, and client-side privacy-preserving AI can be seamlessly unified into an accessible, bilingual educational application. Thank you, and we welcome any questions from the committee."*
