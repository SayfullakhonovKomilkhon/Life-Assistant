import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, ThemeMode, AccentColor } from '../types';
import { api, setStoredToken, getStoredToken } from '../services/api';
import { offlineStore } from '../services/offlineStore';
import { useOnlineStatus } from './useOnlineStatus';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  login: (email: string, pass?: string, autoCreate?: boolean) => Promise<void>;
  loginDemo: () => Promise<void>;
  register: (email: string, pass: string, name: string, lang?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => offlineStore.getCache<User>('current_user'));
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('pla_theme') as ThemeMode) || 'system';
  });
  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    return (localStorage.getItem('pla_accent_color') as AccentColor) || 'indigo';
  });

  const isOnline = useOnlineStatus();

  // Apply dark / midnight mode to document
  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      theme === 'dark' ||
      theme === 'midnight' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    if (theme === 'midnight') {
      root.classList.add('midnight');
      root.setAttribute('data-theme', 'midnight');
    } else {
      root.classList.remove('midnight');
      root.removeAttribute('data-theme');
    }
  }, [theme]);

  // Apply accent color to document
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-accent', accentColor);
  }, [accentColor]);

  // Sync offline queue when coming back online
  useEffect(() => {
    if (isOnline) {
      offlineStore.processQueue();
    }
  }, [isOnline]);

  // Fetch initial profile or fallback to demo user
  useEffect(() => {
    let mounted = true;
    async function loadUser() {
      try {
        const token = getStoredToken();
        if (!token) {
          const res = await api.loginDemo().catch(() => api.getMe().catch(() => null));
          if (res && mounted) {
            if ('token' in res && res.token) setStoredToken(res.token);
            if (res.user) {
              setUser(res.user);
              offlineStore.setCache('current_user', res.user);
              if (res.user.theme) setThemeState(res.user.theme);
              if (res.user.accentColor) setAccentColorState(res.user.accentColor);
            }
          }
        } else {
          const res = await api.getMe().catch(async () => {
            return await api.loginDemo().catch(() => null);
          });
          if (res && mounted) {
            if ('token' in res && res.token) setStoredToken(res.token);
            if (res.user) {
              setUser(res.user);
              offlineStore.setCache('current_user', res.user);
              if (res.user.theme) setThemeState(res.user.theme);
              if (res.user.accentColor) setAccentColorState(res.user.accentColor);
            }
          }
        }
      } catch (err) {
        console.warn('Could not load user, checking offline cache:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, pass?: string, autoCreate = true) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password: pass || 'password123', autoCreate });
      setStoredToken(res.token);
      setUser(res.user);
      offlineStore.setCache('current_user', res.user);
      if (res.user.theme) setThemeState(res.user.theme);
      if (res.user.accentColor) setAccentColorState(res.user.accentColor);
    } finally {
      setIsLoading(false);
    }
  };

  const loginDemo = async () => {
    setIsLoading(true);
    try {
      const res = await api.loginDemo();
      setStoredToken(res.token);
      setUser(res.user);
      offlineStore.setCache('current_user', res.user);
      if (res.user.theme) setThemeState(res.user.theme);
      if (res.user.accentColor) setAccentColorState(res.user.accentColor);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, pass: string, name: string, lang?: string) => {
    setIsLoading(true);
    try {
      const res = await api.register({ email, password: pass, name, language: lang });
      setStoredToken(res.token);
      setUser(res.user);
      offlineStore.setCache('current_user', res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setStoredToken(null);
    setUser(null);
    offlineStore.setCache('current_user', null);
  };

  const updateProfile = async (data: Partial<User>) => {
    const updated = user ? { ...user, ...data } : ({ id: 'user_bekhruz', email: 'bekhruz@assistant.ai', name: 'User', ...data } as User);
    setUser(updated);
    offlineStore.setCache('current_user', updated);
    if (data.theme) {
      setThemeState(data.theme);
      localStorage.setItem('pla_theme', data.theme);
    }
    if (data.accentColor) {
      setAccentColorState(data.accentColor);
      localStorage.setItem('pla_accent_color', data.accentColor);
    }
    try {
      const res = await api.updateProfile(data);
      if (res?.user) {
        setUser(res.user);
        offlineStore.setCache('current_user', res.user);
      }
    } catch (err) {
      console.warn('Saved offline, will sync later:', err);
    }
  };

  const setTheme = (t: ThemeMode) => {
    setThemeState(t);
    localStorage.setItem('pla_theme', t);
    updateProfile({ theme: t });
  };

  const setAccentColor = (c: AccentColor) => {
    setAccentColorState(c);
    localStorage.setItem('pla_accent_color', c);
    updateProfile({ accentColor: c });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        theme,
        setTheme,
        accentColor,
        setAccentColor,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
