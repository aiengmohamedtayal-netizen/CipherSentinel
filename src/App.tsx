/**
 * CipherSentinel — AI-Assisted Secure Message Protection Workbench
 * Frontend Application Root
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeProvider } from './context/ThemeContext';
import { SessionProvider, useSessionActivity } from './context/SessionContext';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { CryptoLabPage } from './components/crypto/CryptoLabPage';
import { PhishingDetectionPage } from './components/ai/PhishingDetectionPage';
import { HashIntegrityPage } from './components/integrity/HashIntegrityPage';
import { SecureVaultPage } from './components/vault/SecureVaultPage';
import { KeyManagerPage } from './components/keys/KeyManagerPage';
import { TestingCenterPage } from './components/testing/TestingCenterPage';
import { SECURITY_METADATA } from './data/reportData';

function MainWorkbench() {
  const { activeTab } = useSessionActivity();

  return (
    <div className="min-h-screen bg-[#FBF9F5] dark:bg-[#131D12] text-[#243324] dark:text-[#F4EFE6] font-sans antialiased selection:bg-[#E8DCC4] dark:selection:bg-[#384F35] selection:text-[#1F2B1D] dark:selection:text-[#F4EFE6] transition-colors duration-400 flex flex-col justify-between">
      {/* Top Persistent Workbench Navigation Toolbar */}
      <Navbar />

      {/* Main Dynamic View Content */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="w-full"
          >
            {activeTab === 'dashboard' && <DashboardPage />}
            {activeTab === 'crypto-lab' && <CryptoLabPage />}
            {activeTab === 'phishing' && <PhishingDetectionPage />}
            {activeTab === 'integrity' && <HashIntegrityPage />}
            {activeTab === 'vault' && <SecureVaultPage />}
            {activeTab === 'keys' && <KeyManagerPage />}
            {activeTab === 'testing' && <TestingCenterPage />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#243324]/10 dark:border-white/10 py-6 px-4 sm:px-8 text-center text-xs font-mono text-[#657351] dark:text-[#A3B59E] bg-[#F5F2EB]/50 dark:bg-[#10190F]/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>CipherSentinel v1.0 • {SECURITY_METADATA.courseReference}</span>
          <span>{SECURITY_METADATA.standardsReference}</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <MainWorkbench />
      </SessionProvider>
    </ThemeProvider>
  );
}
