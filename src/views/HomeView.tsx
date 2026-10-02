import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Sun,
  Moon,
  Cake,
  PartyPopper,
  Pin,
  CheckSquare,
  Mic,
  Calendar,
  ChevronRight,
  Plus,
  Clock,
  ArrowRight,
  Bot,
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import type { PlanEvent, Birthday, Holiday, Task } from '../types';
import type { ActiveTab } from '../components/Sidebar';

interface HomeViewProps {
  events: PlanEvent[];
  birthdays: Birthday[];
  holidays: Holiday[];
  tasks: Task[];
  onOpenVoice: () => void;
  onOpenAddPlan: () => void;
  onOpenAddTask: () => void;
  onOpenAddBirthday: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onToggleTask: (id: string, completed: boolean) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  events,
  birthdays,
  holidays,
  tasks,
  onOpenVoice,
  onOpenAddPlan,
  onOpenAddTask,
  onOpenAddBirthday,
  onNavigateTab,
  onToggleTask,
}) => {
  const { language, t, formatDate, formatWeekday } = useLanguage();
  const { user } = useAuth();

  const [briefingText, setBriefingText] = useState<string>('');
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);
  const [summaryText, setSummaryText] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const currentHour = now.getHours();
  const greeting =
    currentHour >= 5 && currentHour < 12
      ? t('goodMorning')
      : currentHour >= 12 && currentHour < 17
      ? t('goodAfternoon')
      : currentHour >= 17 && currentHour < 22
      ? t('goodEvening')
      : t('goodNight');

  // Filter today's items
  const todayEvents = events.filter((e) => e.date === todayStr);
  const todayTasks = tasks.filter((t) => t.date === todayStr || (!t.date && !t.isCompleted));
  const todayBirthdays = birthdays.filter((b) => b.birthDate.endsWith(todayStr.slice(4)));
  const todayHolidays = holidays.filter((h) => h.date.endsWith(todayStr.slice(4)));

  const totalTodayEvents = todayEvents.length + todayTasks.length + todayBirthdays.length + todayHolidays.length;

  // Nearest birthday calculation
  const nearestBirthday = (() => {
    if (birthdays.length === 0) return null;
    let closest: { birthday: Birthday; daysRemaining: number; nextAge: number } | null = null;
    const thisYear = now.getFullYear();

    for (const b of birthdays) {
      const parts = b.birthDate.split('-');
      const mm = parseInt(parts[1] || '1', 10) - 1;
      const dd = parseInt(parts[2] || '1', 10);

      let nextBday = new Date(thisYear, mm, dd);
      if (nextBday < new Date(thisYear, now.getMonth(), now.getDate())) {
        nextBday = new Date(thisYear + 1, mm, dd);
      }

      const diffTime = nextBday.getTime() - new Date(thisYear, now.getMonth(), now.getDate()).getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const birthYear = b.birthYear || (parts[0] ? parseInt(parts[0], 10) : undefined);
      const nextAge = birthYear ? nextBday.getFullYear() - birthYear : 0;

      if (!closest || daysRemaining < closest.daysRemaining) {
        closest = { birthday: b, daysRemaining, nextAge };
      }
    }
    return closest;
  })();

  // Nearest holiday
  const nearestHoliday = (() => {
    if (holidays.length === 0) return null;
    let closest: { holiday: Holiday; daysRemaining: number } | null = null;
    const thisYear = now.getFullYear();

    for (const h of holidays) {
      const parts = h.date.split('-');
      const mm = parseInt(parts[1] || '1', 10) - 1;
      const dd = parseInt(parts[2] || '1', 10);

      let nextHDate = new Date(thisYear, mm, dd);
      if (nextHDate < new Date(thisYear, now.getMonth(), now.getDate())) {
        nextHDate = new Date(thisYear + 1, mm, dd);
      }

      const diffTime = nextHDate.getTime() - new Date(thisYear, now.getMonth(), now.getDate()).getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (!closest || daysRemaining < closest.daysRemaining) {
        closest = { holiday: h, daysRemaining };
      }
    }
    return closest;
  })();

  // Nearest plan
  const nearestPlan = (() => {
    const upcoming = events.filter((e) => e.date >= todayStr).sort((a, b) => {
      const da = `${a.date} ${a.time || '00:00'}`;
      const db = `${b.date} ${b.time || '00:00'}`;
      return da.localeCompare(db);
    });
    return upcoming.length > 0 ? upcoming[0] : null;
  })();

  const handleGenerateBriefing = async () => {
    setIsGeneratingBriefing(true);
    try {
      const res = await api.getDailyBriefing(todayStr);
      setBriefingText(res.briefing);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const res = await api.getDailySummary(todayStr);
      setSummaryText(res.summary);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner: Greeting, Date, & Today Count */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white p-6 sm:p-8 shadow-xl shadow-indigo-500/15">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-48 h-48 rounded-full bg-violet-400/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold mb-2 tracking-wide uppercase">
              <span>{formatWeekday(now)}</span>
              <span>•</span>
              <span>{formatDate(now)}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
              {greeting}
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100/90 max-w-xl font-medium">
              {totalTodayEvents === 0
                ? t('noEventsToday')
                : `${t('todayEventsCount')}: ${totalTodayEvents} (📌 ${todayEvents.length} • 🎂 ${todayBirthdays.length} • 🎉 ${todayHolidays.length} • ✅ ${todayTasks.length})`}
            </p>
          </div>

          {/* Quick Voice Assistant Callout */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenVoice}
              className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white text-indigo-900 hover:bg-indigo-50 text-xs sm:text-sm font-bold shadow-lg transition active:scale-95 cursor-pointer"
            >
              <Mic className="w-4 h-4 text-indigo-600 animate-pulse" />
              <span>{t('quickVoiceAssistant')}</span>
            </button>
            <button
              onClick={() => onNavigateTab('my-day')}
              className="px-4 py-3 rounded-2xl bg-indigo-500/30 hover:bg-indigo-500/40 text-white text-xs sm:text-sm font-semibold border border-indigo-400/30 backdrop-blur-sm transition cursor-pointer flex items-center gap-1.5"
            >
              <Bot className="w-4 h-4" />
              <span>{t('myDay')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Navigation Pills: Today, Tomorrow, My Day, Week, Next 7 Days, Month */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { tab: 'today' as ActiveTab, label: t('today'), count: totalTodayEvents },
          { tab: 'tomorrow' as ActiveTab, label: t('tomorrow') },
          { tab: 'my-day' as ActiveTab, label: t('myDay'), isAi: true },
          { tab: 'week' as ActiveTab, label: t('thisWeek') },
          { tab: 'next7' as ActiveTab, label: t('next7Days') },
          { tab: 'month' as ActiveTab, label: t('thisMonth') },
        ].map((item) => (
          <button
            key={item.tab}
            onClick={() => onNavigateTab(item.tab)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition border cursor-pointer ${
              item.isAi
                ? 'border-indigo-500/30 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40 text-indigo-700 dark:text-indigo-300'
                : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
            }`}
          >
            <span>{item.label}</span>
            {typeof item.count === 'number' && item.count > 0 && (
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                {item.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 3 Metric Cards: Nearest Birthday, Nearest Holiday, Nearest Plan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Nearest Birthday */}
        <div
          onClick={() => onNavigateTab('birthdays')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-2xl bg-pink-50 dark:bg-pink-950/60 text-pink-500">
              <Cake className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider">
              {t('nearestBirthday')}
            </span>
          </div>

          {nearestBirthday ? (
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-pink-100 flex-shrink-0">
                  {nearestBirthday.birthday.photo ? (
                    <img
                      src={nearestBirthday.birthday.photo}
                      alt={nearestBirthday.birthday.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-pink-600 font-bold text-sm">
                      {nearestBirthday.birthday.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {nearestBirthday.birthday.name}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {nearestBirthday.birthday.relationship || 'Friend'}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {nearestBirthday.daysRemaining === 0
                    ? t('todayBirthdayBanner')
                    : t('daysRemaining', { days: nearestBirthday.daysRemaining })}
                </span>
                {nearestBirthday.nextAge > 0 && (
                  <span className="text-slate-400">
                    {t('ageWillTurn', { age: nearestBirthday.nextAge })}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">{t('noUpcomingBirthdays')}</p>
          )}
        </div>

        {/* Nearest Holiday */}
        <div
          onClick={() => onNavigateTab('holidays')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500">
              <PartyPopper className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              {t('nearestHoliday')}
            </span>
          </div>

          {nearestHoliday ? (
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 truncate">
                {language === 'uz'
                  ? nearestHoliday.holiday.titleUz || nearestHoliday.holiday.title
                  : language === 'ru'
                  ? nearestHoliday.holiday.titleRu || nearestHoliday.holiday.title
                  : nearestHoliday.holiday.title}
              </h4>
              <p className="text-xs text-slate-500 line-clamp-1 mb-3">
                {nearestHoliday.holiday.category === 'uzbekistan'
                  ? t('categoryUzbekistan')
                  : t('categoryInternational')}
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {nearestHoliday.daysRemaining === 0
                    ? '🎉 Celebrating today!'
                    : t('daysRemaining', { days: nearestHoliday.daysRemaining })}
                </span>
                <span className="text-slate-400">{formatDate(nearestHoliday.holiday.date)}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">{t('noUpcomingHolidays')}</p>
          )}
        </div>

        {/* Nearest Plan */}
        <div
          onClick={() => onNavigateTab('plans')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500">
              <Pin className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              {t('nearestPlan')}
            </span>
          </div>

          {nearestPlan ? (
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 truncate">
                {nearestPlan.title}
              </h4>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                {nearestPlan.time && (
                  <span className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                    <Clock className="w-3.5 h-3.5" />
                    {nearestPlan.time}
                  </span>
                )}
                <span>•</span>
                <span>{nearestPlan.category || 'General'}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {nearestPlan.date === todayStr ? t('today') : formatDate(nearestPlan.date)}
                </span>
                <span className="capitalize px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 text-[10px] font-bold">
                  {nearestPlan.priority}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">{t('noUpcomingPlans')}</p>
          )}
        </div>
      </div>

      {/* AI Daily Briefing / Summary Section */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-violet-500/10 border border-indigo-500/20 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('dailyBriefingTitle')}
              </h3>
              <p className="text-xs text-slate-500">
                Personalized summary in {language === 'ru' ? 'Russian' : language === 'uz' ? 'Uzbek' : 'English'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateBriefing}
              disabled={isGeneratingBriefing}
              className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer flex items-center gap-1.5"
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>{isGeneratingBriefing ? t('loading') : t('generateBriefing')}</span>
            </button>
            <button
              onClick={handleGenerateSummary}
              disabled={isGeneratingSummary}
              className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer flex items-center gap-1.5"
            >
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isGeneratingSummary ? t('loading') : t('generateSummary')}</span>
            </button>
          </div>
        </div>

        {(briefingText || summaryText) && (
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed animate-in fade-in">
            {briefingText || summaryText}
          </div>
        )}
      </div>

      {/* Today's Schedule Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plans today */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <Pin className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('plans')} {t('today')}
              </h3>
            </div>
            <button
              onClick={onOpenAddPlan}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('add')}</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {todayEvents.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">{t('noEventsToday')}</p>
            ) : (
              todayEvents.map((e) => (
                <div
                  key={e.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {e.time && (
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                        {e.time}
                      </span>
                    )}
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {e.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {e.priority}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tasks today */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('tasks')} {t('today')}
              </h3>
            </div>
            <button
              onClick={onOpenAddTask}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('add')}</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {todayTasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No tasks for today</p>
            ) : (
              todayTasks.map((tItem) => (
                <div
                  key={tItem.id}
                  onClick={() => onToggleTask(tItem.id, !tItem.isCompleted)}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                    tItem.isCompleted
                      ? 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 text-slate-400 line-through'
                      : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={tItem.isCompleted}
                      onChange={() => {}}
                      className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-xs font-medium truncate">{tItem.title}</span>
                  </div>
                  {tItem.time && (
                    <span className="text-[11px] text-slate-400 font-mono">{tItem.time}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
