import React, { useState } from 'react';
import {
  Home,
  Calendar,
  Cake,
  Bot,
  Mic,
  MoreHorizontal,
  Pin,
  PartyPopper,
  CheckSquare,
  BarChart3,
  Settings,
  Search,
  X,
  Palette,
  User as UserIcon,
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import type { ActiveTab } from './Sidebar';

interface MobileNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenVoice: () => void;
  onOpenProfile?: () => void;
  onOpenThemePicker?: () => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenVoice,
  onOpenProfile,
  onOpenThemePicker,
  isMenuOpen,
  setIsMenuOpen,
}) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const handleTabClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  const moreItems = [
    { id: 'plans' as ActiveTab, label: t('plans'), icon: Pin },
    { id: 'holidays' as ActiveTab, label: t('holidays'), icon: PartyPopper },
    { id: 'tasks' as ActiveTab, label: t('tasks'), icon: CheckSquare },
    { id: 'voice-notes' as ActiveTab, label: t('voiceNotes'), icon: Mic },
    { id: 'search' as ActiveTab, label: t('search'), icon: Search },
    { id: 'statistics' as ActiveTab, label: t('statistics'), icon: BarChart3 },
    { id: 'settings' as ActiveTab, label: t('settings'), icon: Settings },
  ];

  return (
    <>
      {/* Drawer for More items on mobile */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full bg-white dark:bg-slate-900 rounded-t-3xl p-5 shadow-2xl border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom duration-250 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('actions')}
              </h3>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile User Profile & Theme Quick Row */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  if (onOpenProfile) onOpenProfile();
                }}
                className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-left transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-indigo-500 flex items-center justify-center bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200 text-xs font-bold flex-shrink-0">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0) || <UserIcon className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {user?.name || 'Bekhruz'}
                  </p>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold truncate">
                    {language === 'ru' ? 'Настроить' : 'Edit profile'}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  if (onOpenThemePicker) onOpenThemePicker();
                }}
                className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-accent-gradient flex items-center justify-center text-white shadow-xs flex-shrink-0">
                  <Palette className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {language === 'ru' ? 'Темы и цвета' : 'Theme & Color'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {language === 'ru' ? 'День / Ночь' : 'Day / Night'}
                  </p>
                </div>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition cursor-pointer ${
                      isActive
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1.5" />
                    <span className="text-[11px] font-medium leading-tight truncate w-full">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Floating Big Voice Assistant Button */}
      <div className="md:hidden fixed bottom-18 right-4 z-40">
        <button
          onClick={onOpenVoice}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-500/35 flex items-center justify-center active:scale-95 transition cursor-pointer"
          aria-label={t('quickVoiceAssistant')}
        >
          <Mic className="w-7 h-7" />
        </button>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg flex items-center justify-around px-2">
        <button
          onClick={() => handleTabClick('home')}
          className={`flex flex-col items-center justify-center py-1 flex-1 cursor-pointer ${
            activeTab === 'home' ||
            activeTab === 'today' ||
            activeTab === 'tomorrow' ||
            activeTab === 'my-day' ||
            activeTab === 'week' ||
            activeTab === 'next7' ||
            activeTab === 'month'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => handleTabClick('calendar')}
          className={`flex flex-col items-center justify-center py-1 flex-1 cursor-pointer ${
            activeTab === 'calendar'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">{t('calendar')}</span>
        </button>

        <button
          onClick={() => handleTabClick('birthdays')}
          className={`flex flex-col items-center justify-center py-1 flex-1 cursor-pointer ${
            activeTab === 'birthdays'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <Cake className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">{t('birthdays')}</span>
        </button>

        <button
          onClick={() => handleTabClick('ai-assistant')}
          className={`flex flex-col items-center justify-center py-1 flex-1 cursor-pointer ${
            activeTab === 'ai-assistant'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <Bot className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">AI</span>
        </button>

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`flex flex-col items-center justify-center py-1 flex-1 cursor-pointer ${
            isMenuOpen ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">More</span>
        </button>
      </nav>
    </>
  );
};
