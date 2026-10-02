import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Language } from '../types';
import {
  locales,
  getTranslation,
  formatDateLocalized,
  formatWeekdayLocalized,
  formatShortDate as formatShortDateHelper,
  type TranslationKey,
} from '../locales';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  formatDate: (date: string | Date) => string;
  formatWeekday: (date: string | Date) => string;
  formatShortDate: (date: string | Date) => string;
  months: readonly string[];
  monthsShort: readonly string[];
  weekdays: readonly string[];
  weekdaysShort: readonly string[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'pla_preferred_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Language;
    if (saved && (saved === 'en' || saved === 'ru' || saved === 'uz')) {
      return saved;
    }
    // Browser language check
    const navLang = navigator.language.toLowerCase();
    if (navLang.startsWith('uz')) return 'uz';
    if (navLang.startsWith('ru')) return 'ru';
    return 'ru'; // Russian default for Uzbekistan/regional preference
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  const t = (key: TranslationKey, params?: Record<string, string | number>) => {
    return getTranslation(language, key, params);
  };

  const formatDate = (date: string | Date) => formatDateLocalized(date, language);
  const formatWeekday = (date: string | Date) => formatWeekdayLocalized(date, language);
  const formatShortDate = (date: string | Date) => formatShortDateHelper(date, language);

  const dict = locales[language] || locales.ru;

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        formatDate,
        formatWeekday,
        formatShortDate,
        months: dict.months,
        monthsShort: dict.monthsShort,
        weekdays: dict.weekdays,
        weekdaysShort: dict.weekdaysShort,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
