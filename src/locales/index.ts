import { en } from './en';
import { ru } from './ru';
import { uz } from './uz';
import type { Language } from '../types';

export const locales = { en, ru, uz } as const;

export type TranslationKey = keyof typeof en;

export function getTranslation(lang: Language, key: TranslationKey, params?: Record<string, string | number>): string {
  const dict = locales[lang] || locales.en;
  const val = dict[key];
  if (typeof val !== 'string') {
    return String(val ?? key);
  }
  if (!params) return val;
  return Object.entries(params).reduce((str, [k, v]) => {
    return str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }, val);
}

export function formatDateLocalized(dateInput: string | Date, lang: Language): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput.includes('T') ? dateInput : `${dateInput}T00:00:00`) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);

  const year = d.getFullYear();
  const monthIdx = d.getMonth();
  const day = d.getDate();
  const dict = locales[lang] || locales.en;

  if (lang === 'uz') {
    const monthName = dict.months[monthIdx].toLowerCase();
    return `${year}-yil ${day}-${monthName}`;
  } else if (lang === 'ru') {
    const ruGenitiveMonths = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    return `${day} ${ruGenitiveMonths[monthIdx]} ${year}`;
  } else {
    // English: September 25, 2026
    const monthName = dict.months[monthIdx];
    return `${monthName} ${day}, ${year}`;
  }
}

export function formatWeekdayLocalized(dateInput: string | Date, lang: Language): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput.includes('T') ? dateInput : `${dateInput}T00:00:00`) : dateInput;
  if (isNaN(d.getTime())) return '';
  const dayOfWeek = d.getDay();
  const dict = locales[lang] || locales.en;
  return dict.weekdays[dayOfWeek];
}

export function formatShortDate(dateInput: string | Date, lang: Language): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput.includes('T') ? dateInput : `${dateInput}T00:00:00`) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);
  const monthIdx = d.getMonth();
  const day = d.getDate();
  const dict = locales[lang] || locales.en;
  if (lang === 'uz') {
    return `${day}-${dict.monthsShort[monthIdx]}`;
  } else if (lang === 'ru') {
    return `${day} ${dict.monthsShort[monthIdx]}`;
  } else {
    return `${dict.monthsShort[monthIdx]} ${day}`;
  }
}
