import React from 'react';
import {
  BarChart3,
  Cake,
  Pin,
  CheckSquare,
  PartyPopper,
  Mic,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import type { PlanEvent, Birthday, Holiday, Task, VoiceNote } from '../types';

interface StatisticsViewProps {
  events: PlanEvent[];
  birthdays: Birthday[];
  holidays: Holiday[];
  tasks: Task[];
  voiceNotes: VoiceNote[];
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({
  events,
  birthdays,
  holidays,
  tasks,
  voiceNotes,
}) => {
  const { t } = useLanguage();

  const completedTasks = tasks.filter((t) => t.isCompleted).length;
  const pendingTasks = tasks.length - completedTasks;
  const completionRate =
    tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const now = new Date();
  const next7DaysDate = new Date();
  next7DaysDate.setDate(next7DaysDate.getDate() + 7);
  const todayStr = now.toISOString().split('T')[0];
  const next7Str = next7DaysDate.toISOString().split('T')[0];

  const upcoming7DaysEvents = events.filter((e) => e.date >= todayStr && e.date <= next7Str).length;

  const statCards = [
    { label: t('statsTotalBirthdays'), value: birthdays.length, icon: Cake, color: 'text-pink-500 bg-pink-50 dark:bg-pink-950/60' },
    { label: t('statsTotalPlans'), value: events.length, icon: Pin, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60' },
    { label: t('statsCompletedTasks'), value: completedTasks, icon: CheckSquare, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60' },
    { label: t('statsPendingTasks'), value: pendingTasks, icon: ClockIcon, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60' },
    { label: t('statsUpcomingEvents'), value: upcoming7DaysEvents, icon: Calendar, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/60' },
    { label: t('statsVoiceNotes'), value: voiceNotes.length, icon: Mic, color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/60' },
    { label: t('statsHolidays'), value: holidays.length, icon: PartyPopper, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/60' },
    { label: t('statsRate'), value: `${completionRate}%`, icon: TrendingUp, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/60' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
          <BarChart3 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {t('statistics')}
          </h2>
          <p className="text-xs text-slate-400">
            Life overview and productivity metrics
          </p>
        </div>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-500 leading-tight">
                  {stat.label}
                </span>
                <div className={`p-2 rounded-xl ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Productivity progress bar */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-200">
            Task Completion Progress
          </span>
          <span className="font-bold text-emerald-600">{completionRate}%</span>
        </div>
        <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500 rounded-full"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400">
          {completedTasks} completed out of {tasks.length} total tasks.
        </p>
      </div>
    </div>
  );
};

function ClockIcon(props: any) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <path strokeWidth="2" d="M12 6v6l4 2" />
    </svg>
  );
}
