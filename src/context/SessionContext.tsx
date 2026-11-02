import React, { createContext, useContext, useState, useEffect } from 'react';
import { EncryptedRecord, TestCase, NavigationTab, ActiveRsaKeyPair } from '../types';
import { INITIAL_VAULT_RECORDS, INITIAL_SECURITY_TEST_CASES } from '../data/reportData';
import {
  generateRsaKeyPair,
  generateRandomAesKey,
} from '../utils/crypto';
import { executeSecurityTestSuite } from '../utils/securityTestSuite';

interface SessionContextType {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  activeRsaKey: ActiveRsaKeyPair | null;
  setActiveRsaKey: (key: ActiveRsaKeyPair | null) => void;
  generateNewRsaKey: () => Promise<ActiveRsaKeyPair>;
  activeAesKeyB64: string;
  setActiveAesKeyB64: (keyB64: string) => void;
  generateNewAesKey: () => void;
  sessionOperationsCount: number;
  incrementSessionOps: (amount?: number) => void;
  vaultRecords: EncryptedRecord[];
  addVaultRecord: (record: EncryptedRecord) => void;
  deleteVaultRecord: (recordId: string) => void;
  updateVaultRecord: (record: EncryptedRecord) => void;
  testCases: TestCase[];
  runAllTests: () => Promise<void>;
  isTestingInProgress: boolean;
  lastTestRunTimestamp: string | null;
  stagedMessage: { subject: string; body: string } | null;
  stageMessageForEncryption: (msg: { subject: string; body: string }) => void;
  clearStagedMessage: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Primary navigation: Default directly to 'crypto-lab' as requested!
  const [activeTab, setActiveTab] = useState<NavigationTab>('crypto-lab');

  // Cryptographic Keys State
  const [activeRsaKey, setActiveRsaKey] = useState<ActiveRsaKeyPair | null>(null);
  const [activeAesKeyB64, setActiveAesKeyB64] = useState<string>('');

  // Operations & Persistence State
  const [sessionOperationsCount, setSessionOperationsCount] = useState<number>(0);
  const [vaultRecords, setVaultRecords] = useState<EncryptedRecord[]>(INITIAL_VAULT_RECORDS);
  const [testCases, setTestCases] = useState<TestCase[]>(INITIAL_SECURITY_TEST_CASES);
  const [isTestingInProgress, setIsTestingInProgress] = useState<boolean>(false);
  const [lastTestRunTimestamp, setLastTestRunTimestamp] = useState<string | null>(null);
  const [stagedMessage, setStagedMessage] = useState<{ subject: string; body: string } | null>(null);

  // Initialize fresh keys on start
  useEffect(() => {
    // Generate AES key immediately
    const { keyB64 } = generateRandomAesKey();
    setActiveAesKeyB64(keyB64);

    // Generate RSA-3072 key pair in Web Crypto (Consistent with report spec)
    generateRsaKeyPair(3072)
      .then((keyPair) => {
        setActiveRsaKey({
          keyId: keyPair.keyId,
          publicKeyPem: keyPair.publicKeyPem,
          privateKeyPem: keyPair.privateKeyPem,
          publicKeyFingerprint: keyPair.publicKeyFingerprint,
          modulusLength: keyPair.modulusLength,
          createdAt: new Date().toLocaleTimeString(),
        });
      })
      .catch((err) => {
        console.warn('Initial RSA key generation note:', err);
      });
  }, []);

  const generateNewRsaKey = async (): Promise<ActiveRsaKeyPair> => {
    const keyPair = await generateRsaKeyPair(3072);
    const newKey: ActiveRsaKeyPair = {
      keyId: keyPair.keyId,
      publicKeyPem: keyPair.publicKeyPem,
      privateKeyPem: keyPair.privateKeyPem,
      publicKeyFingerprint: keyPair.publicKeyFingerprint,
      modulusLength: keyPair.modulusLength,
      createdAt: new Date().toLocaleTimeString(),
    };
    setActiveRsaKey(newKey);
    incrementSessionOps(1);
    return newKey;
  };

  const generateNewAesKey = () => {
    const { keyB64 } = generateRandomAesKey();
    setActiveAesKeyB64(keyB64);
    incrementSessionOps(1);
  };

  const incrementSessionOps = (amount: number = 1) => {
    setSessionOperationsCount((prev) => prev + amount);
  };

  const addVaultRecord = (record: EncryptedRecord) => {
    setVaultRecords((prev) => [record, ...prev]);
    incrementSessionOps(1);
  };

  const deleteVaultRecord = (recordId: string) => {
    setVaultRecords((prev) => prev.filter((r) => r.record_id !== recordId));
  };

  const updateVaultRecord = (record: EncryptedRecord) => {
    setVaultRecords((prev) => prev.map((r) => (r.record_id === record.record_id ? record : r)));
  };

  const stageMessageForEncryption = (msg: { subject: string; body: string }) => {
    setStagedMessage(msg);
    setActiveTab('hybrid');
  };

  const clearStagedMessage = () => setStagedMessage(null);

  const runAllTests = async () => {
    setIsTestingInProgress(true);
    try {
      const executed = await executeSecurityTestSuite();
      setTestCases(executed);
      setLastTestRunTimestamp(new Date().toLocaleTimeString());
      incrementSessionOps(executed.length);
    } finally {
      setIsTestingInProgress(false);
    }
  };

  return (
    <SessionContext.Provider
      value={{
        activeTab,
        setActiveTab,
        activeRsaKey,
        setActiveRsaKey,
        generateNewRsaKey,
        activeAesKeyB64,
        setActiveAesKeyB64,
        generateNewAesKey,
        sessionOperationsCount,
        incrementSessionOps,
        vaultRecords,
        addVaultRecord,
        deleteVaultRecord,
        updateVaultRecord,
        testCases,
        runAllTests,
        isTestingInProgress,
        lastTestRunTimestamp,
        stagedMessage,
        stageMessageForEncryption,
        clearStagedMessage,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSessionActivity = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessionActivity must be used within a SessionProvider');
  }
  return context;
};
