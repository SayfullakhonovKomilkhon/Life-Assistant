import React from 'react';
import {
  Mic,
  Bell,
  Sun,
  Moon,
  Laptop,
  Globe,
  Sparkles,
  Menu,
  User as UserIcon,
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { PWAInstallButton } from './PWAInstallButton';
import type { Language, ThemeMode } from '../types';

interface HeaderProps {
  onOpenVoice: () => void;
  onOpenNotifications: () => void;
  onOpenMobileMenu: () => void;
  onOpenProfile: () => void;
  onOpenThemePicker: () => void;
  unreadCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenVoice,
  onOpenNotifications,
  onOpenMobileMenu,
  onOpenProfile,
  onOpenThemePicker,
  unreadCount,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, user, accentColor } = useAuth();

  const getThemeIcon = () => {
    if (theme === 'light') return <Sun className="w-4 h-4 text-amber-500" />;
    if (theme === 'dark') return <Moon className="w-4 h-4 text-indigo-400" />;
    return <Laptop className="w-4 h-4 text-slate-500" />;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Left: Mobile Menu + Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent-gradient flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                {t('appName')}
              </h1>
              <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-xs md:max-w-md">
                {t('appSubtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Big Voice Assistant Trigger Button */}
          <button
            onClick={onOpenVoice}
            className="flex items-center gap-2 rounded-xl bg-accent-gradient hover:opacity-95 text-white px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold shadow-md transition active:scale-95 cursor-pointer"
            title={t('quickVoiceAssistant')}
          >
            <Mic className="w-4 h-4 animate-pulse text-white" />
            <span className="hidden sm:inline">{t('quickVoiceAssistant')}</span>
          </button>

          {/* Language Switcher: EN | RU | UZ */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-xs font-semibold">
            {(['en', 'ru', 'uz'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-2 py-1 rounded-lg transition uppercase text-[11px] cursor-pointer ${
                  language === lang
                    ? 'bg-white dark:bg-slate-700 text-accent-main shadow-sm font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Theme & Color Picker button */}
          <button
            onClick={onOpenThemePicker}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer relative"
            title={language === 'ru' ? 'Выбрать тему и цвет' : language === 'uz' ? 'Mavzu va rangni tanlash' : 'Theme & Accent Color'}
          >
            {getThemeIcon()}
          </button>

          {/* Notifications Button with Badge */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title={t('notifications')}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* User Profile Avatar Button (Clickable!) */}
          <button
            onClick={onOpenProfile}
            className="w-9 h-9 rounded-full overflow-hidden border-2 border-indigo-500/50 hover:border-indigo-500 flex items-center justify-center bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-bold text-xs shadow-xs hover:scale-105 active:scale-95 transition cursor-pointer"
            title={user?.name || user?.email || (language === 'ru' ? 'Настроить профиль' : 'Profile Settings')}
            aria-label="Open profile settings"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name || 'User'} className="w-full h-full object-cover" />
            ) : user?.name ? (
              user.name.charAt(0).toUpperCase()
            ) : (
              <UserIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
