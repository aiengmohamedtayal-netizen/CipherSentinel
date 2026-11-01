import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Hash,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Zap,
  Info,
  Download,
  Terminal,
  Activity,
} from 'lucide-react';
import { useSessionActivity } from '../../context/SessionContext';
import { sha256, verifySha256, computeHexHammingDistance } from '../../utils/crypto';

export const HashIntegrityPage: React.FC = () => {
  const { incrementSessionOps } = useSessionActivity();

  const [inputMessage, setInputMessage] = useState<string>(
    'The quick brown fox jumps over the lazy dog'
  );
  const [calculatedDigest, setCalculatedDigest] = useState<string>('');
  const [expectedDigest, setExpectedDigest] = useState<string>(
    'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592'
  );
  const [verificationResult, setVerificationResult] = useState<{
    tested: boolean;
    matches: boolean;
  } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Avalanche Effect State
  const [tamperedInput, setTamperedInput] = useState<string>(
    'The quick brown fox jumps over the lazy dog.' // with trailing period
  );
  const [tamperedDigest, setTamperedDigest] = useState<string>('');
  const [avalancheStats, setAvalancheStats] = useState<{
    bitsChanged: number;
    totalBits: number;
    percentChanged: number;
  } | null>(null);

  // Auto-calculate initial digest on load
  useEffect(() => {
    handleComputeHash();
  }, []);

  const handleComputeHash = async () => {
    if (!inputMessage) return;
    const digest = await sha256(inputMessage);
    setCalculatedDigest(digest);
    incrementSessionOps(1);
  };

  const handleVerify = async () => {
    if (!calculatedDigest) {
      await handleComputeHash();
    }
    const cleanComputed = calculatedDigest.trim().toLowerCase();
    const cleanExpected = expectedDigest.trim().toLowerCase();
    const isMatch = cleanComputed === cleanExpected && cleanComputed.length === 64;
    setVerificationResult({ tested: true, matches: isMatch });
    incrementSessionOps(1);
  };

  const handleRunAvalancheTest = async () => {
    const d1 = await sha256(inputMessage);
    const d2 = await sha256(tamperedInput);
    setTamperedDigest(d2);

    const stats = computeHexHammingDistance(d1, d2);
    setAvalancheStats(stats);
    incrementSessionOps(1);
  };

  const handleQuickTamper1Bit = () => {
    if (!inputMessage) return;
    // Invert the last character
    const lastChar = inputMessage[inputMessage.length - 1];
    const newChar = lastChar === '!' ? '.' : '!';
    const modified = inputMessage.slice(0, -1) + newChar;
    setTamperedInput(modified);
    sha256(modified).then((d2) => {
      setTamperedDigest(d2);
      if (calculatedDigest) {
        setAvalancheStats(computeHexHammingDistance(calculatedDigest, d2));
      }
    });
    incrementSessionOps(1);
  };

  const handleCopyDigest = () => {
    if (!calculatedDigest) return;
    navigator.clipboard.writeText(calculatedDigest);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#243324]/10 dark:border-white/10 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider bg-[#1F2B1D]/10 dark:bg-white/10 text-[#1F2B1D] dark:text-[#F4EFE6]">
              Cryptographic Integrity
            </span>
            <span className="text-xs font-mono text-[#657351] dark:text-[#A3B59E]">
              NIST FIPS 180-4 • SHA-256
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-[#1F2B1D] dark:text-[#F4EFE6] font-normal tracking-tight">
            Cryptographic Hashing & Integrity
          </h1>
          <p className="text-sm sm:text-base text-[#4A5D44] dark:text-[#CBD7C7] font-light max-w-2xl">
            Compute collision-resistant SHA-256 digests, verify message authenticity against reference hashes, and inspect live bit-level avalanche effects.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#657351] dark:text-[#A3B59E] bg-[#F5F2EB] dark:bg-[#1A2619] px-3.5 py-2 rounded-xl border border-[#243324]/10 dark:border-white/10">
          <Hash className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Digest Width: 256 bits (64 hex characters)</span>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Hash Generator & Verification (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Input Message Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#1F2B1D] dark:text-[#F4EFE6]">
                1. Original Input Text
              </label>
              <span className="text-[11px] font-mono text-[#657351] dark:text-[#A3B59E]">
                {inputMessage.length} bytes
              </span>
            </div>

            <textarea
              rows={4}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Enter message to generate 256-bit SHA-256 digest..."
              className="w-full p-4 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1F2B1D] dark:focus:ring-[#CBD7C7] text-[#1F2B1D] dark:text-[#F4EFE6] leading-relaxed resize-y"
            />

            <button
              type="button"
              onClick={handleComputeHash}
              className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[#1F2B1D] dark:bg-[#CBD7C7] text-white dark:text-[#1F2B1D] hover:bg-[#2C3E2A] dark:hover:bg-white transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Calculate SHA-256 Digest</span>
            </button>
          </div>

          {/* Computed Digest Output Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#1F2B1D] dark:text-[#F4EFE6]">
                2. Calculated SHA-256 Digest
              </label>
              <button
                type="button"
                onClick={handleCopyDigest}
                className="text-xs font-mono text-[#1F2B1D] dark:text-[#CBD7C7] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Digest'}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 font-mono text-xs text-[#1F2B1D] dark:text-[#F4EFE6] break-all leading-relaxed select-all">
              {calculatedDigest || 'Computing digest...'}
            </div>
          </div>

          {/* Verification Comparison Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 shadow-xs space-y-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2B1D] dark:text-[#F4EFE6]">
              3. Integrity Verification Against Expected Reference
            </label>

            <div className="space-y-1.5">
              <span className="text-[11px] font-mono text-[#657351] dark:text-[#A3B59E]">
                Expected Reference Digest (64 hex characters):
              </span>
              <input
                type="text"
                value={expectedDigest}
                onChange={(e) => setExpectedDigest(e.target.value)}
                placeholder="Paste expected 64-char hash to verify against..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#1F2B1D] dark:focus:ring-[#CBD7C7] text-[#1F2B1D] dark:text-[#F4EFE6]"
              />
            </div>

            <button
              type="button"
              onClick={handleVerify}
              className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[#1F2B1D] dark:bg-[#384E36] text-white hover:bg-[#2c402a] transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verify Integrity Match</span>
            </button>

            {/* Verification Result Banner */}
            <AnimatePresence mode="wait">
              {verificationResult?.tested && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className={`p-4 rounded-2xl border text-xs flex items-center gap-3 ${
                    verificationResult.matches
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-200'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-900 dark:text-rose-200'
                  }`}
                >
                  {verificationResult.matches ? (
                    <>
                      <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <strong>INTEGRITY VERIFIED:</strong> The calculated digest matches the expected reference exactly. No modifications detected.
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                      <div>
                        <strong>INTEGRITY MISMATCH:</strong> The calculated digest does not match the reference hash. The message has been tampered with or corrupted.
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Live Avalanche Effect & Educational Insight (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Avalanche Effect Simulator */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1F2B1D] dark:text-[#F4EFE6] flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Avalanche Effect Demonstration</span>
              </h4>
              <button
                type="button"
                onClick={handleQuickTamper1Bit}
                className="text-[11px] font-mono text-rose-700 dark:text-rose-400 hover:underline cursor-pointer"
              >
                Invert 1 Char →
              </button>
            </div>

            <p className="text-xs text-[#4A5D44] dark:text-[#CBD7C7] font-light leading-relaxed">
              In a secure hash function, changing a single bit in the input must randomly change ~50% of the output bits.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-[#657351] dark:text-[#A3B59E]">
                Tampered / Altered Input Text:
              </label>
              <input
                type="text"
                value={tamperedInput}
                onChange={(e) => setTamperedInput(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 text-xs font-mono text-[#1F2B1D] dark:text-[#F4EFE6]"
              />
            </div>

            <button
              type="button"
              onClick={handleRunAvalancheTest}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#F5F2EB] dark:bg-[#233522] text-[#1F2B1D] dark:text-[#CBD7C7] hover:bg-[#eae5da] dark:hover:bg-[#2c402a] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Measure Live Bit Difference</span>
            </button>

            {/* Avalanche Metrics */}
            {avalancheStats && (
              <div className="p-4 rounded-2xl bg-[#F5F2EB] dark:bg-[#233522] border border-[#243324]/10 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-display text-2xl sm:text-3xl text-[#1F2B1D] dark:text-[#F4EFE6] block">
                      {avalancheStats.percentChanged}%
                    </span>
                    <span className="text-[10px] font-mono uppercase text-[#657351] dark:text-[#A3B59E]">
                      Output Bits Inverted
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-display text-xl text-[#1F2B1D] dark:text-[#F4EFE6] block">
                      {avalancheStats.bitsChanged} / {avalancheStats.totalBits}
                    </span>
                    <span className="text-[10px] font-mono uppercase text-[#657351] dark:text-[#A3B59E]">
                      Hamming Distance
                    </span>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 dark:bg-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(avalancheStats.percentChanged, 100)}%` }}
                  />
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 space-y-1.5 text-[10px] font-mono text-[#657351] dark:text-[#A3B59E]">
                  <strong className="text-[#1F2B1D] dark:text-[#F4EFE6] block">
                    Measurement Input Reconciliation:
                  </strong>
                  <div>• Pair A (Test T-13): "Message A100" vs "Message A101" &rarr; 140 / 256 bits (54.7%)</div>
                  <div>• Pair B (Sentence Demo): "The quick brown fox jumps over the lazy dog" vs trailing "." &rarr; 124 / 256 bits (48.4%)</div>
                </div>
              </div>
            )}
          </div>

          {/* Educational Insight Card */}
          <div className="p-6 rounded-3xl bg-[#F5F2EB] dark:bg-[#172216] border border-[#243324]/10 dark:border-white/10 space-y-3 text-xs text-[#4A5D44] dark:text-[#CBD7C7] leading-relaxed">
            <h5 className="font-semibold uppercase tracking-wider text-[#1F2B1D] dark:text-[#F4EFE6] flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#657351] dark:text-[#A3B59E]" />
              <span>Cryptographic Hashing vs Encryption</span>
            </h5>
            <p>
              <strong>SHA-256 is an irreversible one-way function.</strong> It possesses no decryption key or reverse operation.
            </p>
            <p>
              <strong>Integrity vs Authenticity:</strong> SHA-256 alone detects accidental or malicious modification when compared against a trusted reference. However, it does not authenticate the sender without a secret key (HMAC or digital signature).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
