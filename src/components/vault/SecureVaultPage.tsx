import { useLanguage } from '../../context/LanguageContext';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Archive,
  Lock,
  Unlock,
  Key,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  Check,
  Search,
  Filter,
  FileCode,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useSessionActivity } from '../../context/SessionContext';
import { EncryptedRecord } from '../../types';
import { base64ToBytes, bytesToBase64, decryptEncryptedEnvelope } from '../../utils/crypto';

export const SecureVaultPage: React.FC = () => {
  const { t, formatNumber, localizeError } = useLanguage();
  const {
    vaultRecords,
    deleteVaultRecord,
    updateVaultRecord,
    activeRsaKey,
    incrementSessionOps,
    setActiveTab,
  } = useSessionActivity();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'user'>('all');
  const [selectedRecord, setSelectedRecord] = useState<EncryptedRecord | null>(null);
  const [decryptedPlaintextMap, setDecryptedPlaintextMap] = useState<Record<string, string>>({});
  const [decryptionErrorMap, setDecryptionErrorMap] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter records
  const filteredRecords = vaultRecords.filter((record) => {
    const matchesSearch =
      record.record_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t(record.subject).toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.cipher_suite.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterType === 'user') return matchesSearch && !record.isDemoFixture;
    return matchesSearch;
  });

  const handleDecryptRecord = async (record: EncryptedRecord) => {
    try {
      setDecryptionErrorMap((prev) => ({ ...prev, [record.record_id]: '' }));
      if (!activeRsaKey) throw new Error('The active RSA private key is not ready.');
      if (record.key_id !== activeRsaKey.keyId) {
        throw new Error('This envelope belongs to a different RSA key. The matching private key is not active in this session.');
      }

      const res = await decryptEncryptedEnvelope(record, activeRsaKey.privateKeyPem);
      let displayText = res.plaintext;
      try {
        const parsed: unknown = JSON.parse(res.plaintext);
        if (parsed && typeof parsed === 'object') {
          const payload = parsed as { format?: unknown; subject?: unknown; body?: unknown };
          if (payload.format === 'ciphersentinel-message-v1' && typeof payload.subject === 'string' && typeof payload.body === 'string') {
            displayText = `${payload.subject}\n\n${payload.body}`;
          }
        }
      } catch {
        // Valid envelopes may contain plain text rather than the message payload format.
      }
      setDecryptedPlaintextMap((prev) => ({ ...prev, [record.record_id]: displayText }));
      incrementSessionOps(1);
    } catch (err) {
      setDecryptionErrorMap((prev) => ({
        ...prev,
        [record.record_id]: err instanceof Error ? err.message : 'Authentication failed: fail-closed rejection.',
      }));
    }
  };

  const handleSimulateTamper = (record: EncryptedRecord) => {
    try {
      const raw = base64ToBytes(record.ciphertext_b64);
      raw[0] ^= 0x01; // Flip 1 bit
      const tamperedRecord: EncryptedRecord = {
        ...record,
        ciphertext_b64: bytesToBase64(raw),
        status: 'Tampered (Simulated)',
      };
      updateVaultRecord(tamperedRecord);
      setDecryptedPlaintextMap((prev) => {
        const copy = { ...prev };
        delete copy[record.record_id];
        return copy;
      });
      incrementSessionOps(1);
    } catch (err) {
      setDecryptionErrorMap((prev) => ({
        ...prev,
        [record.record_id]: err instanceof Error ? err.message : 'Unable to simulate tampering for this envelope.',
      }));
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#243324]/10 dark:border-white/10 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider bg-[#1F2B1D]/10 dark:bg-white/10 text-[#1F2B1D] dark:text-[#F4EFE6]">
              {t("Encrypted Envelope Storage")}</span>
            <span className="text-xs font-mono text-[#657351] dark:text-[#A3B59E]">
              {t("Session-Only Records")}</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-[#1F2B1D] dark:text-[#F4EFE6] font-normal tracking-tight">
            {t("Secure Message Vault (Session Storage)")}</h1>
          <p className="text-sm sm:text-base text-[#4A5D44] dark:text-[#CBD7C7] font-light max-w-2xl">
            {t("Inspect versioned cryptographic envelopes. Message content stays inside authenticated ciphertext; records remain in React memory only and are lost when this tab is refreshed or closed.")}</p>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('hybrid')}
          className="px-4 py-2.5 rounded-full text-xs font-medium bg-[#1F2B1D] dark:bg-[#384E36] text-white hover:bg-[#2c402a] transition-all flex items-center gap-2 shadow-xs cursor-pointer self-start md:self-end"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>{t("Encrypt New Message")}</span>
          <ArrowRight className="w-3 h-3 rtl-mirror" />
        </button>
      </div>

      {/* Session-Only Volatile Storage Notice Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex items-start gap-3 text-xs leading-relaxed">
        <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div className="space-y-1">
          <strong className="font-semibold block text-sm">
            {t("Session-Only Volatile Memory Storage Notice")}</strong>
          <p>
            {t("The Secure Message Vault operates exclusively in transient browser memory (React state). It does not write records to localStorage, cookies, or disk. User-created records disappear when the page is refreshed or closed. Decrypted plaintext is shown only after RSA key unwrap and AES-GCM authentication succeed.")}</p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#657351] dark:text-[#A3B59E] absolute start-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("Search by Record ID, subject, or cipher suite...")}
            dir="auto"
            className="w-full ps-10 pe-4 py-2.5 rounded-2xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 text-xs sm:text-sm font-sans focus:outline-none focus:ring-2 focus:ring-[#1F2B1D] dark:focus:ring-[#CBD7C7] text-[#1F2B1D] dark:text-[#F4EFE6]"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-[#1F2B1D] dark:bg-[#CBD7C7] text-white dark:text-[#1F2B1D]'
                : 'bg-white dark:bg-[#1A2619] text-[#657351] dark:text-[#A3B59E] border border-[#243324]/10 dark:border-white/10'
            }`}
          >
            {t('All Envelopes ({{count}})', { count: formatNumber(vaultRecords.length) })}</button>
          <button
            type="button"
            onClick={() => setFilterType('user')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              filterType === 'user'
                ? 'bg-[#1F2B1D] dark:bg-[#CBD7C7] text-white dark:text-[#1F2B1D]'
                : 'bg-white dark:bg-[#1A2619] text-[#657351] dark:text-[#A3B59E] border border-[#243324]/10 dark:border-white/10'
            }`}
          >
            {t('User Session ({{count}})', { count: formatNumber(vaultRecords.filter((r) => !r.isDemoFixture).length) })}</button>
        </div>
      </div>

      {/* Records Grid */}
      {filteredRecords.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRecords.map((record) => {
            const isDecrypted = Boolean(decryptedPlaintextMap[record.record_id]);
            const errorMessage = decryptionErrorMap[record.record_id];

            return (
              <div
                key={record.record_id}
                className="p-6 rounded-3xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 shadow-xs space-y-4 flex flex-col justify-between"
              >
                {/* Record Top Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#1F2B1D] dark:text-[#F4EFE6]" dir="ltr">
                      <bdi>{record.record_id}</bdi>
                    </span>
                    <div className="flex items-center gap-2">
                      {record.isDemoFixture ? (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                          {t("Demo Data")}</span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          {t("Active Session Record")}</span>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteVaultRecord(record.record_id)}
                        className="text-[#657351] hover:text-rose-600 dark:text-[#A3B59E] dark:hover:text-rose-400 p-1 cursor-pointer transition-colors"
                        title={t("Delete record from vault")}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-display text-lg font-medium text-[#1F2B1D] dark:text-[#F4EFE6] leading-snug">
                    <bdi dir="auto">{t(record.subject)}</bdi>
                  </h3>

                  <div className="flex flex-wrap gap-2 text-[11px] font-mono text-[#657351] dark:text-[#A3B59E]">
                    <bdi dir="ltr">{record.cipher_suite}</bdi>
                    <span>{t("•")}</span>
                    <span>{t("Key:")}{' '}<bdi dir="ltr">{record.key_id}</bdi></span>
                  </div>
                </div>

                {/* Envelope Parameters Badges */}
                <div className="p-3.5 rounded-2xl bg-[#F5F2EB] dark:bg-[#131D12] border border-[#243324]/10 dark:border-white/10 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-[#657351] dark:text-[#A3B59E]">{t("Ciphertext:")}</span>
                    <span className="text-[#1F2B1D] dark:text-[#F4EFE6] truncate max-w-[200px]" dir="ltr">
                      <bdi>{record.ciphertext_b64.substring(0, 24)}...</bdi></span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#657351] dark:text-[#A3B59E]">{t("GCM Nonce:")}</span>
                    <span className="text-[#1F2B1D] dark:text-[#F4EFE6]" dir="ltr">
                      <bdi>{record.nonce_b64.substring(0, 16)}...</bdi></span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#657351] dark:text-[#A3B59E]">{t("Auth Tag:")}</span>
                    <span className="text-[#1F2B1D] dark:text-[#F4EFE6]" dir="ltr">
                      <bdi>{record.tag_b64.substring(0, 16)}...</bdi></span>
                  </div>
                </div>

                {/* Decrypted Output / Error View */}
                {isDecrypted && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                      {t("Decrypted Plaintext (Active Memory Only)")}</span>
                    <p dir="auto" className="text-xs font-mono text-[#1F2B1D] dark:text-[#F4EFE6] whitespace-pre-wrap break-all">
                      {decryptedPlaintextMap[record.record_id]}
                    </p>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <span className="font-mono">{localizeError(errorMessage)}</span>
                  </div>
                )}

                {/* Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#243324]/10 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDecryptRecord(record)}
                      disabled={!activeRsaKey}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#1F2B1D] dark:bg-[#384E36] text-white hover:bg-[#2c402a] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>{t(isDecrypted ? 'Re-Verify' : 'Decrypt & Authenticate')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRecord(record)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#F5F2EB] dark:bg-[#202E1E] border border-[#243324]/10 dark:border-white/10 text-[#1F2B1D] dark:text-[#CBD7C7] hover:bg-[#eae5da] cursor-pointer"
                    >
                      {t("Inspect JSON")}</button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSimulateTamper(record)}
                    className="px-2.5 py-1.5 rounded-xl text-[11px] font-mono text-rose-700 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 cursor-pointer"
                    title={t("Flip a byte in ciphertext to test fail-closed authentication rejection")}
                  >
                    {t("Simulate Tamper")}</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 space-y-3">
          <Archive className="w-8 h-8 mx-auto text-[#657351] dark:text-[#A3B59E] opacity-50" />
          <h3 className="font-display text-lg text-[#1F2B1D] dark:text-[#F4EFE6]">
            {t("No encrypted records found")}</h3>
          <p className="text-xs text-[#4A5D44] dark:text-[#CBD7C7] font-light max-w-sm mx-auto">
            {t("Try adjusting your search filter or start a hybrid encryption workflow to add a real envelope to this session.")}</p>
        </div>
      )}

      {/* JSON Envelope Inspector Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 sm:p-8 rounded-3xl bg-[#FBF9F5] dark:bg-[#152014] text-[#1F2B1D] dark:text-[#F4EFE6] border border-[#243324]/15 dark:border-white/15 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#243324]/10 dark:border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-[#1F2B1D] dark:text-[#CBD7C7]" />
                  <h3 className="font-display text-lg font-medium">
                    {t("Encrypted Envelope Schema •")}<bdi dir="ltr">{selectedRecord.record_id}</bdi>
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="text-xs text-[#657351] hover:text-[#1F2B1D] dark:text-[#A3B59E] dark:hover:text-[#F4EFE6] cursor-pointer"
                >
                  {t("Close [×]")}</button>
              </div>

              <pre dir="ltr" className="p-4 rounded-2xl bg-white dark:bg-[#10190F] border border-[#243324]/10 dark:border-white/10 font-mono text-xs overflow-x-auto text-[#1F2B1D] dark:text-[#CBD7C7] leading-relaxed">
                {JSON.stringify(selectedRecord, null, 2)}
              </pre>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleCopy(JSON.stringify(selectedRecord, null, 2), selectedRecord.record_id)}
                  className="px-4 py-2 rounded-xl text-xs font-mono bg-[#1F2B1D] dark:bg-[#384E36] text-white hover:bg-[#2c402a] cursor-pointer"
                >
                  {t(copiedId === selectedRecord.record_id ? 'Copied JSON!' : 'Copy JSON Envelope')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

