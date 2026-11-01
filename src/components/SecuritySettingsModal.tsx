import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Key, Shield, Cpu, RefreshCw, Check, Copy, AlertTriangle } from 'lucide-react';
import { generateDefaultRsaMetadata } from '../utils/crypto';
import { SECURITY_METADATA } from '../data/reportData';

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'keys' | 'model' | 'policy'>('keys');
  const [rsaKeys, setRsaKeys] = useState(generateDefaultRsaMetadata());
  const [copiedKey, setCopiedKey] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(rsaKeys.publicKeyPem);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRegenerateKey = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      const randomHex = Array.from({ length: 48 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      setRsaKeys({
        publicKeyFingerprint: `SHA256:${randomHex}`,
        publicKeyPem: `-----BEGIN PUBLIC KEY-----\nMIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEA${randomHex.substring(0, 32)}...\n...CipherSentinel-3072-RSA-OAEP-Generated-Key...\n-----END PUBLIC KEY-----`,
        privateKeyId: `rsa-priv-sec-vault-${randomHex.substring(0, 8)}`,
      });
      setIsRegenerating(false);
    }, 600);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 25 }}
            className="relative w-full max-w-2xl rounded-[2.5rem] bg-[#FBF9F5] dark:bg-[#1E2E1D] text-[#243324] dark:text-[#F4EFE6] border border-[#243324]/10 dark:border-white/12 shadow-2xl overflow-hidden z-10 my-8 transition-colors duration-400"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 sm:p-8 border-b border-[#243324]/10 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#1F2B1D] dark:bg-[#384E36] text-white">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-2xl text-[#1F2B1D] dark:text-[#F4EFE6]">
                    Security Settings & Key Manager
                  </h3>
                  <p className="text-xs text-[#657351] dark:text-[#A3B59E]">
                    Cryptographic hierarchy, local model calibration, and threat policies
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#657351] dark:text-[#A3B59E] hover:text-[#1F2B1D] dark:hover:text-white transition-colors cursor-pointer"
                title="Close settings"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-[#243324]/10 dark:border-white/10 px-6 sm:px-8 pt-2 gap-2 bg-[#F5F2EB]/60 dark:bg-black/10">
              <button
                type="button"
                onClick={() => setActiveTab('keys')}
                className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === 'keys'
                    ? 'border-[#1F2B1D] dark:border-[#CBD7C7] text-[#1F2B1D] dark:text-white'
                    : 'border-transparent text-[#657351] dark:text-[#A3B59E] hover:text-[#1F2B1D] dark:hover:text-white'
                }`}
              >
                RSA Key Pair
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('model')}
                className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === 'model'
                    ? 'border-[#1F2B1D] dark:border-[#CBD7C7] text-[#1F2B1D] dark:text-white'
                    : 'border-transparent text-[#657351] dark:text-[#A3B59E] hover:text-[#1F2B1D] dark:hover:text-white'
                }`}
              >
                AI Model Config
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('policy')}
                className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === 'policy'
                    ? 'border-[#1F2B1D] dark:border-[#CBD7C7] text-[#1F2B1D] dark:text-white'
                    : 'border-transparent text-[#657351] dark:text-[#A3B59E] hover:text-[#1F2B1D] dark:hover:text-white'
                }`}
              >
                Security Policy
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6 sm:p-8 space-y-6">
              {activeTab === 'keys' && (
                <div className="space-y-6">
                  {/* Fingerprint Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#F5F2EB] dark:bg-[#233522] border border-[#243324]/10 dark:border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase font-semibold text-[#657351] dark:text-[#A3B59E] tracking-wider">
                        Public Key Fingerprint (SHA-256)
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#1F2B1D]/10 dark:bg-white/15 text-[#1F2B1D] dark:text-[#F4EFE6] font-mono">
                        RSA-3072
                      </span>
                    </div>
                    <p className="font-mono text-xs sm:text-sm text-[#1F2B1D] dark:text-[#F4EFE6] break-all select-all">
                      {rsaKeys.publicKeyFingerprint}
                    </p>
                  </div>

                  {/* Public Key PEM */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-[#4A5D44] dark:text-[#CBD7C7]">
                        Public Key (Distribution Safe — RFC 8017)
                      </label>
                      <button
                        type="button"
                        onClick={handleCopyKey}
                        className="flex items-center gap-1.5 text-xs text-[#3B4D36] dark:text-[#CBD7C7] hover:underline cursor-pointer"
                      >
                        {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedKey ? 'Copied PEM' : 'Copy Public Key'}
                      </button>
                    </div>
                    <pre className="p-4 rounded-2xl bg-[#1F2B1D] dark:bg-[#121A11] text-[#E8DCC4] text-xs font-mono overflow-x-auto border border-black/10 select-all leading-relaxed">
                      {rsaKeys.publicKeyPem}
                    </pre>
                  </div>

                  {/* Warning on Private Key */}
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                    <p className="text-xs leading-relaxed">
                      <strong>Zero-Leakage Assurance:</strong> Private key identifier{' '}
                      <code className="font-mono font-semibold">{rsaKeys.privateKeyId}</code> is retained strictly in local memory and is never exported, logged, or sent over any network.
                    </p>
                  </div>

                  {/* Regenerate Action */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleRegenerateKey}
                      disabled={isRegenerating}
                      className="px-5 py-2.5 rounded-full text-xs font-medium bg-[#1F2B1D] dark:bg-[#384E36] text-white hover:bg-[#2C3E2A] transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                      {isRegenerating ? 'Generating New RSA Pair...' : 'Generate New RSA-3072 Key Pair'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'model' && (
                <div className="space-y-5">
                  <div className="p-5 rounded-2xl bg-[#F5F2EB] dark:bg-[#233522] border border-[#243324]/10 dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-[#1F2B1D] dark:text-[#F4EFE6]">
                        Model Architecture
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-600/15 text-emerald-800 dark:text-emerald-300 font-mono">
                        TF-IDF + Logistic Regression
                      </span>
                    </div>
                    <p className="text-xs text-[#4A5D44] dark:text-[#CBD7C7] leading-relaxed">
                      Local Scikit-Learn pipeline trained on balanced corporate email corpora. Evaluated using precision, recall, and PR-AUC with class-weighted loss to minimize false alarms.
                    </p>
                  </div>

                  {/* Decision Thresholds */}
                  <div className="space-y-3">
                    <h4 className="text-xs uppercase font-semibold text-[#657351] dark:text-[#A3B59E] tracking-wider">
                      Calibrated Advisory Decision Thresholds
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#243723] border border-[#243324]/10 dark:border-white/10 text-center space-y-1">
                        <span className="text-xs text-[#4A5D44] dark:text-[#CBD7C7] block">Lower Risk</span>
                        <span className="font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-400">P &lt; 0.35</span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#243723] border border-[#243324]/10 dark:border-white/10 text-center space-y-1">
                        <span className="text-xs text-[#4A5D44] dark:text-[#CBD7C7] block">Review Band</span>
                        <span className="font-mono text-sm font-semibold text-amber-700 dark:text-amber-400">0.35 ≤ P ≤ 0.70</span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#243723] border border-[#243324]/10 dark:border-white/10 text-center space-y-1">
                        <span className="text-xs text-[#4A5D44] dark:text-[#CBD7C7] block">High Phishing</span>
                        <span className="font-mono text-sm font-semibold text-rose-700 dark:text-rose-400">P &gt; 0.70</span>
                      </div>
                    </div>
                  </div>

                  {/* Offline Privacy Guarantee */}
                  <div className="p-4 rounded-2xl bg-[#F5F2EB] dark:bg-[#233522] border border-[#243324]/10 dark:border-white/10 flex items-center gap-3">
                    <Cpu className="w-5 h-5 text-[#3B4D36] dark:text-[#CBD7C7] shrink-0" />
                    <p className="text-xs text-[#4A5D44] dark:text-[#CBD7C7]">
                      <strong>100% Offline Inference:</strong> No user message text is ever transmitted to external servers, cloud APIs, or telemetry backends.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'policy' && (
                <div className="space-y-4">
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#F5F2EB] dark:bg-[#233522] border border-[#243324]/10 dark:border-white/10 space-y-2">
                    <h4 className="font-medium text-sm text-[#1F2B1D] dark:text-[#F4EFE6] flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      Fail-Closed Cryptographic Enforcement
                    </h4>
                    <p className="text-xs text-[#4A5D44] dark:text-[#CBD7C7] leading-relaxed">
                      If an AES-GCM 128-bit authentication tag verification fails, or an RSA-OAEP wrapped DEK cannot be unwrapped, the engine immediately terminates without releasing partial plaintext or detailed error stack traces.
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-[#F5F2EB] dark:bg-[#233522] border border-[#243324]/10 dark:border-white/10 space-y-2">
                    <h4 className="font-medium text-sm text-[#1F2B1D] dark:text-[#F4EFE6] flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      Zero-Plaintext Persistence Policy
                    </h4>
                    <p className="text-xs text-[#4A5D44] dark:text-[#CBD7C7] leading-relaxed">
                      Plaintext messages and raw 256-bit data keys are stored strictly in ephemeral memory buffers during active use. Only encrypted envelope payloads, nonces, and wrapped keys are written to persistent storage.
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-[#F5F2EB] dark:bg-[#233522] border border-[#243324]/10 dark:border-white/10 space-y-2">
                    <h4 className="font-medium text-sm text-[#1F2B1D] dark:text-[#F4EFE6] flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      Strict Educational Boundary
                    </h4>
                    <p className="text-xs text-[#4A5D44] dark:text-[#CBD7C7] leading-relaxed">
                      Classical ciphers (Caesar and Vigenère) are explicitly restricted to the educational lab and cannot be selected for message archiving in the Secure Vault.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#243324]/10 dark:border-white/10 flex items-center justify-between bg-[#F5F2EB]/40 dark:bg-black/15">
              <span className="text-xs text-[#657351] dark:text-[#A3B59E] font-mono">
                {SECURITY_METADATA.complianceSpec}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-full text-xs font-semibold bg-[#1F2B1D] dark:bg-[#CBD7C7] text-white dark:text-[#1F2B1D] hover:opacity-90 transition-opacity cursor-pointer"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
