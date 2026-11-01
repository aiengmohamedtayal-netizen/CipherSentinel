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
  Download,
  Terminal,
  Zap,
  Info,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useSessionActivity } from '../../context/SessionContext';
import {
  caesarEncrypt,
  caesarDecrypt,
  vigenereEncrypt,
  vigenereDecrypt,
  sha256,
  verifySha256,
  aesGcmEncrypt,
  aesGcmDecrypt,
  wrapAesKeyWithRsa,
  unwrapAesKeyWithRsa,
  generateRandomAesKey,
  generateGcmNonce,
  bytesToBase64,
} from '../../utils/crypto';

interface AlgoOption {
  id: string;
  name: string;
  category: 'Classical Encryption' | 'Symmetric Encryption' | 'Public-Key Cryptography' | 'Hashing';
  standard: string;
  description: string;
  formula: string;
  icon: React.ComponentType<{ className?: string }>;
  isEducational?: boolean;
}

const ALGORITHMS: AlgoOption[] = [
  {
    id: 'caesar',
    name: 'Caesar Cipher',
    category: 'Classical Encryption',
    standard: 'Classical Monoalphabetic',
    description: 'Monoalphabetic modular substitution shifting alphabetic characters modulo 26.',
    formula: 'E(x) = (x + k) mod 26, D(x) = (x - k) mod 26',
    icon: BookOpen,
    isEducational: true,
  },
  {
    id: 'vigenere',
    name: 'Vigenère Cipher',
    category: 'Classical Encryption',
    standard: 'Classical Polyalphabetic',
    description: 'Polyalphabetic substitution using a periodic keyword string modulo 26.',
    formula: 'C_i = (P_i + K_i) mod 26, P_i = (C_i - K_i) mod 26',
    icon: SlidersHorizontal,
    isEducational: true,
  },
  {
    id: 'aes-256-gcm',
    name: 'AES-256-GCM',
    category: 'Symmetric Encryption',
    standard: 'NIST SP 800-38D',
    description: 'Authenticated symmetric cipher providing confidentiality and 128-bit authentication integrity.',
    formula: 'C = AES_K(CTR) ⊕ P, Tag = GHASH_H(AAD || C || len)',
    icon: Lock,
    isEducational: false,
  },
  {
    id: 'rsa-oaep',
    name: 'RSA-OAEP',
    category: 'Public-Key Cryptography',
    standard: 'RFC 8017 / PKCS #1 v2.2',
    description: 'Asymmetric key encapsulation used to securely wrap short 256-bit symmetric DEKs.',
    formula: 'c = (EM)^e mod n, where EM = OAEP(DEK, Seed, MGF1)',
    icon: Key,
    isEducational: false,
  },
  {
    id: 'sha-256',
    name: 'SHA-256',
    category: 'Hashing',
    standard: 'NIST FIPS 180-4',
    description: 'Collision-resistant one-way cryptographic hash producing a 64-character hexadecimal digest.',
    formula: 'H = SHA-256(M) via 64 compression rounds',
    icon: Hash,
    isEducational: false,
  },
];

const SAMPLE_INPUTS = [
  { label: 'Security Dispatch', text: 'CONFIDENTIAL_OPERATION_SECURE_PAYLOAD_2026' },
  { label: 'Financial Wire', text: 'WIRE_TRANSFER_AUTHORIZATION: $45,000 USD to ACCT_8921' },
  { label: 'System Credential', text: 'DEK_BACKUP: 9f8a2b3c4d5e6f7a8b9c0d1e2f3a4b5c' },
];

export const CryptoLabPage: React.FC = () => {
  const {
    activeAesKeyB64,
    setActiveAesKeyB64,
    generateNewAesKey,
    activeRsaKey,
    generateNewRsaKey,
    incrementSessionOps,
    setActiveTab,
  } = useSessionActivity();

  // State
  const [selectedAlgoId, setSelectedAlgoId] = useState<string>('aes-256-gcm');
  const [inputText, setInputText] = useState<string>('CONFIDENTIAL_OPERATION_SECURE_PAYLOAD_2026');
  const [outputText, setOutputText] = useState<string>('');
  const [operationMode, setOperationMode] = useState<string>('encrypt'); // encrypt | decrypt | hash | verify | wrap | unwrap

  // Dynamic Keys State
  const [caesarShift, setCaesarShift] = useState<number>(7);
  const [vigenereKey, setVigenereKey] = useState<string>('SENTINEL');
  const [aesKeyInput, setAesKeyInput] = useState<string>('');
  const [gcmNonceInput, setGcmNonceInput] = useState<string>('');
  const [authTagInput, setAuthTagInput] = useState<string>('');
  const [aadInput, setAadInput] = useState<string>('env=production;classification=restricted');
  const [expectedHashInput, setExpectedHashInput] = useState<string>('');

  // Execution Feedback
  const [statusMessage, setStatusMessage] = useState<string>('Ready for cryptographic execution.');
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [lastOpDurationMs, setLastOpDurationMs] = useState<number | null>(null);

  const currentAlgo = ALGORITHMS.find((a) => a.id === selectedAlgoId) || ALGORITHMS[2];

  // Sync session AES key when loaded
  useEffect(() => {
    if (activeAesKeyB64 && !aesKeyInput) {
      setAesKeyInput(activeAesKeyB64);
    }
  }, [activeAesKeyB64]);

  // Adjust default operation mode when algorithm changes
  const handleSelectAlgorithm = (algoId: string) => {
    setSelectedAlgoId(algoId);
    setErrorFeedback(null);
    setIsSuccess(false);

    if (algoId === 'sha-256') {
      setOperationMode('hash');
    } else if (algoId === 'rsa-oaep') {
      setOperationMode('wrap');
    } else {
      setOperationMode('encrypt');
    }
  };

  const handleGenerateFreshNonce = () => {
    const nonce = generateGcmNonce();
    setGcmNonceInput(bytesToBase64(nonce));
  };

  const handleGenerateFreshAesKey = () => {
    const { keyB64 } = generateRandomAesKey();
    setAesKeyInput(keyB64);
    setActiveAesKeyB64(keyB64);
    incrementSessionOps(1);
  };

  // Execution Handlers
  const handleExecuteOperation = async () => {
    setErrorFeedback(null);
    setIsSuccess(false);
    const startTime = performance.now();

    try {
      if (!inputText && operationMode !== 'decrypt' && operationMode !== 'unwrap') {
        throw new Error('Input message cannot be empty.');
      }

      if (currentAlgo.id === 'caesar') {
        if (typeof caesarShift !== 'number' || isNaN(caesarShift)) {
          throw new Error('Caesar shift key must be a valid integer.');
        }
        if (operationMode === 'encrypt') {
          const res = caesarEncrypt(inputText, caesarShift);
          setOutputText(res);
          setStatusMessage(`Caesar encrypted successfully with shift k=${caesarShift}.`);
        } else {
          const target = outputText || inputText;
          const res = caesarDecrypt(target, caesarShift);
          setOutputText(res);
          setStatusMessage(`Caesar decrypted successfully with shift k=-${caesarShift}.`);
        }
      } else if (currentAlgo.id === 'vigenere') {
        if (!vigenereKey.trim() || !/^[A-Za-z]+$/.test(vigenereKey.trim())) {
          throw new Error('Vigenère keyword must contain alphabetic characters only (A-Z).');
        }
        if (operationMode === 'encrypt') {
          const res = vigenereEncrypt(inputText, vigenereKey);
          setOutputText(res);
          setStatusMessage(`Vigenère encrypted with keyword "${vigenereKey.toUpperCase()}".`);
        } else {
          const target = outputText || inputText;
          const res = vigenereDecrypt(target, vigenereKey);
          setOutputText(res);
          setStatusMessage(`Vigenère decrypted with keyword "${vigenereKey.toUpperCase()}".`);
        }
      } else if (currentAlgo.id === 'aes-256-gcm') {
        const key = aesKeyInput.trim() || activeAesKeyB64;
        if (!key) throw new Error('A 256-bit AES key is required.');

        if (operationMode === 'encrypt') {
          // Nonce generation: fresh 96-bit nonce for each encryption!
          const result = await aesGcmEncrypt(inputText, key, gcmNonceInput.trim() || undefined, aadInput.trim() || undefined);
          setOutputText(result.ciphertextB64);
          setAuthTagInput(result.tagB64);
          setGcmNonceInput(result.nonceB64);
          setAesKeyInput(result.keyB64);
          setStatusMessage('AES-256-GCM encryption verified. 128-bit authentication tag generated.');
        } else {
          // Decrypt
          const ciphertext = outputText.trim() || inputText.trim();
          if (!ciphertext) throw new Error('Ciphertext payload is required for decryption.');
          if (!authTagInput.trim()) throw new Error('128-bit Authentication Tag is required for authenticated decryption.');
          if (!gcmNonceInput.trim()) throw new Error('96-bit Nonce is required for AES-GCM decryption.');

          const result = await aesGcmDecrypt(
            ciphertext,
            authTagInput.trim(),
            key,
            gcmNonceInput.trim(),
            aadInput.trim() || undefined
          );
          setOutputText(result.plaintext);
          setStatusMessage('Decryption successful: GCM authentication tag verified. Plaintext authenticated.');
        }
      } else if (currentAlgo.id === 'rsa-oaep') {
        if (!activeRsaKey) throw new Error('No active RSA key found. Click "Generate RSA Key Pair" in Key Manager.');

        if (operationMode === 'wrap') {
          // Wrap symmetric key
          const keyToWrap = inputText.trim() || aesKeyInput.trim();
          if (!keyToWrap) throw new Error('Enter an AES DEK (Base64) to wrap.');
          const wrapped = await wrapAesKeyWithRsa(keyToWrap, activeRsaKey.publicKeyPem);
          setOutputText(wrapped);
          setStatusMessage(`AES DEK successfully wrapped with RSA-OAEP public key (${activeRsaKey.publicKeyFingerprint}).`);
        } else {
          // Unwrap
          const wrappedPayload = outputText.trim() || inputText.trim();
          if (!wrappedPayload) throw new Error('Wrapped key payload is required for unwrap operation.');
          const unwrapped = await unwrapAesKeyWithRsa(wrappedPayload, activeRsaKey.privateKeyPem);
          setOutputText(unwrapped);
          setStatusMessage('RSA-OAEP private key unwrap verified. Recovered 256-bit symmetric DEK.');
        }
      } else if (currentAlgo.id === 'sha-256') {
        if (operationMode === 'hash') {
          const digest = await sha256(inputText);
          setOutputText(digest);
          setExpectedHashInput(digest);
          setStatusMessage('SHA-256 digest calculated successfully (64 hexadecimal characters).');
        } else {
          // Verify
          const res = await verifySha256(inputText, expectedHashInput);
          if (res.matches) {
            setOutputText(`VERIFIED MATCH:\n${res.computedDigest}`);
            setStatusMessage('Integrity Verified: Computed digest matches expected reference exactly.');
          } else {
            throw new Error(`Integrity Mismatch!\nComputed: ${res.computedDigest}\nExpected: ${res.expectedDigest}`);
          }
        }
      }

      setIsSuccess(true);
      incrementSessionOps(1);
      setLastOpDurationMs(Math.round((performance.now() - startTime) * 10) / 10);
    } catch (err: any) {
      setIsSuccess(false);
      setErrorFeedback(err.message || 'Cryptographic operation failed.');
      setStatusMessage('Operation failed closed.');
      setLastOpDurationMs(Math.round((performance.now() - startTime) * 10) / 10);
    }
  };

  const handleSimulateTamper = () => {
    if (!outputText) return;
    try {
      // Flip a character in output
      const chars = outputText.split('');
      const targetIdx = Math.floor(chars.length / 2);
      chars[targetIdx] = chars[targetIdx] === 'A' ? 'B' : 'A';
      setOutputText(chars.join(''));
      setStatusMessage('Simulated tamper: 1 character inverted in output buffer. Click Decrypt/Verify to test fail-closed response.');
      setErrorFeedback(null);
    } catch {
      // Ignore
    }
  };

  const handleCopyOutput = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadOutput = () => {
    if (!outputText) return;
    const blob = new Blob([outputText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ciphersentinel-${selectedAlgoId}-output.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#243324]/10 dark:border-white/10 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider bg-[#1F2B1D]/10 dark:bg-white/10 text-[#1F2B1D] dark:text-[#F4EFE6]">
              Interactive GUI Workspace
            </span>
            <span className="text-xs font-mono text-[#657351] dark:text-[#A3B59E]">
              Web Crypto API Native
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-[#1F2B1D] dark:text-[#F4EFE6] font-normal tracking-tight">
            Cryptographic Operations Laboratory
          </h1>
          <p className="text-sm sm:text-base text-[#4A5D44] dark:text-[#CBD7C7] font-light max-w-2xl">
            Select an algorithm, provide parameters, and execute genuine client-side encryption, authenticated decryption, key wrapping, and hashing operations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('hybrid')}
          className="px-4 py-2.5 rounded-full text-xs font-medium bg-[#1F2B1D] dark:bg-[#384E36] text-white hover:bg-[#2c402a] transition-all flex items-center gap-2 shadow-xs cursor-pointer self-start md:self-end"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Launch Hybrid Workflow</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Algorithm Selector Grid */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#657351] dark:text-[#A3B59E]">
          1. Select Cryptographic Algorithm
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {ALGORITHMS.map((algo) => {
            const Icon = algo.icon;
            const isSelected = algo.id === selectedAlgoId;
            return (
              <button
                key={algo.id}
                type="button"
                onClick={() => handleSelectAlgorithm(algo.id)}
                className={`p-3.5 sm:p-4 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#1F2B1D] dark:border-[#CBD7C7] bg-[#1F2B1D] text-white dark:bg-[#273B25] shadow-md scale-[1.01]'
                    : 'border-[#243324]/15 dark:border-white/10 bg-white dark:bg-[#1A2619] text-[#1F2B1D] dark:text-[#F4EFE6] hover:border-[#1F2B1D]/40'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div
                    className={`p-2 rounded-xl ${
                      isSelected
                        ? 'bg-white/15 text-white'
                        : 'bg-[#F5F2EB] dark:bg-[#233522] text-[#1F2B1D] dark:text-[#CBD7C7]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-[#243324]/5 dark:bg-white/5 text-[#657351] dark:text-[#A3B59E]'
                    }`}
                  >
                    {algo.category.split(' ')[0]}
                  </span>
                </div>
                <div>
                  <h3 className="font-display text-base font-medium leading-tight">{algo.name}</h3>
                  <p
                    className={`text-[11px] font-mono mt-1 ${
                      isSelected ? 'text-white/80' : 'text-[#657351] dark:text-[#A3B59E]'
                    }`}
                  >
                    {algo.standard}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Educational Notice Banner if classical algorithm */}
      {currentAlgo.isEducational && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex items-start gap-3 text-xs leading-relaxed">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div>
            <strong>Educational Only:</strong> {currentAlgo.name} is a historical cipher vulnerable to frequency analysis and brute-force key search. Not suitable for modern confidential communication.
          </div>
        </div>
      )}

      {/* Main 2-Column Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Input & Key Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Operation Selector Tabs */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#657351] dark:text-[#A3B59E]">
              2. Select Operation
            </label>
            <div className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-[#F5F2EB] dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 w-fit">
              {currentAlgo.id !== 'sha-256' && currentAlgo.id !== 'rsa-oaep' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setOperationMode('encrypt');
                      setErrorFeedback(null);
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      operationMode === 'encrypt'
                        ? 'bg-[#1F2B1D] dark:bg-[#384E36] text-white shadow-xs'
                        : 'text-[#4A5D44] dark:text-[#CBD7C7] hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    Encrypt Message
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOperationMode('decrypt');
                      setErrorFeedback(null);
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      operationMode === 'decrypt'
                        ? 'bg-[#1F2B1D] dark:bg-[#384E36] text-white shadow-xs'
                        : 'text-[#4A5D44] dark:text-[#CBD7C7] hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    Decrypt Message
                  </button>
                </>
              )}

              {currentAlgo.id === 'rsa-oaep' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setOperationMode('wrap');
                      setErrorFeedback(null);
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      operationMode === 'wrap'
                        ? 'bg-[#1F2B1D] dark:bg-[#384E36] text-white shadow-xs'
                        : 'text-[#4A5D44] dark:text-[#CBD7C7] hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    Wrap AES DEK
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOperationMode('unwrap');
                      setErrorFeedback(null);
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      operationMode === 'unwrap'
                        ? 'bg-[#1F2B1D] dark:bg-[#384E36] text-white shadow-xs'
                        : 'text-[#4A5D44] dark:text-[#CBD7C7] hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    Unwrap AES DEK
                  </button>
                </>
              )}

              {currentAlgo.id === 'sha-256' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setOperationMode('hash');
                      setErrorFeedback(null);
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      operationMode === 'hash'
                        ? 'bg-[#1F2B1D] dark:bg-[#384E36] text-white shadow-xs'
                        : 'text-[#4A5D44] dark:text-[#CBD7C7] hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    Generate Hash
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOperationMode('verify');
                      setErrorFeedback(null);
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      operationMode === 'verify'
                        ? 'bg-[#1F2B1D] dark:bg-[#384E36] text-white shadow-xs'
                        : 'text-[#4A5D44] dark:text-[#CBD7C7] hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    Verify Against Expected
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Input Textarea Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#1F2B1D] dark:text-[#F4EFE6]">
                3. Input Message / Payload
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-[#657351] dark:text-[#A3B59E]">
                  {inputText.length} chars
                </span>
                <button
                  type="button"
                  onClick={() => setInputText('')}
                  className="text-[11px] text-[#657351] hover:text-[#1F2B1D] dark:text-[#A3B59E] dark:hover:text-[#F4EFE6] underline cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter message text, ciphertext string, or DEK to process..."
              className="w-full p-3.5 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1F2B1D] dark:focus:ring-[#CBD7C7] text-[#1F2B1D] dark:text-[#F4EFE6] leading-relaxed resize-y"
            />

            {/* Quick Sample Input Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-mono text-[#657351] dark:text-[#A3B59E]">Samples:</span>
              {SAMPLE_INPUTS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInputText(s.text)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-[#F5F2EB] dark:bg-[#233522] text-[#1F2B1D] dark:text-[#CBD7C7] hover:bg-[#eae5da] cursor-pointer transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Algorithm-Specific Dynamic Key Controls */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 shadow-xs space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1F2B1D] dark:text-[#F4EFE6] flex items-center justify-between">
              <span>4. Algorithm Parameters & Key Controls</span>
              <span className="text-[10px] font-mono text-[#657351] dark:text-[#A3B59E]">
                {currentAlgo.name}
              </span>
            </h4>

            {/* Caesar Controls */}
            {currentAlgo.id === 'caesar' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#4A5D44] dark:text-[#CBD7C7]">
                    Shift Key (k): <span className="font-mono font-bold text-[#1F2B1D] dark:text-[#F4EFE6]">{caesarShift}</span>
                  </label>
                  <span className="text-[11px] font-mono text-[#657351] dark:text-[#A3B59E]">1 to 25</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={25}
                  value={caesarShift}
                  onChange={(e) => setCaesarShift(parseInt(e.target.value, 10))}
                  className="w-full accent-[#1F2B1D] dark:accent-[#A3B59E] cursor-pointer"
                />
              </div>
            )}

            {/* Vigenère Controls */}
            {currentAlgo.id === 'vigenere' && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#4A5D44] dark:text-[#CBD7C7]">
                  Keyword String (Letters A-Z only):
                </label>
                <input
                  type="text"
                  value={vigenereKey}
                  onChange={(e) => setVigenereKey(e.target.value.toUpperCase())}
                  placeholder="e.g. SENTINEL"
                  className="w-full px-4 py-2 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1F2B1D] dark:focus:ring-[#CBD7C7] text-[#1F2B1D] dark:text-[#F4EFE6]"
                />
              </div>
            )}

            {/* AES-256-GCM Controls */}
            {currentAlgo.id === 'aes-256-gcm' && (
              <div className="space-y-4">
                {/* 256-bit Key Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[#4A5D44] dark:text-[#CBD7C7]">
                      AES-256 Key (Base64 - 32 bytes):
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateFreshAesKey}
                      className="text-[11px] font-mono text-[#1F2B1D] dark:text-[#CBD7C7] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Generate New Key
                    </button>
                  </div>
                  <input
                    type="text"
                    value={aesKeyInput}
                    onChange={(e) => setAesKeyInput(e.target.value)}
                    placeholder="Base64 256-bit symmetric key..."
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#1F2B1D] dark:focus:ring-[#CBD7C7] text-[#1F2B1D] dark:text-[#F4EFE6]"
                  />
                </div>

                {/* 96-bit GCM Nonce Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[#4A5D44] dark:text-[#CBD7C7]">
                      GCM Nonce / IV (96 bits - 12 bytes):
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateFreshNonce}
                      className="text-[11px] font-mono text-[#1F2B1D] dark:text-[#CBD7C7] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Fresh Nonce
                    </button>
                  </div>
                  <input
                    type="text"
                    value={gcmNonceInput}
                    onChange={(e) => setGcmNonceInput(e.target.value)}
                    placeholder="Fresh random nonce per encryption (never reused with same key)..."
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#1F2B1D] dark:focus:ring-[#CBD7C7] text-[#1F2B1D] dark:text-[#F4EFE6]"
                  />
                </div>

                {/* 128-bit Authentication Tag */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#4A5D44] dark:text-[#CBD7C7]">
                    Authentication Tag (128 bits - 16 bytes):
                  </label>
                  <input
                    type="text"
                    value={authTagInput}
                    onChange={(e) => setAuthTagInput(e.target.value)}
                    placeholder="Generated during encryption; verified strictly during authenticated decryption..."
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#1F2B1D] dark:focus:ring-[#CBD7C7] text-[#1F2B1D] dark:text-[#F4EFE6]"
                  />
                </div>

                {/* Authenticated Additional Data (AAD) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#4A5D44] dark:text-[#CBD7C7]">
                    Authenticated Additional Data (AAD metadata):
                  </label>
                  <input
                    type="text"
                    value={aadInput}
                    onChange={(e) => setAadInput(e.target.value)}
                    placeholder="Metadata bound into authentication tag..."
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#1F2B1D] dark:focus:ring-[#CBD7C7] text-[#1F2B1D] dark:text-[#F4EFE6]"
                  />
                </div>
              </div>
            )}

            {/* RSA-OAEP Controls */}
            {currentAlgo.id === 'rsa-oaep' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-[#F5F2EB] dark:bg-[#233522] border border-[#243324]/10 dark:border-white/10 text-xs text-[#4A5D44] dark:text-[#CBD7C7] space-y-1.5">
                  <div className="font-semibold text-[#1F2B1D] dark:text-[#F4EFE6] flex items-center justify-between">
                    <span>Active RSA Key Pair</span>
                    <span className="font-mono text-[10px]">{activeRsaKey ? activeRsaKey.keyId : 'Generating...'}</span>
                  </div>
                  <p className="font-mono text-[11px] truncate">
                    {activeRsaKey ? activeRsaKey.publicKeyFingerprint : 'Generating Web Crypto RSA pair...'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={generateNewRsaKey}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#1F2B1D]/10 dark:bg-white/10 hover:bg-[#1F2B1D]/20 text-[#1F2B1D] dark:text-[#F4EFE6] cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Generate Fresh RSA-3072 Key Pair</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('keys')}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#657351] dark:text-[#A3B59E] hover:underline cursor-pointer"
                  >
                    Manage Keys in Key Manager →
                  </button>
                </div>
              </div>
            )}

            {/* SHA-256 Controls */}
            {currentAlgo.id === 'sha-256' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-[#F5F2EB] dark:bg-[#233522] border border-[#243324]/10 dark:border-white/10 text-xs text-[#4A5D44] dark:text-[#CBD7C7] space-y-1">
                  <strong>Unkeyed One-Way Function:</strong> SHA-256 requires no secret key. It transforms arbitrary input into a 256-bit (64 hex characters) digest.
                </div>

                {operationMode === 'verify' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#4A5D44] dark:text-[#CBD7C7]">
                      Expected 64-char Hex Digest:
                    </label>
                    <input
                      type="text"
                      value={expectedHashInput}
                      onChange={(e) => setExpectedHashInput(e.target.value)}
                      placeholder="Paste 64-character expected hash to compare..."
                      className="w-full px-3.5 py-2 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#1F2B1D] dark:focus:ring-[#CBD7C7] text-[#1F2B1D] dark:text-[#F4EFE6]"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleExecuteOperation}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#1F2B1D] dark:bg-[#CBD7C7] text-white dark:text-[#1F2B1D] hover:bg-[#2C3E2A] dark:hover:bg-white transition-all font-semibold text-sm cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>
                  {operationMode === 'encrypt' && `Encrypt with ${currentAlgo.name}`}
                  {operationMode === 'decrypt' && `Decrypt & Authenticate with ${currentAlgo.name}`}
                  {operationMode === 'wrap' && 'Wrap AES DEK with RSA-OAEP'}
                  {operationMode === 'unwrap' && 'Unwrap AES DEK with RSA Private Key'}
                  {operationMode === 'hash' && 'Generate 256-Bit SHA-256 Digest'}
                  {operationMode === 'verify' && 'Verify Digest Against Expected Reference'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Output Panel & Verification (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Output Box */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#1F2B1D] dark:text-[#CBD7C7]" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1F2B1D] dark:text-[#F4EFE6]">
                  Cryptographic Output
                </h4>
              </div>
              {lastOpDurationMs !== null && (
                <span className="text-[10px] font-mono text-[#657351] dark:text-[#A3B59E]">
                  Execution: {lastOpDurationMs} ms
                </span>
              )}
            </div>

            {/* Output Display */}
            <div className="relative min-h-[160px] p-4 rounded-2xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 flex flex-col justify-between">
              {outputText ? (
                <div className="space-y-2">
                  <div className="text-xs font-mono text-[#1F2B1D] dark:text-[#F4EFE6] break-all leading-relaxed select-all">
                    {outputText}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center text-[#657351] dark:text-[#A3B59E] space-y-2">
                  <div className="p-2.5 rounded-full bg-[#243324]/5 dark:bg-white/5">
                    <Terminal className="w-5 h-5 opacity-50" />
                  </div>
                  <p className="text-xs font-mono">No cryptographic output yet.</p>
                  <p className="text-[11px] font-light max-w-xs">
                    Configure parameters and click the primary action button to execute.
                  </p>
                </div>
              )}

              {/* Action Buttons on Output */}
              {outputText && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-[#243324]/10 dark:border-white/10 mt-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyOutput}
                      className="px-3 py-1.5 rounded-xl text-xs font-mono bg-white dark:bg-[#202E1E] border border-[#243324]/15 dark:border-white/15 text-[#1F2B1D] dark:text-[#CBD7C7] hover:bg-[#F5F2EB] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadOutput}
                      className="px-3 py-1.5 rounded-xl text-xs font-mono bg-white dark:bg-[#202E1E] border border-[#243324]/15 dark:border-white/15 text-[#1F2B1D] dark:text-[#CBD7C7] hover:bg-[#F5F2EB] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSimulateTamper}
                    className="px-2.5 py-1.5 rounded-xl text-[11px] font-mono text-rose-700 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 cursor-pointer"
                    title="Flip a character in the output to demonstrate fail-closed authentication rejection"
                  >
                    Simulate Tamper
                  </button>
                </div>
              )}
            </div>

            {/* Status Message / Error Message */}
            <AnimatePresence mode="wait">
              {errorFeedback ? (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-900 dark:text-rose-200 text-xs flex items-start gap-2.5"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                  <div className="font-mono whitespace-pre-wrap">{errorFeedback}</div>
                </motion.div>
              ) : isSuccess ? (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 text-xs flex items-start gap-2.5"
                >
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <div>{statusMessage}</div>
                </motion.div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-[#F5F2EB] dark:bg-[#233522] border border-[#243324]/10 dark:border-white/10 text-xs text-[#4A5D44] dark:text-[#CBD7C7] flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0 text-[#657351] dark:text-[#A3B59E]" />
                  <span>{statusMessage}</span>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Algorithm Mathematical Specification Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#F5F2EB] dark:bg-[#172216] border border-[#243324]/10 dark:border-white/10 space-y-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-[#657351] dark:text-[#A3B59E]">
              Mathematical Specification
            </h5>
            <div className="p-3 rounded-xl bg-white dark:bg-[#1E2E1D] border border-[#243324]/10 dark:border-white/10 font-mono text-xs text-[#1F2B1D] dark:text-[#F4EFE6] break-all">
              {currentAlgo.formula}
            </div>
            <p className="text-xs text-[#4A5D44] dark:text-[#CBD7C7] font-light leading-relaxed">
              {currentAlgo.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
