# CipherSentinel — Classical Cryptography Expansion Implementation Report

**Document ID:** CS-REPORT-CLASSICAL-CIPHERS-01  
**Project:** CipherSentinel (Client-Side Cybersecurity & Cryptography Educational Workbench)  
**Date:** March 2026 / Implementation Verification Phase  
**Author:** Senior Cryptography & Software Testing Engineering Lead  
**Classification:** Academic Technical Documentation / Architecture & Verification  

---

## 1. Executive Summary

This report documents the architectural design, formal mathematical implementation, user experience integration, and rigorous automated verification of the **Classical Cryptography Expansion** within the CipherSentinel application.

Prior to this expansion, CipherSentinel included educational demonstrations of the Caesar Cipher and Vigenère Cipher, positioned alongside modern standards (AES-256-GCM, RSA-3072 OAEP, SHA-256, and in-browser AI phishing risk evaluation). While functional, the classical coverage was limited to two historical techniques.

To transform CipherSentinel into a comprehensive, academic-grade cryptographic laboratory, the system has been expanded to support a complete, cohesive collection of **eight classical ciphers**:

1. **Caesar Cipher** (Fixed alphabetic shift with strict input boundary enforcement)
2. **ROT13** (Fixed shift of 13 positions, self-reciprocal involution)
3. **Additive Cipher** (General numeric shift addition modulo 26, mathematically unified with Caesar)
4. **Multiplicative Cipher** (Modular multiplication modulo 26 with coprime key validation)
5. **Playfair Cipher** (Digraph polygraphic substitution via a 5×5 key matrix with J merged into I)
6. **Hill Cipher** (Polygraphic block cipher using 2×2 matrix multiplication modulo 26 and modular matrix inversion)
7. **Vigenère Cipher** (Polyalphabetic periodic keyword-based shift substitution)
8. **Autokey Cipher** (Plaintext-Autokey variant eliminating periodic key repetition by appending plaintext to the keystream)

All eight algorithms are fully integrated into the existing `CryptoLabPage` interface with interactive, real-time visual tools (including dynamic 5×5 Playfair matrix grids, 2×2 Hill matrix determinants and inverse previews, and coprime multiplicative key selectors). The entire suite maintains **100% bilingual parity** across English and Arabic (including native RTL layout and directional text isolation) and is verified by a dedicated test matrix within `tests/security.test.ts`, bringing total automated test coverage to **62 tests across 12 suites passing with 100% success**.

---

## 2. Supported Classical Algorithms Overview

The table below summarizes the theoretical and operational properties of the eight supported classical cipher algorithms:

| # | Algorithm | Category | Mathematical Formulation | Key Space | Invertibility Condition | Security Status |
|---|---|---|---|---|---|---|
| **1** | **Caesar Cipher** | Monoalphabetic Shift Substitution | $C = (P + K) \pmod{26}$<br>$P = (C - K) \pmod{26}$ | 26 (effective: 25 non-trivial) | Always invertible for any integer $K$ | Broken (exhaustive brute force in $\le 25$ attempts, frequency analysis) |
| **2** | **ROT13** | Monoalphabetic Fixed Shift Involution | $C = (P + 13) \pmod{26}$<br>$P = (C + 13) \pmod{26}$ | 1 (fixed $K = 13$, self-inverse) | Always invertible; encryption $\equiv$ decryption | Zero security (obfuscation only, no secret key) |
| **3** | **Additive Cipher** | Monoalphabetic Modular Addition | $C = (P + K) \pmod{26}$<br>$P = (C - K) \pmod{26}$ | 26 (normalized $K \in [0, 25]$) | Always invertible for any integer $K$ | Broken (identical to Caesar; frequency analysis, single-letter cribs) |
| **4** | **Multiplicative Cipher** | Monoalphabetic Modular Multiplication | $C = (P \times K) \pmod{26}$<br>$P = (C \times K^{-1}) \pmod{26}$ | 12 ($\phi(26) = 12$ coprime keys) | $\gcd(K, 26) = 1$ | Broken (exhaustive key search in 12 attempts, frequency analysis) |
| **5** | **Playfair Cipher** | Polygraphic Digraph Substitution | Digraph shift rules on $5 \times 5$ matrix: row $(+1/-1)$, col $(+1/-1)$, rectangle swap | $25! \approx 1.55 \times 10^{25}$ theoretical | Unambiguous digraph pair mapping | Broken (digraph frequency analysis, known-plaintext cribs) |
| **6** | **Hill Cipher** | Polygraphic Linear Block Cipher ($2 \times 2$) | $\mathbf{C} = (\mathbf{K} \cdot \mathbf{P}) \pmod{26}$<br>$\mathbf{P} = (\mathbf{K}^{-1} \cdot \mathbf{C}) \pmod{26}$ | $|\text{GL}(2, \mathbb{Z}_{26})| = 157,248$ | $\gcd(\det(\mathbf{K}), 26) = 1$ | Broken (completely vulnerable to known-plaintext attack with 2 digraph pairs) |
| **7** | **Vigenère Cipher** | Polyalphabetic Periodic Substitution | $C_i = (P_i + K_{i \bmod m}) \pmod{26}$<br>$P_i = (C_i - K_{i \bmod m}) \pmod{26}$ | $26^m$ for keyword length $m$ | Always invertible for alphabetic keyword | Broken (Kasiski examination, Friedman test, index of coincidence) |
| **8** | **Autokey Cipher** | Polyalphabetic Aperiodic Keystream (Plaintext Autokey) | $K_{\text{stream}} = K_{\text{word}} \parallel P$<br>$C_i = (P_i + K_{\text{stream}, i}) \pmod{26}$ | $26^m$ initial keyword space | Dynamically invertible via sequential plaintext recovery | Weak (susceptible to known-plaintext search, dictionary attacks on initial key, letter frequency cascades) |

---

## 3. Architectural Design & Module Structure

To ensure maximum maintainability, modularity, and zero disruption to existing application features, the classical cryptography expansion was architected as a dedicated, standalone module located in `src/utils/classicalCiphers/`.

The existing `src/utils/crypto.ts` facade exports all functions from this sub-module, ensuring full backward compatibility with all existing components, test harnesses, and type definitions.

### 3.1 Directory and File Structure

```
src/utils/
├── classicalCiphers/
│   ├── common.ts           # Modular arithmetic primitives: mod(), gcd(), modInverse()
│   ├── types.ts            # TypeScript interfaces: PlayfairResult, HillResult, HillMatrix2x2
│   ├── caesar.ts           # Caesar cipher implementation & strict numeric validation
│   ├── rot13.ts            # ROT13 cipher implementation (involution)
│   ├── additive.ts         # Additive cipher implementation & integer key validation
│   ├── multiplicative.ts   # Multiplicative cipher & coprime key validation
│   ├── playfair.ts         # 5x5 matrix generation, digraph prep, encryption & decryption
│   ├── hill.ts             # 2x2 matrix operations, determinant, modular inverse, block crypto
│   ├── vigenere.ts         # Polyalphabetic Vigenère implementation
│   ├── autokey.ts          # Plaintext-Autokey keystream expansion & sequential recovery
│   └── index.ts            # Clean unified re-export barrel
├── crypto.ts               # Facade re-exporting classicalCiphers + Web Crypto modern features
└── securityTestSuite.ts    # In-browser test runner (retains T-01 through T-22)
```

### 3.2 Common Mathematical Primitives (`common.ts`)

Modular arithmetic in standard JavaScript encounters issues with negative operands because the native `%` operator is the remainder operator, not the mathematical modulo. The helper library standardizes mathematical behavior:

- **Euclidean Modulo (`mod(n, m)`):**
  $$\text{mod}(n, m) = ((n \bmod m) + m) \bmod m$$
  Guarantees non-negative results in $[0, m - 1]$ for all integers $n \in \mathbb{Z}$.

- **Greatest Common Divisor (`gcd(a, b)`):**
  Calculates $\gcd(|a|, |b|)$ using Euclid's Euclidean algorithm.

- **Extended Euclidean Algorithm Modular Inverse (`modInverse(a, m)`):**
  Finds $x \in [0, m - 1]$ such that $(a \cdot x) \equiv 1 \pmod{m}$ using the Extended Euclidean Algorithm. Throws a clear error if $\gcd(a, m) \ne 1$.

---

## 4. Algorithm-by-Algorithm Implementation Details

### 4.1 Caesar Cipher

- **Mathematical Formulation:**
  - Encryption: $C = (P + K) \pmod{26}$
  - Decryption: $P = (C - K) \pmod{26}$
- **Alphabet Mapping:** $\text{A} = 0, \text{B} = 1, \dots, \text{Z} = 25$.
- **Key Validation:**
  - Accepts finite integers only.
  - Normalizes $K$ modulo 26: $K_{\text{norm}} = \text{mod}(K, 26)$.
  - Rejects `NaN`, `+Infinity`, `-Infinity`, fractional numbers (e.g., `3.5`), and invalid strings without silent flooring or coercion.
- **Corner Cases:**
  - Zero shift ($K = 0$): Text returned unchanged.
  - Negative shifts: Handled symmetrically ($K = -3 \implies K_{\text{norm}} = 23$).
  - Large shifts: Handled via modular reduction ($K = 1000 \implies K_{\text{norm}} = 12$).
  - Non-alphabetic characters (digits, spaces, punctuation) and letter casing (uppercase/lowercase) are strictly preserved.
- **Reference Vector:**
  - Plaintext: `"HELLO, WORLD!"`, Key: `3`
  - Ciphertext: `"KHOOR, ZRUOG!"`
  - Decryption with `3`: `"HELLO, WORLD!"`

### 4.2 ROT13 Cipher

- **Mathematical Formulation:**
  - Encryption: $C = (P + 13) \pmod{26}$
  - Decryption: $P = (C + 13) \pmod{26}$
- **Involution Property:**
  Because $13 + 13 = 26 \equiv 0 \pmod{26}$, the transformation is its own inverse:
  $$\text{ROT13}(\text{ROT13}(M)) = M$$
- **Operational Rules:**
  - Requires no key parameter from the user.
  - Uses the same internal function for encryption and decryption.
  - Preserves letter case, numbers, whitespace, and punctuation.
- **Educational Context:**
  Presented as a specialized Caesar cipher with a fixed shift of 13.
- **Reference Vector:**
  - Plaintext: `"CipherSentinel 2026"`
  - Ciphertext: `"PvcureFragvary 2026"`
  - Decryption: `"CipherSentinel 2026"`

### 4.3 Additive Cipher

- **Mathematical Formulation:**
  - Encryption: $C = (P + K) \pmod{26}$
  - Decryption: $P = (C - K) \pmod{26}$
- **Relationship to Caesar:**
  The Additive Cipher is mathematically identical to the generalized Caesar Cipher. In modular group theory, shifting by $K$ corresponds to addition in the cyclic group $(\mathbb{Z}_{26}, +)$.
- **Validation Rules:**
  - Strictly accepts finite integer keys.
  - Rejects fractional, `NaN`, and infinite values.
  - Normalizes keys modulo 26 into $[0, 25]$.
- **Reference Vector:**
  - Plaintext: `"SECURITY OPERATIONS"`, Key: `7`
  - Ciphertext: `"ZLJBYPAF VWLYHAPVUZ"`
  - Decryption with `7`: `"SECURITY OPERATIONS"`

### 4.4 Multiplicative Cipher

- **Mathematical Formulation:**
  - Encryption: $C = (P \times K) \pmod{26}$
  - Decryption: $P = (C \times K^{-1}) \pmod{26}$
  where $K^{-1}$ is the modular multiplicative inverse satisfying:
  $$(K \times K^{-1}) \equiv 1 \pmod{26}$$
- **Key Invertibility Condition:**
  A key $K$ is invertible modulo 26 if and only if $\gcd(K, 26) = 1$. The set of valid normalized keys is $\mathbb{Z}_{26}^\times$, containing $\phi(26) = 12$ elements:
  $$\{1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25\}$$
- **Modular Inverses Lookup Table:**
  - $1^{-1} \equiv 1$
  - $3^{-1} \equiv 9$
  - $5^{-1} \equiv 21$
  - $7^{-1} \equiv 15$
  - $9^{-1} \equiv 3$
  - $11^{-1} \equiv 19$
  - $15^{-1} \equiv 7$
  - $17^{-1} \equiv 23$
  - $19^{-1} \equiv 11$
  - $21^{-1} \equiv 5$
  - $23^{-1} \equiv 17$
  - $25^{-1} \equiv 25$
- **Validation Rules:**
  - Rejects any key where $\gcd(K \bmod 26, 26) \ne 1$ (e.g., even numbers 2, 4, 6... and multiples of 13).
  - Throws informative error detailing the GCD violation and listing the 12 valid keys.
- **Reference Vector:**
  - Plaintext: `"HELLO"`, Key: `5`
  - Letter values: $\text{H}(7), \text{E}(4), \text{L}(11), \text{L}(11), \text{O}(14)$
  - Calculations:
    - $7 \times 5 = 35 \equiv 9 \implies \text{J}$
    - $4 \times 5 = 20 \equiv 20 \implies \text{U}$
    - $11 \times 5 = 55 \equiv 3 \implies \text{D}$
    - $11 \times 5 = 55 \equiv 3 \implies \text{D}$
    - $14 \times 5 = 70 \equiv 18 \implies \text{S}$
  - Ciphertext: `"JUDDS"`
  - Decryption with $5^{-1} = 21$:
    - $\text{J}(9) \times 21 = 189 \equiv 7 \implies \text{H}$
    - $\text{U}(20) \times 21 = 420 \equiv 4 \implies \text{E}$
    - $\text{D}(3) \times 21 = 63 \equiv 11 \implies \text{L}$
    - $\text{D}(3) \times 21 = 63 \equiv 11 \implies \text{L}$
    - $\text{S}(18) \times 21 = 378 \equiv 14 \implies \text{O}$
    - Result: `"HELLO"`

### 4.5 Playfair Cipher

- **Matrix Construction ($5 \times 5$):**
  - Keyword is normalized to uppercase, letters `J` are converted to `I`, and non-alphabetic characters are stripped.
  - Unique characters from the keyword are inserted row by row without duplicates.
  - Remaining letters of the 25-letter alphabet (`ABCDEFGHIKLMNOPQRSTUVWXYZ`, omitting `J`) fill the remaining cells.
- **Plaintext Preparation Rules:**
  - Text is filtered to A-Z, mapping `J` to `I`.
  - Grouped into digraph pairs $(m_1, m_2)$.
  - If $m_1 = m_2$, a filler character is inserted between them (`'X'`, or `'Q'` if the repeated letter is `'X'`), and the second letter shifts to head the next pair.
  - If a single trailing letter remains at the end of the message, it is padded with `'X'` (or `'Q'` if the letter is `'X'`).
- **Digraph Transformation Rules:**
  - **Same Row:** Each letter is replaced by the letter immediately to its right (wrapping to the row start: $(c + 1) \bmod 5$ for encryption, $(c - 1) \bmod 5$ for decryption).
  - **Same Column:** Each letter is replaced by the letter immediately below it (wrapping to the column top: $(r + 1) \bmod 5$ for encryption, $(r - 1) \bmod 5$ for decryption).
  - **Rectangle (Different Row & Column):** Each letter is replaced by the letter in the same row but in the column of the other letter in the digraph: $(r_1, c_2)$ and $(r_2, c_1)$.
- **Preservation of Decrypted Text:**
  - Raw decrypted text retains padding and filler characters so users can observe the exact mechanics of digraph reconstruction.
- **Reference Vector:**
  - Plaintext: `"INSTRUMENTS"`, Keyword: `"MONARCHY"`
  - Matrix:
    ```
    M O N A R
    C H Y B D
    E F G I K
    L P Q S T
    U V W X Z
    ```
  - Digraphs: `['IN', 'ST', 'RU', 'ME', 'NT', 'SX']`
  - Encrypted Ciphertext: `"GA TL MZ CL RQ XA"`
  - Decrypted Output: `"IN ST RU ME NT SX"`

### 4.6 Hill Cipher ($2 \times 2$ Matrix Modulo 26)

- **Mathematical Formulation:**
  Plaintext is divided into 2-character blocks, represented as $2 \times 1$ column vectors $\mathbf{P} = \begin{pmatrix} p_1 \\ p_2 \end{pmatrix}$.
  - Encryption:
    $$\mathbf{C} = (\mathbf{K} \cdot \mathbf{P}) \pmod{26} = \begin{pmatrix} a & b \\ c & d \end{pmatrix} \begin{pmatrix} p_1 \\ p_2 \end{pmatrix} \pmod{26}$$
  - Decryption:
    $$\mathbf{P} = (\mathbf{K}^{-1} \cdot \mathbf{C}) \pmod{26}$$
- **Determinant & Invertibility:**
  $$\det(\mathbf{K}) = (ad - bc) \pmod{26}$$
  The matrix $\mathbf{K}$ is invertible modulo 26 if and only if:
  $$\gcd(\det(\mathbf{K}), 26) = 1$$
- **Modular Inverse Matrix Calculation:**
  $$\mathbf{K}^{-1} = (\det(\mathbf{K}))^{-1} \cdot \text{adj}(\mathbf{K}) \pmod{26}$$
  $$\mathbf{K}^{-1} = (\det(\mathbf{K}))^{-1} \begin{pmatrix} d & -b \\ -c & a \end{pmatrix} \pmod{26}$$
- **Padding:**
  If the plaintext contains an odd number of alphabetic characters, it is padded with `'X'` to complete the final $2 \times 1$ block.
- **Reference Vector:**
  - Key Matrix: $\mathbf{K} = \begin{pmatrix} 3 & 3 \\ 2 & 5 \end{pmatrix}$
  - $\det(\mathbf{K}) = (15 - 6) = 9$. Since $\gcd(9, 26) = 1$, matrix is invertible.
  - $9^{-1} \pmod{26} = 3$ (since $9 \times 3 = 27 \equiv 1$).
  - $\mathbf{K}^{-1} = 3 \begin{pmatrix} 5 & -3 \\ -2 & 3 \end{pmatrix} = 3 \begin{pmatrix} 5 & 23 \\ 24 & 3 \end{pmatrix} = \begin{pmatrix} 15 & 69 \\ 72 & 9 \end{pmatrix} \equiv \begin{pmatrix} 15 & 17 \\ 20 & 9 \end{pmatrix} \pmod{26}$.
  - Plaintext: `"HELP"` $\to$ Block 1: `HE` $\begin{pmatrix} 7 \\ 4 \end{pmatrix}$, Block 2: `LP` $\begin{pmatrix} 11 \\ 15 \end{pmatrix}$
  - Block 1 Encryption: $\begin{pmatrix} 3 & 3 \\ 2 & 5 \end{pmatrix} \begin{pmatrix} 7 \\ 4 \end{pmatrix} = \begin{pmatrix} 33 \\ 34 \end{pmatrix} \equiv \begin{pmatrix} 7 \\ 8 \end{pmatrix} \implies \text{HI}$
  - Block 2 Encryption: $\begin{pmatrix} 3 & 3 \\ 2 & 5 \end{pmatrix} \begin{pmatrix} 11 \\ 15 \end{pmatrix} = \begin{pmatrix} 78 \\ 97 \end{pmatrix} \equiv \begin{pmatrix} 0 \\ 19 \end{pmatrix} \implies \text{AT}$
  - Ciphertext: `"HIAT"`
  - Decryption with $\mathbf{K}^{-1}$:
    - $\begin{pmatrix} 15 & 17 \\ 20 & 9 \end{pmatrix} \begin{pmatrix} 7 \\ 8 \end{pmatrix} = \begin{pmatrix} 241 \\ 212 \end{pmatrix} \equiv \begin{pmatrix} 7 \\ 4 \end{pmatrix} \implies \text{HE}$
    - $\begin{pmatrix} 15 & 17 \\ 20 & 9 \end{pmatrix} \begin{pmatrix} 0 \\ 19 \end{pmatrix} = \begin{pmatrix} 323 \\ 171 \end{pmatrix} \equiv \begin{pmatrix} 11 \\ 15 \end{pmatrix} \implies \text{LP}$
    - Result: `"HELP"`

### 4.7 Vigenère Cipher

- **Mathematical Formulation:**
  - Encryption: $C_i = (P_i + K_{i \bmod m}) \pmod{26}$
  - Decryption: $P_i = (C_i - K_{i \bmod m}) \pmod{26}$
  where $K$ is a repeating keyword string of length $m$.
- **Validation Rules:**
  - Requires a non-empty keyword containing only alphabetic characters (A-Z).
  - Preserves case and non-alphabetic characters in the plaintext (non-alphabetic characters do not advance the key index).
- **Reference Vector:**
  - Plaintext: `"ATTACKATDAWN"`, Keyword: `"LEMON"`
  - Keystream: `"LEMONLEMONLE"`
  - Ciphertext: `"LXFOPVEFRNHR"`
  - Decryption: `"ATTACKATDAWN"`

### 4.8 Autokey Cipher (Plaintext-Autokey Variant)

- **Plaintext Autokey Mechanics:**
  Unlike Vigenère, which periodically repeats the keyword, the **Plaintext-Autokey Cipher** begins with the initial keyword and then concatenates the actual plaintext letters to form an aperiodic keystream:
  $$K_{\text{stream}} = K_{\text{word}} \parallel P$$
- **Sequential Dynamic Decryption:**
  During decryption, the receiver possesses only the initial keyword $K_{\text{word}}$ of length $m$.
  1. For $i < m$, decrypt using $K_{\text{word}, i}$:
     $$P_i = (C_i - K_{\text{word}, i}) \pmod{26}$$
  2. For $i \ge m$, use the previously recovered plaintext character $P_{i - m}$ as the key for character $i$:
     $$P_i = (C_i - P_{i - m}) \pmod{26}$$
- **Distinction from Ciphertext Autokey:**
  The implementation explicitly uses **Plaintext Autokey** rather than Ciphertext Autokey ($K_{\text{stream}} = K_{\text{word}} \parallel C$). Plaintext Autokey provides superior resistance against statistical attacks because it is driven by natural language plaintext statistics rather than pseudo-random ciphertext characters.
- **Reference Vector:**
  - Plaintext: `"ATTACKATDAWN"`, Initial Keyword: `"QUEENLY"` ($m = 7$)
  - Keystream construction:
    - First 7 characters: `"QUEENLY"`
    - Remaining 5 characters from plaintext: `"ATTAC"`
    - Complete Keystream: `"QUEENLYATTAC"`
  - Encryption:
    - $\text{A}(0) + \text{Q}(16) = 16 \implies \text{Q}$
    - $\text{T}(19) + \text{U}(20) = 39 \equiv 13 \implies \text{N}$
    - $\text{T}(19) + \text{E}(4) = 23 \implies \text{X}$
    - $\text{A}(0) + \text{E}(4) = 4 \implies \text{E}$
    - $\text{C}(2) + \text{N}(13) = 15 \implies \text{P}$
    - $\text{K}(10) + \text{L}(11) = 21 \implies \text{V}$
    - $\text{A}(0) + \text{Y}(24) = 24 \implies \text{Y}$
    - $\text{T}(19) + \text{A}(0) = 19 \implies \text{T}$
    - $\text{D}(3) + \text{T}(19) = 22 \implies \text{W}$
    - $\text{A}(0) + \text{T}(19) = 19 \implies \text{T}$
    - $\text{W}(22) + \text{A}(0) = 22 \implies \text{W}$
    - $\text{N}(13) + \text{C}(2) = 15 \implies \text{P}$
  - Ciphertext: `"QNXEPVYTWTWP"`
  - Decryption with `"QUEENLY"`:
    - Decrypts characters 0–6 to recover `"ATTACKA"`.
    - Uses recovered `'A'` to decrypt character 7 $\to$ `'T'`.
    - Uses recovered `'T'` to decrypt character 8 $\to$ `'D'`.
    - Uses recovered `'T'` to decrypt character 9 $\to$ `'A'`.
    - Uses recovered `'A'` to decrypt character 10 $\to$ `'W'`.
    - Uses recovered `'C'` to decrypt character 11 $\to$ `'N'`.
    - Fully recovered Plaintext: `"ATTACKATDAWN"`.

---

## 5. Input Validation & Security Boundaries

Strict validation boundaries are established across all eight algorithms to ensure predictable, secure, and fail-closed behavior without silent truncation or corruption:

1. **Non-Empty Plaintext Check:**
   All encryption operations verify that the input message contains at least one alphabetic character before performing cryptographic work.

2. **Numeric Type Enforcement:**
   Shift keys for Caesar and Additive ciphers, and multiplicative keys, must strictly validate as finite integers. Values such as `NaN`, `Infinity`, `-Infinity`, and non-integer floats (e.g. `2.5`) are rejected immediately with an explicit error message.

3. **Coprimality Enforcement:**
   Multiplicative and Hill key validations enforce the mathematical requirement that $\gcd(K, 26) = 1$ and $\gcd(\det(\mathbf{K}), 26) = 1$. Non-invertible configurations are blocked with descriptive mathematical guidance.

4. **Even-Length Ciphertext Enforcement for Block & Digraph Ciphers:**
   Playfair and Hill decryption verify that the ciphertext contains an even number of characters, since both operate strictly on 2-letter blocks.

5. **Character Filtering & Case Preservation:**
   Punctuation, digits, and casing are preserved in streaming ciphers (Caesar, ROT13, Additive, Multiplicative, Vigenère, Autokey), while matrix and block ciphers (Playfair, Hill) clearly document and display uppercase digraph and block preparation.

---

## 6. Crypto Lab Integration & User Experience

The eight classical ciphers are seamlessly unified with modern cryptographic algorithms in `src/components/crypto/CryptoLabPage.tsx`:

### 6.1 Unified Selection & Category Filtering

Users can filter algorithms using category tabs:
- **All Algorithms (11):** Displays all 8 classical and 3 modern algorithms.
- **Classical (8):** Filters the grid to show the 8 historical ciphers.
- **Modern (3):** Filters the grid to show AES-256-GCM, RSA-OAEP, and SHA-256.

The algorithm grid is fully responsive (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6`), with each card displaying its standard, formula, and category badge.

### 6.2 Specialized Interactive Parameter Controls

- **ROT13:** Displays an informative notification that ROT13 is an involution requiring no user key ($C = (P + 13) \bmod 26$).
- **Additive:** Synchronized slider and numeric input field with a note explaining mathematical equivalence to Caesar.
- **Multiplicative:** Key input with live coprimality validation, real-time modular inverse $K^{-1} \pmod{26}$ preview, and quick-select badges for all 12 coprime keys.
- **Playfair:** Keyword input with an **interactive live 5×5 key matrix grid** that updates dynamically as the user types, plus an output panel displaying the prepared digraph pairs.
- **Hill:** Interactive $2 \times 2$ grid inputs for $a, b, c, d$, live determinant calculation, modular inverse matrix display, and preset buttons for valid matrices.
- **Autokey:** Keyword input with clear badge indicating the Plaintext-Autokey variant.

### 6.3 Educational Advisory Banner

Selecting any classical algorithm displays an educational advisory banner:
> **Educational Only:** Historical ciphers are vulnerable to frequency analysis, brute-force key search, and known-plaintext attacks. Not suitable for confidential modern communication.

---

## 7. Bilingual Support & RTL Considerations

The entire classical ciphers expansion provides **100% translation key parity** between English (`src/i18n/en.ts`) and Arabic (`src/i18n/ar.ts`):

- **Key Parity:** Every algorithm name, category label, formula, descriptive explanation, UI label, and error string is translated into professional academic Arabic.
- **RTL Layout Integrity:** The UI respects Arabic right-to-left layout conventions, utilizing the locally bundled **Thmanyah font family** (Thmanyah Sans, Thmanyah Serif Display, Thmanyah Serif Text).
- **Directional Isolation:** All formulas, matrices, hexadecimal digests, and ciphertext values are wrapped in `<bdi dir="ltr">` tags, preventing bidirectional text reordering glitches when viewed in Arabic.

---

## 8. Automated Test Suite & Verification Results

Verification of the expanded classical cipher suite is integrated into `tests/security.test.ts`.

### 8.1 Verification Test Matrix

```bash
npm.cmd test
```

### 8.2 Summary of Test Execution

```
✔ CipherSentinel T-01 through T-22 security matrix (22 tests passing)
✔ Caesar Cipher Strict Input Validation & Integrity Suite (11 tests passing)
✔ AI Custom TypeScript Vectorizer & In-Browser Inference Suite (4 tests passing)
▶ Eight Classical Ciphers Comprehensive Verification Suite
  ▶ 1. Caesar Cipher Suite (2 tests passing)
  ▶ 2. ROT13 Cipher Suite (2 tests passing)
  ▶ 3. Additive Cipher Suite (2 tests passing)
  ▶ 4. Multiplicative Cipher Suite (3 tests passing)
  ▶ 5. Playfair Cipher Suite (4 tests passing)
  ▶ 6. Hill Cipher Suite (4 tests passing)
  ▶ 7. Vigenère Cipher Suite (3 tests passing)
  ▶ 8. Autokey Cipher Suite (Plaintext Autokey) (4 tests passing)
✔ Eight Classical Ciphers Comprehensive Verification Suite (25 tests passing)

Total Tests: 62
Total Suites: 12
Passed: 62
Failed: 0
Execution Time: ~530ms
```

---

## 9. Security & Educational Cryptanalysis

Classical ciphers played a foundational role in the evolution of cryptography, but none are secure against modern cryptanalytic techniques:

| Cipher | Attack Technique | Mechanism | Time / Data Complexity |
|---|---|---|---|
| **Caesar / Additive / ROT13** | Brute-force exhaustive search | Check all 25 possible shifts | $O(1)$ — trivial mental effort |
| **Multiplicative** | Brute-force exhaustive search | Check all 12 coprime keys | $O(1)$ — 12 attempts maximum |
| **Monoalphabetic Substitution** | Frequency Analysis | Compare letter frequencies to standard English ($E \approx 12.7\%$, $T \approx 9.1\%$) | Ciphertext length $\ge 25$ characters |
| **Playfair** | Digraph Frequency Analysis | Analyze frequency of 600 possible digraphs (e.g. `TH`, `HE`, `IN`, `ER`) | Ciphertext length $\approx 100$ characters |
| **Hill Cipher ($2 \times 2$)** | Known-Plaintext Attack | Solve $\mathbf{K} = \mathbf{C} \cdot \mathbf{P}^{-1} \pmod{26}$ using linear algebra | Requires only 2 known plaintext-ciphertext digraph pairs |
| **Vigenère** | Kasiski Examination / Index of Coincidence | Find repeating ciphertext sequences to determine key length $m$, then solve $m$ parallel Caesar ciphers | Ciphertext length $\ge 50$ characters |
| **Autokey** | Known-Plaintext & Keystream Cascade | Guess common words (cribs); correct guesses propagate along the keystream | Short known plaintext fragment |

---

## 10. Modern Cryptography Comparison

| Dimension | Classical Cryptography (The 8 Ciphers) | Modern Symmetric (AES-256-GCM) | Modern Asymmetric (RSA-3072 OAEP) |
|---|---|---|---|
| **Underlying Mathematics** | Permutations & modular arithmetic in $\mathbb{Z}_{26}$ | Finite Galois fields $\text{GF}(2^8)$, substitution-permutation networks | Prime factorization in $\mathbb{Z}_n$, modular exponentiation |
| **Key Size** | 5 to 17 bits | 256 bits | 3072 bits |
| **Confidentiality** | Ineffective against computation | Computationally secure against known attacks ($2^{256}$ operations) | Computationally secure against classical computers |
| **Integrity / Authenticity** | None (malleable, no authentication tags) | 128-bit GHASH authentication tag (NIST SP 800-38D) | OAEP padding prevents malleability |
| **Role in CipherSentinel** | Educational interactive laboratory | High-throughput data payload encryption (DEK) | Key transport & DEK encapsulation (KEK) |

---

## 11. File Inventory

| File Path | Status | Lines of Code | Description / Responsibility |
|---|---|---|---|
| `src/utils/classicalCiphers/common.ts` | **New** | 50 | Mathematical helpers: `mod`, `gcd`, `modInverse` |
| `src/utils/classicalCiphers/types.ts` | **New** | 35 | TypeScript interfaces for Playfair and Hill results |
| `src/utils/classicalCiphers/caesar.ts` | **New** | 76 | Caesar cipher with strict numeric validation |
| `src/utils/classicalCiphers/rot13.ts` | **New** | 35 | ROT13 fixed-shift involution |
| `src/utils/classicalCiphers/additive.ts` | **New** | 52 | Additive cipher and integer key validation |
| `src/utils/classicalCiphers/multiplicative.ts` | **New** | 68 | Multiplicative cipher and coprime key validation |
| `src/utils/classicalCiphers/playfair.ts` | **New** | 183 | $5 \times 5$ matrix generator, digraph preparer, encryption/decryption |
| `src/utils/classicalCiphers/hill.ts` | **New** | 165 | $2 \times 2$ Hill matrix validation, modular inverse, block crypto |
| `src/utils/classicalCiphers/vigenere.ts` | **New** | 68 | Polyalphabetic Vigenère cipher |
| `src/utils/classicalCiphers/autokey.ts` | **New** | 85 | Plaintext-Autokey keystream and dynamic decryption |
| `src/utils/classicalCiphers/index.ts` | **New** | 20 | Module barrel re-exporting all classical ciphers |
| `src/utils/crypto.ts` | **Modified** | 215 | Clean facade re-exporting classical ciphers + Web Crypto |
| `src/components/crypto/CryptoLabPage.tsx` | **Modified** | 1,440 | Unified workbench with category filters and interactive matrix UIs |
| `src/i18n/en.ts` | **Modified** | 510 | Complete English dictionary entries for all 8 ciphers |
| `src/i18n/ar.ts` | **Modified** | 610 | Complete Arabic dictionary entries with RTL considerations |
| `tests/security.test.ts` | **Modified** | 655 | Automated test suite verifying all 8 ciphers (62 tests total) |
| `CLASSICAL_CIPHERS_IMPLEMENTATION_REPORT.md` | **New** | ~500 | This comprehensive technical report |

---

## 12. Verification Checklist

- [x] All eight classical ciphers implemented with distinct encryption and decryption functions.
- [x] Caesar Cipher strict integer validation preserved without regression.
- [x] ROT13 implemented as a keyless self-reciprocal involution.
- [x] Additive Cipher implemented and documented as mathematically equivalent to Caesar.
- [x] Multiplicative Cipher implemented with coprime validation ($\gcd(K, 26) = 1$) and inverse lookup.
- [x] Playfair Cipher implemented with $5 \times 5$ matrix, `J` $\to$ `I` mapping, filler rules (`X`/`Q`), and raw decrypted output.
- [x] Hill Cipher implemented for $2 \times 2$ matrices with determinant check, modular inverse, and odd padding.
- [x] Vigenère Cipher preserved and verified.
- [x] Autokey Cipher implemented specifically as the **Plaintext-Autokey** variant.
- [x] Modern cryptographic features (AES-256-GCM, RSA-3072, SHA-256, Hybrid Vault) completely untouched and intact.
- [x] AI Phishing Detection completely untouched and functional.
- [x] Full English and Arabic localization parity with zero untranslated strings.
- [x] `npm test` runs 62 automated tests across 12 suites with 100% pass rate.
- [x] `npm run lint` passes with 0 TypeScript errors.
- [x] `npm run build` generates production assets with zero bundle size warnings.

---

## 13. Future Work & Recommendations

1. **Known-Plaintext Cryptanalysis Solver:** Add interactive educational solvers that demonstrate automatic key recovery for Caesar (chi-squared frequency analysis) and Hill (solving $2 \times 2$ linear systems).
2. **Frequency Distribution Visualizer:** Render a live histogram comparing English letter frequencies against ciphertext letter frequencies to visually prove why monoalphabetic ciphers fail.
3. **Kasiski Examination Assistant:** Provide an interactive tool for the Vigenère workspace that identifies repeated trigraphs and calculates key length candidates.
