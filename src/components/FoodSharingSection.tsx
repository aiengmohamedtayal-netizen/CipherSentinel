import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AnimatedNumber } from './AnimatedNumber';
import { SECURITY_METADATA } from '../data/reportData';
import { sha256 } from '../utils/crypto';
import { Hash, CheckCircle2, AlertTriangle, Copy, Check, RefreshCw } from 'lucide-react';

export const FoodSharingSection: React.FC = () => {
  const [sourcePayload, setSourcePayload] = useState<string>(
    'CipherSentinel Authenticated Message Payload v1.0 [CONFIDENTIAL]'
  );
  const [computedHash, setComputedHash] = useState<string>('');
  const [expectedHash, setExpectedHash] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Compute SHA-256 on payload change
  useEffect(() => {
    let isMounted = true;
    sha256(sourcePayload).then((digest) => {
      if (isMounted) {
        setComputedHash(digest);
        // Initially set expected hash to match
        if (!expectedHash) {
          setExpectedHash(digest);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [sourcePayload]);

  const handleCopyHash = () => {
    if (!computedHash) return;
    navigator.clipboard.writeText(computedHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSyncExpected = () => {
    setExpectedHash(computedHash);
  };

  const handleSimulateTamper = () => {
    setSourcePayload((prev) => prev + ' [MODIFIED_BY_ATTACKER]');
  };

  const isMatching = computedHash.length > 0 && expectedHash.trim().toLowerCase() === computedHash.toLowerCase();

  return (
    <section
      id="integrity-section"
      className="relative min-h-screen py-24 px-4 sm:px-8 lg:px-12 flex flex-col justify-center border-t border-[#243324]/10 dark:border-white/10 bg-[#FBF9F5] dark:bg-[#131D12] text-[#243324] dark:text-[#F4EFE6] transition-colors duration-400"
    >
      <div className="max-w-6xl mx-auto w-full space-y-16">
        {/* Headline */}
        <div className="space-y-4 max-w-4xl">
          <p className="text-sm font-medium tracking-wide text-[#657351] dark:text-[#A3B59E]">
            Data Integrity & Tamper Detection
          </p>
          <h2 className="font-display text-4xl sm:text-6xl lg:text-7xl text-[#1F2B1D] dark:text-[#F4EFE6] font-normal leading-[1.02] tracking-tight">
            Cryptographic hashing verifies message authenticity and bit-level integrity.
          </h2>
          <p className="text-lg sm:text-xl text-[#4A5D44] dark:text-[#CBD7C7] font-light leading-relaxed">
            Compute irreversible 256-bit SHA-256 fingerprints. Any modification — even a single bit flip in an email or encrypted payload — radically alters the resulting hexadecimal digest.
          </p>
        </div>

        {/* Visual & Metric Integration */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Interactive Hash & Verify Console */}
          <div className="lg:col-span-6 rounded-[2.5rem] sm:rounded-[3.5rem] bg-white dark:bg-[#1E2E1D] border border-[#243324]/10 dark:border-white/12 p-6 sm:p-9 shadow-lg space-y-6 transition-colors duration-400">
            <div className="flex items-center justify-between border-b border-[#243324]/10 dark:border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-[#3B4D36] dark:text-[#CBD7C7]" />
                <h3 className="font-display text-2xl text-[#1F2B1D] dark:text-[#F4EFE6]">
                  SHA-256 Hash & Verify
                </h3>
              </div>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#1F2B1D]/10 dark:bg-white/10 text-[#1F2B1D] dark:text-[#F4EFE6]">
                FIPS 180-4
              </span>
            </div>

            {/* Input Payload */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#4A5D44] dark:text-[#CBD7C7]">
                Original Input Message or Payload
              </label>
              <textarea
                rows={3}
                value={sourcePayload}
                onChange={(e) => setSourcePayload(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-[#FBF9F5] dark:bg-[#152014] border border-[#243324]/15 dark:border-white/15 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#3B4D36] text-[#1F2B1D] dark:text-[#F4EFE6]"
                placeholder="Enter text to generate cryptographic digest..."
              />
            </div>

            {/* Generated Hash Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#4A5D44] dark:text-[#CBD7C7]">
                  Calculated SHA-256 Digest (64 Hex Characters)
                </label>
                <button
                  type="button"
                  onClick={handleCopyHash}
                  className="flex items-center gap-1 text-xs text-[#3B4D36] dark:text-[#CBD7C7] hover:underline cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Hash'}
                </button>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#1F2B1D] dark:bg-[#121A11] text-[#E8DCC4] font-mono text-xs break-all select-all">
                {computedHash}
              </div>
            </div>

            {/* Expected Hash Input Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#4A5D44] dark:text-[#CBD7C7]">
                Expected Digest to Verify Against
              </label>
              <input
                type="text"
                value={expectedHash}
                onChange={(e) => setExpectedHash(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBF9F5] dark:bg-[#152014] border border-[#243324]/15 dark:border-white/15 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#3B4D36] text-[#1F2B1D] dark:text-[#F4EFE6]"
                placeholder="Paste expected reference hash..."
              />
            </div>

            {/* Verification Status Badge */}
            <div className="pt-1">
              {isMatching ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <div>
                    <strong className="font-semibold block">Integrity Verified:</strong>
                    Digest matches expected reference. Payload has not been altered.
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <div>
                    <strong className="font-semibold block">Integrity Violation Detected:</strong>
                    Digest mismatch. The input payload has been modified or corrupted.
                  </div>
                </div>
              )}
            </div>

            {/* Helper Action Buttons */}
            <div className="pt-2 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleSyncExpected}
                className="px-4 py-2 rounded-full text-xs font-medium bg-[#1F2B1D] dark:bg-[#384E36] text-white hover:bg-[#2C3E2A] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Sync Expected to Calculated
              </button>
              <button
                type="button"
                onClick={handleSimulateTamper}
                className="px-4 py-2 rounded-full text-xs font-medium bg-rose-600/15 text-rose-800 dark:text-rose-300 border border-rose-500/20 hover:bg-rose-600/25 transition-colors cursor-pointer"
              >
                Simulate Tamper
              </button>
            </div>
          </div>

          {/* Impact Stats */}
          <div className="lg:col-span-6 space-y-6">
            <div className="p-8 sm:p-10 rounded-[2.5rem] bg-[#F5F2EB] dark:bg-[#233522] border border-[#243324]/10 dark:border-white/12 shadow-sm space-y-3 transition-colors duration-400">
              <div className="font-display text-5xl sm:text-6xl text-[#1F2B1D] dark:text-[#F4EFE6] font-light tracking-tight">
                <AnimatedNumber value={SECURITY_METADATA.integrityVerifiedCount} />
              </div>
              <p className="text-base text-[#1F2B1D] dark:text-[#F4EFE6] font-medium">Integrity Digests Verified</p>
              <p className="text-sm text-[#4A5D44] dark:text-[#CBD7C7] font-light leading-relaxed">
                Deterministic 256-bit hashes validated across message archives, firmware manifests, and envelope headers.
              </p>
            </div>

            <div className="p-8 sm:p-10 rounded-[2.5rem] bg-[#F5F2EB] dark:bg-[#233522] border border-[#243324]/10 dark:border-white/12 shadow-sm space-y-3 transition-colors duration-400">
              <div className="font-display text-5xl sm:text-6xl text-[#1F2B1D] dark:text-[#F4EFE6] font-light tracking-tight">
                50.4%
              </div>
              <p className="text-base text-[#1F2B1D] dark:text-[#F4EFE6] font-medium">Avalanche Effect Bit Diffusion</p>
              <p className="text-sm text-[#4A5D44] dark:text-[#CBD7C7] font-light leading-relaxed">
                Flipping a single input bit alters approximately half of all 256 output bits, rendering unauthorized modifications instantly evident.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
