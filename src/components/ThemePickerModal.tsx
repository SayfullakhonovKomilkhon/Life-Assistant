import React from 'react';
import { Sun, Moon, Laptop, Check, Palette, X, Sparkles, Smartphone } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import type { ThemeMode, AccentColor } from '../types';

interface ThemePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ACCENT_OPTIONS: { id: AccentColor; nameRu: string; nameUz: string; nameEn: string; bg: string; dot: string }[] = [
  { id: 'indigo', nameRu: 'Индиго (Классика)', nameUz: 'Indigo (Klassik)', nameEn: 'Classic Indigo', bg: 'bg-indigo-600', dot: '#4f46e5' },
  { id: 'emerald', nameRu: 'Изумруд (Мята)', nameUz: 'Zumrad (Yalpiz)', nameEn: 'Emerald Mint', bg: 'bg-emerald-600', dot: '#059669' },
  { id: 'rose', nameRu: 'Розовый (Неон)', nameUz: 'Pushti (Neon)', nameEn: 'Neon Rose', bg: 'bg-rose-600', dot: '#e11d48' },
  { id: 'amber', nameRu: 'Янтарь (Закат)', nameUz: 'Qahrabo (Quyosh botishi)', nameEn: 'Sunset Amber', bg: 'bg-amber-500', dot: '#d97706' },
  { id: 'cyan', nameRu: 'Бирюзовый (Океан)', nameUz: 'Moviy (Okean)', nameEn: 'Ocean Cyan', bg: 'bg-cyan-500', dot: '#0891b2' },
  { id: 'purple', nameRu: 'Пурпур (Бархат)', nameUz: 'Binafsha (Baxmal)', nameEn: 'Velvet Purple', bg: 'bg-purple-600', dot: '#9333ea' },
  { id: 'blue', nameRu: 'Сапфир (Синий)', nameUz: 'Sapfir (Ko‘k)', nameEn: 'Sapphire Blue', bg: 'bg-blue-600', dot: '#2563eb' },
  { id: 'crimson', nameRu: 'Рубин (Красный)', nameUz: 'Yoqut (Qizil)', nameEn: 'Crimson Ruby', bg: 'bg-red-600', dot: '#dc2626' },
  { id: 'teal', nameRu: 'Морская волна', nameUz: 'Dengiz to‘lqini', nameEn: 'Deep Teal', bg: 'bg-teal-600', dot: '#0d9488' },
];

export const ThemePickerModal: React.FC<ThemePickerModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme, accentColor, setAccentColor } = useAuth();
  const { language } = useLanguage();

  if (!isOpen) return null;

  const currentAccent = ACCENT_OPTIONS.find((a) => a.id === accentColor) || ACCENT_OPTIONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-150 relative max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent-gradient flex items-center justify-center text-white shadow-xs">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'ru' ? 'Темы и цветовые палитры' : language === 'uz' ? 'Mavzular va ranglar' : 'Themes & Color Palette'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'ru' ? 'Настройте комфортный вид приложения' : language === 'uz' ? 'Ilova ko‘rinishini sozlang' : 'Personalize the visual style'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Card */}
        <div className="mb-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {language === 'ru' ? 'Живой предпросмотр' : language === 'uz' ? 'Jonli ko‘rish' : 'Live Preview'}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent-subtle text-accent-main">
              {language === 'ru' ? currentAccent.nameRu : language === 'uz' ? currentAccent.nameUz : currentAccent.nameEn}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex-1 py-2 px-3 rounded-xl bg-accent-gradient text-white text-xs font-bold shadow-md shadow-accent-glow flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language === 'ru' ? 'Кнопка действия' : 'Action Button'}</span>
            </button>
            <div className="py-2 px-3 rounded-xl border border-accent-main text-accent-main text-xs font-bold bg-accent-subtle">
              10:00
            </div>
          </div>
        </div>

        {/* Theme Modes: Day / Night / Midnight / System */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5">
            {language === 'ru' ? 'Режим освещения' : language === 'uz' ? 'Yoritish rejimi' : 'Lighting Mode'}
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              {
                id: 'light' as ThemeMode,
                labelRu: 'Дневная ☀️',
                labelUz: 'Yorug‘ ☀️',
                labelEn: 'Day Light ☀️',
                descRu: 'Чистый белый фон',
                descUz: 'Yorug‘ oq fon',
                descEn: 'Clean light backdrop',
                icon: Sun,
              },
              {
                id: 'dark' as ThemeMode,
                labelRu: 'Ночная 🌙',
                labelUz: 'Tungi 🌙',
                labelEn: 'Night Dark 🌙',
                descRu: 'Мягкий темный графит',
                descUz: 'Yumshoq qora fon',
                descEn: 'Soft graphite dark',
                icon: Moon,
              },
              {
                id: 'midnight' as ThemeMode,
                labelRu: 'Midnight OLED 🖤',
                labelUz: 'Midnight OLED 🖤',
                labelEn: 'Midnight OLED 🖤',
                descRu: 'Глубокий черный',
                descUz: 'To‘liq qora OLED',
                descEn: 'Pitch black AMOLED',
                icon: Smartphone,
              },
              {
                id: 'system' as ThemeMode,
                labelRu: 'Системная 💻',
                labelUz: 'Tizim 💻',
                labelEn: 'System Auto 💻',
                descRu: 'Как на устройстве',
                descUz: 'Qurilma sozlamalari',
                descEn: 'Matches OS settings',
                icon: Laptop,
              },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = theme === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setTheme(m.id)}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 shadow-xs ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 stroke-[3]" />}
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {language === 'ru' ? m.labelRu : language === 'uz' ? m.labelUz : m.labelEn}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">
                    {language === 'ru' ? m.descRu : language === 'uz' ? m.descUz : m.descEn}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accent Colors (9 Options) */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {language === 'ru' ? 'Цвет акцентов и кнопок' : language === 'uz' ? 'Asosiy urg‘u rangi' : 'Accent Color Palette'}
            </label>
            <span className="text-xs font-bold text-slate-500">
              {ACCENT_OPTIONS.length} {language === 'ru' ? 'цветов' : 'colors'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ACCENT_OPTIONS.map((col) => {
              const isSelected = accentColor === col.id;
              return (
                <button
                  key={col.id}
                  onClick={() => setAccentColor(col.id)}
                  className={`flex items-center justify-between p-2.5 rounded-2xl border transition cursor-pointer ${
                    isSelected
                      ? 'border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-800 shadow-sm'
                      : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-5 h-5 rounded-full ${col.bg} flex items-center justify-center text-white shadow-xs flex-shrink-0`}
                    />
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                      {language === 'ru' ? col.nameRu : language === 'uz' ? col.nameUz : col.nameEn}
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 stroke-[3] flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
          >
            {language === 'ru' ? 'Применить и закрыть' : language === 'uz' ? 'Qo‘llash va yopish' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
