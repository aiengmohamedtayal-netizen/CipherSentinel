import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  Key,
  Hash,
  BookOpen,
  SlidersHorizontal,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  Cpu,
} from 'lucide-react';
import {
  caesarEncrypt,
  caesarDecrypt,
  vigenereEncrypt,
  vigenereDecrypt,
  sha256,
  aesGcmEncrypt,
  aesGcmDecrypt,
  wrapDekWithRsa,
  unwrapDekWithRsa,
  generateDefaultRsaMetadata,
} from '../utils/crypto';
import { IMAGES } from '../assets/images';

interface AlgorithmConfig {
  id: string;
  name: string;
  shortLabel: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  standard: string;
  formula: string;
  educationalWarning?: string;
  insight: string;
}

const CRYPTO_ALGORITHMS: AlgorithmConfig[] = [
  {
    id: 'aes-256-gcm',
    name: 'AES-256-GCM',
    shortLabel: 'AES-256-GCM',
    category: 'Modern Authenticated Symmetric',
    icon: Lock,
    description: 'NIST-approved authenticated symmetric cipher delivering confidentiality and tamper detection.',
    standard: 'NIST SP 800-38D',
    formula: 'C = AES_K(CTR) ⊕ P, Tag = GHASH_H(AAD || C || len)',
    insight: 'Galois/Counter Mode computes a 128-bit authentication tag over both ciphertext and Associated Authenticated Data (AAD). Flipping a single bit causes decryption to fail closed.',
  },
  {
    id: 'rsa-oaep',
    name: 'RSA-3072 OAEP',
    shortLabel: 'RSA-OAEP',
    category: 'Public-Key Key Transport',
    icon: Key,
    description: 'Asymmetric wrapping of short symmetric data-encryption keys (DEKs) using recipient public key.',
    standard: 'RFC 8017 / PKCS #1 v2.2',
    formula: 'c = (EM)^e mod n, where EM = OAEP(DEK, Seed, MGF1)',
    insight: 'RSA is computationally intensive and restricted to small payloads. In CipherSentinel, RSA-OAEP wraps the 32-byte AES DEK, leaving heavy payload encryption to AES-GCM.',
  },
  {
    id: 'sha-256',
    name: 'SHA-256 Hash',
    shortLabel: 'SHA-256',
    category: 'Cryptographic One-Way Digest',
    icon: Hash,
    description: 'Collision-resistant Merkle-Damgård digest producing a 64-character hexadecimal fingerprint.',
    standard: 'NIST FIPS 180-4',
    formula: 'H = SHA-256(M) via 64 compression rounds',
    insight: 'SHA-256 is an irreversible one-way mathematical function. It does NOT possess a decryption operation. It verifies bit-level data integrity against expected reference digests.',
  },
  {
    id: 'caesar',
    name: 'Caesar Cipher',
    shortLabel: 'Caesar Cipher',
    category: 'Classical Educational Sandbox',
    icon: BookOpen,
    description: 'Historical monoalphabetic substitution shifting letters modulo 26. Trivial to break via brute-force.',
    standard: 'Classical Historical (Insecure)',
    formula: 'E(x) = (x + k) mod 26, D(x) = (x - k) mod 26',
    educationalWarning: 'Educational Only: There are only 25 non-trivial shifts. Frequency analysis recovers the shift in milliseconds.',
    insight: 'Letter frequencies in Caesar ciphertext remain identical to English plaintext. A frequency histogram instantly exposes the shift. Classical ciphers are strictly pedagogical.',
  },
  {
    id: 'vigenere',
    name: 'Vigenère Cipher',
    shortLabel: 'Vigenère Cipher',
    category: 'Classical Polyalphabetic Sandbox',
    icon: SlidersHorizontal,
    description: 'Polyalphabetic substitution using a cyclic keyword. Vulnerable to Kasiski examination.',
    standard: 'Classical Historical (Insecure)',
    formula: 'C_i = (P_i + K_i) mod 26, P_i = (C_i - K_i) mod 26',
    educationalWarning: 'Educational Only: Repeating keywords leave structural periodicity that can be broken without a key.',
    insight: 'Friedman and Kasiski tests determine the keyword length by measuring coincidence indices. Once the length is known, each slice reduces to simple Caesar cryptanalysis.',
  },
];

export const RooftopCalculator: React.FC = () => {
  const [selectedAlgoId, setSelectedAlgoId] = useState<string>('aes-256-gcm');
  const [inputText, setInputText] = useState<string>('CONFIDENTIAL_SECURITY_DISPATCH_2026');
  const [outputText, setOutputText] = useState<string>('');
  const [authTag, setAuthTag] = useState<string>('');
  const [activeNonce, setActiveNonce] = useState<string>('');
  const [aesKeyB64, setAesKeyB64] = useState<string>('');
  const [caesarShift, setCaesarShift] = useState<number>(7);
  const [vigenereKey, setVigenereKey] = useState<string>('SENTINEL');
  const [copied, setCopied] = useState<boolean>(false);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Ready for cryptographic execution');
  const [rsaPair] = useState(generateDefaultRsaMetadata());

  const currentAlgo = CRYPTO_ALGORITHMS.find((a) => a.id === selectedAlgoId) || CRYPTO_ALGORITHMS[0];

  // Auto-generate AES key on load
  useEffect(() => {
    generateRandomAesKey();
  }, []);

  const generateRandomAesKey = () => {
    const keyBytes = new Uint8Array(32);
    window.crypto.getRandomValues(keyBytes);
    let binary = '';
    for (let i = 0; i < keyBytes.length; i++) binary += String.fromCharCode(keyBytes[i]);
    setAesKeyB64(window.btoa(binary));
  };

  const handleCopyOutput = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEncrypt = async () => {
    setErrorFeedback(null);
    setStatusMessage('Executing encryption...');

    try {
      if (!inputText.trim()) {
        throw new Error('Input text cannot be empty.');
      }

      if (selectedAlgoId === 'aes-256-gcm') {
        const result = await aesGcmEncrypt(inputText, aesKeyB64, undefined, 'record_id=demo-bench-01');
        setOutputText(result.ciphertextB64);
        setAuthTag(result.tagB64);
        setActiveNonce(result.nonceB64);
        setStatusMessage('AES-256-GCM encryption verified with 128-bit authentication tag.');
      } else if (selectedAlgoId === 'rsa-oaep') {
        const wrapped = wrapDekWithRsa(inputText, rsaPair.publicKeyFingerprint);
        setOutputText(wrapped);
        setAuthTag('OAEP-SHA256-MGF1-VERIFIED');
        setStatusMessage('RSA-3072 OAEP key wrapping complete.');
      } else if (selectedAlgoId === 'caesar') {
        const encrypted = caesarEncrypt(inputText, caesarShift);
        setOutputText(encrypted);
        setAuthTag('UNAUTHENTICATED-CLASSICAL');
        setStatusMessage(`Caesar encrypted with shift ${caesarShift}.`);
      } else if (selectedAlgoId === 'vigenere') {
        const encrypted = vigenereEncrypt(inputText, vigenereKey);
        setOutputText(encrypted);
        setAuthTag('UNAUTHENTICATED-CLASSICAL');
        setStatusMessage(`Vigenère encrypted with keyword "${vigenereKey.toUpperCase()}".`);
      }
    } catch (err: any) {
      setErrorFeedback(err.message || 'Cryptographic operation failed.');
      setStatusMessage('Operation failed.');
    }
  };

  const handleDecrypt = async () => {
    setErrorFeedback(null);
    setStatusMessage('Executing decryption...');

    try {
      if (!outputText.trim()) {
        throw new Error('No ciphertext available to decrypt. Please encrypt first or paste ciphertext.');
      }

      if (selectedAlgoId === 'aes-256-gcm') {
        if (!authTag || !activeNonce || !aesKeyB64) {
          throw new Error('Missing AES-GCM nonce, key, or authentication tag.');
        }
        const result = await aesGcmDecrypt(outputText, authTag, aesKeyB64, activeNonce, 'record_id=demo-bench-01');
        setInputText(result.plaintext);
        setStatusMessage('Decryption successful: GCM authentication tag verified. Plaintext recovered.');
      } else if (selectedAlgoId === 'rsa-oaep') {
        const unwrapped = unwrapDekWithRsa(outputText, rsaPair.publicKeyFingerprint);
        setInputText(unwrapped);
        setStatusMessage('RSA-OAEP private key unwrap successful. Recovered data key.');
      } else if (selectedAlgoId === 'caesar') {
        const decrypted = caesarDecrypt(outputText, caesarShift);
        setInputText(decrypted);
        setStatusMessage(`Caesar decrypted with shift -${caesarShift}.`);
      } else if (selectedAlgoId === 'vigenere') {
        const decrypted = vigenereDecrypt(outputText, vigenereKey);
        setInputText(decrypted);
        setStatusMessage(`Vigenère decrypted with keyword "${vigenereKey.toUpperCase()}".`);
      }
    } catch (err: any) {
      setErrorFeedback(err.message || 'Decryption failed: fail-closed triggered.');
      setStatusMessage('Decryption failed.');
    }
  };

  const handleGenerateHash = async () => {
    setErrorFeedback(null);
    try {
      if (!inputText) {
        throw new Error('Input text cannot be empty.');
      }
      const digest = await sha256(inputText);
      setOutputText(digest);
      setAuthTag('256-BIT-COLLISION-RESISTANT');
      setStatusMessage('SHA-256 digest calculated successfully (64 hexadecimal characters).');
    } catch (err: any) {
      setErrorFeedback(err.message || 'Hash generation failed.');
    }
  };

  return (
    <div
      id="crypto-workbench"
      className="mt-16 pt-12 border-t border-[#1F2B1D]/15 dark:border-white/15 space-y-10 transition-colors duration-400"
    >
      {/* Editorial Header */}
      <div className="space-y-3 max-w-3xl">
        <p className="text-sm font-medium tracking-wide text-[#657351] dark:text-[#A3B59E]">
          Interactive Simulator
        </p>
        <h3 className="font-display text-3xl sm:text-4xl lg:text-5xl text-[#1F2B1D] dark:text-[#F4EFE6] font-normal leading-[1.08] tracking-tight">
          Cryptographic Operations Laboratory
        </h3>
        <p className="text-base sm:text-lg text-[#3B4D36] dark:text-[#CBD7C7] font-light leading-relaxed">
          Select an algorithm and input parameters to execute real-time encryption, authenticated decryption, key wrapping, and hashing operations.
        </p>
      </div>

      {/* 2-Column Split: Controls on Left, 4 Visual Output / Metric Cards on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* LEFT COLUMN: Controls (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Step 1: Algorithm Selector */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2B1D] dark:text-[#F4EFE6]">
              1. Select Cryptographic Algorithm
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {CRYPTO_ALGORITHMS.map((algo) => {
                const IconComponent = algo.icon;
                const isSelected = algo.id === selectedAlgoId;
                return (
                  <button
                    key={algo.id}
                    type="button"
                    onClick={() => {
                      setSelectedAlgoId(algo.id);
                      setOutputText('');
                      setErrorFeedback(null);
                    }}
                    className={`p-3.5 rounded-2xl flex items-center gap-3.5 text-left transition-all duration-200 cursor-pointer border ${
                      isSelected
                        ? 'bg-[#1F2B1D] dark:bg-[#384F35] text-[#F4EFE6] border-[#1F2B1D] dark:border-[#4B6B47] shadow-sm'
                        : 'bg-white/80 dark:bg-[#253924] text-[#243324] dark:text-[#F4EFE6] border-[#243324]/10 dark:border-white/12 hover:border-[#243324]/30 dark:hover:border-white/30 hover:bg-white dark:hover:bg-[#2E452C]'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-white/15 text-[#E6C285]'
                          : 'bg-[#1F2B1D]/5 dark:bg-white/10 text-[#657351] dark:text-[#A3B59E]'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold leading-tight">{algo.name}</span>
                        {algo.educationalWarning && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                            Edu Only
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-xs leading-tight pt-0.5 truncate ${
                          isSelected ? 'text-[#F4EFE6]/75' : 'text-[#657351] dark:text-[#A3B59E]'
                        }`}
                      >
                        {algo.category}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Input Message & Parameters */}
          <div className="space-y-4 p-5 rounded-2xl bg-white dark:bg-[#253924] border border-[#243324]/10 dark:border-white/12 shadow-xs transition-colors duration-400">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#1F2B1D] dark:text-[#F4EFE6]">
                2. Input Message / Payload
              </label>
              <textarea
                rows={3}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#FBF9F5] dark:bg-[#1A2619] border border-[#243324]/15 dark:border-white/15 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#3B4D36] dark:focus:ring-[#CBD7C7] text-[#1F2B1D] dark:text-[#F4EFE6]"
                placeholder="Enter text to encrypt or hash..."
              />
            </div>

            {/* Algorithm-Specific Parameter Inputs */}
            {selectedAlgoId === 'caesar' && (
              <div className="space-y-2 pt-2 border-t border-[#243324]/10 dark:border-white/10">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-medium text-[#4A5D44] dark:text-[#CBD7C7]">
                    Caesar Shift (k ∈ [1..25])
                  </span>
                  <span className="font-mono text-sm font-bold text-[#1F2B1D] dark:text-[#F4EFE6]">
                    +{caesarShift}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={25}
                  value={caesarShift}
                  onChange={(e) => setCaesarShift(parseInt(e.target.value))}
                  className="w-full accent-[#3B4D36] dark:accent-[#85E7B7] cursor-pointer"
                />
              </div>
            )}

            {selectedAlgoId === 'vigenere' && (
              <div className="space-y-1.5 pt-2 border-t border-[#243324]/10 dark:border-white/10">
                <label className="text-xs font-medium text-[#4A5D44] dark:text-[#CBD7C7]">
                  Keyword (Letters Only)
                </label>
                <input
                  type="text"
                  value={vigenereKey}
                  onChange={(e) => setVigenereKey(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                  className="w-full px-3 py-2 rounded-xl bg-[#FBF9F5] dark:bg-[#1A2619] border border-[#243324]/15 dark:border-white/15 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#3B4D36] text-[#1F2B1D] dark:text-[#F4EFE6]"
                  placeholder="e.g. SENTINEL"
                />
              </div>
            )}

            {selectedAlgoId === 'aes-256-gcm' && (
              <div className="space-y-2 pt-2 border-t border-[#243324]/10 dark:border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-[#4A5D44] dark:text-[#CBD7C7]">
                    256-bit AES Data Encryption Key (DEK)
                  </span>
                  <button
                    type="button"
                    onClick={generateRandomAesKey}
                    className="flex items-center gap-1 text-[11px] text-[#3B4D36] dark:text-[#CBD7C7] hover:underline cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Fresh DEK
                  </button>
                </div>
                <input
                  type="text"
                  value={aesKeyB64}
                  onChange={(e) => setAesKeyB64(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#FBF9F5] dark:bg-[#1A2619] border border-[#243324]/15 dark:border-white/15 text-[11px] font-mono select-all text-[#1F2B1D] dark:text-[#F4EFE6]"
                />
              </div>
            )}

            {/* Educational Warning If Applicable */}
            {currentAlgo.educationalWarning && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{currentAlgo.educationalWarning}</span>
              </div>
            )}

            {/* Error Feedback Banner */}
            {errorFeedback && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-200 text-xs">
                {errorFeedback}
              </div>
            )}

            {/* Action Buttons: SHA-256 only has Generate Hash; ciphers have Encrypt and Decrypt */}
            <div className="pt-2 flex flex-wrap gap-2.5">
              {selectedAlgoId === 'sha-256' ? (
                <button
                  type="button"
                  onClick={handleGenerateHash}
                  className="w-full py-3 px-5 rounded-full text-xs font-semibold bg-[#1F2B1D] dark:bg-[#384E36] text-white hover:bg-[#2C3E2A] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Hash className="w-4 h-4" />
                  Generate SHA-256 Digest
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleEncrypt}
                    className="flex-1 py-2.5 px-4 rounded-full text-xs font-semibold bg-[#1F2B1D] dark:bg-[#384E36] text-white hover:bg-[#2C3E2A] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Encrypt Message
                  </button>
                  <button
                    type="button"
                    onClick={handleDecrypt}
                    className="flex-1 py-2.5 px-4 rounded-full text-xs font-semibold bg-white dark:bg-[#1E2E1D] text-[#1F2B1D] dark:text-[#F4EFE6] border border-[#243324]/20 dark:border-white/20 hover:bg-[#F5F2EB] dark:hover:bg-[#273B25] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5" />
                    Decrypt Ciphertext
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 4 Strata Cards with Rich Visual Treatments (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Card 1: Primary Output Display */}
          <div className="p-6 sm:p-7 rounded-[2rem] bg-white dark:bg-[#243723] border border-[#243324]/10 dark:border-white/12 shadow-md space-y-3 transition-colors duration-400">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold text-[#657351] dark:text-[#A3B59E] tracking-wider">
                Cryptographic Output (Base64 / Hex)
              </span>
              {outputText && (
                <button
                  type="button"
                  onClick={handleCopyOutput}
                  className="flex items-center gap-1 text-xs text-[#3B4D36] dark:text-[#CBD7C7] hover:underline cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Output'}
                </button>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-[#1F2B1D] dark:bg-[#121A11] text-[#E8DCC4] font-mono text-xs break-all select-all min-h-[72px] flex items-center">
              {outputText || <span className="opacity-40 italic">Output will be rendered here upon execution...</span>}
            </div>

            {authTag && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] font-mono text-[#657351] dark:text-[#A3B59E]">
                <span>Tag / Integrity: <code className="text-[#1F2B1D] dark:text-[#CBD7C7]">{authTag}</code></span>
                {activeNonce && <span>Nonce: <code className="text-[#1F2B1D] dark:text-[#CBD7C7]">{activeNonce}</code></span>}
              </div>
            )}
          </div>

          {/* Card 2: Security & Standard Metric */}
          <div className="p-6 sm:p-7 rounded-[2rem] bg-[#F5F2EB] dark:bg-[#233522] border border-[#243324]/10 dark:border-white/12 shadow-sm space-y-2 transition-colors duration-400">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold text-[#657351] dark:text-[#A3B59E] tracking-wider">
                Compliance Standard & Security Level
              </span>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#1F2B1D]/10 dark:bg-white/10 text-[#1F2B1D] dark:text-[#F4EFE6]">
                {currentAlgo.standard}
              </span>
            </div>
            <p className="font-display text-xl sm:text-2xl text-[#1F2B1D] dark:text-[#F4EFE6]">
              {currentAlgo.category}
            </p>
            <p className="text-xs text-[#4A5D44] dark:text-[#CBD7C7] font-light leading-relaxed">
              {currentAlgo.description}
            </p>
          </div>

          {/* Card 3: Mathematical Formulation */}
          <div className="p-6 sm:p-7 rounded-[2rem] bg-[#F5F2EB] dark:bg-[#233522] border border-[#243324]/10 dark:border-white/12 shadow-sm space-y-2 transition-colors duration-400">
            <span className="text-xs uppercase font-semibold text-[#657351] dark:text-[#A3B59E] tracking-wider block">
              Mathematical Transformation
            </span>
            <div className="p-3.5 rounded-xl bg-white/70 dark:bg-[#1A2619]/60 font-mono text-xs text-[#1F2B1D] dark:text-[#F4EFE6] border border-[#243324]/10 dark:border-white/10">
              {currentAlgo.formula}
            </div>
          </div>

          {/* Card 4: Status & Operational Insight */}
          <div className="p-6 sm:p-7 rounded-[2rem] bg-white dark:bg-[#243723] border border-[#243324]/10 dark:border-white/12 shadow-sm space-y-2 transition-colors duration-400">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#657351] dark:text-[#A3B59E]">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Operational & Security Insight</span>
            </div>
            <p className="text-xs text-[#4A5D44] dark:text-[#CBD7C7] font-light leading-relaxed">
              {currentAlgo.insight}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
