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

export const PhishingDetectionPage: React.FC = () => {
  const { incrementSessionOps, stageMessageForEncryption, setActiveTab } = useSessionActivity();

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
    setArchivedSuccess(false);
    // Instant real inference on sample load
    const result = analyzeMessageForPhishing(sample.body);
    setAnalysisResult(result);
  };

  const handleRunAnalysis = () => {
    if (!messageBody.trim()) return;
    setIsAnalyzing(true);
    setArchivedSuccess(false);

    setTimeout(() => {
      const result = analyzeMessageForPhishing(messageBody);
      setAnalysisResult(result);
      setIsAnalyzing(false);
      incrementSessionOps(1);
    }, 200);
  };

  const handleSecureAndArchive = () => {
    setArchivedSuccess(true);
    stageMessageForEncryption({
      subject: messageSubject || 'Suspicious Phishing Message Dispatch',
      body: messageBody,
    });
    setTimeout(() => {
      setActiveTab('vault');
    }, 800);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#243324]/10 dark:border-white/10 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider bg-[#1F2B1D]/10 dark:bg-white/10 text-[#1F2B1D] dark:text-[#F4EFE6]">
              Advisory Threat Intelligence
            </span>
            <span className="text-xs font-mono text-[#657351] dark:text-[#A3B59E]">
              TF-IDF + Logistic Regression
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-[#1F2B1D] dark:text-[#F4EFE6] font-normal tracking-tight">
            AI-Powered Phishing Detection
          </h1>
          <p className="text-sm sm:text-base text-[#4A5D44] dark:text-[#CBD7C7] font-light max-w-2xl">
            Evaluate untrusted messages for deceptive urgency and credential solicitation cues using in-browser TF-IDF feature extraction and logistic regression.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#657351] dark:text-[#A3B59E] bg-[#F5F2EB] dark:bg-[#1A2619] px-3.5 py-2 rounded-xl border border-[#243324]/10 dark:border-white/10">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Model: TF-IDF-LogReg-v1.4 (In-Memory)</span>
        </div>
      </div>

      {/* Main Grid: Input Card on Left, Live Inference Result on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form & Sample Picker (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Curated Benchmark Samples */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#657351] dark:text-[#A3B59E]">
              Load Curated Benchmark Dispatches
            </label>
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
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form Inputs Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 shadow-xs space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#1F2B1D] dark:text-[#F4EFE6]">
                Subject Line
              </label>
              <input
                type="text"
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
                placeholder="Enter email subject line..."
                className="w-full px-4 py-2.5 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-[#1F2B1D] dark:focus:ring-[#CBD7C7] text-[#1F2B1D] dark:text-[#F4EFE6]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1F2B1D] dark:text-[#F4EFE6]">
                  Message Body (Plaintext Under Inspection)
                </label>
                <span className="text-[11px] font-mono text-[#657351] dark:text-[#A3B59E]">
                  {messageBody.length} chars
                </span>
              </div>
              <textarea
                rows={7}
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder="Paste message text to evaluate for deceptive indicators, artificial urgency, or credential solicitation..."
                className="w-full p-4 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 text-xs sm:text-sm font-sans focus:outline-none focus:ring-2 focus:ring-[#1F2B1D] dark:focus:ring-[#CBD7C7] text-[#1F2B1D] dark:text-[#F4EFE6] leading-relaxed resize-y"
              />
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleRunAnalysis}
                disabled={isAnalyzing || !messageBody.trim()}
                className="px-6 py-3 rounded-full text-xs sm:text-sm font-semibold bg-[#1F2B1D] dark:bg-[#CBD7C7] text-white dark:text-[#1F2B1D] hover:bg-[#2C3E2A] dark:hover:bg-white transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                <Cpu className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                <span>{isAnalyzing ? 'Extracting n-grams & Evaluating...' : 'Analyze Message for Phishing'}</span>
              </button>

              <span className="text-[11px] font-mono text-[#657351] dark:text-[#A3B59E]">
                Zero Cloud Telemetry • Local Inference
              </span>
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
                        Classification Risk Band
                      </span>
                      <h3 className="font-display text-lg sm:text-xl text-[#1F2B1D] dark:text-[#F4EFE6] font-medium leading-tight">
                        {analysisResult.riskBand}
                      </h3>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-display text-3xl text-[#1F2B1D] dark:text-[#F4EFE6] block">
                      {Math.round(analysisResult.riskScore * 100)}%
                    </span>
                    <span className="text-[10px] font-mono text-[#657351] dark:text-[#A3B59E]">
                      Estimated Probability
                    </span>
                  </div>
                </div>

                {/* Detected TF-IDF Threat Indicators */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#657351] dark:text-[#A3B59E] flex items-center justify-between">
                    <span>Contributing TF-IDF Feature Tokens</span>
                    <span className="text-[10px] font-mono">{analysisResult.indicators.length} tokens</span>
                  </label>

                  {analysisResult.indicators.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {analysisResult.indicators.map((ind, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg text-xs font-mono bg-[#F5F2EB] dark:bg-[#202E1E] border border-[#243324]/10 dark:border-white/10 text-[#1F2B1D] dark:text-[#CBD7C7] flex items-center gap-1.5"
                          title={ind.description}
                        >
                          <span>{ind.token}</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            +{ind.weight.toFixed(2)}
                          </span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-mono text-[#657351] dark:text-[#A3B59E] italic">
                      No deceptive keyword tokens or urgency indicators matched.
                    </p>
                  )}
                </div>

                {/* Explanation */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#657351] dark:text-[#A3B59E]">
                    Explainable Model Output
                  </span>
                  <p className="text-xs text-[#4A5D44] dark:text-[#CBD7C7] font-light leading-relaxed">
                    {analysisResult.explanation}
                  </p>
                </div>

                {/* Recommendations */}
                {analysisResult.recommendations.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#657351] dark:text-[#A3B59E]">
                      Advisory Recommendations
                    </span>
                    <ul className="space-y-1 text-xs text-[#4A5D44] dark:text-[#CBD7C7] font-light list-disc list-inside">
                      {analysisResult.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Model Training & Validation Boundary Notice */}
                <div className="p-4 rounded-2xl bg-[#F5F2EB] dark:bg-[#233522] border border-[#243324]/10 dark:border-white/10 space-y-1.5 text-xs text-[#4A5D44] dark:text-[#CBD7C7]">
                  <div className="font-semibold text-[#1F2B1D] dark:text-[#F4EFE6] flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-[#657351] dark:text-[#A3B59E]" />
                    <span>Inference vs Offline Validation Distinction</span>
                  </div>
                  <p className="leading-relaxed">
                    This screen executes <strong>live in-browser model inference</strong> by vectorizing text n-grams and calculating the logistic sigmoid over 993 trained coefficients. Live probability scores are advisory estimations. Model precision or accuracy cannot be asserted from single test runs without independent cross-validation over external out-of-distribution datasets.
                  </p>
                </div>

                {/* Mandatory Advisory Notice */}
                <div className="p-3.5 rounded-2xl bg-[#F5F2EB] dark:bg-[#233522] border border-[#243324]/10 dark:border-white/10 text-[11px] text-[#4A5D44] dark:text-[#CBD7C7] leading-relaxed">
                  <strong>Advisory Notice:</strong> Machine-learning outputs are statistical estimations, not mathematical guarantees. Low detected risk does not certify complete safety.
                </div>

                {/* Secure & Archive Primary Action */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#243324]/10 dark:border-white/10">
                  <button
                    type="button"
                    onClick={handleSecureAndArchive}
                    className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[#1F2B1D] dark:bg-[#384E36] text-white hover:bg-[#2c402a] transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{archivedSuccess ? 'Staged to Vault!' : 'Secure & Archive in Vault'}</span>
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
      </div>
    </div>
  );
};
