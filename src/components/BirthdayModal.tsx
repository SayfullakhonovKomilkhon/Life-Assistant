import React, { useState, useEffect } from 'react';
import { X, Cake, User, Phone, Mail, Image, Calendar } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import type { Birthday } from '../types';

interface BirthdayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Birthday, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: Birthday | null;
}

export const BirthdayModal: React.FC<BirthdayModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('');
  const [birthDate, setBirthDate] = useState('1998-05-15');
  const [birthYear, setBirthYear] = useState<number | undefined>(1998);
  const [relationship, setRelationship] = useState('Friend');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [reminderDays, setReminderDays] = useState<number[]>([7, 1, 0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setPhoto(initialData.photo || '');
      setBirthDate(initialData.birthDate);
      setBirthYear(initialData.birthYear);
      setRelationship(initialData.relationship || 'Friend');
      setPhone(initialData.phone || '');
      setEmail(initialData.email || '');
      setNotes(initialData.notes || '');
      setReminderDays(initialData.reminderDays || [7, 1, 0]);
    } else {
      setName('');
      setPhoto('');
      setBirthDate('1998-05-15');
      setBirthYear(1998);
      setRelationship('Friend');
      setPhone('');
      setEmail('');
      setNotes('');
      setReminderDays([7, 1, 0]);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleDateChange = (val: string) => {
    setBirthDate(val);
    const y = parseInt(val.split('-')[0], 10);
    if (!isNaN(y)) setBirthYear(y);
  };

  const toggleReminderDay = (day: number) => {
    if (reminderDays.includes(day)) {
      setReminderDays(reminderDays.filter((d) => d !== day));
    } else {
      setReminderDays([...reminderDays, day]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        photo: photo.trim() || undefined,
        birthDate,
        birthYear,
        relationship,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        reminderDays,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-100 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-pink-50 dark:bg-pink-950/60 text-pink-500">
              <Cake className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {initialData ? t('editBirthday') : t('addBirthday')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('birthdayPersonName')} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Johnson"
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('birthDate')} *
              </label>
              <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('relationship')}
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="Family">{t('relationshipFamily')}</option>
                <option value="Friend">{t('relationshipFriend')}</option>
                <option value="Colleague">{t('relationshipColleague')}</option>
                <option value="Other">{t('relationshipOther')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('phone')}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 90 123-45-67"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="friend@example.com"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('photoUrl')}
            </label>
            <input
              type="url"
              value={photo}
              onChange={(e) => setPhoto(e.target.value)}
              placeholder="https://... (photo or avatar URL)"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Birthday Reminders */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {t('remindDaysBefore')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { day: 0, label: t('remindSameDay') },
                { day: 1, label: t('remind1DayBefore') },
                { day: 3, label: t('remind3DaysBefore') },
                { day: 7, label: t('remind7DaysBefore') },
                { day: 14, label: t('remind14DaysBefore') },
                { day: 30, label: t('remind30DaysBefore') },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.day}
                  onClick={() => toggleReminderDay(opt.day)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium border text-center transition cursor-pointer ${
                    reminderDays.includes(opt.day)
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('description')}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Gift ideas, preferences, hobbies..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-md transition"
            >
              {isSubmitting ? t('loading') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
