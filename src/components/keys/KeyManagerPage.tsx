import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Key,
  Shield,
  Copy,
  Check,
  RefreshCw,
  Download,
  AlertTriangle,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Layers,
  ArrowRight,
  Info,
  CheckCircle2,
  FileCode,
} from 'lucide-react';
import { useSessionActivity } from '../../context/SessionContext';
import {
  exportEncryptedPrivateKey,
  importEncryptedPrivateKey,
  EncryptedPrivateKeyEnvelope,
} from '../../utils/crypto';

export const KeyManagerPage: React.FC = () => {
  const {
    activeRsaKey,
    generateNewRsaKey,
    activeAesKeyB64,
    generateNewAesKey,
    incrementSessionOps,
    setActiveTab,
  } = useSessionActivity();

  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isGeneratingRsa, setIsGeneratingRsa] = useState<boolean>(false);

  // Password-Protected Private Key Export State
  const [exportPassphrase, setExportPassphrase] = useState<string>('');
  const [encryptedEnvelope, setEncryptedEnvelope] = useState<EncryptedPrivateKeyEnvelope | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Test Decrypt State
  const [testPassphrase, setTestPassphrase] = useState<string>('');
  const [testDecryptedResult, setTestDecryptedResult] = useState<string | null>(null);
  const [testDecryptError, setTestDecryptError] = useState<string | null>(null);

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleDownloadPublicKey = () => {
    if (!activeRsaKey) return;
    const blob = new Blob([activeRsaKey.publicKeyPem], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeRsaKey.keyId}-public.pem`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadEncryptedKey = () => {
    if (!encryptedEnvelope) return;
    const blob = new Blob([JSON.stringify(encryptedEnvelope, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${encryptedEnvelope.keyId}-encrypted-private.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateRsa = async () => {
    setIsGeneratingRsa(true);
    setEncryptedEnvelope(null);
    setTestDecryptedResult(null);
    setTestDecryptError(null);
    try {
      await generateNewRsaKey();
    } finally {
      setIsGeneratingRsa(false);
    }
  };

  const handleEncryptAndExportPrivateKey = async () => {
    if (!activeRsaKey) return;
    setExportError(null);
    setIsExporting(true);

    try {
      if (!exportPassphrase || exportPassphrase.length < 8) {
        throw new Error('Export passphrase must be at least 8 characters in length.');
      }

      const env = await exportEncryptedPrivateKey(
        activeRsaKey.privateKeyPem,
        exportPassphrase,
        activeRsaKey.keyId
      );

      setEncryptedEnvelope(env);
      incrementSessionOps(1);
    } catch (err: any) {
      setExportError(err.message || 'Key encryption failed.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleTestDecryptPrivateKey = async () => {
    if (!encryptedEnvelope) return;
    setTestDecryptError(null);
    setTestDecryptedResult(null);

    try {
      const recoveredPem = await importEncryptedPrivateKey(encryptedEnvelope, testPassphrase);
      setTestDecryptedResult(recoveredPem);
      incrementSessionOps(1);
    } catch (err: any) {
      setTestDecryptError(err.message || 'Decryption failed closed: Incorrect passphrase.');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#243324]/10 dark:border-white/10 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider bg-[#1F2B1D]/10 dark:bg-white/10 text-[#1F2B1D] dark:text-[#F4EFE6]">
              Key Infrastructure
            </span>
            <span className="text-xs font-mono text-[#657351] dark:text-[#A3B59E]">
              RSA-3072 OAEP & AES-256
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-[#1F2B1D] dark:text-[#F4EFE6] font-normal tracking-tight">
            Cryptographic Key Management
          </h1>
          <p className="text-sm sm:text-base text-[#4A5D44] dark:text-[#CBD7C7] font-light max-w-2xl">
            Generate and manage asymmetric RSA-3072 key pairs for DEK wrapping and export private keys using authenticated PBKDF2 + AES-256-GCM password protection.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('crypto-lab')}
          className="px-4 py-2.5 rounded-full text-xs font-medium bg-[#1F2B1D] dark:bg-[#384E36] text-white hover:bg-[#2c402a] transition-all flex items-center gap-2 shadow-xs cursor-pointer self-start md:self-end"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Test in Crypto Lab</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Main Grid: RSA on Left, AES & Architecture on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: RSA-3072 Key Pair & Encrypted Export (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#243324]/10 dark:border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#F5F2EB] dark:bg-[#233522] text-[#1F2B1D] dark:text-[#CBD7C7]">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-medium text-[#1F2B1D] dark:text-[#F4EFE6]">
                    Active RSA-3072 OAEP Key Pair
                  </h3>
                  <span className="text-[11px] font-mono text-[#657351] dark:text-[#A3B59E]">
                    RFC 8017 / PKCS #1 v2.2 • Modulus: 3072 bits • Hash: SHA-256
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateRsa}
                disabled={isGeneratingRsa}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-[#1F2B1D] dark:bg-[#CBD7C7] text-white dark:text-[#1F2B1D] hover:bg-[#2C3E2A] dark:hover:bg-white transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingRsa ? 'animate-spin' : ''}`} />
                <span>{isGeneratingRsa ? 'Generating 3072-bit Key...' : 'Generate Fresh RSA-3072'}</span>
              </button>
            </div>

            {/* Key Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#F5F2EB] dark:bg-[#131D12] border border-[#243324]/10 dark:border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#657351] dark:text-[#A3B59E]">
                  Key Identifier (Key ID)
                </span>
                <p className="font-mono text-xs font-bold text-[#1F2B1D] dark:text-[#F4EFE6] truncate">
                  {activeRsaKey ? activeRsaKey.keyId : 'Generating...'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F5F2EB] dark:bg-[#131D12] border border-[#243324]/10 dark:border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#657351] dark:text-[#A3B59E]">
                  Public Key SHA-256 Fingerprint
                </span>
                <p className="font-mono text-xs font-bold text-[#1F2B1D] dark:text-[#F4EFE6] truncate">
                  {activeRsaKey ? activeRsaKey.publicKeyFingerprint : 'Calculating...'}
                </p>
              </div>
            </div>

            {/* Public Key Display */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1F2B1D] dark:text-[#F4EFE6]">
                  Public Key (SPKI PEM Format - RSA-3072)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(activeRsaKey?.publicKeyPem || '', 'public')}
                    className="text-xs font-mono text-[#1F2B1D] dark:text-[#CBD7C7] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSection === 'public' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedSection === 'public' ? 'Copied' : 'Copy PEM'}</span>
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={handleDownloadPublicKey}
                    className="text-xs font-mono text-[#1F2B1D] dark:text-[#CBD7C7] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              <pre className="p-4 rounded-2xl bg-[#FBF9F5] dark:bg-[#10190F] border border-[#243324]/15 dark:border-white/15 font-mono text-[11px] text-[#1F2B1D] dark:text-[#CBD7C7] overflow-x-auto max-h-40 leading-relaxed">
                {activeRsaKey ? activeRsaKey.publicKeyPem : 'Loading public key...'}
              </pre>
            </div>

            {/* Genuine Password-Based Private Key Export */}
            <div className="space-y-4 pt-4 border-t border-[#243324]/10 dark:border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#1F2B1D] dark:text-[#F4EFE6]">
                    Password-Based Private Key Export (PKCS#8 + PBKDF2 + AES-GCM)
                  </label>
                </div>
                <p className="text-xs text-[#4A5D44] dark:text-[#CBD7C7] font-light">
                  A simple toggle is not cryptographic protection. Private keys are encrypted using a 256-bit AES key derived from your passphrase via PBKDF2 (100,000 iterations, SHA-256, 16-byte random salt).
                </p>
              </div>

              {/* Passphrase Input & Action */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="password"
                    value={exportPassphrase}
                    onChange={(e) => setExportPassphrase(e.target.value)}
                    placeholder="Enter passphrase to encrypt private key (min 8 chars)..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-[#1F2B1D] dark:focus:ring-[#CBD7C7] text-[#1F2B1D] dark:text-[#F4EFE6]"
                  />
                  <button
                    type="button"
                    onClick={handleEncryptAndExportPrivateKey}
                    disabled={isExporting || !exportPassphrase || exportPassphrase.length < 8}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#1F2B1D] dark:bg-[#CBD7C7] text-white dark:text-[#1F2B1D] hover:bg-[#2C3E2A] dark:hover:bg-white transition-all cursor-pointer shadow-xs disabled:opacity-50 shrink-0"
                  >
                    {isExporting ? 'Deriving & Encrypting...' : 'Encrypt & Export Private Key'}
                  </button>
                </div>

                {exportError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-mono">
                    {exportError}
                  </p>
                )}
              </div>

              {/* Encrypted Envelope Display */}
              <AnimatePresence>
                {encryptedEnvelope && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-5 rounded-2xl bg-[#F5F2EB] dark:bg-[#131D12] border border-[#243324]/10 dark:border-white/10 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Authenticated Encrypted Private Key Envelope</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopy(JSON.stringify(encryptedEnvelope, null, 2), 'envelope')}
                          className="text-xs font-mono text-[#1F2B1D] dark:text-[#CBD7C7] hover:underline cursor-pointer"
                        >
                          {copiedSection === 'envelope' ? 'Copied JSON!' : 'Copy JSON'}
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={handleDownloadEncryptedKey}
                          className="text-xs font-mono text-[#1F2B1D] dark:text-[#CBD7C7] hover:underline cursor-pointer"
                        >
                          Download .json
                        </button>
                      </div>
                    </div>

                    <pre className="p-3.5 rounded-xl bg-white dark:bg-[#0D140C] border border-[#243324]/10 dark:border-white/10 font-mono text-[11px] overflow-x-auto text-[#1F2B1D] dark:text-[#CBD7C7] max-h-40 leading-relaxed">
                      {JSON.stringify(encryptedEnvelope, null, 2)}
                    </pre>

                    {/* Test Decrypt With Passphrase (Negative & Positive Verification) */}
                    <div className="pt-2 border-t border-[#243324]/10 dark:border-white/10 space-y-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#657351] dark:text-[#A3B59E] block">
                        Verify Decryption With Passphrase
                      </span>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="password"
                          value={testPassphrase}
                          onChange={(e) => setTestPassphrase(e.target.value)}
                          placeholder="Enter passphrase to test decryption..."
                          className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-[#1A2619] border border-[#243324]/15 dark:border-white/15 text-xs font-sans text-[#1F2B1D] dark:text-[#F4EFE6]"
                        />
                        <button
                          type="button"
                          onClick={handleTestDecryptPrivateKey}
                          className="px-4 py-2 rounded-xl text-xs font-medium bg-[#1F2B1D] dark:bg-[#384E36] text-white hover:bg-[#2c402a] cursor-pointer shrink-0"
                        >
                          Test Decrypt
                        </button>
                      </div>

                      {testDecryptedResult && (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-200 font-mono flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Decryption verified: Correct passphrase recovered private key.</span>
                        </div>
                      )}

                      {testDecryptError && (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-900 dark:text-rose-200 font-mono flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                          <span>{testDecryptError}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Column: AES-256 Symmetric DEKs & Key Role Concept (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* AES-256 DEK Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#243324]/10 dark:border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#F5F2EB] dark:bg-[#233522] text-[#1F2B1D] dark:text-[#CBD7C7]">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-medium text-[#1F2B1D] dark:text-[#F4EFE6]">
                    Active AES-256 DEK
                  </h3>
                  <span className="text-[11px] font-mono text-[#657351] dark:text-[#A3B59E]">
                    Symmetric Payload Key (256 bits)
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={generateNewAesKey}
                className="text-xs font-mono text-[#1F2B1D] dark:text-[#CBD7C7] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>New DEK</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#657351] dark:text-[#A3B59E]">
                  Base64 Encoded Key (32 bytes):
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(activeAesKeyB64, 'aes')}
                  className="text-xs font-mono text-[#1F2B1D] dark:text-[#CBD7C7] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedSection === 'aes' ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedSection === 'aes' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 font-mono text-xs text-[#1F2B1D] dark:text-[#F4EFE6] break-all select-all">
                {activeAesKeyB64 || 'Generating 256-bit AES key...'}
              </div>
            </div>
          </div>

          {/* Key Roles & Architecture Explanation Card */}
          <div className="p-6 rounded-3xl bg-[#F5F2EB] dark:bg-[#172216] border border-[#243324]/10 dark:border-white/10 space-y-4 text-xs text-[#4A5D44] dark:text-[#CBD7C7] leading-relaxed">
            <h4 className="font-semibold uppercase tracking-wider text-[#1F2B1D] dark:text-[#F4EFE6] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#657351] dark:text-[#A3B59E]" />
              <span>Hybrid Key Role Separation</span>
            </h4>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-white dark:bg-[#1E2E1D] border border-[#243324]/10 dark:border-white/10 space-y-1">
                <strong className="text-[#1F2B1D] dark:text-[#F4EFE6] block">
                  1. Symmetric Data Encryption Key (DEK)
                </strong>
                <p>
                  AES-256-GCM is computationally efficient for high-throughput payload encryption, providing confidentiality and a 128-bit authentication tag.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-[#1E2E1D] border border-[#243324]/10 dark:border-white/10 space-y-1">
                <strong className="text-[#1F2B1D] dark:text-[#F4EFE6] block">
                  2. Asymmetric Key Pair (RSA-3072 OAEP)
                </strong>
                <p>
                  RSA-3072 OAEP encrypts the short 32-byte AES DEK, eliminating the risk of transmitting shared symmetric secrets across untrusted networks.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-[11px] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Zero-Persistence Rule:</strong> Private keys and decrypted plaintext are kept exclusively in volatile browser memory and never written to localStorage or plain text logs.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
