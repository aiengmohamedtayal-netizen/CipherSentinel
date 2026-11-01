import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimatedNumber } from './AnimatedNumber';
import { INITIAL_VAULT_RECORDS, SECURITY_METADATA } from '../data/reportData';
import { EncryptedRecord } from '../types';
import { Lock, Key, ShieldCheck, AlertTriangle, Eye, EyeOff, Trash2, CheckCircle2 } from 'lucide-react';

export const EducationSection: React.FC = () => {
  const [records, setRecords] = useState<EncryptedRecord[]>(INITIAL_VAULT_RECORDS);
  const [decryptedRecordId, setDecryptedRecordId] = useState<string | null>(null);
  const [tamperedRecordId, setTamperedRecordId] = useState<string | null>(null);
  const [operationMessage, setOperationMessage] = useState<string | null>(null);

  const handleDecrypt = (rec: EncryptedRecord) => {
    if (tamperedRecordId === rec.record_id) {
      setOperationMessage(`Decryption failed on ${rec.record_id}: AES-GCM authentication tag mismatch! Ciphertext was altered.`);
      return;
    }

    if (decryptedRecordId === rec.record_id) {
      setDecryptedRecordId(null);
      setOperationMessage(null);
    } else {
      setDecryptedRecordId(rec.record_id);
      setOperationMessage(`Private key unwrap & AES-GCM authentication succeeded for ${rec.record_id}. Plaintext released in-memory.`);
    }
  };

  const handleSimulateTamper = (recId: string) => {
    if (tamperedRecordId === recId) {
      setTamperedRecordId(null);
      setOperationMessage(`Tamper simulation removed on ${recId}. Envelope integrity restored.`);
    } else {
      setTamperedRecordId(recId);
      if (decryptedRecordId === recId) {
        setDecryptedRecordId(null);
      }
      setOperationMessage(`1 bit flipped in ciphertext for ${recId}. Decryption will now fail closed.`);
    }
  };

  const handleDelete = (recId: string) => {
    setRecords((prev) => prev.filter((r) => r.record_id !== recId));
    if (decryptedRecordId === recId) setDecryptedRecordId(null);
    setOperationMessage(`Record ${recId} removed from local secure envelope vault.`);
  };

  return (
    <section
      id="vault-section"
      className="relative min-h-screen py-24 px-4 sm:px-8 lg:px-12 flex flex-col justify-center border-t border-[#243324]/10 dark:border-white/10 bg-[#F5F2EB] dark:bg-[#182417] text-[#243324] dark:text-[#F4EFE6] transition-colors duration-400"
    >
      <div className="max-w-6xl mx-auto w-full space-y-16">
        {/* Headline */}
        <div className="space-y-4 max-w-4xl">
          <p className="text-sm font-medium tracking-wide text-[#657351] dark:text-[#A3B59E]">
            Protected Message Archive
          </p>
          <h2 className="font-display text-4xl sm:text-6xl lg:text-7xl text-[#1F2B1D] dark:text-[#F4EFE6] font-normal leading-[1.02] tracking-tight">
            Encrypted envelopes guarantee confidentiality at rest and in transit.
          </h2>
          <p className="text-lg sm:text-xl text-[#4A5D44] dark:text-[#CBD7C7] font-light leading-relaxed">
            Archived messages are stored strictly as encrypted envelopes containing ciphertext, AES-GCM authentication tags, and RSA-wrapped data keys. Plaintext secrets are never persisted in local storage or logs.
          </p>
        </div>

        {/* Visual & Education Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Metrics Column - Cards slide in from left */}
          <div className="lg:col-span-5 space-y-8 order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="p-8 sm:p-10 rounded-[2.5rem] bg-white dark:bg-[#243723] border border-[#243324]/10 dark:border-white/12 shadow-sm space-y-3 transition-colors duration-400"
            >
              <div className="font-display text-5xl sm:text-6xl text-[#1F2B1D] dark:text-[#F4EFE6] font-light tracking-tight">
                <AnimatedNumber value={records.length} />
              </div>
              <p className="text-base text-[#1F2B1D] dark:text-[#F4EFE6] font-medium">Encrypted Records in Vault</p>
              <p className="text-sm text-[#4A5D44] dark:text-[#CBD7C7] font-light leading-relaxed">
                Persisted exclusively as JSON/SQLite envelopes with authenticated metadata (AAD: record ID, cipher suite version).
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="p-8 sm:p-10 rounded-[2.5rem] bg-white dark:bg-[#243723] border border-[#243324]/10 dark:border-white/12 shadow-sm space-y-3 transition-colors duration-400"
            >
              <div className="font-display text-5xl sm:text-6xl text-[#1F2B1D] dark:text-[#F4EFE6] font-light tracking-tight">
                0
              </div>
              <p className="text-base text-[#1F2B1D] dark:text-[#F4EFE6] font-medium">Plaintext Secrets Exposed</p>
              <p className="text-sm text-[#4A5D44] dark:text-[#CBD7C7] font-light leading-relaxed">
                Zero plaintext message bodies, raw DEKs, or private keys written to storage or application logs. Decryption occurs only upon demand.
              </p>
            </motion.div>
          </div>

          {/* Interactive Secure Vault Records Browser Column */}
          <div className="lg:col-span-7 rounded-[2.5rem] sm:rounded-[3.5rem] overflow-hidden shadow-xl bg-white dark:bg-[#1E2E1D] border border-[#243324]/10 dark:border-white/12 p-6 sm:p-9 space-y-5 order-1 lg:order-2 transition-colors duration-400">
            <div className="flex items-center justify-between border-b border-[#243324]/10 dark:border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#1F2B1D] dark:bg-[#384E36] text-white">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-xl sm:text-2xl text-[#1F2B1D] dark:text-[#F4EFE6]">
                    Secure Message Vault
                  </h3>
                  <p className="text-xs text-[#657351] dark:text-[#A3B59E]">
                    AES-256-GCM + RSA-OAEP Protected Envelopes
                  </p>
                </div>
              </div>

              <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#1F2B1D]/10 dark:bg-white/10 text-[#1F2B1D] dark:text-[#F4EFE6]">
                {records.length} Records
              </span>
            </div>

            {/* Status / Feedback Banner */}
            {operationMessage && (
              <div className="p-3.5 rounded-2xl bg-[#F5F2EB] dark:bg-[#152014] border border-[#243324]/10 dark:border-white/10 text-xs font-mono text-[#1F2B1D] dark:text-[#CBD7C7] flex items-center justify-between">
                <span>{operationMessage}</span>
                <button
                  type="button"
                  onClick={() => setOperationMessage(null)}
                  className="text-xs opacity-60 hover:opacity-100 cursor-pointer ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Records List */}
            <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
              {records.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#657351] dark:text-[#A3B59E]">
                  Vault is empty. Analyze a message above and choose "Secure & Archive".
                </div>
              ) : (
                records.map((rec) => {
                  const isDecrypted = decryptedRecordId === rec.record_id;
                  const isTampered = tamperedRecordId === rec.record_id;

                  return (
                    <div
                      key={rec.record_id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 space-y-3 ${
                        isTampered
                          ? 'border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/20'
                          : isDecrypted
                          ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20'
                          : 'border-[#243324]/10 dark:border-white/10 bg-[#FBF9F5] dark:bg-[#162215]'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#1F2B1D] dark:text-[#F4EFE6]">
                              {rec.record_id}
                            </span>
                            {rec.ai_risk_band && (
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                                  rec.ai_risk_band === 'High phishing risk'
                                    ? 'bg-rose-500/20 text-rose-800 dark:text-rose-300'
                                    : rec.ai_risk_band === 'Review recommended'
                                    ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                                    : 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                                }`}
                              >
                                {rec.ai_risk_band}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-medium text-[#1F2B1D] dark:text-[#F4EFE6] pt-1">
                            {rec.subject}
                          </p>
                          <p className="text-[10px] font-mono text-[#657351] dark:text-[#A3B59E]">
                            {rec.created_at} • {rec.cipher_suite}
                          </p>
                        </div>

                        {/* Record Status Badge */}
                        <div className="text-right">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                              isTampered
                                ? 'bg-rose-600/20 text-rose-700 dark:text-rose-300'
                                : 'bg-emerald-600/15 text-emerald-800 dark:text-emerald-300'
                            }`}
                          >
                            {isTampered ? 'Tampered (1-Bit Flip)' : rec.status}
                          </span>
                        </div>
                      </div>

                      {/* Ciphertext / Decrypted Content Display */}
                      {isDecrypted && rec.decryptedPlaintext ? (
                        <div className="p-3.5 rounded-xl bg-white dark:bg-[#1E2E1D] border border-emerald-500/30 space-y-1">
                          <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-700 dark:text-emerald-400 block font-semibold">
                            Authenticated Plaintext Recovered:
                          </span>
                          <p className="text-xs font-sans text-[#1F2B1D] dark:text-[#F4EFE6] leading-relaxed">
                            {rec.decryptedPlaintext}
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-black/5 dark:bg-black/20 text-[11px] font-mono text-[#657351] dark:text-[#A3B59E] truncate select-all">
                          Ciphertext: {rec.ciphertext_b64}
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#243324]/5 dark:border-white/5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDecrypt(rec)}
                            className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#1F2B1D] dark:bg-[#384E36] text-white hover:bg-[#2C3E2A] transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            {isDecrypted ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            {isDecrypted ? 'Hide Plaintext' : 'Decrypt & View'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSimulateTamper(rec.record_id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                              isTampered
                                ? 'bg-amber-600/15 border-amber-600/30 text-amber-800 dark:text-amber-200'
                                : 'border-[#243324]/15 dark:border-white/15 text-[#657351] dark:text-[#CBD7C7] hover:bg-black/5'
                            }`}
                          >
                            {isTampered ? 'Restore Original' : 'Simulate 1-Bit Tamper'}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDelete(rec.record_id)}
                          className="p-1.5 text-rose-600/70 hover:text-rose-700 dark:text-rose-400/70 dark:hover:text-rose-400 rounded-lg cursor-pointer"
                          title="Delete encrypted record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
