import { useLanguage } from '../../context/LanguageContext';
import React from 'react';
import { motion } from 'motion/react';
import {
  Shield,
  Lock,
  Cpu,
  Hash,
  Key,
  Archive,
  CheckCircle2,
  ArrowRight,
  Activity,
  Layers,
  Sparkles,
  Terminal,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useSessionActivity } from '../../context/SessionContext';
import { SECURITY_METADATA } from '../../data/reportData';

export const DashboardPage: React.FC = () => {
  const { t, formatNumber } = useLanguage();
  const {
    sessionOperationsCount,
    vaultRecords,
    activeRsaKey,
    testCases,
    setActiveTab,
  } = useSessionActivity();

  const executedTests = testCases.filter((t) => t.status !== 'Pending');
  const passedTests = testCases.filter((t) => t.status === 'Passed');

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-16">
      {/* Hero Welcome & Status Banner */}
      <div className="relative overflow-hidden p-6 sm:p-10 rounded-[2.5rem] bg-gradient-to-br from-[#1F2B1D] to-[#131D12] text-[#F4EFE6] shadow-xl border border-white/10">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-white/10 backdrop-blur-md border border-white/15 text-[#CBD7C7]">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t("CipherSentinel Workbench • Frontend Application")}</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight leading-[1.08]">
            {t("AI-Assisted Secure Message Protection Workbench")}</h1>

          <p className="text-sm sm:text-base text-[#CBD7C7] font-light leading-relaxed">
            {t("A unified cybersecurity workspace combining classical educational ciphers, authenticated AES-256-GCM symmetric encryption, RSA-OAEP public-key transport, SHA-256 integrity verification, and AI phishing risk evaluation.")}</p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('crypto-lab')}
              className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[#CBD7C7] text-[#1F2B1D] hover:bg-white transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{t("Open Cryptography Lab")}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl-mirror" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('phishing')}
              className="px-5 py-2.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-[#F4EFE6] transition-all flex items-center gap-2 cursor-pointer border border-white/15"
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t("Analyze Message with AI")}</span>
            </button>
          </div>
        </div>

        {/* Decorative background grid and glow */}
        <div className="absolute end-0 top-0 bottom-0 w-1/2 opacity-10 pointer-events-none hidden md:block">
          <div className="w-full h-full border-l border-white/20 grid grid-cols-4 grid-rows-4" />
        </div>
      </div>

      {/* Real Dynamic Session Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1: Session Operations */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#657351] dark:text-[#A3B59E]">
              {t("Session Operations")}</span>
            <div className="p-2 rounded-xl bg-[#F5F2EB] dark:bg-[#233522] text-[#1F2B1D] dark:text-[#CBD7C7]">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-4xl text-[#1F2B1D] dark:text-[#F4EFE6] font-light">
            {formatNumber(sessionOperationsCount)}
          </div>
          <p className="text-xs text-[#4A5D44] dark:text-[#CBD7C7] font-light">
            {t("Real dynamic operations executed during active session")}</p>
        </div>

        {/* Metric 2: Supported Algorithms */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#657351] dark:text-[#A3B59E]">
              {t("Supported Ciphers")}</span>
            <div className="p-2 rounded-xl bg-[#F5F2EB] dark:bg-[#233522] text-[#1F2B1D] dark:text-[#CBD7C7]">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-4xl text-[#1F2B1D] dark:text-[#F4EFE6] font-light">
            {formatNumber(SECURITY_METADATA.supportedAlgorithmCount)}
          </div>
          <p className="text-xs text-[#4A5D44] dark:text-[#CBD7C7] font-light">
            {t("Caesar, Vigenère, AES-GCM, RSA-OAEP, SHA-256")}</p>
        </div>

        {/* Metric 3: Active Key Status */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#657351] dark:text-[#A3B59E]">
              {t("Key Infrastructure")}</span>
            <div className="p-2 rounded-xl bg-[#F5F2EB] dark:bg-[#233522] text-[#1F2B1D] dark:text-[#CBD7C7]">
              <Key className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl text-[#1F2B1D] dark:text-[#F4EFE6] font-light flex items-center gap-2 pt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t(activeRsaKey ? 'RSA-3072 Ready' : 'Initializing...')}</span>
          </div>
          <p className="text-xs text-[#4A5D44] dark:text-[#CBD7C7] font-light truncate">
            <bdi dir="ltr">{activeRsaKey ? activeRsaKey.publicKeyFingerprint : t('Generating Web Crypto pair...')}</bdi>
          </p>
        </div>

        {/* Metric 4: Encrypted Vault Records */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#657351] dark:text-[#A3B59E]">
              {t("Vault Envelopes")}</span>
            <div className="p-2 rounded-xl bg-[#F5F2EB] dark:bg-[#233522] text-[#1F2B1D] dark:text-[#CBD7C7]">
              <Archive className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-4xl text-[#1F2B1D] dark:text-[#F4EFE6] font-light">
            {formatNumber(vaultRecords.length)}
          </div>
          <p className="text-xs text-[#4A5D44] dark:text-[#CBD7C7] font-light">
            {t("Encrypted records in active tab memory only")}</p>
        </div>
      </div>

      {/* Quick Launchpad to All Application Workspaces */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#657351] dark:text-[#A3B59E]">
          {t("Application Workspaces")}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Crypto Lab */}
          <div
            onClick={() => setActiveTab('crypto-lab')}
            className="p-6 rounded-3xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 hover:border-[#1F2B1D]/40 dark:hover:border-white/30 transition-all cursor-pointer shadow-xs group flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-[#F5F2EB] dark:bg-[#233522] text-[#1F2B1D] dark:text-[#CBD7C7] w-fit group-hover:bg-[#1F2B1D] group-hover:text-white dark:group-hover:bg-[#CBD7C7] dark:group-hover:text-[#1F2B1D] transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-display text-xl text-[#1F2B1D] dark:text-[#F4EFE6] font-medium">
                {t("Cryptography Laboratory")}</h3>
              <p className="text-xs text-[#4A5D44] dark:text-[#CBD7C7] font-light leading-relaxed">
                {t("Execute interactive encryption and decryption for Caesar, Vigenère, AES-256-GCM, and RSA-OAEP key wrapping.")}</p>
            </div>
            <div className="flex items-center text-xs font-semibold text-[#1F2B1D] dark:text-[#CBD7C7] group-hover:translate-x-1 transition-transform">
              <span>{t("Open Crypto Lab")}</span>
              <ArrowRight className="w-3.5 h-3.5 ms-1 rtl-mirror" />
            </div>
          </div>

          {/* Card 2: AI Phishing Detection */}
          <div
            onClick={() => setActiveTab('phishing')}
            className="p-6 rounded-3xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 hover:border-[#1F2B1D]/40 dark:hover:border-white/30 transition-all cursor-pointer shadow-xs group flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-[#F5F2EB] dark:bg-[#233522] text-[#1F2B1D] dark:text-[#CBD7C7] w-fit group-hover:bg-[#1F2B1D] group-hover:text-white dark:group-hover:bg-[#CBD7C7] dark:group-hover:text-[#1F2B1D] transition-colors">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-display text-xl text-[#1F2B1D] dark:text-[#F4EFE6] font-medium">
                {t("AI Phishing Detection")}</h3>
              <p className="text-xs text-[#4A5D44] dark:text-[#CBD7C7] font-light leading-relaxed">
                {t("Client-side TF-IDF + Logistic Regression evaluator offering advisory risk bands; no independent accuracy metrics are available.")}</p>
            </div>
            <div className="flex items-center text-xs font-semibold text-[#1F2B1D] dark:text-[#CBD7C7] group-hover:translate-x-1 transition-transform">
              <span>{t("Analyze Messages")}</span>
              <ArrowRight className="w-3.5 h-3.5 ms-1 rtl-mirror" />
            </div>
          </div>

          {/* Card 3: Hash & Integrity */}
          <div
            onClick={() => setActiveTab('integrity')}
            className="p-6 rounded-3xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 hover:border-[#1F2B1D]/40 dark:hover:border-white/30 transition-all cursor-pointer shadow-xs group flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-[#F5F2EB] dark:bg-[#233522] text-[#1F2B1D] dark:text-[#CBD7C7] w-fit group-hover:bg-[#1F2B1D] group-hover:text-white dark:group-hover:bg-[#CBD7C7] dark:group-hover:text-[#1F2B1D] transition-colors">
                <Hash className="w-5 h-5" />
              </div>
              <h3 className="font-display text-xl text-[#1F2B1D] dark:text-[#F4EFE6] font-medium">
                {t("Hash & Integrity Verification")}</h3>
              <p className="text-xs text-[#4A5D44] dark:text-[#CBD7C7] font-light leading-relaxed">
                {t("Compute 64-character SHA-256 digests, verify against expected reference hashes, and demonstrate the live bit-level avalanche effect.")}</p>
            </div>
            <div className="flex items-center text-xs font-semibold text-[#1F2B1D] dark:text-[#CBD7C7] group-hover:translate-x-1 transition-transform">
              <span>{t("Verify Integrity")}</span>
              <ArrowRight className="w-3.5 h-3.5 ms-1 rtl-mirror" />
            </div>
          </div>

          {/* Card 4: Secure Message Vault */}
          <div
            onClick={() => setActiveTab('vault')}
            className="p-6 rounded-3xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 hover:border-[#1F2B1D]/40 dark:hover:border-white/30 transition-all cursor-pointer shadow-xs group flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-[#F5F2EB] dark:bg-[#233522] text-[#1F2B1D] dark:text-[#CBD7C7] w-fit group-hover:bg-[#1F2B1D] group-hover:text-white dark:group-hover:bg-[#CBD7C7] dark:group-hover:text-[#1F2B1D] transition-colors">
                <Archive className="w-5 h-5" />
              </div>
              <h3 className="font-display text-xl text-[#1F2B1D] dark:text-[#F4EFE6] font-medium">
                {t("Secure Message Vault")}</h3>
              <p className="text-xs text-[#4A5D44] dark:text-[#CBD7C7] font-light leading-relaxed">
                {t("Inspect sealed encrypted envelopes, verify GCM authentication tags, test fail-closed tampering, and view plaintext upon authorization.")}</p>
            </div>
            <div className="flex items-center text-xs font-semibold text-[#1F2B1D] dark:text-[#CBD7C7] group-hover:translate-x-1 transition-transform">
              <span>{t('Open Vault ({{count}})', { count: formatNumber(vaultRecords.length) })}</span>
              <ArrowRight className="w-3.5 h-3.5 ms-1 rtl-mirror" />
            </div>
          </div>

          {/* Card 5: Key Manager */}
          <div
            onClick={() => setActiveTab('keys')}
            className="p-6 rounded-3xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 hover:border-[#1F2B1D]/40 dark:hover:border-white/30 transition-all cursor-pointer shadow-xs group flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-[#F5F2EB] dark:bg-[#233522] text-[#1F2B1D] dark:text-[#CBD7C7] w-fit group-hover:bg-[#1F2B1D] group-hover:text-white dark:group-hover:bg-[#CBD7C7] dark:group-hover:text-[#1F2B1D] transition-colors">
                <Key className="w-5 h-5" />
              </div>
              <h3 className="font-display text-xl text-[#1F2B1D] dark:text-[#F4EFE6] font-medium">
                {t("Key Management Center")}</h3>
              <p className="text-xs text-[#4A5D44] dark:text-[#CBD7C7] font-light leading-relaxed">
                {t("Generate 3072-bit RSA-OAEP key pairs, inspect fingerprints, export public keys in PEM format, and manage 256-bit AES DEKs.")}</p>
            </div>
            <div className="flex items-center text-xs font-semibold text-[#1F2B1D] dark:text-[#CBD7C7] group-hover:translate-x-1 transition-transform">
              <span>{t("Manage Keys")}</span>
              <ArrowRight className="w-3.5 h-3.5 ms-1 rtl-mirror" />
            </div>
          </div>

          {/* Card 6: Testing Center */}
          <div
            onClick={() => setActiveTab('testing')}
            className="p-6 rounded-3xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 hover:border-[#1F2B1D]/40 dark:hover:border-white/30 transition-all cursor-pointer shadow-xs group flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-[#F5F2EB] dark:bg-[#233522] text-[#1F2B1D] dark:text-[#CBD7C7] w-fit group-hover:bg-[#1F2B1D] group-hover:text-white dark:group-hover:bg-[#CBD7C7] dark:group-hover:text-[#1F2B1D] transition-colors">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-display text-xl text-[#1F2B1D] dark:text-[#F4EFE6] font-medium">
                {t("Automated Testing Center")}</h3>
              <p className="text-xs text-[#4A5D44] dark:text-[#CBD7C7] font-light leading-relaxed">
                {t("Run the 22-test automated verification matrix (T-01 to T-22) covering classical, symmetric, asymmetric, integrity, and negative scenarios.")}</p>
            </div>
            <div className="flex items-center text-xs font-semibold text-[#1F2B1D] dark:text-[#CBD7C7] group-hover:translate-x-1 transition-transform">
              <span>
                {executedTests.length > 0
                  ? t('{{passed}}/{{total}} Passed', { passed: formatNumber(passedTests.length), total: formatNumber(executedTests.length) })
                  : t('Run Test Matrix')}
              </span>
              <ArrowRight className="w-3.5 h-3.5 ms-1 rtl-mirror" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Vault Envelopes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#657351] dark:text-[#A3B59E]">
            {t("Recent Sealed Envelopes in Vault")}</h2>
          <button
            type="button"
            onClick={() => setActiveTab('vault')}
            className="text-xs font-medium text-[#1F2B1D] dark:text-[#CBD7C7] hover:underline cursor-pointer"
          >
            {t('View all ({{count}}) →', { count: formatNumber(vaultRecords.length) })}</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vaultRecords.slice(0, 4).map((record) => (
            <div
              key={record.record_id}
              className="p-5 rounded-2xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#1F2B1D] dark:text-[#F4EFE6]">
                  <bdi dir="ltr">{record.record_id}</bdi>
                </span>
                {record.isDemoFixture ? (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                    {t("Demo Data")}</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    {t("User Session")}</span>
                )}
              </div>

              <div className="space-y-1">
                <h4 className="font-display text-sm font-medium text-[#1F2B1D] dark:text-[#F4EFE6] truncate">
                  <bdi dir="auto">{t(record.subject)}</bdi>
                </h4>
                <div className="flex flex-wrap gap-2 text-[11px] font-mono text-[#657351] dark:text-[#A3B59E]">
                  <bdi dir="ltr">{record.cipher_suite}</bdi>
                  <span>{t("•")}</span>
                  <span>{t("Nonce:")}{' '}<bdi dir="ltr">{record.nonce_b64.substring(0, 8)}...</bdi></span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] font-mono text-[#657351] dark:text-[#A3B59E]">
                  {t("Status:")}{t(record.status)}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('vault')}
                  className="text-xs text-[#1F2B1D] dark:text-[#CBD7C7] hover:underline font-medium cursor-pointer"
                >
                  {t("Inspect Envelope →")}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

