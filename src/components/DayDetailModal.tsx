import React from 'react';
import { X, Calendar, Plus, Clock, Cake, PartyPopper, CheckSquare, Pin } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import type { PlanEvent, Birthday, Holiday, Task } from '../types';

interface DayDetailModalProps {
  dateStr: string | null;
  onClose: () => void;
  events: PlanEvent[];
  birthdays: Birthday[];
  holidays: Holiday[];
  tasks: Task[];
  onOpenAddPlan: (defaultDate: string) => void;
  onOpenAddTask: (defaultDate: string) => void;
  onToggleTask: (id: string, completed: boolean) => void;
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({
  dateStr,
  onClose,
  events,
  birthdays,
  holidays,
  tasks,
  onOpenAddPlan,
  onOpenAddTask,
  onToggleTask,
}) => {
  const { language, t, formatDate, formatWeekday } = useLanguage();

  if (!dateStr) return null;

  const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);

  const dayEvents = events.filter((e) => e.date === dateStr);
  const dayBirthdays = birthdays.filter((b) => b.birthDate.endsWith(dateStr.slice(4)));
  const dayHolidays = holidays.filter((h) => h.date.endsWith(dateStr.slice(4)));
  const dayTasks = tasks.filter((t) => t.date === dateStr);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-100 dark:border-slate-800 relative max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {formatWeekday(d)}
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {formatDate(d)}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Birthdays */}
          {dayBirthdays.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-900/60">
              <span className="text-[11px] font-bold text-pink-600 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <Cake className="w-3.5 h-3.5" />
                {t('birthdays')}
              </span>
              {dayBirthdays.map((b) => (
                <div key={b.id} className="text-xs font-bold text-slate-900 dark:text-white">
                  🎂 {b.name} ({b.relationship || 'Friend'})
                </div>
              ))}
            </div>
          )}

          {/* Holidays */}
          {dayHolidays.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <PartyPopper className="w-3.5 h-3.5" />
                {t('holidays')}
              </span>
              {dayHolidays.map((h) => (
                <div key={h.id} className="text-xs font-bold text-slate-900 dark:text-white">
                  🎉 {language === 'uz' ? h.titleUz || h.title : language === 'ru' ? h.titleRu || h.title : h.title}
                </div>
              ))}
            </div>
          )}

          {/* Plans */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Pin className="w-3.5 h-3.5 text-indigo-500" />
                {t('plans')} ({dayEvents.length})
              </span>
              <button
                onClick={() => onOpenAddPlan(dateStr)}
                className="text-xs text-indigo-600 font-bold flex items-center gap-0.5 hover:underline"
              >
                <Plus className="w-3 h-3" />
                <span>{t('add')}</span>
              </button>
            </div>
            <div className="space-y-2">
              {dayEvents.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No plans scheduled</p>
              ) : (
                dayEvents.map((e) => (
                  <div key={e.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{e.title}</span>
                      {e.time && <span className="text-slate-400 font-mono ml-2">{e.time}</span>}
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-600">{e.priority}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                {t('tasks')} ({dayTasks.length})
              </span>
              <button
                onClick={() => onOpenAddTask(dateStr)}
                className="text-xs text-emerald-600 font-bold flex items-center gap-0.5 hover:underline"
              >
                <Plus className="w-3 h-3" />
                <span>{t('add')}</span>
              </button>
            </div>
            <div className="space-y-2">
              {dayTasks.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No tasks for this day</p>
              ) : (
                dayTasks.map((tItem) => (
                  <div
                    key={tItem.id}
                    onClick={() => onToggleTask(tItem.id, !tItem.isCompleted)}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs flex items-center justify-between cursor-pointer"
                  >
                    <span className={tItem.isCompleted ? 'line-through text-slate-400' : 'font-medium text-slate-900 dark:text-white'}>
                      {tItem.title}
                    </span>
                    <span className="text-[10px] text-slate-400">{tItem.isCompleted ? 'Done' : 'Pending'}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
