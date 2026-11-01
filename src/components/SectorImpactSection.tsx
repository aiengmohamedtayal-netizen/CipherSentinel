import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ALGORITHM_SPECS } from '../data/reportData';
import { RooftopCalculator } from './RooftopCalculator';

export const SectorImpactSection: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string>(ALGORITHM_SPECS[0].name);
  const selectedAlgo = ALGORITHM_SPECS.find((s) => s.name === selectedType) || ALGORITHM_SPECS[0];

  return (
    <section
      id="crypto-lab-section"
      className="relative min-h-screen py-24 px-4 sm:px-8 lg:px-12 flex flex-col justify-center border-t border-[#243324]/10 dark:border-white/10 bg-[#F5F2EB] dark:bg-[#182417] text-[#243324] dark:text-[#F4EFE6] transition-colors duration-400"
    >
      <div className="max-w-6xl mx-auto w-full space-y-12">
        {/* Headline */}
        <div className="space-y-4 max-w-4xl">
          <p className="text-sm font-medium tracking-wide text-[#657351] dark:text-[#A3B59E]">
            Cryptographic Operations
          </p>
          <h2 className="font-display text-4xl sm:text-6xl lg:text-7xl text-[#1F2B1D] dark:text-[#F4EFE6] font-normal leading-[1.02] tracking-tight">
            Deterministic encryption, authenticated ciphers, and key wrapping.
          </h2>
          <p className="text-lg sm:text-xl text-[#4A5D44] dark:text-[#CBD7C7] font-light leading-relaxed">
            Experiment with educational classical substitution ciphers or execute modern military-grade AES-256-GCM and RSA-OAEP operations in a unified cryptographic playground.
          </p>
        </div>

        {/* Algorithm Navigation Strip */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {ALGORITHM_SPECS.map((algo) => {
            const isSelected = selectedType === algo.name;
            return (
              <button
                key={algo.name}
                type="button"
                onClick={() => setSelectedType(algo.name)}
                className={`px-5 py-3 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-[#1F2B1D] dark:bg-[#384E36] text-white dark:text-[#F4EFE6] shadow-sm'
                    : 'bg-white dark:bg-[#263925] text-[#3B4D36] dark:text-[#E2EBE0] hover:bg-white/80 dark:hover:bg-[#30482F] border border-[#243324]/10 dark:border-white/12'
                }`}
              >
                {algo.name}
              </button>
            );
          })}
        </div>

        {/* Detailed Algorithm Spotlight Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedAlgo.name}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            className="p-8 sm:p-12 rounded-[2.5rem] bg-white dark:bg-[#243723] border border-[#243324]/10 dark:border-white/12 shadow-lg space-y-8 transition-colors duration-400"
          >
            <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 border-b border-[#243324]/10 dark:border-white/10 pb-6">
              <div>
                <span className="text-xs uppercase font-mono tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold block pb-1">
                  {selectedAlgo.standard}
                </span>
                <h3 className="font-display text-3xl sm:text-5xl text-[#1F2B1D] dark:text-[#F4EFE6]">
                  {selectedAlgo.name}
                </h3>
                <p className="text-base sm:text-lg text-[#4A5D44] dark:text-[#CBD7C7] font-light pt-1">
                  {selectedAlgo.description}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="font-display text-2xl sm:text-3xl text-[#1F2B1D] dark:text-[#F4EFE6] block">
                  {selectedAlgo.implementationBasis}
                </span>
                <span className="block text-xs uppercase tracking-wider text-[#657351] dark:text-[#A3B59E]">
                  Implementation Standard
                </span>
              </div>
            </div>

            {/* 4-Stat Core Breakdown */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              <div className="space-y-1">
                <div className="font-display text-2xl sm:text-3xl text-[#1F2B1D] dark:text-[#F4EFE6]">
                  {selectedAlgo.keySize}
                </div>
                <p className="text-sm font-medium text-[#1F2B1D] dark:text-[#F4EFE6]">Key / Parameter Size</p>
                <p className="text-xs text-[#657351] dark:text-[#A3B59E]">Cryptographic bit strength</p>
              </div>

              <div className="space-y-1">
                <div className="font-display text-2xl sm:text-3xl text-[#1F2B1D] dark:text-[#F4EFE6]">
                  {selectedAlgo.nonceSize}
                </div>
                <p className="text-sm font-medium text-[#1F2B1D] dark:text-[#F4EFE6]">Nonce / Initialization</p>
                <p className="text-xs text-[#657351] dark:text-[#A3B59E]">Unique per-operation vector</p>
              </div>

              <div className="space-y-1">
                <div className="font-display text-2xl sm:text-3xl text-[#1F2B1D] dark:text-[#F4EFE6]">
                  {selectedAlgo.tagSize}
                </div>
                <p className="text-sm font-medium text-[#1F2B1D] dark:text-[#F4EFE6]">Authentication / Tag</p>
                <p className="text-xs text-[#657351] dark:text-[#A3B59E]">Tamper detection mechanism</p>
              </div>

              <div className="space-y-1">
                <div className="font-display text-2xl sm:text-3xl text-[#1F2B1D] dark:text-[#F4EFE6]">
                  {selectedAlgo.securityLevel.split(' ')[0]}
                </div>
                <p className="text-sm font-medium text-[#1F2B1D] dark:text-[#F4EFE6]">Security Posture</p>
                <p className="text-xs text-[#657351] dark:text-[#A3B59E]">{selectedAlgo.securityLevel}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dynamic Cryptographic Operations Interactive Simulator */}
        <RooftopCalculator />
      </div>
    </section>
  );
};
