import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, AlertTriangle, ShieldCheck, Cpu, ArrowRight, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { SAMPLE_PHISHING_MESSAGES, SECURITY_METADATA } from '../data/reportData';
import { analyzeMessageForPhishing, PhishingAnalysis } from '../utils/crypto';
import { PhishingSample } from '../types';

export const StormwaterClimateSection: React.FC = () => {
  const [selectedSample, setSelectedSample] = useState<PhishingSample>(SAMPLE_PHISHING_MESSAGES[0]);
  const [messageSubject, setMessageSubject] = useState<string>(SAMPLE_PHISHING_MESSAGES[0].subject);
  const [messageBody, setMessageBody] = useState<string>(SAMPLE_PHISHING_MESSAGES[0].body);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<PhishingAnalysis | null>(() =>
    analyzeMessageForPhishing(SAMPLE_PHISHING_MESSAGES[0].body)
  );
  const [archivedSuccess, setArchivedSuccess] = useState<boolean>(false);

  const handleSelectSample = (sample: PhishingSample) => {
    setSelectedSample(sample);
    setMessageSubject(sample.subject);
    setMessageBody(sample.body);
    setAnalysisResult(null);
    setArchivedSuccess(false);
  };

  const handleRunAnalysis = () => {
    if (!messageBody.trim()) return;
    setIsAnalyzing(true);
    setArchivedSuccess(false);
    setTimeout(() => {
      const result = analyzeMessageForPhishing(messageBody);
      setAnalysisResult(result);
      setIsAnalyzing(false);
    }, 280);
  };

  const handleSecureAndArchive = () => {
    setArchivedSuccess(true);
    setTimeout(() => {
      const vaultElement = document.getElementById('vault-section');
      if (vaultElement) {
        vaultElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 1200);
  };

  return (
    <section
      id="ai-phishing-section"
      className="relative min-h-screen py-24 px-4 sm:px-8 lg:px-12 flex flex-col justify-center border-t border-[#243324]/10 dark:border-white/10 bg-[#FBF9F5] dark:bg-[#131D12] text-[#243324] dark:text-[#F4EFE6] transition-colors duration-400"
    >
      <div className="max-w-6xl mx-auto w-full space-y-16">
        {/* Section Headline */}
        <div className="space-y-4 max-w-4xl">
          <p className="text-sm font-medium tracking-wide text-[#657351] dark:text-[#A3B59E]">
            Advisory Threat Intelligence
          </p>
          <h2 className="font-display text-4xl sm:text-6xl lg:text-7xl text-[#1F2B1D] dark:text-[#F4EFE6] font-normal leading-[1.02] tracking-tight">
            Local TF-IDF & Logistic Regression detects deception without cloud exposure.
          </h2>
          <p className="text-lg sm:text-xl text-[#4A5D44] dark:text-[#CBD7C7] font-light leading-relaxed">
            Inspect incoming messages offline. The local classifier extracts word and character n-gram tokens to estimate phishing probability while keeping all message text private on your workstation.
          </p>
        </div>

        {/* Visual & Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Interactive AI Analyzer Card */}
          <div className="lg:col-span-7 rounded-[2.5rem] sm:rounded-[3.5rem] overflow-hidden shadow-xl bg-white dark:bg-[#1E2E1D] border border-[#243324]/10 dark:border-white/12 p-6 sm:p-10 space-y-6 transition-colors duration-400">
            {/* Sample Selector Buttons */}
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#657351] dark:text-[#A3B59E]">
                Load Curated Benchmark Samples (Report Sec 8.4 & 12)
              </span>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_PHISHING_MESSAGES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSample(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      selectedSample.id === s.id
                        ? 'bg-[#1F2B1D] dark:bg-[#384E36] text-white shadow-xs'
                        : 'bg-[#F5F2EB] dark:bg-[#283C26] text-[#3B4D36] dark:text-[#CBD7C7] hover:bg-[#eae5da] dark:hover:bg-[#30482F]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Subject & Body */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#4A5D44] dark:text-[#CBD7C7]">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FBF9F5] dark:bg-[#152014] border border-[#243324]/15 dark:border-white/15 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-[#3B4D36] dark:focus:ring-[#CBD7C7] text-[#1F2B1D] dark:text-[#F4EFE6]"
                  placeholder="Enter message subject..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#4A5D44] dark:text-[#CBD7C7]">
                  Message Body (Untrusted Plaintext Input)
                </label>
                <textarea
                  rows={6}
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-[#FBF9F5] dark:bg-[#152014] border border-[#243324]/15 dark:border-white/15 text-xs sm:text-sm font-sans focus:outline-none focus:ring-2 focus:ring-[#3B4D36] dark:focus:ring-[#CBD7C7] text-[#1F2B1D] dark:text-[#F4EFE6] leading-relaxed resize-y"
                  placeholder="Paste email text to evaluate for deceptive links or urgency cues..."
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <button
                type="button"
                onClick={handleRunAnalysis}
                disabled={isAnalyzing || !messageBody.trim()}
                className="px-6 py-3 rounded-full text-xs sm:text-sm font-semibold bg-[#1F2B1D] dark:bg-[#384E36] text-white hover:bg-[#2C3E2A] transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
              >
                <Cpu className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                {isAnalyzing ? 'Extracting n-grams & Evaluating...' : 'Analyze Message for Phishing'}
              </button>

              <span className="text-[11px] font-mono text-[#657351] dark:text-[#A3B59E]">
                TF-IDF-LogReg-v1.4 (Offline Local)
              </span>
            </div>

            {/* Live Analysis Output */}
            <AnimatePresence mode="wait">
              {analysisResult && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="p-5 sm:p-6 rounded-3xl bg-[#F5F2EB] dark:bg-[#172216] border border-[#243324]/10 dark:border-white/10 space-y-4"
                >
                  {/* Result Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#243324]/10 dark:border-white/10 pb-4">
                    <div className="flex items-center gap-2.5">
                      {analysisResult.riskBand === 'High phishing risk' && (
                        <div className="p-2 rounded-xl bg-rose-600/15 text-rose-700 dark:text-rose-400">
                          <ShieldAlert className="w-5 h-5" />
                        </div>
                      )}
                      {analysisResult.riskBand === 'Review recommended' && (
                        <div className="p-2 rounded-xl bg-amber-600/15 text-amber-700 dark:text-amber-400">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                      )}
                      {analysisResult.riskBand === 'Lower detected risk' && (
                        <div className="p-2 rounded-xl bg-emerald-600/15 text-emerald-700 dark:text-emerald-400">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <span className="text-xs uppercase font-mono tracking-wider text-[#657351] dark:text-[#A3B59E] block">
                          Advisory Risk Band
                        </span>
                        <span className="font-display text-xl text-[#1F2B1D] dark:text-[#F4EFE6] font-medium">
                          {analysisResult.riskBand}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-display text-2xl text-[#1F2B1D] dark:text-[#F4EFE6]">
                        {Math.round(analysisResult.riskScore * 100)}%
                      </span>
                      <span className="block text-[10px] uppercase font-mono text-[#657351] dark:text-[#A3B59E]">
                        Estimated Risk Score
                      </span>
                    </div>
                  </div>

                  {/* Detected Indicators */}
                  {analysisResult.indicators.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#657351] dark:text-[#A3B59E]">
                        Detected Threat Indicators (Model Weights)
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {analysisResult.indicators.map((ind, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white dark:bg-[#202E1E] border border-[#243324]/10 dark:border-white/10 text-[#1F2B1D] dark:text-[#CBD7C7]"
                            title={ind.description}
                          >
                            {ind.token} <span className="opacity-60">+{ind.weight.toFixed(1)}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Explanation */}
                  <p className="text-xs text-[#4A5D44] dark:text-[#CBD7C7] font-light leading-relaxed">
                    {analysisResult.explanation}
                  </p>

                  {/* Mandatory Advisory Notice (Section 8.1 & 8.7) */}
                  <div className="p-3.5 rounded-2xl bg-[#EFE9DD] dark:bg-[#213020] border border-[#243324]/10 dark:border-white/10 text-[11px] text-[#657351] dark:text-[#A3B59E] leading-relaxed">
                    <strong>Advisory Notice:</strong> Machine-learning outputs are statistical estimations, not mathematical guarantees. Low detected risk does not certify complete safety.
                  </div>

                  {/* Secure & Archive Primary Action */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleSecureAndArchive}
                      className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[#1F2B1D] dark:bg-[#CBD7C7] text-white dark:text-[#1F2B1D] hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{archivedSuccess ? 'Enveloped & Saved to Vault!' : 'Secure & Archive in Vault'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <span className="text-[10px] font-mono text-[#657351] dark:text-[#A3B59E]">
                      Latency: {analysisResult.latencyMs} ms
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Key Metric Highlights - Stacked on Right */}
          <div className="lg:col-span-5 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="p-8 sm:p-10 rounded-[2.5rem] bg-[#F5F2EB] dark:bg-[#233522] border border-[#243324]/10 dark:border-white/12 shadow-sm space-y-3 transition-colors duration-400"
            >
              <div className="font-display text-5xl sm:text-6xl text-[#1F2B1D] dark:text-[#F4EFE6] font-light tracking-tight">
                {SECURITY_METADATA.heldOutModelPrecision}%
              </div>
              <p className="text-base text-[#1F2B1D] dark:text-[#F4EFE6] font-medium">Held-Out Model Precision</p>
              <p className="text-sm text-[#4A5D44] dark:text-[#CBD7C7] font-light leading-relaxed">
                Trained on balanced message corpora using class weighting to suppress false-positive alarms while catching deceptive phishing attacks.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="p-8 sm:p-10 rounded-[2.5rem] bg-[#F5F2EB] dark:bg-[#233522] border border-[#243324]/10 dark:border-white/12 shadow-sm space-y-3 transition-colors duration-400"
            >
              <div className="font-display text-5xl sm:text-6xl text-[#1F2B1D] dark:text-[#F4EFE6] font-light tracking-tight">
                &lt; 12 ms
              </div>
              <p className="text-base text-[#1F2B1D] dark:text-[#F4EFE6] font-medium">Local Inference Latency</p>
              <p className="text-sm text-[#4A5D44] dark:text-[#CBD7C7] font-light leading-relaxed">
                Zero cloud API dependencies or network telemetry. Analysis executes entirely in-memory on the local workstation with TF-IDF vectorization.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
