import React, { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react';
import { ar } from '../i18n/ar';
import { en } from '../i18n/en';

export type Language = 'en' | 'ar';
type TranslationValues = Record<string, string | number>;
type LanguageContextValue = {
  language: Language;
  direction: 'ltr' | 'rtl';
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, values?: TranslationValues) => string;
  localizeError: (error: unknown) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
};

const LANGUAGE_STORAGE_KEY = 'ciphersentinel-language';
const dictionaries: Record<Language, Record<string, string>> = { en, ar };
const templates = Object.fromEntries(Object.entries(en)
  .filter(([key]) => key.includes('{{'))
  .map(([key]) => {
    const names: string[] = [];
    const pattern = key.split(/(\{\{[^}]+\}\})/g).map((part) => {
      const placeholder = part.match(/^\{\{([^}]+)\}\}$/);
      if (placeholder) {
        const name = placeholder[1];
        names.push(name);
        return '([\\s\\S]+?)';
      }
      return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }).join('');
    return [key, { regex: new RegExp(`^${pattern}$`), names }];
  }));
const LanguageContext = createContext<LanguageContextValue | null>(null);

function getSavedLanguage(): Language {
  try {
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'en' ? 'en' : 'ar';
  } catch {
    return 'ar';
  }
}

export const LanguageProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(getSavedLanguage);
  const direction = language === 'ar' ? 'rtl' : 'ltr';

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    } catch {
      // The language switch still works for this page when storage is unavailable.
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  }, [language, setLanguage]);

  const t = useCallback((key: string, values?: TranslationValues) => {
    let resolvedKey = key;
    let resolvedValues = values;
    if (!values) {
      for (const [template, config] of Object.entries(templates) as [string, { regex: RegExp; names: string[] }][]) {
        const match = key.match(config.regex);
        if (match) {
          resolvedKey = template;
          resolvedValues = Object.fromEntries(config.names.map((name, index) => [name, match[index + 1]]));
          break;
        }
      }
    }
    let result = dictionaries[language][resolvedKey] ?? key;
    if (resolvedValues) {
      for (const [name, value] of Object.entries(resolvedValues)) {
        const rawValue = String(value);
        const translatedValue = dictionaries[language][rawValue] ?? rawValue;
        const isolatedValue = language === 'ar' && /^[\x00-\x7F]+$/.test(translatedValue)
          ? `\u2066${translatedValue}\u2069`
          : translatedValue;
        result = result.replaceAll(`{{${name}}}`, isolatedValue);
      }
    }
    return result.replaceAll('&rarr;', language === 'ar' ? '←' : '→');
  }, [language]);

  const localizeError = useCallback((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error ?? '');
    const translated = t(message);
    if (translated !== message) return translated;
    if (language === 'ar') return 'تعذر إكمال العملية. تحقق من المدخلات والمفتاح النشط ثم حاول مجددًا.';
    return message || 'Operation failed.';
  }, [language, t]);

  const formatNumber = useCallback((value: number, options?: Intl.NumberFormatOptions) => (
    new Intl.NumberFormat(language === 'ar' ? 'ar' : 'en', options).format(value)
  ), [language]);

  useLayoutEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    document.title = dictionaries[language]['CipherSentinel — AI-Assisted Secure Message Protection System']
      ?? 'CipherSentinel — AI-Assisted Secure Message Protection System';
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) {
      description.content = dictionaries[language]['Frontend-only security education web application with local phishing analysis, AES-256-GCM and RSA-OAEP hybrid encryption, and SHA-256 integrity tools.']
        ?? description.content;
    }
  }, [language, direction]);

  const value = useMemo(() => ({ language, direction, setLanguage, toggleLanguage, t, localizeError, formatNumber }), [
    language, direction, setLanguage, toggleLanguage, t, localizeError, formatNumber,
  ]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used within LanguageProvider');
  return value;
}
