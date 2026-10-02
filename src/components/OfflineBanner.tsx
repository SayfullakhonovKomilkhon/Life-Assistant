import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useLanguage } from '../hooks/useLanguage';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { t } = useLanguage();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-500/95 dark:bg-amber-600/95 backdrop-blur-md px-3.5 py-2 text-xs font-medium text-white shadow-xl animate-in slide-in-from-bottom duration-300">
      <WifiOff className="w-4 h-4 animate-pulse" />
      <span>{t('offlineMessage')}</span>
    </div>
  );
};
