import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  X,
  Cake,
  Calendar,
  CheckSquare,
  PartyPopper,
  Info,
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { api } from '../services/api';
import type { AppNotification } from '../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onNotificationsUpdated: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  onNotificationsUpdated,
}) => {
  const { t, formatDate } = useLanguage();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  if (!isOpen) return null;

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  const handleMarkAsRead = async (id: string) => {
    await api.markNotificationRead(id);
    onNotificationsUpdated();
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    onNotificationsUpdated();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'birthday':
        return <Cake className="w-4 h-4 text-pink-500" />;
      case 'event':
        return <Calendar className="w-4 h-4 text-indigo-500" />;
      case 'task':
        return <CheckSquare className="w-4 h-4 text-emerald-500" />;
      case 'holiday':
        return <PartyPopper className="w-4 h-4 text-amber-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:justify-end bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md h-[85vh] sm:h-full sm:max-h-screen bg-white dark:bg-slate-900 rounded-3xl sm:rounded-l-3xl sm:rounded-r-none p-5 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t('notifications')}
              </h3>
              <p className="text-xs text-slate-500">
                {notifications.filter((n) => !n.isRead).length} {t('unread').toLowerCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleMarkAllRead}
              className="p-1.5 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={t('markAllRead')}
            >
              <CheckCheck className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 py-3 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
              filter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {t('all')} ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
              filter === 'unread'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {t('unread')} ({notifications.filter((n) => !n.isRead).length})
          </button>
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-slate-400">
              <Bell className="w-8 h-8 mb-2 stroke-1" />
              <p className="text-xs">No notifications to display</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => !item.isRead && handleMarkAsRead(item.id)}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                  !item.isRead
                    ? 'border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20'
                    : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.message}
                  </p>
                </div>
                {!item.isRead && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0 mt-2" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
