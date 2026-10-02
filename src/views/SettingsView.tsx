import React, { useState, useRef, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Globe,
  Moon,
  Sun,
  Laptop,
  Clock,
  Bell,
  Download,
  Upload,
  Shield,
  LogOut,
  User as UserIcon,
  Check,
  Palette,
  Camera,
  Mail,
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { generateICS, generateCSV, parseICS, parseCSV, downloadFile } from '../services/ics';
import type { Language, ThemeMode, AccentColor, PlanEvent, Birthday, Task, Note } from '../types';

interface SettingsViewProps {
  events: PlanEvent[];
  birthdays: Birthday[];
  tasks: Task[];
  notes: Note[];
  onRefreshData: () => void;
  onOpenAuthModal: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
];

const ACCENT_COLORS: { id: AccentColor; label: string; bg: string }[] = [
  { id: 'indigo', label: 'Indigo (Classic)', bg: 'bg-indigo-600' },
  { id: 'emerald', label: 'Emerald (Mint)', bg: 'bg-emerald-600' },
  { id: 'rose', label: 'Rose (Pink)', bg: 'bg-rose-600' },
  { id: 'amber', label: 'Sunset Amber', bg: 'bg-amber-500' },
  { id: 'cyan', label: 'Ocean Cyan', bg: 'bg-cyan-500' },
  { id: 'purple', label: 'Velvet Purple', bg: 'bg-purple-600' },
  { id: 'blue', label: 'Sapphire Blue', bg: 'bg-blue-600' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  events,
  birthdays,
  tasks,
  notes,
  onRefreshData,
  onOpenAuthModal,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { user, theme, setTheme, accentColor, setAccentColor, logout, updateProfile } = useAuth();

  // Profile edit fields
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || AVATAR_PRESETS[0]);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [showCustomAvatar, setShowCustomAvatar] = useState(false);
  const [timezone, setTimezone] = useState(user?.timezone || 'Asia/Tashkent');
  const [country, setCountry] = useState(user?.country || 'Uzbekistan');

  const [isProfileSaved, setIsProfileSaved] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);

  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [isPushLoading, setIsPushLoading] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
      setProfileAvatar(user.avatar || AVATAR_PRESETS[0]);
      setTimezone(user.timezone || 'Asia/Tashkent');
      setCountry(user.country || 'Uzbekistan');
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileSaving(true);
    try {
      await updateProfile({
        name: profileName.trim(),
        email: profileEmail.trim(),
        avatar: customAvatarUrl.trim() || profileAvatar,
        timezone,
        country,
        language,
        theme,
        accentColor,
      });
      setIsProfileSaved(true);
      setTimeout(() => setIsProfileSaved(false), 2000);
    } finally {
      setIsProfileSaving(false);
    }
  };

  // Push notification registration flow
  const handleEnablePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushStatus('Push notifications not supported on this browser/environment.');
      return;
    }

    setIsPushLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setPushStatus(t('notificationsDisabled'));
        setIsPushLoading(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const { publicKey } = await api.getVapidPublicKey();

      const padding = '='.repeat((4 - (publicKey.length % 4)) % 4);
      const base64 = (publicKey + padding).replace(/\-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: outputArray,
      });

      await api.subscribePush(subscription);
      setPushStatus(t('pushEnabledStatus'));
      updateProfile({ pushEnabled: true });
    } catch (err: any) {
      console.error('Push subscription failed:', err);
      setPushStatus(err.message || 'Push registration failed');
    } finally {
      setIsPushLoading(false);
    }
  };

  const handleTestPush = async () => {
    setIsPushLoading(true);
    try {
      const res = await api.sendTestPush();
      if (res.success) {
        setPushStatus('Test notification sent successfully! Check your device notifications.');
      } else {
        setPushStatus('No active subscriptions found. Enable push above first.');
      }
    } catch (e: any) {
      setPushStatus(e.message || 'Test push error');
    } finally {
      setIsPushLoading(false);
    }
  };

  // Export flows
  const handleExportJSON = async () => {
    const data = await api.exportFullData();
    downloadFile(
      `personal_life_assistant_backup_${new Date().toISOString().split('T')[0]}.json`,
      JSON.stringify(data, null, 2),
      'application/json'
    );
  };

  const handleExportCSV = () => {
    const csvContent = generateCSV({ events, tasks, birthdays });
    downloadFile(
      `personal_life_assistant_data_${new Date().toISOString().split('T')[0]}.csv`,
      csvContent,
      'text/csv'
    );
  };

  const handleExportICS = () => {
    const icsContent = generateICS(events, birthdays);
    downloadFile(
      `personal_life_assistant_calendar_${new Date().toISOString().split('T')[0]}.ics`,
      icsContent,
      'text/calendar'
    );
  };

  // Import file handler
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const content = reader.result as string;
      try {
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          await api.importFullData(parsed);
          setImportMessage('JSON data imported successfully!');
        } else if (file.name.endsWith('.ics')) {
          const { events: icsEvents, birthdays: icsBirthdays } = parseICS(content);
          await api.importFullData({ events: icsEvents, birthdays: icsBirthdays });
          setImportMessage(`Imported ${icsEvents.length} events and ${icsBirthdays.length} birthdays from .ics!`);
        } else if (file.name.endsWith('.csv')) {
          const { events: csvEvents, tasks: csvTasks, birthdays: csvBirthdays } = parseCSV(content);
          await api.importFullData({ events: csvEvents, tasks: csvTasks, birthdays: csvBirthdays });
          setImportMessage('CSV data imported successfully!');
        }
        onRefreshData();
      } catch (err: any) {
        setImportMessage('Failed to parse file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {t('settings')}
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'ru' ? 'Профиль, темы, языки и уведомления' : language === 'uz' ? 'Profil, mavzular, tillar va bildirishnomalar' : 'Profile, themes, languages and notifications'}
            </p>
          </div>
        </div>

        {user ? (
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t('logout')}</span>
          </button>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition cursor-pointer"
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>{t('login')}</span>
          </button>
        )}
      </div>

      {/* Profile Settings Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {language === 'ru' ? 'Настройка моего профиля' : language === 'uz' ? 'Mening profilim' : 'My Profile Settings'}
            </h3>
          </div>
          {isProfileSaved && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <Check className="w-4 h-4" />
              {language === 'ru' ? 'Сохранено!' : 'Saved!'}
            </span>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* Avatar Presets */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500 shadow-md flex-shrink-0 bg-slate-200">
              <img
                src={customAvatarUrl || profileAvatar}
                alt="Profile Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {language === 'ru' ? 'Выберите аватарку или введите ссылку' : language === 'uz' ? 'Avatar tanlang yoki havola kiriting' : 'Choose an avatar or enter URL'}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {AVATAR_PRESETS.map((p, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => {
                      setProfileAvatar(p);
                      setCustomAvatarUrl('');
                    }}
                    className={`w-8 h-8 rounded-full overflow-hidden border-2 transition cursor-pointer ${
                      profileAvatar === p && !customAvatarUrl
                        ? 'border-indigo-600 scale-110 shadow-sm'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={p} alt="preset" className="w-full h-full object-cover" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowCustomAvatar(!showCustomAvatar)}
                  className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition"
                >
                  Custom URL
                </button>
              </div>
              {showCustomAvatar && (
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('nameLabel')} *
              </label>
              <input
                type="text"
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Your Name"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('emailLabel')} *
              </label>
              <input
                type="email"
                required
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isProfileSaving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition cursor-pointer"
            >
              {isProfileSaving ? t('loading') : t('save')}
            </button>
          </div>
        </form>
      </div>

      {/* Theme Modes: Day / Night / System */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {language === 'ru' ? 'Режим темы (Дневная / Ночная)' : language === 'uz' ? 'Mavzu rejimi (Yorug‘ / Qorong‘i)' : 'Theme Mode (Day / Night)'}
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'light' as ThemeMode, label: language === 'ru' ? 'Дневная ☀️' : language === 'uz' ? 'Yorug‘ ☀️' : 'Day ☀️', icon: Sun },
            { id: 'dark' as ThemeMode, label: language === 'ru' ? 'Ночная 🌙' : language === 'uz' ? 'Qorong‘i 🌙' : 'Night 🌙', icon: Moon },
            { id: 'system' as ThemeMode, label: language === 'ru' ? 'Системная 💻' : language === 'uz' ? 'Tizim 💻' : 'System 💻', icon: Laptop },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setTheme(item.id)}
                className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
                  theme === item.id
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Colors & Palettes */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {language === 'ru' ? 'Цветовые темы' : language === 'uz' ? 'Rangli mavzular' : 'Color Themes'}
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-500 capitalize">
            {accentColor}
          </span>
        </div>

        <p className="text-xs text-slate-500">
          {language === 'ru'
            ? 'Выберите акцентный цвет для кнопок, значков, графиков и выделений:'
            : language === 'uz'
            ? 'Tugmalar, piktogrammalar va belgilar uchun asosiy rangni tanlang:'
            : 'Select an accent color for buttons, badges, and highlights:'}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {ACCENT_COLORS.map((col) => (
            <button
              key={col.id}
              onClick={() => setAccentColor(col.id)}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition cursor-pointer ${
                accentColor === col.id
                  ? 'border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-800 shadow-sm'
                  : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className={`w-8 h-8 rounded-full ${col.bg} flex items-center justify-center text-white shadow-xs`}>
                {accentColor === col.id && <Check className="w-4 h-4 stroke-[3]" />}
              </div>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 text-center leading-tight">
                {col.label.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Language Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {t('language')}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { code: 'ru' as Language, label: '🇷🇺 Русский', desc: 'Русский интерфейс и AI' },
            { code: 'uz' as Language, label: '🇺🇿 O‘zbekcha', desc: 'O‘zbek tili va AI' },
            { code: 'en' as Language, label: '🇬🇧 English', desc: 'English UI and AI' },
          ].map((item) => (
            <button
              key={item.code}
              onClick={() => {
                setLanguage(item.code);
                updateProfile({ language: item.code });
              }}
              className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                language === item.code
                  ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-white font-bold'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="text-sm font-bold mb-1">{item.label}</div>
              <div className="text-[11px] text-slate-500 font-normal">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Timezone Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {t('timezone')}
          </h3>
        </div>

        <select
          value={timezone}
          onChange={(e) => {
            setTimezone(e.target.value);
            updateProfile({ timezone: e.target.value });
          }}
          className="w-full text-xs p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
        >
          <option value="Asia/Tashkent">Asia/Tashkent (UTC+5:00) — Default</option>
          <option value="Asia/Samarkand">Asia/Samarkand (UTC+5:00)</option>
          <option value="Asia/Almaty">Asia/Almaty (UTC+5:00)</option>
          <option value="Europe/Moscow">Europe/Moscow (UTC+3:00)</option>
          <option value="Europe/London">Europe/London (UTC+1:00)</option>
          <option value="America/New_York">America/New_York (UTC-5:00)</option>
          <option value="America/Los_Angeles">America/Los_Angeles (UTC-8:00)</option>
          <option value="Asia/Tokyo">Asia/Tokyo (UTC+9:00)</option>
        </select>
      </div>

      {/* Web Push Notifications Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('pushNotifications')}
            </h3>
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Receive real background alerts for birthdays and urgent plans even when the tab is closed.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleEnablePush}
            disabled={isPushLoading}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition cursor-pointer"
          >
            {isPushLoading ? t('loading') : t('pushEnableButton')}
          </button>
          <button
            onClick={handleTestPush}
            disabled={isPushLoading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
          >
            {t('pushTestButton')}
          </button>
        </div>

        {pushStatus && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-xs font-medium text-slate-700 dark:text-slate-300">
            {pushStatus}
          </div>
        )}
      </div>

      {/* Export / Import Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {t('dataExportImport')}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportJSON}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition"
          >
            {t('exportJSON')}
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition"
          >
            {t('exportCSV')}
          </button>
          <button
            onClick={handleExportICS}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition"
          >
            {t('exportICS')}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{t('importData')}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv,.ics"
            onChange={handleFileImport}
            className="hidden"
          />
        </div>

        {importMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
            {importMessage}
          </div>
        )}
      </div>

      {/* Privacy Notice */}
      <div className="p-6 rounded-3xl bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>{t('privacyNoticeTitle')}</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          {t('privacyNoticeText')}
        </p>
      </div>
    </div>
  );
};
