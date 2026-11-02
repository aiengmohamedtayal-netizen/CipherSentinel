import { useLanguage } from '../../context/LanguageContext';
import React, { useState, useEffect, useMemo } from 'react';
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
  Grid3X3,
  Table,
} from 'lucide-react';
import { useSessionActivity } from '../../context/SessionContext';
import {
  validateCaesarShift,
  caesarEncrypt,
  caesarDecrypt,
  rot13Encrypt,
  rot13Decrypt,
  validateAdditiveKey,
  additiveEncrypt,
  additiveDecrypt,
  VALID_MULTIPLICATIVE_KEYS,
  validateMultiplicativeKey,
  multiplicativeEncrypt,
  multiplicativeDecrypt,
  generatePlayfairMatrix,
  playfairEncrypt,
  playfairDecrypt,
  PlayfairResult,
  validateHillMatrix,
  hillEncrypt,
  hillDecrypt,
  HillResult,
  HillMatrix2x2,
  vigenereEncrypt,
  vigenereDecrypt,
  autokeyEncrypt,
  autokeyDecrypt,
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
    formula: 'C = (P + K) mod 26, P = (C - K) mod 26',
    icon: BookOpen,
    isEducational: true,
  },
  {
    id: 'rot13',
    name: 'ROT13',
    category: 'Classical Encryption',
    standard: 'Fixed Shift Involution',
    description: 'Specialized Caesar Cipher with a fixed shift of 13 positions. Self-reciprocal: encryption and decryption use the identical transformation.',
    formula: 'C = (P + 13) mod 26, P = (C + 13) mod 26',
    icon: RefreshCw,
    isEducational: true,
  },
  {
    id: 'additive',
    name: 'Additive Cipher',
    category: 'Classical Encryption',
    standard: 'Modular Shift Addition',
    description: 'Generalized modular shift addition: C = (P + K) mod 26. Mathematically equivalent to the general Caesar cipher with arbitrary integer key.',
    formula: 'C = (P + K) mod 26, P = (C - K) mod 26',
    icon: SlidersHorizontal,
    isEducational: true,
  },
  {
    id: 'multiplicative',
    name: 'Multiplicative Cipher',
    category: 'Classical Encryption',
    standard: 'Modular Multiplication',
    description: 'Monoalphabetic substitution multiplying letter values by a key coprime to 26. Decryption multiplies by modular multiplicative inverse K⁻¹ mod 26.',
    formula: 'C = (P × K) mod 26, P = (C × K⁻¹) mod 26 [gcd(K, 26) = 1]',
    icon: Layers,
    isEducational: true,
  },
  {
    id: 'playfair',
    name: 'Playfair Cipher',
    category: 'Classical Encryption',
    standard: 'Digraph 5×5 Matrix',
    description: 'Polygraphic substitution cipher encrypting digraph letter pairs using a 5×5 key matrix with J merged into I. Handles repeated letters with filler characters.',
    formula: 'Digraph rules: Same Row (+1), Same Column (+1), Rectangle (swap cols)',
    icon: Grid3X3,
    isEducational: true,
  },
  {
    id: 'hill',
    name: 'Hill Cipher',
    category: 'Classical Encryption',
    standard: '2×2 Matrix Modulo 26',
    description: 'Polygraphic block cipher encrypting letter pairs via linear algebra: C = (K × P) mod 26. Invertible only when det(K) is coprime to 26.',
    formula: 'C = (K × P) mod 26, P = (K⁻¹ × C) mod 26, det(K)⁻¹ mod 26',
    icon: Table,
    isEducational: true,
  },
  {
    id: 'vigenere',
    name: 'Vigenère Cipher',
    category: 'Classical Encryption',
    standard: 'Classical Polyalphabetic',
    description: 'Polyalphabetic substitution using a periodic keyword string modulo 26 to shift each letter successively.',
    formula: 'C_i = (P_i + K_i) mod 26, P_i = (C_i - K_i) mod 26',
    icon: SlidersHorizontal,
    isEducational: true,
  },
  {
    id: 'autokey',
    name: 'Autokey Cipher',
    category: 'Classical Encryption',
    standard: 'Plaintext-Autokey Keystream',
    description: 'Polyalphabetic cipher eliminating periodic vulnerability by extending keystream with the recovered plaintext (Plaintext-Autokey variant).',
    formula: 'K_stream = KEYWORD || P, C_i = (P_i + K_stream_i) mod 26',
    icon: Zap,
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
  const { t, formatNumber, localizeError } = useLanguage();
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
  const [caesarShift, setCaesarShift] = useState<number | string>(7);
  const [vigenereKey, setVigenereKey] = useState<string>('SENTINEL');
  const [additiveKey, setAdditiveKey] = useState<number | string>(7);
  const [multiplicativeKey, setMultiplicativeKey] = useState<number | string>(5);
  const [playfairKey, setPlayfairKey] = useState<string>('MONARCHY');
  const [hillMatrix, setHillMatrix] = useState<HillMatrix2x2>([
    [3, 3],
    [2, 5],
  ]);
  const [autokeyKey, setAutokeyKey] = useState<string>('QUEENLY');
  const [playfairMetadata, setPlayfairMetadata] = useState<PlayfairResult | null>(null);
  const [hillMetadata, setHillMetadata] = useState<HillResult | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'classical' | 'modern'>('all');

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

  const currentAlgo = ALGORITHMS.find((a) => a.id === selectedAlgoId) || ALGORITHMS[0];

  const filteredAlgorithms = useMemo(() => {
    return ALGORITHMS.filter((algo) => {
      if (categoryFilter === 'classical') return algo.isEducational;
      if (categoryFilter === 'modern') return !algo.isEducational;
      return true;
    });
  }, [categoryFilter]);

  // Playfair live matrix
  const livePlayfairMatrix = useMemo(() => {
    try {
      return generatePlayfairMatrix(playfairKey || 'MONARCHY').matrix;
    } catch {
      return null;
    }
  }, [playfairKey]);

  // Hill live evaluation
  const liveHillInfo = useMemo(() => {
    try {
      return validateHillMatrix(hillMatrix);
    } catch (err: any) {
      return { error: err.message || 'Invalid matrix' };
    }
  }, [hillMatrix]);

  // Multiplicative live evaluation
  const liveMultiplicativeInfo = useMemo(() => {
    try {
      return validateMultiplicativeKey(multiplicativeKey);
    } catch (err: any) {
      return { error: err.message || 'Invalid key' };
    }
  }, [multiplicativeKey]);

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
        const validatedShift = validateCaesarShift(caesarShift);
        if (operationMode === 'encrypt') {
          const res = caesarEncrypt(inputText, validatedShift);
          setOutputText(res);
          setStatusMessage(`Caesar encrypted successfully with shift k=${validatedShift}.`);
        } else {
          const target = outputText || inputText;
          const res = caesarDecrypt(target, validatedShift);
          setOutputText(res);
          setStatusMessage(`Caesar decrypted successfully with shift k=-${validatedShift}.`);
        }
      } else if (currentAlgo.id === 'rot13') {
        if (operationMode === 'encrypt') {
          const res = rot13Encrypt(inputText);
          setOutputText(res);
          setStatusMessage('ROT13 transformed (fixed shift 13 involution).');
        } else {
          const target = outputText || inputText;
          const res = rot13Decrypt(target);
          setOutputText(res);
          setStatusMessage('ROT13 transformed (fixed shift 13 involution).');
        }
      } else if (currentAlgo.id === 'additive') {
        const validatedK = validateAdditiveKey(additiveKey);
        if (operationMode === 'encrypt') {
          const res = additiveEncrypt(inputText, validatedK);
          setOutputText(res);
          setStatusMessage(`Additive cipher encrypted with key k=${validatedK}.`);
        } else {
          const target = outputText || inputText;
          const res = additiveDecrypt(target, validatedK);
          setOutputText(res);
          setStatusMessage(`Additive cipher decrypted with key k=-${validatedK}.`);
        }
      } else if (currentAlgo.id === 'multiplicative') {
        const { normalizedKey, inverseKey } = validateMultiplicativeKey(multiplicativeKey);
        if (operationMode === 'encrypt') {
          const res = multiplicativeEncrypt(inputText, normalizedKey);
          setOutputText(res);
          setStatusMessage(`Multiplicative encrypted with key k=${normalizedKey} (inverse k⁻¹=${inverseKey}).`);
        } else {
          const target = outputText || inputText;
          const res = multiplicativeDecrypt(target, normalizedKey);
          setOutputText(res);
          setStatusMessage(`Multiplicative decrypted with inverse key k⁻¹=${inverseKey}.`);
        }
      } else if (currentAlgo.id === 'playfair') {
        if (operationMode === 'encrypt') {
          const res = playfairEncrypt(inputText, playfairKey);
          setOutputText(res.ciphertext);
          setPlayfairMetadata(res);
          setStatusMessage('Playfair encrypted into digraph pairs with 5×5 key matrix.');
        } else {
          const target = outputText || inputText;
          const res = playfairDecrypt(target, playfairKey);
          setOutputText(res.ciphertext);
          setPlayfairMetadata(res);
          setStatusMessage('Playfair decrypted from digraph pairs with 5×5 key matrix.');
        }
      } else if (currentAlgo.id === 'hill') {
        if (operationMode === 'encrypt') {
          const res = hillEncrypt(inputText, hillMatrix);
          setOutputText(res.ciphertext);
          setHillMetadata(res);
          setStatusMessage(`Hill cipher encrypted 2×2 blocks (det=${res.determinant}, det⁻¹=${res.determinantInverse}).`);
        } else {
          const target = outputText || inputText;
          const res = hillDecrypt(target, hillMatrix);
          setOutputText(res.ciphertext);
          setHillMetadata(res);
          setStatusMessage('Hill cipher decrypted 2×2 blocks with modular inverse matrix.');
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
      } else if (currentAlgo.id === 'autokey') {
        if (operationMode === 'encrypt') {
          const res = autokeyEncrypt(inputText, autokeyKey);
          setOutputText(res);
          setStatusMessage(`Autokey encrypted with keyword "${autokeyKey.toUpperCase()}" using Plaintext Autokey extension.`);
        } else {
          const target = outputText || inputText;
          const res = autokeyDecrypt(target, autokeyKey);
          setOutputText(res);
          setStatusMessage(`Autokey decrypted with keyword "${autokeyKey.toUpperCase()}" via recovered plaintext.`);
        }
      } else if (currentAlgo.id === 'aes-256-gcm') {
        const key = aesKeyInput.trim() || activeAesKeyB64;
        if (!key) throw new Error('A 256-bit AES key is required.');

        if (operationMode === 'encrypt') {
          // Nonce generation: fresh 96-bit nonce for each encryption!
          const result = await aesGcmEncrypt(inputText, key, aadInput.trim() || undefined);
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
              {t("Interactive GUI Workspace")}</span>
            <span className="text-xs font-mono text-[#657351] dark:text-[#A3B59E]">
              {t("Web Crypto API Native")}</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-[#1F2B1D] dark:text-[#F4EFE6] font-normal tracking-tight">
            {t("Cryptographic Operations Laboratory")}</h1>
          <p className="text-sm sm:text-base text-[#4A5D44] dark:text-[#CBD7C7] font-light max-w-2xl">
            {t("Select an algorithm, provide parameters, and execute genuine client-side encryption, authenticated decryption, key wrapping, and hashing operations.")}</p>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('hybrid')}
          className="px-4 py-2.5 rounded-full text-xs font-medium bg-[#1F2B1D] dark:bg-[#384E36] text-white hover:bg-[#2c402a] transition-all flex items-center gap-2 shadow-xs cursor-pointer self-start md:self-end"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{t("Launch Hybrid Workflow")}</span>
          <ArrowRight className="w-3 h-3 rtl-mirror" />
        </button>
      </div>

      {/* Algorithm Selector Grid */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#657351] dark:text-[#A3B59E]">
            {t("1. Select Cryptographic Algorithm")}
          </label>
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F5F2EB] dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 w-fit">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-[#1F2B1D] dark:bg-[#384E36] text-white shadow-xs'
                  : 'text-[#4A5D44] dark:text-[#CBD7C7] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {t("All Algorithms")} ({ALGORITHMS.length})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('classical')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                categoryFilter === 'classical'
                  ? 'bg-[#1F2B1D] dark:bg-[#384E36] text-white shadow-xs'
                  : 'text-[#4A5D44] dark:text-[#CBD7C7] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {t("Classical (8)")}
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('modern')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                categoryFilter === 'modern'
                  ? 'bg-[#1F2B1D] dark:bg-[#384E36] text-white shadow-xs'
                  : 'text-[#4A5D44] dark:text-[#CBD7C7] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {t("Modern (3)")}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {filteredAlgorithms.map((algo) => {
            const Icon = algo.icon;
            const isSelected = algo.id === selectedAlgoId;
            return (
              <button
                key={algo.id}
                type="button"
                onClick={() => handleSelectAlgorithm(algo.id)}
                className={`p-3.5 sm:p-4 rounded-2xl text-start border transition-all cursor-pointer flex flex-col justify-between ${
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
                    {t(algo.category)}
                  </span>
                </div>
                <div>
                  <h3 className="font-display text-base font-medium leading-tight">{t(algo.name)}</h3>
                  <p
                    className={`text-[11px] font-mono mt-1 ${
                      isSelected ? 'text-white/80' : 'text-[#657351] dark:text-[#A3B59E]'
                    }`}
                  >
                    {t(algo.standard)}
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
            <strong>{t("Educational Only:")}</strong> {t('{{algorithm}} is a historical cipher vulnerable to frequency analysis and brute-force key search. Not suitable for modern confidential communication.', { algorithm: t(currentAlgo.name) })}</div>
        </div>
      )}

      {/* Main 2-Column Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Input & Key Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Operation Selector Tabs */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#657351] dark:text-[#A3B59E]">
              {t("2. Select Operation")}</label>
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
                    {t("Encrypt Message")}</button>
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
                    {t("Decrypt Message")}</button>
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
                    {t("Wrap AES DEK")}</button>
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
                    {t("Unwrap AES DEK")}</button>
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
                    {t("Generate Hash")}</button>
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
                    {t("Verify Against Expected")}</button>
                </>
              )}
            </div>
          </div>

          {/* Input Textarea Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#1F2B1D] dark:text-[#F4EFE6]">
                {t("3. Input Message / Payload")}</label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-[#657351] dark:text-[#A3B59E]">
                  {formatNumber(inputText.length)} {t("chars")}</span>
                <button
                  type="button"
                  onClick={() => setInputText('')}
                  className="text-[11px] text-[#657351] hover:text-[#1F2B1D] dark:text-[#A3B59E] dark:hover:text-[#F4EFE6] underline cursor-pointer"
                >
                  {t("Clear")}</button>
              </div>
            </div>

            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t("Enter message text, ciphertext string, or DEK to process...")}
              dir="auto"
              className="w-full p-3.5 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1F2B1D] dark:focus:ring-[#CBD7C7] text-[#1F2B1D] dark:text-[#F4EFE6] leading-relaxed resize-y"
            />

            {/* Quick Sample Input Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-mono text-[#657351] dark:text-[#A3B59E]">{t("Samples:")}</span>
              {SAMPLE_INPUTS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInputText(s.text)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-[#F5F2EB] dark:bg-[#233522] text-[#1F2B1D] dark:text-[#CBD7C7] hover:bg-[#eae5da] cursor-pointer transition-colors"
                >
                  {t(s.label)}
                </button>
              ))}
            </div>
          </div>

          {/* Algorithm-Specific Dynamic Key Controls */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 shadow-xs space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1F2B1D] dark:text-[#F4EFE6] flex items-center justify-between">
              <span>{t("4. Algorithm Parameters & Key Controls")}</span>
              <span className="text-[10px] font-mono text-[#657351] dark:text-[#A3B59E]">
                {t(currentAlgo.name)}
              </span>
            </h4>

            {/* Caesar Controls */}
            {currentAlgo.id === 'caesar' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#4A5D44] dark:text-[#CBD7C7]">
                    {t("Shift Key (k):")}{typeof caesarShift === 'number' && Number.isFinite(caesarShift) ? (
                      <span className="font-mono font-bold text-[#1F2B1D] dark:text-[#F4EFE6] ml-1.5 rtl:mr-1.5" dir="ltr">
                        <bdi>{formatNumber(caesarShift)}</bdi>
                      </span>
                    ) : (
                      <span className="font-mono font-bold text-[#1F2B1D] dark:text-[#F4EFE6] ml-1.5 rtl:mr-1.5" dir="ltr">
                        <bdi>{String(caesarShift)}</bdi>
                      </span>
                    )}
                  </label>
                  <span className="text-[11px] font-mono text-[#657351] dark:text-[#A3B59E]">{t("1 to 25")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={25}
                    value={
                      typeof caesarShift === 'number' && Number.isInteger(caesarShift) && caesarShift >= 1 && caesarShift <= 25
                        ? caesarShift
                        : typeof caesarShift === 'string' && /^-?\d+$/.test(caesarShift.trim()) && Number(caesarShift.trim()) >= 1 && Number(caesarShift.trim()) <= 25
                          ? Number(caesarShift.trim())
                          : 7
                    }
                    onChange={(e) => setCaesarShift(Number(e.target.value))}
                    className="flex-1 accent-[#1F2B1D] dark:accent-[#A3B59E] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={caesarShift}
                    onChange={(e) => setCaesarShift(e.target.value)}
                    placeholder="7"
                    aria-label={t("Shift Key (k):")}
                    className="w-20 px-3 py-1.5 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 text-xs sm:text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-[#1F2B1D] dark:focus:ring-[#CBD7C7] text-[#1F2B1D] dark:text-[#F4EFE6]"
                  />
                </div>
              </div>
            )}

            {/* ROT13 Controls */}
            {currentAlgo.id === 'rot13' && (
              <div className="p-4 rounded-2xl bg-[#F5F2EB] dark:bg-[#233522] border border-[#243324]/10 dark:border-white/10 text-xs text-[#4A5D44] dark:text-[#CBD7C7] space-y-2">
                <div className="font-semibold text-[#1F2B1D] dark:text-[#F4EFE6] flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t("Fixed Shift Involution Notice:")}</span>
                </div>
                <p className="leading-relaxed">
                  {t("ROT13 is a fixed-shift (k=13) Caesar cipher. No key input is required. Encryption and decryption are identical involutions.")}
                </p>
                <div className="font-mono text-[11px] bg-white/60 dark:bg-black/20 p-2 rounded-lg" dir="ltr">
                  C = (P + 13) mod 26 &nbsp;|&nbsp; P = (C + 13) mod 26
                </div>
              </div>
            )}

            {/* Additive Controls */}
            {currentAlgo.id === 'additive' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#4A5D44] dark:text-[#CBD7C7]">
                    {t("Numeric Key (K):")}{typeof additiveKey === 'number' && Number.isFinite(additiveKey) ? (
                      <span className="font-mono font-bold text-[#1F2B1D] dark:text-[#F4EFE6] ml-1.5 rtl:mr-1.5" dir="ltr">
                        <bdi>{formatNumber(additiveKey)}</bdi>
                      </span>
                    ) : (
                      <span className="font-mono font-bold text-[#1F2B1D] dark:text-[#F4EFE6] ml-1.5 rtl:mr-1.5" dir="ltr">
                        <bdi>{String(additiveKey)}</bdi>
                      </span>
                    )}
                  </label>
                  <span className="text-[11px] font-mono text-[#657351] dark:text-[#A3B59E]">{t("0 to 25")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={25}
                    value={
                      typeof additiveKey === 'number' && Number.isInteger(additiveKey) && additiveKey >= 0 && additiveKey <= 25
                        ? additiveKey
                        : typeof additiveKey === 'string' && /^-?\d+$/.test(additiveKey.trim()) && Number(additiveKey.trim()) >= 0 && Number(additiveKey.trim()) <= 25
                          ? Number(additiveKey.trim())
                          : 7
                    }
                    onChange={(e) => setAdditiveKey(Number(e.target.value))}
                    className="flex-1 accent-[#1F2B1D] dark:accent-[#A3B59E] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={additiveKey}
                    onChange={(e) => setAdditiveKey(e.target.value)}
                    placeholder="7"
                    aria-label={t("Numeric Key (K):")}
                    className="w-20 px-3 py-1.5 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 text-xs sm:text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-[#1F2B1D] dark:focus:ring-[#CBD7C7] text-[#1F2B1D] dark:text-[#F4EFE6]"
                  />
                </div>
                <p className="text-[11px] text-[#657351] dark:text-[#A3B59E]">
                  {t("Mathematically equivalent to Caesar Cipher (shift addition modulo 26).")}
                </p>
              </div>
            )}

            {/* Multiplicative Controls */}
            {currentAlgo.id === 'multiplicative' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#4A5D44] dark:text-[#CBD7C7]">
                    {t("Coprime Key (K):")}
                  </label>
                  {'inverseKey' in liveMultiplicativeInfo && (
                    <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400" dir="ltr">
                      {t("Modular Inverse (K⁻¹ mod 26):")} <strong>{liveMultiplicativeInfo.inverseKey}</strong>
                    </span>
                  )}
                  {'error' in liveMultiplicativeInfo && (
                    <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400">
                      {t("Invalid Key: gcd(K, 26) must be 1.")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={multiplicativeKey}
                    onChange={(e) => setMultiplicativeKey(e.target.value)}
                    placeholder="5"
                    aria-label={t("Coprime Key (K):")}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1F2B1D] dark:focus:ring-[#CBD7C7] text-[#1F2B1D] dark:text-[#F4EFE6]"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono text-[#657351] dark:text-[#A3B59E]">
                    {t("Coprime Keys with 26:")}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {VALID_MULTIPLICATIVE_KEYS.map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setMultiplicativeKey(k)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-mono cursor-pointer transition-colors ${
                          Number(multiplicativeKey) === k
                            ? 'bg-[#1F2B1D] text-white dark:bg-[#CBD7C7] dark:text-[#1F2B1D] font-bold'
                            : 'bg-[#F5F2EB] dark:bg-[#233522] text-[#1F2B1D] dark:text-[#CBD7C7] hover:bg-[#eae5da]'
                        }`}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Playfair Controls */}
            {currentAlgo.id === 'playfair' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#4A5D44] dark:text-[#CBD7C7]">
                    {t("Playfair Keyword:")}
                  </label>
                  <input
                    type="text"
                    value={playfairKey}
                    onChange={(e) => setPlayfairKey(e.target.value.toUpperCase())}
                    placeholder="MONARCHY"
                    aria-label={t("Playfair Keyword:")}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1F2B1D] dark:focus:ring-[#CBD7C7] text-[#1F2B1D] dark:text-[#F4EFE6]"
                  />
                </div>
                <p className="text-[11px] text-[#657351] dark:text-[#A3B59E] leading-relaxed">
                  {t("Letter J is merged into I. Duplicate letters are omitted.")}
                  {' '}{t("Filler rule: Repeated letters in a pair use X (or Q). Odd length padded with X.")}
                </p>
                {/* 5x5 Key Matrix Visual Display */}
                {livePlayfairMatrix && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#657351] dark:text-[#A3B59E]">
                      {t("Playfair 5×5 Key Matrix:")}
                    </span>
                    <div className="grid grid-cols-5 gap-1.5 max-w-[220px] p-2.5 rounded-xl bg-[#F5F2EB] dark:bg-[#233522] border border-[#243324]/10 dark:border-white/10" dir="ltr">
                      {livePlayfairMatrix.flat().map((char, idx) => (
                        <div
                          key={idx}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-[#1A2619] border border-[#243324]/15 dark:border-white/15 font-mono text-xs font-bold text-[#1F2B1D] dark:text-[#F4EFE6]"
                        >
                          {char}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Hill Controls */}
            {currentAlgo.id === 'hill' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[#4A5D44] dark:text-[#CBD7C7]">
                      {t("Hill 2×2 Key Matrix (K):")}
                    </label>
                    <span className="text-[11px] font-mono text-[#657351] dark:text-[#A3B59E]">
                      mod 26
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-w-[200px]" dir="ltr">
                    <input
                      type="number"
                      value={hillMatrix[0][0]}
                      onChange={(e) => setHillMatrix([[Number(e.target.value) || 0, hillMatrix[0][1]], hillMatrix[1]])}
                      className="p-2 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 text-center font-mono text-sm text-[#1F2B1D] dark:text-[#F4EFE6]"
                      aria-label="K[0][0]"
                    />
                    <input
                      type="number"
                      value={hillMatrix[0][1]}
                      onChange={(e) => setHillMatrix([[hillMatrix[0][0], Number(e.target.value) || 0], hillMatrix[1]])}
                      className="p-2 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 text-center font-mono text-sm text-[#1F2B1D] dark:text-[#F4EFE6]"
                      aria-label="K[0][1]"
                    />
                    <input
                      type="number"
                      value={hillMatrix[1][0]}
                      onChange={(e) => setHillMatrix([hillMatrix[0], [Number(e.target.value) || 0, hillMatrix[1][1]]])}
                      className="p-2 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 text-center font-mono text-sm text-[#1F2B1D] dark:text-[#F4EFE6]"
                      aria-label="K[1][0]"
                    />
                    <input
                      type="number"
                      value={hillMatrix[1][1]}
                      onChange={(e) => setHillMatrix([hillMatrix[0], [hillMatrix[1][0], Number(e.target.value) || 0]])}
                      className="p-2 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 text-center font-mono text-sm text-[#1F2B1D] dark:text-[#F4EFE6]"
                      aria-label="K[1][1]"
                    />
                  </div>
                </div>

                {/* Matrix Status & Invertibility */}
                {'determinant' in liveHillInfo ? (
                  <div className="p-3 rounded-xl bg-[#F5F2EB] dark:bg-[#233522] border border-[#243324]/10 dark:border-white/10 text-xs space-y-1">
                    <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-mono">
                      <span>{t("Determinant: det(K) = {{det}}", { det: liveHillInfo.determinant })}</span>
                      <span>det⁻¹ = {liveHillInfo.determinantInverse}</span>
                    </div>
                    <div className="text-[11px] text-[#4A5D44] dark:text-[#CBD7C7]">
                      {t("Modular Inverse Matrix (K⁻¹ mod 26):")}
                      <span className="font-mono ml-1 font-bold" dir="ltr">
                        [[{liveHillInfo.inverseMatrix[0][0]}, {liveHillInfo.inverseMatrix[0][1]}], [{liveHillInfo.inverseMatrix[1][0]}, {liveHillInfo.inverseMatrix[1][1]}]]
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-mono">
                    {t("Matrix is non-invertible: gcd({{det}}, 26) ≠ 1", { det: 'det' })}
                  </div>
                )}

                {/* Hill Presets */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono text-[#657351] dark:text-[#A3B59E]">
                    {t("Preset Matrices:")}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'det=9', matrix: [[3, 3], [2, 5]] as HillMatrix2x2 },
                      { label: 'det=1', matrix: [[5, 8], [17, 3]] as HillMatrix2x2 },
                      { label: 'det=11', matrix: [[9, 4], [5, 7]] as HillMatrix2x2 },
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setHillMatrix(p.matrix)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-[#F5F2EB] dark:bg-[#233522] text-[#1F2B1D] dark:text-[#CBD7C7] hover:bg-[#eae5da] cursor-pointer"
                      >
                        {p.label}: [[{p.matrix[0].join(',')}] [{p.matrix[1].join(',')}]]
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Vigenère Controls */}
            {currentAlgo.id === 'vigenere' && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#4A5D44] dark:text-[#CBD7C7]">
                  {t("Keyword String (Letters A-Z only):")}</label>
                <input
                  type="text"
                  value={vigenereKey}
                  onChange={(e) => setVigenereKey(e.target.value.toUpperCase())}
                  placeholder={t("e.g. SENTINEL")}
                  className="w-full px-4 py-2 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1F2B1D] dark:focus:ring-[#CBD7C7] text-[#1F2B1D] dark:text-[#F4EFE6]"
                />
              </div>
            )}

            {/* Autokey Controls */}
            {currentAlgo.id === 'autokey' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#4A5D44] dark:text-[#CBD7C7]">
                    {t("Autokey Keyword:")}
                  </label>
                  <input
                    type="text"
                    value={autokeyKey}
                    onChange={(e) => setAutokeyKey(e.target.value.toUpperCase())}
                    placeholder="QUEENLY"
                    aria-label={t("Autokey Keyword:")}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1F2B1D] dark:focus:ring-[#CBD7C7] text-[#1F2B1D] dark:text-[#F4EFE6]"
                  />
                </div>
                <div className="p-3 rounded-xl bg-[#F5F2EB] dark:bg-[#233522] border border-[#243324]/10 dark:border-white/10 text-xs text-[#4A5D44] dark:text-[#CBD7C7]">
                  <strong>{t("Variant: Plaintext-Autokey (keystream extended with plaintext characters)")}</strong>
                  <div className="font-mono text-[11px] mt-1 text-[#1F2B1D] dark:text-[#F4EFE6]" dir="ltr">
                    K_stream = KEYWORD || P
                  </div>
                </div>
              </div>
            )}

            {/* AES-256-GCM Controls */}
            {currentAlgo.id === 'aes-256-gcm' && (
              <div className="space-y-4">
                {/* 256-bit Key Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[#4A5D44] dark:text-[#CBD7C7]">
                      {t("AES-256 Key (Base64 - 32 bytes):")}</label>
                    <button
                      type="button"
                      onClick={handleGenerateFreshAesKey}
                      className="text-[11px] font-mono text-[#1F2B1D] dark:text-[#CBD7C7] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      {t("Generate New Key")}</button>
                  </div>
                  <input
                    type="text"
                    value={aesKeyInput}
                    onChange={(e) => setAesKeyInput(e.target.value)}
                    placeholder={t("Base64 256-bit symmetric key...")}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#1F2B1D] dark:focus:ring-[#CBD7C7] text-[#1F2B1D] dark:text-[#F4EFE6]"
                  />
                </div>

                {/* 96-bit GCM Nonce Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[#4A5D44] dark:text-[#CBD7C7]">
                      {t("GCM Nonce / IV (96 bits - 12 bytes):")}{operationMode === 'encrypt' ? t('Freshly generated') : t('for decryption')}
                    </label>
                    {operationMode === 'decrypt' && <button
                      type="button"
                      onClick={handleGenerateFreshNonce}
                      className="text-[11px] font-mono text-[#1F2B1D] dark:text-[#CBD7C7] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      {t("Fresh Nonce")}</button>}
                  </div>
                  <input
                    type="text"
                    value={gcmNonceInput}
                    onChange={(e) => setGcmNonceInput(e.target.value)}
                    readOnly={operationMode === 'encrypt'}
                    placeholder={t("Fresh random nonce per encryption (never reused with same key)...")}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#1F2B1D] dark:focus:ring-[#CBD7C7] text-[#1F2B1D] dark:text-[#F4EFE6]"
                  />
                </div>

                {/* 128-bit Authentication Tag */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#4A5D44] dark:text-[#CBD7C7]">
                    {t("Authentication Tag (128 bits - 16 bytes):")}</label>
                  <input
                    type="text"
                    value={authTagInput}
                    onChange={(e) => setAuthTagInput(e.target.value)}
                    placeholder={t("Generated during encryption; verified strictly during authenticated decryption...")}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#1F2B1D] dark:focus:ring-[#CBD7C7] text-[#1F2B1D] dark:text-[#F4EFE6]"
                  />
                </div>

                {/* Authenticated Additional Data (AAD) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#4A5D44] dark:text-[#CBD7C7]">
                    {t("Authenticated Additional Data (AAD metadata):")}</label>
                  <input
                    type="text"
                    value={aadInput}
                    onChange={(e) => setAadInput(e.target.value)}
                    placeholder={t("Metadata bound into authentication tag...")}
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
                    <span>{t("Active RSA Key Pair")}</span>
                    <span className="font-mono text-[10px]" dir="ltr"><bdi>{activeRsaKey ? activeRsaKey.keyId : t('Generating...')}</bdi></span>
                  </div>
                  <p className="font-mono text-[11px] truncate">
                    <bdi dir="ltr">{activeRsaKey ? activeRsaKey.publicKeyFingerprint : t('Generating Web Crypto RSA pair...')}</bdi>
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={generateNewRsaKey}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#1F2B1D]/10 dark:bg-white/10 hover:bg-[#1F2B1D]/20 text-[#1F2B1D] dark:text-[#F4EFE6] cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{t("Generate Fresh RSA-3072 Key Pair")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('keys')}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#657351] dark:text-[#A3B59E] hover:underline cursor-pointer"
                  >
                    {t("Manage Keys in Key Manager →")}</button>
                </div>
              </div>
            )}

            {/* SHA-256 Controls */}
            {currentAlgo.id === 'sha-256' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-[#F5F2EB] dark:bg-[#233522] border border-[#243324]/10 dark:border-white/10 text-xs text-[#4A5D44] dark:text-[#CBD7C7] space-y-1">
                  <strong>{t("Unkeyed One-Way Function:")}</strong> {t("SHA-256 requires no secret key. It transforms arbitrary input into a 256-bit (64 hex characters) digest.")}</div>

                {operationMode === 'verify' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#4A5D44] dark:text-[#CBD7C7]">
                      {t("Expected 64-char Hex Digest:")}</label>
                    <input
                      type="text"
                      value={expectedHashInput}
                      onChange={(e) => setExpectedHashInput(e.target.value)}
                      placeholder={t("Paste 64-character expected hash to compare...")}
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
                  {operationMode === 'encrypt' && t('Encrypt with {{algorithm}}', { algorithm: t(currentAlgo.name) })}
                  {operationMode === 'decrypt' && t('Decrypt & Authenticate with {{algorithm}}', { algorithm: t(currentAlgo.name) })}
                  {operationMode === 'wrap' && t('Wrap AES DEK with RSA-OAEP')}
                  {operationMode === 'unwrap' && t('Unwrap AES DEK with RSA Private Key')}
                  {operationMode === 'hash' && t('Generate 256-Bit SHA-256 Digest')}
                  {operationMode === 'verify' && t('Verify Digest Against Expected Reference')}
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
                  {t("Cryptographic Output")}</h4>
              </div>
              {lastOpDurationMs !== null && (
                <span className="text-[10px] font-mono text-[#657351] dark:text-[#A3B59E]">
                  {t("Execution:")}{formatNumber(lastOpDurationMs)} {t("ms")}</span>
              )}
            </div>

            {/* Output Display */}
            <div className="relative min-h-[160px] p-4 rounded-2xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 flex flex-col justify-between">
              {outputText ? (
                <div className="space-y-2">
                  <div
                    dir={
                      ['caesar', 'rot13', 'additive', 'multiplicative', 'playfair', 'hill', 'vigenere', 'autokey'].includes(selectedAlgoId) ||
                      (selectedAlgoId === 'aes-256-gcm' && operationMode === 'decrypt')
                        ? 'auto'
                        : 'ltr'
                    }
                    className="text-xs font-mono text-[#1F2B1D] dark:text-[#F4EFE6] break-all leading-relaxed select-all"
                  >
                    <bdi>{outputText}</bdi>
                  </div>

                  {/* Playfair Digraphs Display */}
                  {selectedAlgoId === 'playfair' && playfairMetadata && (
                    <div className="mt-3 p-3 rounded-xl bg-white dark:bg-[#1E2E1D] border border-[#243324]/10 dark:border-white/10 text-xs font-mono space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[#657351] dark:text-[#A3B59E]">
                        {t("Prepared Digraph Pairs:")}
                      </span>
                      <div className="flex flex-wrap gap-1.5 text-xs font-bold" dir="ltr">
                        {playfairMetadata.preparedDigraphs.map(([a, b], idx) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded bg-[#F5F2EB] dark:bg-[#2a3e28] text-[#1F2B1D] dark:text-[#F4EFE6]">
                            {a}{b}
                          </span>
                        ))}
                      </div>
                      {operationMode === 'decrypt' && (
                        <p className="text-[10px] text-[#657351] dark:text-[#A3B59E] mt-1">
                          {t("Raw Decrypted Output (retains padding & fillers)")}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Hill Metadata Display */}
                  {selectedAlgoId === 'hill' && hillMetadata && (
                    <div className="mt-3 p-3 rounded-xl bg-white dark:bg-[#1E2E1D] border border-[#243324]/10 dark:border-white/10 text-xs font-mono space-y-1">
                      <div className="flex justify-between text-[11px]" dir="ltr">
                        <span>det(K) = {hillMetadata.determinant}</span>
                        <span>det⁻¹ = {hillMetadata.determinantInverse}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center text-[#657351] dark:text-[#A3B59E] space-y-2">
                  <div className="p-2.5 rounded-full bg-[#243324]/5 dark:bg-white/5">
                    <Terminal className="w-5 h-5 opacity-50" />
                  </div>
                  <p className="text-xs font-mono">{t("No cryptographic output yet.")}</p>
                  <p className="text-[11px] font-light max-w-xs">
                    {t("Configure parameters and click the primary action button to execute.")}</p>
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
                      <span>{t(copied ? 'Copied' : 'Copy')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadOutput}
                      className="px-3 py-1.5 rounded-xl text-xs font-mono bg-white dark:bg-[#202E1E] border border-[#243324]/15 dark:border-white/15 text-[#1F2B1D] dark:text-[#CBD7C7] hover:bg-[#F5F2EB] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{t("Export")}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSimulateTamper}
                    className="px-2.5 py-1.5 rounded-xl text-[11px] font-mono text-rose-700 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 cursor-pointer"
                    title={t("Flip a character in the output to demonstrate fail-closed authentication rejection")}
                  >
                    {t("Simulate Tamper")}</button>
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
                  <div className="font-mono whitespace-pre-wrap">{localizeError(errorFeedback)}</div>
                </motion.div>
              ) : isSuccess ? (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 text-xs flex items-start gap-2.5"
                >
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <div>{t(statusMessage)}</div>
                </motion.div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-[#F5F2EB] dark:bg-[#233522] border border-[#243324]/10 dark:border-white/10 text-xs text-[#4A5D44] dark:text-[#CBD7C7] flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0 text-[#657351] dark:text-[#A3B59E]" />
                  <span>{t(statusMessage)}</span>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Algorithm Mathematical Specification Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#F5F2EB] dark:bg-[#172216] border border-[#243324]/10 dark:border-white/10 space-y-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-[#657351] dark:text-[#A3B59E]">
              {t("Mathematical Specification")}</h5>
            <div className="p-3 rounded-xl bg-white dark:bg-[#1E2E1D] border border-[#243324]/10 dark:border-white/10 font-mono text-xs text-[#1F2B1D] dark:text-[#F4EFE6] break-all">
              <bdi dir="ltr">{currentAlgo.formula}</bdi>
            </div>
            <p className="text-xs text-[#4A5D44] dark:text-[#CBD7C7] font-light leading-relaxed">
              {t(currentAlgo.description)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

