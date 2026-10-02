import React, { useState } from 'react';
import {
  Sparkles,
  Globe,
  Clock,
  Bell,
  Mic,
  Cake,
  Pin,
  Check,
  ChevronRight,
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import type { Language } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const { language, setLanguage, t } = useLanguage();
  const { user, updateProfile } = useAuth();

  const [step, setStep] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState('Uzbekistan');
  const [selectedTimezone, setSelectedTimezone] = useState('Asia/Tashkent');
  const [birthdayName, setBirthdayName] = useState('');
  const [birthdayDate, setBirthdayDate] = useState('1998-05-15');
  const [planTitle, setPlanTitle] = useState('');
  const [planTime, setPlanTime] = useState('14:00');

  if (!isOpen) return null;

  const handleNext = async () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      await updateProfile({ country: selectedCountry, timezone: selectedTimezone, language });
      setStep(3);
    } else if (step === 3) {
      // Request notifications permission if supported
      if ('Notification' in window) {
        try {
          await Notification.requestPermission();
        } catch {}
      }
      setStep(4);
    } else if (step === 4) {
      // Request mic permission
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch {}
      setStep(5);
    } else if (step === 5) {
      if (birthdayName.trim()) {
        await api.createBirthday({
          name: birthdayName.trim(),
          birthDate: birthdayDate,
          relationship: 'Friend',
          reminderDays: [7, 1, 0],
        });
      }
      setStep(6);
    } else if (step === 6) {
      if (planTitle.trim()) {
        const todayStr = new Date().toISOString().split('T')[0];
        await api.createEvent({
          title: planTitle.trim(),
          date: todayStr,
          time: planTime,
          priority: 'medium',
          repeat: 'none',
        });
      }
      setStep(7);
    } else {
      await updateProfile({ onboardingCompleted: true });
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 relative">
        {/* Progress bar */}
        <div className="flex items-center gap-1.5 mb-6">
          {[1, 2, 3, 4, 5, 6, 7].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Language */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('onboardingStep1')}
            </h3>
            <p className="text-xs text-slate-500">
              Personal Life Assistant supports English, Русский, and O‘zbekcha seamlessly.
            </p>
            <div className="grid grid-cols-1 gap-2.5 pt-2">
              {[
                { code: 'ru' as Language, title: 'Русский', sub: 'Полная поддержка интерфейса и AI' },
                { code: 'uz' as Language, title: 'O‘zbekcha', sub: 'Interfeys va sun’iy intellekt to‘liq o‘zbek tilida' },
                { code: 'en' as Language, title: 'English', sub: 'Global personal life manager' },
              ].map((item) => (
                <button
                  key={item.code}
                  onClick={() => setLanguage(item.code)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition text-left cursor-pointer ${
                    language === item.code
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div>
                    <h4 className="text-sm font-bold">{item.title}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.sub}</p>
                  </div>
                  {language === item.code && <Check className="w-4 h-4 text-indigo-600" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Country & Timezone */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('onboardingStep2')}
            </h3>
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {t('country')}
                </label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Uzbekistan">Uzbekistan</option>
                  <option value="Kazakhstan">Kazakhstan</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Germany">Germany</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {t('timezone')}
                </label>
                <select
                  value={selectedTimezone}
                  onChange={(e) => setSelectedTimezone(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Asia/Tashkent">Asia/Tashkent (UTC+5)</option>
                  <option value="Asia/Almaty">Asia/Almaty (UTC+5)</option>
                  <option value="Europe/Moscow">Europe/Moscow (UTC+3)</option>
                  <option value="Europe/London">Europe/London (UTC+1)</option>
                  <option value="America/New_York">America/New York (UTC-5)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Notifications */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in text-center py-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center mb-3">
              <Bell className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('onboardingStep3')}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              Never miss birthdays or urgent appointments with browser push reminders.
            </p>
          </div>
        )}

        {/* Step 4: Microphone */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in text-center py-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              <Mic className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('onboardingStep4')}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              Dictate your plans naturally in Russian, Uzbek, or English. AI will do the rest!
            </p>
          </div>
        )}

        {/* Step 5: First Birthday */}
        {step === 5 && (
          <div className="space-y-3 animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/60 text-pink-500 flex items-center justify-center mb-3">
              <Cake className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('onboardingStep5')}
            </h3>
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {t('birthdayPersonName')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dilshod"
                  value={birthdayName}
                  onChange={(e) => setBirthdayName(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {t('birthDate')}
                </label>
                <input
                  type="date"
                  value={birthdayDate}
                  onChange={(e) => setBirthdayDate(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 6: First Plan */}
        {step === 6 && (
          <div className="space-y-3 animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              <Pin className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('onboardingStep6')}
            </h3>
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {t('planTitle')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. English speaking lesson"
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {t('time')}
                </label>
                <input
                  type="time"
                  value={planTime}
                  onChange={(e) => setPlanTime(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Complete */}
        {step === 7 && (
          <div className="space-y-4 animate-in fade-in text-center py-6">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center mb-3">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {t('onboardingComplete')}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              Your personal assistant is fully prepared. Enjoy organizing your calendar, plans, and birthdays!
            </p>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={handleNext}
            className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{step === 7 ? t('startUsingApp') : t('confirm')}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
