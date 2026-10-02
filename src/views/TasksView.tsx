import React, { useState } from 'react';
import { CheckSquare, Plus, Edit2, Trash2, Calendar, Clock, Check } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import type { Task } from '../types';

interface TasksViewProps {
  tasks: Task[];
  onToggleTask: (id: string, completed: boolean) => void;
  onOpenAdd: () => void;
  onEdit: (t: Task) => void;
  onDelete: (id: string) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  onToggleTask,
  onOpenAdd,
  onEdit,
  onDelete,
}) => {
  const { t, formatDate } = useLanguage();
  const [filter, setFilter] = useState<'all' | 'incomplete' | 'completed'>('incomplete');

  const filtered = tasks.filter((task) => {
    if (filter === 'incomplete') return !task.isCompleted;
    if (filter === 'completed') return task.isCompleted;
    return true;
  });

  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const pendingCount = tasks.length - completedCount;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {t('tasks')}
            </h2>
            <p className="text-xs text-slate-400">
              {pendingCount} {t('pending').toLowerCase()} • {completedCount} {t('completed').toLowerCase()}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/25 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addTask')}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {[
          { id: 'incomplete', label: t('incomplete'), count: pendingCount },
          { id: 'completed', label: t('completed'), count: completedCount },
          { id: 'all', label: t('all'), count: tasks.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              filter === tab.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <span>{tab.label}</span>
            <span className="opacity-80">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Task Items */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 p-8">
          <CheckSquare className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
            No tasks found
          </h3>
          <p className="text-xs text-slate-400 mb-4">All tasks in this view are clear.</p>
          <button
            onClick={onOpenAdd}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md hover:bg-emerald-700 transition"
          >
            {t('addTask')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-3xl border transition flex items-center justify-between gap-3 ${
                task.isCompleted
                  ? 'border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40 text-slate-400'
                  : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <button
                  onClick={() => onToggleTask(task.id, !task.isCompleted)}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center border transition flex-shrink-0 cursor-pointer ${
                    task.isCompleted
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                  }`}
                >
                  {task.isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                </button>

                <div className="min-w-0">
                  <h4
                    className={`text-sm font-semibold truncate ${
                      task.isCompleted
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    {task.date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(task.date)}
                      </span>
                    )}
                    {task.time && (
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {task.time}
                      </span>
                    )}
                    {task.category && <span>• {task.category}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md capitalize ${
                    task.priority === 'high'
                      ? 'bg-rose-50 dark:bg-rose-950 text-rose-600'
                      : task.priority === 'medium'
                      ? 'bg-amber-50 dark:bg-amber-950 text-amber-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {task.priority}
                </span>

                <button
                  onClick={() => onEdit(task)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(task.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
