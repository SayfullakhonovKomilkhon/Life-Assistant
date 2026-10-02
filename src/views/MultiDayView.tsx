import React from 'react';
import { Calendar, Cake, PartyPopper, Pin, CheckSquare } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import type { PlanEvent, Birthday, Holiday, Task } from '../types';

interface MultiDayViewProps {
  mode: 'week' | 'next7' | 'month';
  events: PlanEvent[];
  birthdays: Birthday[];
  holidays: Holiday[];
  tasks: Task[];
  onSelectDate: (date: string) => void;
}

export const MultiDayView: React.FC<MultiDayViewProps> = ({
  mode,
  events,
  birthdays,
  holidays,
  tasks,
  onSelectDate,
}) => {
  const { language, t, formatDate, formatWeekday } = useLanguage();

  const now = new Date();
  const dayCount = mode === 'month' ? 30 : 7;

  // Build dates array
  const dates: Date[] = [];
  if (mode === 'week') {
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
  } else {
    for (let i = 0; i < dayCount; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
  }

  const title =
    mode === 'week'
      ? `📆 ${t('thisWeek')}`
      : mode === 'next7'
      ? `📆 ${t('next7Days')}`
      : `📅 ${t('thisMonth')}`;

  const todayStr = now.toISOString().split('T')[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          {title}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {mode === 'month' ? 'Upcoming 30 days overview' : 'Upcoming week overview'}
        </p>
      </div>

      <div className="space-y-3">
        {dates.map((d) => {
          const dStr = d.toISOString().split('T')[0];
          const isToday = dStr === todayStr;

          const dayEvents = events.filter((e) => e.date === dStr);
          const dayBirthdays = birthdays.filter((b) => b.birthDate.endsWith(dStr.slice(4)));
          const dayHolidays = holidays.filter((h) => h.date.endsWith(dStr.slice(4)));
          const dayTasks = tasks.filter((t) => t.date === dStr);

          const hasAnything =
            dayEvents.length > 0 ||
            dayBirthdays.length > 0 ||
            dayHolidays.length > 0 ||
            dayTasks.length > 0;

          return (
            <div
              key={dStr}
              onClick={() => onSelectDate(dStr)}
              className={`p-4 rounded-3xl border transition cursor-pointer ${
                isToday
                  ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-xs'
                  : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {formatWeekday(d)}, {formatDate(d)}
                  </span>
                  {isToday && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                      {t('today')}
                    </span>
                  )}
                </div>
              </div>

              {!hasAnything ? (
                <p className="text-xs text-slate-400 italic">No scheduled events</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {dayBirthdays.map((b) => (
                    <div key={b.id} className="text-xs p-2 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300">
                      🎂 {b.name}
                    </div>
                  ))}
                  {dayHolidays.map((h) => (
                    <div key={h.id} className="text-xs p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                      🎉 {language === 'uz' ? h.titleUz || h.title : language === 'ru' ? h.titleRu || h.title : h.title}
                    </div>
                  ))}
                  {dayEvents.map((e) => (
                    <div key={e.id} className="text-xs p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                      📌 {e.time ? `${e.time} — ` : ''}{e.title}
                    </div>
                  ))}
                  {dayTasks.map((t) => (
                    <div key={t.id} className="text-xs p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                      ✅ {t.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
