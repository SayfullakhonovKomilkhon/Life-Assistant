import React, { useState, useEffect } from 'react';
import {
  X,
  User as UserIcon,
  Mail,
  Globe,
  Clock,
  Palette,
  Sun,
  Moon,
  Laptop,
  Check,
  LogOut,
  Camera,
  Sparkles,
  Phone,
  FileText,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import type { Language, ThemeMode, AccentColor } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
  onOpenThemePicker?: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
];

const ACCENT_COLORS: { id: AccentColor; labelRu: string; labelUz: string; labelEn: string; bg: string }[] = [
  { id: 'indigo', labelRu: 'Индиго', labelUz: 'Indigo', labelEn: 'Indigo', bg: 'bg-indigo-600' },
  { id: 'emerald', labelRu: 'Изумруд', labelUz: 'Zumrad', labelEn: 'Emerald', bg: 'bg-emerald-600' },
  { id: 'rose', labelRu: 'Розовый', labelUz: 'Pushti', labelEn: 'Rose', bg: 'bg-rose-600' },
  { id: 'amber', labelRu: 'Янтарь', labelUz: 'Qahrabo', labelEn: 'Amber', bg: 'bg-amber-500' },
  { id: 'cyan', labelRu: 'Бирюзовый', labelUz: 'Moviy', labelEn: 'Cyan', bg: 'bg-cyan-500' },
  { id: 'purple', labelRu: 'Пурпур', labelUz: 'Binafsha', labelEn: 'Purple', bg: 'bg-purple-600' },
  { id: 'blue', labelRu: 'Сапфир', labelUz: 'Sapfir', labelEn: 'Blue', bg: 'bg-blue-600' },
  { id: 'crimson', labelRu: 'Рубин', labelUz: 'Yoqut', labelEn: 'Crimson', bg: 'bg-red-600' },
  { id: 'teal', labelRu: 'Морской', labelUz: 'Dengiz', labelEn: 'Teal', bg: 'bg-teal-600' },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenAuth,
  onOpenThemePicker,
}) => {
  const { user, updateProfile, theme, setTheme, accentColor, setAccentColor, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [name, setName] = useState(user?.name || 'Bekhruz');
  const [email, setEmail] = useState(user?.email || 'bekhruz@assistant.ai');
  const [phone, setPhone] = useState(user?.phone || '+998 90 123-45-67');
  const [bio, setBio] = useState(user?.bio || 'Productivity enthusiast');
  const [avatar, setAvatar] = useState(user?.avatar || AVATAR_PRESETS[0]);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [country, setCountry] = useState(user?.country || 'Uzbekistan');
  const [timezone, setTimezone] = useState(user?.timezone || 'Asia/Tashkent');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setBio(user.bio || '');
      setAvatar(user.avatar || AVATAR_PRESETS[0]);
      setCountry(user.country || 'Uzbekistan');
      setTimezone(user.timezone || 'Asia/Tashkent');
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        avatar: customAvatarUrl.trim() || avatar,
        country,
        timezone,
        language,
        theme,
        accentColor,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePresetSelect = (url: string) => {
    setAvatar(url);
    setCustomAvatarUrl('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {language === 'ru' ? 'Настройки профиля' : language === 'uz' ? 'Profil sozlamalari' : 'Profile Settings'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'ru' ? 'Личные данные, темы оформления и языки' : language === 'uz' ? 'Shaxsiy ma‘lumotlar, mavzular va til' : 'Personal info, appearance themes & language'}
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

        {isSaved && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5 animate-in fade-in">
            <Check className="w-4 h-4 flex-shrink-0 stroke-[3]" />
            <span className="font-semibold">
              {language === 'ru' ? 'Профиль и оформление успешно сохранены!' : language === 'uz' ? 'Profil va mavzu muvaffaqiyatli saqlandi!' : 'Profile & appearance saved successfully!'}
            </span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar Section */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              {language === 'ru' ? 'Аватар профиля' : language === 'uz' ? 'Profil rasmi' : 'Profile Avatar'}
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500 shadow-md flex-shrink-0 bg-slate-200">
                <img
                  src={customAvatarUrl || avatar}
                  alt={name || 'Avatar'}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => handlePresetSelect(preset)}
                      className={`w-8 h-8 rounded-full overflow-hidden border-2 transition cursor-pointer ${
                        avatar === preset && !customAvatarUrl
                          ? 'border-indigo-600 scale-110 shadow-sm ring-2 ring-indigo-500/20'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={preset} alt="preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(!showCustomInput)}
                    className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition cursor-pointer"
                  >
                    URL...
                  </button>
                </div>

                {showCustomInput && (
                  <input
                    type="url"
                    value={customAvatarUrl}
                    onChange={(e) => setCustomAvatarUrl(e.target.value)}
                    placeholder="https://... (image URL)"
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Personal Info: Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('nameLabel')} *
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Bekhruz"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('emailLabel')} *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="bekhruz@example.com"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Optional: Phone & Bio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'ru' ? 'Телефон / Telegram' : language === 'uz' ? 'Telefon / Telegram' : 'Phone / Telegram'}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 90 123-45-67"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'ru' ? 'О себе / Статус' : language === 'uz' ? 'O‘zingiz haqingizda' : 'Bio / Status'}
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Focus on goals"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Language Switcher */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              {language === 'ru' ? 'Язык интерфейса' : language === 'uz' ? 'Interfeys tili' : 'Interface Language'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { code: 'ru' as Language, label: 'Русский 🇷🇺' },
                { code: 'en' as Language, label: 'English 🇬🇧' },
                { code: 'uz' as Language, label: 'O‘zbekcha 🇺🇿' },
              ].map((langItem) => (
                <button
                  type="button"
                  key={langItem.code}
                  onClick={() => setLanguage(langItem.code)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                    language === langItem.code
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {langItem.label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Modes: Day / Night / Midnight / System */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'ru' ? 'Режим оформления (День / Ночь)' : language === 'uz' ? 'Ko‘rinish rejimi (Kun / Tun)' : 'Theme Mode (Day / Night)'}
              </label>
              {onOpenThemePicker && (
                <button
                  type="button"
                  onClick={onOpenThemePicker}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {language === 'ru' ? 'Палитра цветов...' : 'Color Palette...'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'light' as ThemeMode, labelRu: 'Дневная ☀️', labelUz: 'Yorug‘ ☀️', labelEn: 'Day ☀️', icon: Sun },
                { id: 'dark' as ThemeMode, labelRu: 'Ночная 🌙', labelUz: 'Tungi 🌙', labelEn: 'Night 🌙', icon: Moon },
                { id: 'midnight' as ThemeMode, labelRu: 'OLED 🖤', labelUz: 'OLED 🖤', labelEn: 'Midnight 🖤', icon: Smartphone },
                { id: 'system' as ThemeMode, labelRu: 'Системная 💻', labelUz: 'Tizim 💻', labelEn: 'System 💻', icon: Laptop },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = theme === m.id;
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setTheme(m.id)}
                    className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1 text-xs font-bold transition cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{language === 'ru' ? m.labelRu : language === 'uz' ? m.labelUz : m.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accent Colors (9 Options) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'ru' ? 'Цветовая гамма' : language === 'uz' ? 'Ranglar gammasi' : 'Accent Color Palette'}
              </label>
              <span className="text-[11px] font-bold text-slate-400 capitalize">
                {accentColor}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {ACCENT_COLORS.map((col) => (
                <button
                  type="button"
                  key={col.id}
                  onClick={() => setAccentColor(col.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl border transition cursor-pointer ${
                    accentColor === col.id
                      ? 'border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-800 shadow-xs'
                      : 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full ${col.bg} flex items-center justify-center text-white shadow-xs flex-shrink-0`}>
                    {accentColor === col.id && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                    {language === 'ru' ? col.labelRu : language === 'uz' ? col.labelUz : col.labelEn}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Country & Timezone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('country')}
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="Uzbekistan">Uzbekistan (O‘zbekiston)</option>
                <option value="Kazakhstan">Kazakhstan</option>
                <option value="Russia">Russia (Россия)</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Turkey">Turkey</option>
                <option value="Germany">Germany</option>
                <option value="United Arab Emirates">UAE (Dubai)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('timezone')}
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="Asia/Tashkent">Asia/Tashkent (UTC+5)</option>
                <option value="Asia/Samarkand">Asia/Samarkand (UTC+5)</option>
                <option value="Asia/Almaty">Asia/Almaty (UTC+5)</option>
                <option value="Europe/Moscow">Europe/Moscow (UTC+3)</option>
                <option value="Asia/Dubai">Asia/Dubai (UTC+4)</option>
                <option value="Europe/London">Europe/London (UTC+1)</option>
                <option value="America/New_York">America/New York (UTC-5)</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs font-semibold transition cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{language === 'ru' ? 'Сменить аккаунт / Вход' : language === 'uz' ? 'Hisobni almashtirish' : 'Switch Account / Login'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {t('close')}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-accent-gradient text-white text-xs font-bold shadow-md shadow-accent-glow hover:opacity-95 active:scale-98 transition cursor-pointer"
              >
                {isSaving ? t('loading') : (language === 'ru' ? 'Сохранить профиль' : language === 'uz' ? 'Saqlash' : 'Save Profile')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
