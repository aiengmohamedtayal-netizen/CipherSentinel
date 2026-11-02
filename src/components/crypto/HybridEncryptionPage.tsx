import { useLanguage } from '../../context/LanguageContext';
import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, KeyRound, Lock, ShieldCheck, Unlock } from 'lucide-react';
import { useSessionActivity } from '../../context/SessionContext';
import { EncryptedRecord } from '../../types';
import {
  createEncryptedEnvelope,
  decryptEncryptedEnvelope,
  MAX_ENVELOPE_PLAINTEXT_BYTES,
  validateEncryptedEnvelope,
} from '../../utils/crypto';

interface ArchivedMessagePayload {
  format: 'ciphersentinel-message-v1';
  subject: string;
  body: string;
}

const isArchivedMessagePayload = (value: unknown): value is ArchivedMessagePayload => {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Partial<ArchivedMessagePayload>;
  return payload.format === 'ciphersentinel-message-v1' &&
    typeof payload.subject === 'string' &&
    typeof payload.body === 'string';
};

export const HybridEncryptionPage: React.FC = () => {
  const { t, formatNumber, localizeError } = useLanguage();
  const {
    activeRsaKey,
    stagedMessage,
    clearStagedMessage,
    addVaultRecord,
    setActiveTab,
  } = useSessionActivity();

  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptedRecord, setEncryptedRecord] = useState<EncryptedRecord | null>(null);
  const [envelopeInput, setEnvelopeInput] = useState('');
  const [decryptedMessage, setDecryptedMessage] = useState<ArchivedMessagePayload | string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (stagedMessage) {
      setSubject(stagedMessage.subject);
      setMessageBody(stagedMessage.body);
      setEncryptedRecord(null);
      setDecryptedMessage(null);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [stagedMessage]);

  const payloadBytes = useMemo(() => {
    if (!subject.trim() || !messageBody.trim()) return 0;
    return new TextEncoder().encode(JSON.stringify({
      format: 'ciphersentinel-message-v1',
      subject: subject.trim(),
      body: messageBody,
    } satisfies ArchivedMessagePayload)).byteLength;
  }, [subject, messageBody]);

  const handleEncryptAndArchive = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setDecryptedMessage(null);

    if (!subject.trim()) {
      setErrorMessage('Enter a subject before encrypting the message.');
      return;
    }
    if (subject.trim().length > 256) {
      setErrorMessage('Subject must be 256 characters or fewer.');
      return;
    }
    if (!messageBody.trim()) {
      setErrorMessage('Enter message content before encrypting.');
      return;
    }
    if (payloadBytes > MAX_ENVELOPE_PLAINTEXT_BYTES) {
      setErrorMessage(`Message content must not exceed ${MAX_ENVELOPE_PLAINTEXT_BYTES / 1024} KB after packaging.`);
      return;
    }
    if (!activeRsaKey) {
      setErrorMessage('The RSA-3072 key pair is still being generated. Try again when Key Manager shows it as ready.');
      return;
    }

    setIsEncrypting(true);
    try {
      const payload: ArchivedMessagePayload = {
        format: 'ciphersentinel-message-v1',
        subject: subject.trim(),
        body: messageBody,
      };
      const record = await createEncryptedEnvelope(
        JSON.stringify(payload),
        activeRsaKey.publicKeyPem,
        activeRsaKey.keyId
      );

      addVaultRecord(record);
      setEncryptedRecord(record);
      setEnvelopeInput(JSON.stringify(record, null, 2));
      setSubject('');
      setMessageBody('');
      clearStagedMessage();
      setSuccessMessage('Message encrypted with AES-256-GCM, its DEK wrapped with RSA-OAEP, and the envelope added to this session’s vault.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Hybrid encryption failed.');
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleDecrypt = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setDecryptedMessage(null);

    if (!activeRsaKey) {
      setErrorMessage('No active RSA private key is available.');
      return;
    }

    try {
      const parsed: unknown = JSON.parse(envelopeInput);
      validateEncryptedEnvelope(parsed);
      if (parsed.key_id !== activeRsaKey.keyId) {
        throw new Error('This envelope was encrypted for a different RSA key. Select or restore the matching key before decrypting.');
      }

      const result = await decryptEncryptedEnvelope(parsed, activeRsaKey.privateKeyPem);
      let display: ArchivedMessagePayload | string = result.plaintext;
      try {
        const payload: unknown = JSON.parse(result.plaintext);
        if (isArchivedMessagePayload(payload)) display = payload;
      } catch {
        // Other valid envelopes may contain plain text rather than the message form used here.
      }
      setDecryptedMessage(display);
      setSuccessMessage('RSA-OAEP key unwrap and AES-GCM authentication succeeded. Plaintext is held in this page’s memory.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Envelope decryption failed.');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#243324]/10 dark:border-white/10 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider bg-[#1F2B1D]/10 dark:bg-white/10 text-[#1F2B1D] dark:text-[#F4EFE6]">
              {t("Hybrid Encryption Workflow")}</span>
            <span className="text-xs font-mono text-[#657351] dark:text-[#A3B59E]">{t("AES-256-GCM + RSA-3072 OAEP")}</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-[#1F2B1D] dark:text-[#F4EFE6] font-normal tracking-tight">
            {t("Encrypt, Archive & Verify")}</h1>
          <p className="text-sm sm:text-base text-[#4A5D44] dark:text-[#CBD7C7] font-light max-w-2xl">
            {t("Encrypt the message with a fresh AES data key, wrap that key to the active RSA public key, then verify and decrypt the versioned envelope.")}</p>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('vault')}
          className="px-4 py-2.5 rounded-full text-xs font-medium bg-[#1F2B1D] dark:bg-[#384E36] text-white hover:bg-[#2c402a] transition-all flex items-center gap-2 shadow-xs cursor-pointer self-start md:self-end"
        >
          <span>{t("Open Secure Vault")}</span><ArrowRight className="w-3 h-3 rtl-mirror" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 shadow-xs space-y-5">
          <div className="flex items-center gap-3 border-b border-[#243324]/10 dark:border-white/10 pb-4">
            <div className="p-2 rounded-xl bg-[#F5F2EB] dark:bg-[#233522] text-[#1F2B1D] dark:text-[#CBD7C7]"><Lock className="w-5 h-5" /></div>
            <div>
              <h2 className="font-display text-lg font-medium text-[#1F2B1D] dark:text-[#F4EFE6]">{t("Encrypt a message")}</h2>
              <p className="text-[11px] font-mono text-[#657351] dark:text-[#A3B59E]">{t("Private content is encrypted; the vault label stays generic.")}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="hybrid-subject" className="text-xs font-medium text-[#4A5D44] dark:text-[#CBD7C7]">{t("Message subject")}</label>
            <input id="hybrid-subject" dir="auto" value={subject} maxLength={256} onChange={(event) => setSubject(event.target.value)} placeholder={t("Subject (encrypted with the message)")} className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 text-sm text-[#1F2B1D] dark:text-[#F4EFE6]" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="hybrid-message" className="text-xs font-medium text-[#4A5D44] dark:text-[#CBD7C7]">{t("Message content")}</label>
          <textarea id="hybrid-message" dir="auto" value={messageBody} onChange={(event) => setMessageBody(event.target.value)} rows={7} maxLength={MAX_ENVELOPE_PLAINTEXT_BYTES} placeholder={t("Enter the message to protect...")} className="w-full p-3.5 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 text-sm font-mono text-[#1F2B1D] dark:text-[#F4EFE6] leading-relaxed resize-y" />
            <p className="text-[11px] font-mono text-[#657351] dark:text-[#A3B59E]"><span>{t("Packaged payload:")}{' '}</span><bdi dir="ltr">{formatNumber(payloadBytes)} {' '}{t("/")}{' '}{formatNumber(MAX_ENVELOPE_PLAINTEXT_BYTES)}</bdi>{' '}{t("bytes")}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F5F2EB] dark:bg-[#233522] border border-[#243324]/10 dark:border-white/10 text-xs text-[#4A5D44] dark:text-[#CBD7C7] flex items-start gap-2.5">
            <KeyRound className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{activeRsaKey ? t('Recipient key ready: {{keyId}} ({{bits}}-bit RSA).', { keyId: activeRsaKey.keyId, bits: activeRsaKey.modulusLength }) : t('Generating the RSA-3072 key pair…')}</span>
          </div>

          <button type="button" onClick={handleEncryptAndArchive} disabled={isEncrypting || !activeRsaKey} className="w-full py-3.5 px-6 rounded-2xl bg-[#1F2B1D] dark:bg-[#CBD7C7] text-white dark:text-[#1F2B1D] hover:bg-[#2C3E2A] dark:hover:bg-white transition-all font-semibold text-sm cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <ShieldCheck className="w-4 h-4" /><span>{t(isEncrypting ? 'Encrypting message…' : 'Encrypt & Add to Session Vault')}</span>
          </button>
        </section>

        <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 shadow-xs space-y-5">
          <div className="flex items-center gap-3 border-b border-[#243324]/10 dark:border-white/10 pb-4">
            <div className="p-2 rounded-xl bg-[#F5F2EB] dark:bg-[#233522] text-[#1F2B1D] dark:text-[#CBD7C7]"><Unlock className="w-5 h-5" /></div>
            <div>
              <h2 className="font-display text-lg font-medium text-[#1F2B1D] dark:text-[#F4EFE6]">{t("Decrypt an envelope")}</h2>
              <p className="text-[11px] font-mono text-[#657351] dark:text-[#A3B59E]">{t("Requires the matching active private key and valid authentication tag.")}</p>
            </div>
          </div>

          {encryptedRecord && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{t("Envelope")}{' '}<bdi dir="ltr">{encryptedRecord.record_id}</bdi>{' '}{t("was added to this tab’s in-memory vault. It is ready to verify below.")}</span>
            </div>
          )}

          <label htmlFor="hybrid-envelope" className="text-xs font-medium text-[#4A5D44] dark:text-[#CBD7C7] block">{t("Version 1 envelope JSON")}</label>
          <textarea id="hybrid-envelope" dir="ltr" value={envelopeInput} onChange={(event) => setEnvelopeInput(event.target.value)} rows={12} spellCheck={false} placeholder={t("Paste a CipherSentinel encrypted envelope JSON object...")} className="w-full p-3.5 rounded-xl bg-[#FBF9F5] dark:bg-[#131D12] border border-[#243324]/15 dark:border-white/15 text-[11px] font-mono text-[#1F2B1D] dark:text-[#F4EFE6] leading-relaxed resize-y" />
          <button type="button" onClick={handleDecrypt} disabled={!envelopeInput.trim() || !activeRsaKey} className="w-full py-3.5 px-6 rounded-2xl bg-[#1F2B1D] dark:bg-[#CBD7C7] text-white dark:text-[#1F2B1D] hover:bg-[#2C3E2A] dark:hover:bg-white transition-all font-semibold text-sm cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <Unlock className="w-4 h-4" /><span>{t("Unwrap Key & Decrypt")}</span>
          </button>

          {decryptedMessage && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">{t("Authenticated plaintext • active memory only")}</span>
              {typeof decryptedMessage === 'string' ? <pre dir="auto" className="text-xs font-mono whitespace-pre-wrap break-words text-[#1F2B1D] dark:text-[#F4EFE6]">{decryptedMessage}</pre> : <div className="space-y-1"><strong dir="auto" className="text-sm text-[#1F2B1D] dark:text-[#F4EFE6]">{decryptedMessage.subject}</strong><p dir="auto" className="text-xs font-mono whitespace-pre-wrap break-words text-[#1F2B1D] dark:text-[#F4EFE6]">{decryptedMessage.body}</p></div>}
            </div>
          )}
        </section>
      </div>

      {(errorMessage || successMessage) && (
        <div className={`p-4 rounded-2xl border text-xs flex items-start gap-2.5 ${errorMessage ? 'bg-rose-500/10 border-rose-500/20 text-rose-900 dark:text-rose-200' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-200'}`} role={errorMessage ? 'alert' : 'status'}>
          {errorMessage ? <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{errorMessage ? localizeError(errorMessage) : t(successMessage ?? '')}</span>
        </div>
      )}
    </div>
  );
};

