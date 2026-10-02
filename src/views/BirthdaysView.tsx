import React, { useState } from 'react';
import {
  Cake,
  Plus,
  Phone,
  Mail,
  Edit2,
  Trash2,
  Calendar,
  Gift,
  Clock,
  Search,
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import type { Birthday } from '../types';

interface BirthdaysViewProps {
  birthdays: Birthday[];
  onOpenAdd: () => void;
  onEdit: (b: Birthday) => void;
  onDelete: (id: string) => void;
}

export const BirthdaysView: React.FC<BirthdaysViewProps> = ({
  birthdays,
  onOpenAdd,
  onEdit,
  onDelete,
}) => {
  const { t, formatDate } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const now = new Date();
  const thisYear = now.getFullYear();

  // Enrich birthdays with days remaining and next age
  const enriched = birthdays.map((b) => {
    const parts = b.birthDate.split('-');
    const mm = parseInt(parts[1] || '1', 10) - 1;
    const dd = parseInt(parts[2] || '1', 10);

    let nextBday = new Date(thisYear, mm, dd);
    const todayZero = new Date(thisYear, now.getMonth(), now.getDate());

    if (nextBday < todayZero) {
      nextBday = new Date(thisYear + 1, mm, dd);
    }

    const diffTime = nextBday.getTime() - todayZero.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const birthYear = b.birthYear || (parts[0] ? parseInt(parts[0], 10) : undefined);
    const nextAge = birthYear ? nextBday.getFullYear() - birthYear : undefined;

    return {
      ...b,
      nextBirthdayDate: nextBday,
      daysRemaining,
      nextAge,
    };
  });

  // Sort by upcoming days remaining
  enriched.sort((a, b) => a.daysRemaining - b.daysRemaining);

  const filtered = enriched.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.relationship && b.relationship.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (b.notes && b.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-pink-50 dark:bg-pink-950/60 text-pink-500">
            <Cake className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {t('birthdays')}
            </h2>
            <p className="text-xs text-slate-400">
              {birthdays.length} {t('birthdays').toLowerCase()} tracked
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search birthdays..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <button
            onClick={onOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold shadow-md shadow-pink-500/25 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addBirthday')}</span>
          </button>
        </div>
      </div>

      {/* Grid of Birthdays */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 p-8">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-pink-50 dark:bg-pink-950/60 text-pink-500 flex items-center justify-center mb-3">
            <Cake className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
            {t('noUpcomingBirthdays')}
          </h3>
          <p className="text-xs text-slate-400 mb-5">
            Add family, friends and colleagues to never miss a celebration.
          </p>
          <button
            onClick={onOpenAdd}
            className="px-4 py-2 rounded-xl bg-pink-600 text-white text-xs font-bold shadow-md hover:bg-pink-700 transition"
          >
            {t('addBirthday')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((b) => (
            <div
              key={b.id}
              className={`p-5 rounded-3xl border transition flex flex-col justify-between ${
                b.daysRemaining === 0
                  ? 'border-pink-500 bg-gradient-to-br from-pink-50/60 to-rose-50/60 dark:from-pink-950/40 dark:to-rose-950/40 shadow-md ring-2 ring-pink-500/20'
                  : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md'
              }`}
            >
              <div>
                {/* Header with Photo, Name & Actions */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-pink-100 dark:bg-pink-950/80 flex-shrink-0 border border-pink-200 dark:border-pink-900/60">
                      {b.photo ? (
                        <img src={b.photo} alt={b.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-pink-600 font-bold text-lg">
                          {b.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {b.name}
                      </h4>
                      <span className="text-[11px] font-medium text-slate-400">
                        {b.relationship || 'Friend'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(b)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(b.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Days remaining badge / countdown */}
                <div className="mb-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs">
                  <span className="font-bold text-pink-600 dark:text-pink-400">
                    {b.daysRemaining === 0
                      ? t('todayBirthdayBanner')
                      : t('daysRemaining', { days: b.daysRemaining })}
                  </span>
                  {b.nextAge && (
                    <span className="text-slate-500 font-medium">
                      {t('ageWillTurn', { age: b.nextAge })}
                    </span>
                  )}
                </div>

                {/* Details: Date, Phone, Email, Notes */}
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{b.birthDate}</span>
                  </div>
                  {b.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <a href={`tel:${b.phone}`} className="hover:underline">{b.phone}</a>
                    </div>
                  )}
                  {b.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <a href={`mailto:${b.email}`} className="hover:underline truncate">{b.email}</a>
                    </div>
                  )}
                  {b.notes && (
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-slate-500 text-[11px] italic">
                      "{b.notes}"
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
