import { useLanguage } from '../../context/LanguageContext';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cpu,
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  Lock,
  Sparkles,
  Info,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useSessionActivity } from '../../context/SessionContext';
import { SAMPLE_PHISHING_MESSAGES } from '../../data/reportData';
import { analyzeMessageForPhishing, PhishingAnalysis } from '../../utils/crypto';
import { PhishingSample } from '../../types';

const MAX_PHISHING_MESSAGE_LENGTH = 10_000;

export const PhishingDetectionPage: React.FC = () => {
  const { t, formatNumber } = useLanguage();
  const { incrementSessionOps, stageMessageForEncryption } = useSessionActivity();

  const initialSample = SAMPLE_PHISHING_MESSAGES[0];
  const [selectedSample, setSelectedSample] = useState<PhishingSample>(initialSample);
  const [messageSubject, setMessageSubject] = useState<string>(() => t(initialSample.subject));
  const [messageBody, setMessageBody] = useState<string>(() => t(initialSample.body));
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<PhishingAnalysis | null>(() =>
    analyzeMessageForPhishing(t(initialSample.body))
  );
  const handleSelectSample = (sample: PhishingSample) => {
    setSelectedSample(sample);
    const localizedSubject = t(sample.subject);
    const localizedBody = t(sample.body);
    setMessageSubject(localizedSubject);
    setMessageBody(localizedBody);
    // Instant real inference on sample load
    const result = analyzeMessageForPhishing(localizedBody);
    setAnalysisResult(result);
  };

  const handleRunAnalysis = () => {
    if (!messageBody.trim()) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      const result = analyzeMessageForPhishing(messageBody);
      setAnalysisResult(result);
      setIsAnalyzing(false);
      incrementSessionOps(1);
    }, 200);
  };

  const handleSecureAndArchive = () => {
    stageMessageForEncryption({
      subject: messageSubject || t('Suspicious Phishing Message Dispatch'),
      body: messageBody,
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#243324]/10 dark:border-white/10 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider bg-[#1F2B1D]/10 dark:bg-white/10 text-[#1F2B1D] dark:text-[#F4EFE6]">
              {t("Advisory Threat Intelligence")}</span>
            <span className="text-xs font-mono text-[#657351] dark:text-[#A3B59E]">
              {t("TF-IDF + Logistic Regression")}</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-[#1F2B1D] dark:text-[#F4EFE6] font-normal tracking-tight">
            {t("AI-Powered Phishing Detection")}</h1>
          <p className="text-sm sm:text-base text-[#4A5D44] dark:text-[#CBD7C7] font-light max-w-2xl">
            {t("Evaluate untrusted messages for deceptive urgency and credential solicitation cues using in-browser TF-IDF feature extraction and logistic regression.")}</p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#657351] dark:text-[#A3B59E] bg-[#F5F2EB] dark:bg-[#1A2619] px-3.5 py-2 rounded-xl border border-[#243324]/10 dark:border-white/10">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{t("Model: TF-IDF-LogReg-v1.4 (In-Memory)")}</span>
        </div>
      </div>

      {/* Main Grid: Input Card on Left, Live Inference Result on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form & Sample Picker (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Example messages */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#657351] dark:text-[#A3B59E]">
              {t("Load Example Messages")}</label>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PHISHING_MESSAGES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectSample(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    selectedSample.id === s.id
                      ? 'bg-[#1F2B1D] dark:bg-[#384E36] text-white shadow-xs'
                      : 'bg-[#F5F2EB] dark:bg-[#233522] text-[#3B4D36] dark:text-[#CBD7C7] hover:bg-[#eae5da] dark:hover:bg-[#2e422c]'
                  }`}
                >
                  {t(s.label)}
                </button>
              ))}
            </div>
          </div>

          {/* Form Inputs Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 shadow-xs space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#1F2B1D] dark:text-[#F4EFE6]">
                {t("Subject Line")}</label>
              <input
                type="text"
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
                placeholder={t("Enter email subject line...")}
                dir="auto"
                className="w-full px-4 py-2.5 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-[#1F2B1D] dark:focus:ring-[#CBD7C7] text-[#1F2B1D] dark:text-[#F4EFE6]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1F2B1D] dark:text-[#F4EFE6]">
                  {t("Message Body (Plaintext Under Inspection)")}</label>
                <span className="text-[11px] font-mono text-[#657351] dark:text-[#A3B59E]">
                  {formatNumber(messageBody.length)} {' '}{t("/")}{' '}{formatNumber(MAX_PHISHING_MESSAGE_LENGTH)} {t("chars")}</span>
              </div>
              <textarea
                rows={7}
                maxLength={MAX_PHISHING_MESSAGE_LENGTH}
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder={t("Paste message text to evaluate for deceptive indicators, artificial urgency, or credential solicitation...")}
                dir="auto"
                className="w-full p-4 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 text-xs sm:text-sm font-sans focus:outline-none focus:ring-2 focus:ring-[#1F2B1D] dark:focus:ring-[#CBD7C7] text-[#1F2B1D] dark:text-[#F4EFE6] leading-relaxed resize-y"
              />
              <p className="text-[11px] text-[#657351] dark:text-[#A3B59E] leading-relaxed">
                {t('Current model features recognize ASCII letters and digits only. Arabic message content has no Arabic word features and may be misclassified as low risk.')}
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleRunAnalysis}
                disabled={isAnalyzing || !messageBody.trim()}
                className="px-6 py-3 rounded-full text-xs sm:text-sm font-semibold bg-[#1F2B1D] dark:bg-[#CBD7C7] text-white dark:text-[#1F2B1D] hover:bg-[#2C3E2A] dark:hover:bg-white transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                <Cpu className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                <span>{t(isAnalyzing ? 'Extracting n-grams & Evaluating...' : 'Analyze Message for Phishing')}</span>
              </button>

              <span className="text-[11px] font-mono text-[#657351] dark:text-[#A3B59E]">
                {t("Zero Cloud Telemetry • Local Inference")}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Analysis Output (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <AnimatePresence mode="wait">
            {analysisResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6 rounded-3xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 shadow-xs space-y-5"
              >
                {/* Result Header & Risk Band */}
                <div className="flex items-center justify-between border-b border-[#243324]/10 dark:border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    {analysisResult.riskBand === 'High phishing risk' && (
                      <div className="p-2.5 rounded-2xl bg-rose-500/15 text-rose-700 dark:text-rose-400">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                    )}
                    {analysisResult.riskBand === 'Review recommended' && (
                      <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                    )}
                    {analysisResult.riskBand === 'Lower detected risk' && (
                      <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-[#657351] dark:text-[#A3B59E] block">
                        {t("Classification Risk Band")}</span>
                      <h3 className="font-display text-lg sm:text-xl text-[#1F2B1D] dark:text-[#F4EFE6] font-medium leading-tight">
                        {t(analysisResult.riskBand)}
                      </h3>
                    </div>
                  </div>

                  <div className="text-end">
                    <span className="font-display text-3xl text-[#1F2B1D] dark:text-[#F4EFE6] block">
                      <bdi dir="ltr">{formatNumber(Math.round(analysisResult.riskScore * 100))}{t("%")}</bdi></span>
                    <span className="text-[10px] font-mono text-[#657351] dark:text-[#A3B59E]">
                      {t("Uncalibrated Model Score")}</span>
                  </div>
                </div>

                {/* Detected TF-IDF Threat Indicators */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#657351] dark:text-[#A3B59E] flex items-center justify-between">
                    <span>{t("Contributing TF-IDF Feature Tokens")}</span>
                    <span className="text-[10px] font-mono"><bdi dir="ltr">{formatNumber(analysisResult.indicators.length)}</bdi> {' '}{t("tokens")}</span>
                  </label>

                  {analysisResult.indicators.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {analysisResult.indicators.map((ind, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg text-xs font-mono bg-[#F5F2EB] dark:bg-[#202E1E] border border-[#243324]/10 dark:border-white/10 text-[#1F2B1D] dark:text-[#CBD7C7] flex items-center gap-1.5"
                          title={t('TF-IDF feature weight: +{{weight}} toward phishing classification', { weight: ind.weight.toFixed(3) })}
                        >
                          <bdi dir="ltr">{ind.token}</bdi>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {t("+")}{ind.weight.toFixed(2)}
                          </span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-mono text-[#657351] dark:text-[#A3B59E] italic">
                      {t("No deceptive keyword tokens or urgency indicators matched.")}</p>
                  )}
                </div>

                {/* Explanation */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#657351] dark:text-[#A3B59E]">
                    {t("Explainable Model Output")}</span>
                  <p className="text-xs text-[#4A5D44] dark:text-[#CBD7C7] font-light leading-relaxed">
                    {analysisResult.riskBand === 'High phishing risk'
                      ? t('The logistic regression model detected significant indicative tokens ({{tokens}}). Classification indicates strong urgency or credential solicitation.', { tokens: analysisResult.indicators.slice(0, 3).map((indicator) => `"${indicator.token}"`).join(', ') || 'none' })
                      : analysisResult.riskBand === 'Review recommended'
                        ? t('The message contains moderate urgency or transactional signals. Manual human review is recommended before taking action.')
                        : t('The model identified low overall deceptive token density consistent with normal communication.')}
                  </p>
                </div>

                {/* Recommendations */}
                {analysisResult.recommendations.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#657351] dark:text-[#A3B59E]">
                      {t("Advisory Recommendations")}</span>
                    <ul className="space-y-1 text-xs text-[#4A5D44] dark:text-[#CBD7C7] font-light list-disc list-inside">
                      {analysisResult.recommendations.map((rec, i) => (
                        <li key={i}>{t(rec)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Model Training & Validation Boundary Notice */}
                <div className="p-4 rounded-2xl bg-[#F5F2EB] dark:bg-[#233522] border border-[#243324]/10 dark:border-white/10 space-y-1.5 text-xs text-[#4A5D44] dark:text-[#CBD7C7]">
                  <div className="font-semibold text-[#1F2B1D] dark:text-[#F4EFE6] flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-[#657351] dark:text-[#A3B59E]" />
                    <span>{t("Inference vs Offline Validation Distinction")}</span>
                  </div>
                  <p className="leading-relaxed">
                    {t("This screen executes")}<strong>{t("live in-browser model inference")}</strong> {t("by vectorizing text n-grams and calculating a logistic sigmoid over 993 model coefficients. The resulting score is not calibrated as a probability. The artifact declares 40 training samples; no independent accuracy metrics are available, so all bands are advisory.")}</p>
                </div>

                {/* Mandatory Advisory Notice */}
                <div className="p-3.5 rounded-2xl bg-[#F5F2EB] dark:bg-[#233522] border border-[#243324]/10 dark:border-white/10 text-[11px] text-[#4A5D44] dark:text-[#CBD7C7] leading-relaxed">
                  <strong>{t("Advisory Notice:")}</strong> {t("Machine-learning outputs are statistical estimations, not mathematical guarantees. Low detected risk does not certify complete safety.")}</div>

                {/* Secure & Archive Primary Action */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#243324]/10 dark:border-white/10">
                  <button
                    type="button"
                    onClick={handleSecureAndArchive}
                    className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[#1F2B1D] dark:bg-[#384E36] text-white hover:bg-[#2c402a] transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{t("Secure & Archive in Vault")}</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl-mirror" />
                  </button>

                  <span className="text-[10px] font-mono text-[#657351] dark:text-[#A3B59E]">
                    {t("Latency:")}{formatNumber(analysisResult.latencyMs)} {t("ms")}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

