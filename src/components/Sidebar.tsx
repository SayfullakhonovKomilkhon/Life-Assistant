import React from 'react';
import {
  Home,
  Calendar,
  Cake,
  Pin,
  PartyPopper,
  CheckSquare,
  Mic,
  Bot,
  BarChart3,
  Settings,
  Search,
  Palette,
  User as UserIcon,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';

export type ActiveTab =
  | 'home'
  | 'calendar'
  | 'birthdays'
  | 'plans'
  | 'holidays'
  | 'tasks'
  | 'voice-notes'
  | 'ai-assistant'
  | 'statistics'
  | 'settings'
  | 'search'
  | 'today'
  | 'tomorrow'
  | 'my-day'
  | 'week'
  | 'next7'
  | 'month';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenProfile?: () => void;
  onOpenThemePicker?: () => void;
  counts?: {
    todayEvents: number;
    tasksPending: number;
    birthdays: number;
    voiceNotes: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenProfile,
  onOpenThemePicker,
  counts,
}) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const navItems = [
    { id: 'home' as ActiveTab, label: t('appName').split(' ')[0] === 'Personal' ? 'Home' : t('appName'), icon: Home, count: counts?.todayEvents },
    { id: 'calendar' as ActiveTab, label: t('calendar'), icon: Calendar },
    { id: 'birthdays' as ActiveTab, label: t('birthdays'), icon: Cake, count: counts?.birthdays },
    { id: 'plans' as ActiveTab, label: t('plans'), icon: Pin },
    { id: 'holidays' as ActiveTab, label: t('holidays'), icon: PartyPopper },
    { id: 'tasks' as ActiveTab, label: t('tasks'), icon: CheckSquare, count: counts?.tasksPending },
    { id: 'voice-notes' as ActiveTab, label: t('voiceNotes'), icon: Mic, count: counts?.voiceNotes },
    { id: 'ai-assistant' as ActiveTab, label: t('aiAssistant'), icon: Bot, isHighlight: true },
    { id: 'search' as ActiveTab, label: t('search'), icon: Search },
    { id: 'statistics' as ActiveTab, label: t('statistics'), icon: BarChart3 },
    { id: 'settings' as ActiveTab, label: t('settings'), icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-4 h-[calc(100vh-4rem)] sticky top-16 select-none overflow-y-auto">
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeTab === item.id ||
            (item.id === 'home' &&
              (activeTab === 'today' ||
                activeTab === 'tomorrow' ||
                activeTab === 'my-day' ||
                activeTab === 'week' ||
                activeTab === 'next7' ||
                activeTab === 'month'));

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              } ${item.isHighlight && !isActive ? 'hover:text-indigo-600 dark:hover:text-indigo-400' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : item.isHighlight
                      ? 'text-indigo-500'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {typeof item.count === 'number' && item.count > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile & Theme Quick-Access Card */}
      <div className="mt-auto pt-4 space-y-2 border-t border-slate-200/60 dark:border-slate-800/60">
        {/* Profile Card */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-2">
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer hover:opacity-80 transition"
            title={language === 'ru' ? 'Настроить профиль' : 'Edit profile'}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-indigo-500 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex-shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || <UserIcon className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {user?.name || 'Bekhruz'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user?.email || 'bekhruz@assistant.ai'}
              </p>
            </div>
          </button>

          <button
            onClick={onOpenThemePicker}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition cursor-pointer"
            title={language === 'ru' ? 'Выбрать тему и цвет' : 'Theme & Color'}
          >
            <Palette className="w-4 h-4" />
          </button>
        </div>

        {/* Quick AI Daily Briefing card */}
        <button
          onClick={() => setActiveTab('my-day')}
          className="w-full text-left p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-amber-500/10 border border-indigo-500/20 hover:border-indigo-500/40 transition group cursor-pointer"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-0.5">
            <Bot className="w-3.5 h-3.5" />
            <span>{t('myDay')}</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
            {t('dailyBriefingTitle')} & timeline
          </p>
        </button>
      </div>
    </aside>
  );
};
