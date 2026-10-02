import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { api } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, loginDemo } = useAuth();
  const { language, t } = useLanguage();

  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginDemo();
      onClose();
    } catch (err: any) {
      // Fallback
      await login('bekhruz@assistant.ai', 'assistant123', true);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password, true);
        onClose();
      } else if (mode === 'register') {
        await register(email, password, name || email.split('@')[0], language);
        onClose();
      } else {
        const res = await api.resetPassword({ email, newPassword: password });
        setSuccessMsg(res.message);
        setTimeout(() => setMode('login'), 1500);
      }
    } catch (err: any) {
      setError(err.message || (language === 'ru' ? 'Ошибка входа' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {mode === 'login'
                ? (language === 'ru' ? 'Вход в аккаунт' : language === 'uz' ? 'Tizimga kirish' : 'Sign In')
                : mode === 'register'
                ? (language === 'ru' ? 'Создать аккаунт' : language === 'uz' ? 'Hisob yaratish' : 'Create Account')
                : (language === 'ru' ? 'Сброс пароля' : language === 'uz' ? 'Parolni tiklash' : 'Reset Password')}
            </h3>
            <p className="text-xs text-slate-400">
              Personal Life Assistant &bull; Cloud Sync
            </p>
          </div>
        </div>

        {/* 1-Click Demo Login Banner (Super convenient for testing!) */}
        <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-amber-500/10 border border-indigo-500/20 text-center">
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
              {language === 'ru' ? 'Быстрый вход в 1 клик' : language === 'uz' ? '1 ta bosishda tezkor kirish' : 'Quick 1-Click Access'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-2.5 px-3 rounded-xl bg-accent-gradient hover:opacity-95 active:scale-98 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {language === 'ru' ? 'Войти как Bekhruz (Demo)' : language === 'uz' ? 'Bekhruz sifatida kirish (Demo)' : 'Sign In as Bekhruz (Demo)'}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
              mode === 'login'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {language === 'ru' ? 'Вход' : language === 'uz' ? 'Kirish' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
              mode === 'register'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {language === 'ru' ? 'Регистрация' : language === 'uz' ? 'Ro‘yxatdan o‘tish' : 'Register'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('nameLabel')} *
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Bekhruz"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('emailLabel')} *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {mode === 'reset' ? (language === 'ru' ? 'Новый пароль' : 'New Password') : t('passwordLabel')} *
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => setMode('reset')}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {language === 'ru' ? 'Забыли?' : 'Forgot?'}
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition cursor-pointer mt-2"
          >
            {loading
              ? t('loading')
              : mode === 'login'
              ? (language === 'ru' ? 'Войти в аккаунт' : language === 'uz' ? 'Kirish' : 'Sign In')
              : mode === 'register'
              ? (language === 'ru' ? 'Зарегистрироваться' : language === 'uz' ? 'Ro‘yxatdan o‘tish' : 'Register')
              : (language === 'ru' ? 'Сохранить пароль' : 'Save New Password')}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
          {mode === 'login' ? (
            <p>
              {language === 'ru' ? 'Нет аккаунта? ' : language === 'uz' ? 'Hisobingiz yo‘qmi? ' : 'No account? '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                {language === 'ru' ? 'Создать аккаунт' : language === 'uz' ? 'Yaratish' : 'Create one'}
              </button>
            </p>
          ) : (
            <button
              type="button"
              onClick={() => setMode('login')}
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              {language === 'ru' ? 'Уже есть аккаунт? Войти' : 'Already have an account? Sign In'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
