import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { AnimatedNumber } from './AnimatedNumber';
import { SECURITY_METADATA } from '../data/reportData';
import { IMAGES } from '../assets/images';
import { Shield, Lock, CheckCircle2 } from 'lucide-react';
import { useSessionActivity } from '../context/SessionContext';

export const OverviewSection: React.FC = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { sessionOperationsCount, vaultRecords } = useSessionActivity();

  // Smooth parallax scroll tracking mapped safely to card entry and exit
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ['start end', 'end start'],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ['-22%', '0%'], { clamp: true });

  return (
    <section
      id="overview-section"
      className="relative bg-[#FBF9F5] dark:bg-[#131D12] text-[#243324] dark:text-[#F4EFE6] pt-14 sm:pt-20 pb-16 sm:pb-20 px-4 sm:px-8 lg:px-12 flex flex-col justify-between overflow-hidden transition-colors duration-400"
    >
      <div className="max-w-6xl mx-auto w-full space-y-12 sm:space-y-16">
        {/* Visual Showcase Card Container with Parallax */}
        <div
          ref={cardRef}
          className="relative h-[480px] sm:h-[600px] lg:h-[700px] w-full rounded-[2.5rem] sm:rounded-[3.5rem] overflow-hidden shadow-2xl bg-[#1F2B1D]"
        >
          <motion.img
            style={{ y: imageY }}
            src={IMAGES.fiftyTwoRooftops}
            alt="Cryptographic and threat intelligence workbench architecture"
            referrerPolicy="no-referrer"
            className="absolute top-0 left-0 w-full h-[135%] object-cover object-center max-w-none will-change-transform opacity-30 filter saturate-50"
          />

          {/* Deep Forest Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1F2B1D] via-[#1F2B1D]/75 to-[#1F2B1D]/40 pointer-events-none z-10" />

          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#CBD7C7_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none z-10" />

          {/* Overlay Insight / Core Technical Overview */}
          <div className="absolute bottom-8 left-8 right-8 sm:bottom-12 sm:left-12 sm:right-12 z-20 flex flex-col sm:flex-row sm:items-end justify-between gap-6 text-[#F4EFE6]">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs uppercase font-mono tracking-wider text-[#CBD7C7]">
                <Shield className="w-3.5 h-3.5" />
                <span>{SECURITY_METADATA.courseReference}</span>
              </div>
              <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl leading-tight font-light text-[#F4EFE6] drop-shadow-md">
                Advisory threat evaluation paired with authenticated, fail-closed cryptographic protection.
              </h2>
              <p className="text-sm sm:text-base text-[#CBD7C7]/90 font-light max-w-2xl pt-1">
                CipherSentinel treats incoming message text as untrusted input. The application evaluates suspicious tokens to provide advisory guidance, while AES-256-GCM and RSA-OAEP encrypt selected records before persistent storage.
              </p>
            </div>

            <div className="hidden lg:flex flex-col gap-2 p-4 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10 text-xs font-mono">
              <span className="text-[#CBD7C7] flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Client-Side Execution
              </span>
              <span className="text-[#CBD7C7] flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                AES-256-GCM Authenticated
              </span>
              <span className="text-[#CBD7C7] flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                RSA-OAEP Key Wrapping
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic & Verifiable Session Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 pt-4 pb-4 border-t border-[#243324]/10 dark:border-white/10">
            {/* Metric 1: Actual Supported Algorithms */}
            <div className="space-y-1">
              <div className="font-display text-4xl sm:text-6xl text-[#1F2B1D] dark:text-[#F4EFE6] font-light tracking-tight">
                <AnimatedNumber value={SECURITY_METADATA.supportedAlgorithmCount} />
              </div>
              <p className="text-base text-[#4A5D44] dark:text-[#CBD7C7] font-medium">Supported Algorithms</p>
              <p className="text-sm text-[#657351] dark:text-[#A3B59E] font-light">
                Caesar, Vigenère, AES-256-GCM, RSA-OAEP, SHA-256
              </p>
            </div>

            {/* Metric 2: Real Dynamic Operations Run this Session */}
            <div className="space-y-1">
              <div className="font-display text-4xl sm:text-6xl text-[#1F2B1D] dark:text-[#F4EFE6] font-light tracking-tight">
                <AnimatedNumber value={sessionOperationsCount} />
              </div>
              <p className="text-base text-[#4A5D44] dark:text-[#CBD7C7] font-medium">Session Operations Executed</p>
              <p className="text-sm text-[#657351] dark:text-[#A3B59E] font-light">
                Live count of user encryptions, decryptions, hashes, and tests
              </p>
            </div>

            {/* Metric 3: Real Dynamic Count of Vault Envelopes */}
            <div className="space-y-1">
              <div className="font-display text-4xl sm:text-6xl text-[#1F2B1D] dark:text-[#F4EFE6] font-light tracking-tight">
                <AnimatedNumber value={vaultRecords.length} />
              </div>
              <p className="text-base text-[#4A5D44] dark:text-[#CBD7C7] font-medium">Envelopes in Secure Vault</p>
              <p className="text-sm text-[#657351] dark:text-[#A3B59E] font-light">
                Encrypted envelopes currently retained in local session memory
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
