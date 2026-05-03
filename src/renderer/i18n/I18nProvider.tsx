import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { en, type TranslationKey } from './locales/en';
import { ja } from './locales/ja';

export type Locale = 'en' | 'ja';

const STORAGE_KEY = 'gridpark.locale';

const dictionaries: Record<Locale, Record<TranslationKey, string>> = {
  en,
  ja,
};

const detectInitial = (): Locale => {
  if (typeof window === 'undefined') return 'en';
  const stored = window.localStorage?.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'ja') return stored;
  // Fall back to browser language; default to English for anything else.
  const navLang = (navigator?.language ?? '').toLowerCase();
  return navLang.startsWith('ja') ? 'ja' : 'en';
};

const interpolate = (template: string, params?: Record<string, string | number>): string => {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const v = params[key];
    return v === undefined ? `{${key}}` : String(v);
  });
};

interface I18nContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(detectInitial);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage?.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      const dict = dictionaries[locale];
      const template = dict[key] ?? dictionaries.en[key] ?? key;
      return interpolate(template, params);
    },
    [locale]
  );

  const value = useMemo<I18nContextValue>(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};

export const useT = () => useI18n().t;
