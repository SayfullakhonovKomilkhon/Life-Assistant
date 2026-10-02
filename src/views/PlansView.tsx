import React, { useState } from 'react';
import {
  Pin,
  Plus,
  Clock,
  MapPin,
  Calendar,
  Edit2,
  Trash2,
  Repeat,
  Bell,
  Search,
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import type { PlanEvent } from '../types';

interface PlansViewProps {
  events: PlanEvent[];
  onOpenAdd: () => void;
  onEdit: (e: PlanEvent) => void;
  onDelete: (id: string) => void;
}

export const PlansView: React.FC<PlansViewProps> = ({
  events,
  onOpenAdd,
  onEdit,
  onDelete,
}) => {
  const { t, formatDate } = useLanguage();
  const [search, setSearch] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  const filtered = events
    .filter((e) => {
      if (selectedPriority !== 'all' && e.priority !== selectedPriority) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.location && e.location.toLowerCase().includes(q)) ||
        (e.category && e.category.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => `${a.date} ${a.time || '00:00'}`.localeCompare(`${b.date} ${b.time || '00:00'}`));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Pin className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {t('plans')}
            </h2>
            <p className="text-xs text-slate-400">
              {events.length} {t('plans').toLowerCase()} scheduled
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search plans..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={onOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addPlan')}</span>
          </button>
        </div>
      </div>

      {/* Priority Filters */}
      <div className="flex items-center gap-2">
        {['all', 'high', 'medium', 'low'].map((p) => (
          <button
            key={p}
            onClick={() => setSelectedPriority(p)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition cursor-pointer ${
              selectedPriority === p
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {p === 'all' ? t('all') : t(`priority${p.charAt(0).toUpperCase() + p.slice(1)}` as any)}
          </button>
        ))}
      </div>

      {/* Plans List */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 p-8">
          <Pin className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
            {t('noUpcomingPlans')}
          </h3>
          <p className="text-xs text-slate-400 mb-4">Plan meetings, appointments and habits with ease.</p>
          <button
            onClick={onOpenAdd}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 transition"
          >
            {t('addPlan')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((e) => (
            <div
              key={e.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                    {e.title}
                  </h4>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => onEdit(e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(e.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3 text-xs">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {formatDate(e.date)}
                  </span>
                  {e.time && (
                    <span className="flex items-center gap-1 font-mono text-slate-600 dark:text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {e.time}
                      {e.endTime ? ` - ${e.endTime}` : ''}
                    </span>
                  )}
                </div>

                {e.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3 line-clamp-2">
                    {e.description}
                  </p>
                )}

                {e.location && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-3">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{e.location}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span className="font-medium text-slate-400">{e.category || 'General'}</span>
                <div className="flex items-center gap-2">
                  {e.repeat && e.repeat !== 'none' && (
                    <span className="flex items-center gap-1 text-slate-400">
                      <Repeat className="w-3 h-3" />
                      <span className="capitalize">{e.repeat}</span>
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-md font-bold capitalize ${
                      e.priority === 'high'
                        ? 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                        : e.priority === 'medium'
                        ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {e.priority}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
