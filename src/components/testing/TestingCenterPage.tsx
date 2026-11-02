import { useLanguage } from '../../context/LanguageContext';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  RotateCw,
  Search,
  Filter,
  ShieldCheck,
  AlertTriangle,
  Terminal,
  Activity,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useSessionActivity } from '../../context/SessionContext';
import { TestCase } from '../../types';

export const TestingCenterPage: React.FC = () => {
  const { t, formatNumber } = useLanguage();
  const { testCases, runAllTests, isTestingInProgress, lastTestRunTimestamp, setActiveTab } =
    useSessionActivity();

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const executedTests = testCases.filter((t) => t.status !== 'Pending');
  const passedTests = testCases.filter((t) => t.status === 'Passed');
  const failedTests = testCases.filter((t) => t.status === 'Failed');
  const pendingTests = testCases.filter((t) => t.status === 'Pending');

  const totalDurationMs = executedTests.reduce((sum, t) => sum + t.duration_ms, 0);

  // Filtered Test Cases
  const filteredCases = testCases.filter((testCase) => {
    const searchFields = [testCase.id, testCase.area, testCase.action, testCase.expected, testCase.evidence]
      .flatMap((value) => [value, t(value)]);
    const matchesSearch = searchFields.some((value) => value.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeFilter === 'passed') return testCase.status === 'Passed';
    if (activeFilter === 'failed') return testCase.status === 'Failed';
    if (activeFilter === 'pending') return testCase.status === 'Pending';
    if (activeFilter === 'classical') return testCase.area.includes('Caesar') || testCase.area.includes('Vigenère') || testCase.area.includes('Classical');
    if (activeFilter === 'aes') return testCase.area.includes('AES');
    if (activeFilter === 'rsa') return testCase.area.includes('RSA') || testCase.area.includes('Hybrid');
    if (activeFilter === 'hash') return testCase.area.includes('SHA-256');
    if (activeFilter === 'ai') return testCase.area.includes('AI') || testCase.area.includes('Phishing');

    return true;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#243324]/10 dark:border-white/10 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider bg-[#1F2B1D]/10 dark:bg-white/10 text-[#1F2B1D] dark:text-[#F4EFE6]">
              {t("Quality Assurance & Verification")}</span>
            <span className="text-xs font-mono text-[#657351] dark:text-[#A3B59E]">
              {t("Report Section 12 Specification")}</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-[#1F2B1D] dark:text-[#F4EFE6] font-normal tracking-tight">
            {t("Automated Testing Center")}</h1>
          <p className="text-sm sm:text-base text-[#4A5D44] dark:text-[#CBD7C7] font-light max-w-2xl">
            {t("Run 22 asserted scenarios (T-01 through T-22) covering round-trip behavior, fail-closed cryptographic negatives, envelope validation, and example phishing classifications.")}</p>
        </div>

        <button
          type="button"
          onClick={runAllTests}
          disabled={isTestingInProgress}
          className="px-6 py-3 rounded-full text-xs sm:text-sm font-semibold bg-[#1F2B1D] dark:bg-[#CBD7C7] text-white dark:text-[#1F2B1D] hover:bg-[#2C3E2A] dark:hover:bg-white transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 self-start md:self-end"
        >
          <RotateCw className={`w-4 h-4 ${isTestingInProgress ? 'animate-spin' : ''}`} />
          <span>{t(isTestingInProgress ? 'Executing 22 Security Tests...' : 'Run Automated Test Matrix')}</span>
        </button>
      </div>

      {/* Real Execution Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#657351] dark:text-[#A3B59E]">
            {t("Suite Progress")}</span>
          <div className="font-display text-2xl text-[#1F2B1D] dark:text-[#F4EFE6]">
            <bdi dir="ltr">{formatNumber(executedTests.length)} {' '}{t("/")}{' '}{formatNumber(testCases.length)}</bdi>
          </div>
          <p className="text-[11px] font-mono text-[#4A5D44] dark:text-[#CBD7C7]">
            {t(executedTests.length === 0 ? 'Pending initial run' : 'Completed locally')}
          </p>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#657351] dark:text-[#A3B59E]">
            {t("Passed Tests")}</span>
          <div className="font-display text-2xl text-emerald-600 dark:text-emerald-400">
            {formatNumber(passedTests.length)}
          </div>
          <p className="text-[11px] font-mono text-[#4A5D44] dark:text-[#CBD7C7]">
            {passedTests.length > 0 ? t('{{percentage}}% Pass Rate', { percentage: formatNumber(Math.round((passedTests.length / (executedTests.length || 1)) * 100)) }) : t('No runs yet')}
          </p>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#657351] dark:text-[#A3B59E]">
            {t("Failed Tests")}</span>
          <div className="font-display text-2xl text-rose-600 dark:text-rose-400">
            {formatNumber(failedTests.length)}
          </div>
          <p className="text-[11px] font-mono text-[#4A5D44] dark:text-[#CBD7C7]">
            {t("Fail-closed validations")}</p>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#657351] dark:text-[#A3B59E]">
            {t("Cumulative Duration")}</span>
          <div className="font-display text-2xl text-[#1F2B1D] dark:text-[#F4EFE6]">
            {formatNumber(totalDurationMs, { maximumFractionDigits: 1 })} {t("ms")}</div>
          <p className="text-[11px] font-mono text-[#4A5D44] dark:text-[#CBD7C7] truncate">
            {lastTestRunTimestamp ? t('Ran at {{time}}', { time: lastTestRunTimestamp }) : t('Awaiting run')}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#657351] dark:text-[#A3B59E] absolute start-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("Search test ID, area, action, or evidence...")}
            className="w-full ps-10 pe-4 py-2 rounded-2xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-[#1F2B1D] dark:focus:ring-[#CBD7C7] text-[#1F2B1D] dark:text-[#F4EFE6]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'All ({{count}})', count: testCases.length },
            { id: 'passed', label: 'Passed ({{count}})', count: passedTests.length },
            { id: 'failed', label: 'Failed ({{count}})', count: failedTests.length },
            { id: 'pending', label: 'Pending ({{count}})', count: pendingTests.length },
            { id: 'aes', label: 'AES-256-GCM' },
            { id: 'rsa', label: 'RSA-OAEP' },
            { id: 'hash', label: 'SHA-256' },
            { id: 'classical', label: 'Classical' },
            { id: 'ai', label: 'AI Phishing' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeFilter === f.id
                  ? 'bg-[#1F2B1D] dark:bg-[#CBD7C7] text-white dark:text-[#1F2B1D]'
                  : 'bg-white dark:bg-[#1A2619] text-[#657351] dark:text-[#A3B59E] border border-[#243324]/10 dark:border-white/10 hover:bg-[#F5F2EB]'
              }`}
            >
              {'count' in f ? t(f.label, { count: formatNumber(f.count) }) : t(f.label)}
            </button>
          ))}
        </div>
      </div>

      {/* Test Matrix List */}
      <div className="space-y-3">
        {filteredCases.map((test) => (
          <div
            key={test.id}
            className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
          >
            {/* Left: Test Identification & Action */}
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-[#F5F2EB] dark:bg-[#233522] text-[#1F2B1D] dark:text-[#CBD7C7] border border-[#243324]/10 dark:border-white/10">
                  <bdi dir="ltr">{test.id}</bdi>
                </span>
                <span className="text-xs font-mono text-[#657351] dark:text-[#A3B59E]">
                  {t(test.area)}
                </span>
              </div>

              <h4 className="font-display text-sm font-medium text-[#1F2B1D] dark:text-[#F4EFE6]">
                {t(test.action)}
              </h4>

              <p className="text-xs text-[#4A5D44] dark:text-[#CBD7C7] font-light">
                <span className="font-semibold text-[#657351] dark:text-[#A3B59E]">{t("Expected:")}</span> {t(test.expected)}
              </p>

              <div className="p-2.5 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/10 dark:border-white/10 font-mono text-[11px] text-[#1F2B1D] dark:text-[#CBD7C7] break-all">
                <span className="text-[#657351] dark:text-[#A3B59E]">{t("Evidence:")}</span> <span dir="auto">{t(test.evidence)}</span>
              </div>
            </div>

            {/* Right: Status Badge & Duration */}
            <div className="flex items-center md:flex-col items-end justify-between md:justify-center gap-2 shrink-0 md:min-w-[120px]">
              {test.status === 'Passed' && (
                <div className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t("Passed")}</span>
                </div>
              )}
              {test.status === 'Failed' && (
                <div className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/20 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{t("Failed")}</span>
                </div>
              )}
              {test.status === 'Pending' && (
                <div className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/20 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{t("Pending")}</span>
                </div>
              )}

              <span className="text-[11px] font-mono text-[#657351] dark:text-[#A3B59E]">
                {test.duration_ms > 0 ? <bdi dir="ltr">{formatNumber(test.duration_ms, { maximumFractionDigits: 2 })} {t('ms')}</bdi> : '—'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

