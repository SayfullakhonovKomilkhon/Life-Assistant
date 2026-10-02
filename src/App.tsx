import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LanguageProvider, useLanguage } from './hooks/useLanguage';
import { Header } from './components/Header';
import { Sidebar, type ActiveTab } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { VoiceModal } from './components/VoiceModal';
import { NotificationCenter } from './components/NotificationCenter';
import { OnboardingModal } from './components/OnboardingModal';
import { PlanModal } from './components/PlanModal';
import { BirthdayModal } from './components/BirthdayModal';
import { TaskModal } from './components/TaskModal';
import { AuthModal } from './components/AuthModal';
import { DayDetailModal } from './components/DayDetailModal';
import { OfflineBanner } from './components/OfflineBanner';
import { ProfileModal } from './components/ProfileModal';
import { ThemePickerModal } from './components/ThemePickerModal';

// Views
import { HomeView } from './views/HomeView';
import { DayScheduleView } from './views/TodayTomorrowView';
import { CalendarView } from './views/CalendarView';
import { BirthdaysView } from './views/BirthdaysView';
import { HolidaysView } from './views/HolidaysView';
import { PlansView } from './views/PlansView';
import { TasksView } from './views/TasksView';
import { VoiceNotesView } from './views/VoiceNotesView';
import { AiAssistantView } from './views/AiAssistantView';
import { SearchView } from './views/SearchView';
import { StatisticsView } from './views/StatisticsView';
import { SettingsView } from './views/SettingsView';
import { MultiDayView } from './views/MultiDayView';

import { api } from './services/api';
import { offlineStore } from './services/offlineStore';
import type { PlanEvent, Birthday, Holiday, Task, Note, VoiceNote, AppNotification } from './types';

function MainLayout() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Entities
  const [events, setEvents] = useState<PlanEvent[]>(() => offlineStore.getCache('events') || []);
  const [birthdays, setBirthdays] = useState<Birthday[]>(() => offlineStore.getCache('birthdays') || []);
  const [holidays, setHolidays] = useState<Holiday[]>(() => offlineStore.getCache('holidays') || []);
  const [tasks, setTasks] = useState<Task[]>(() => offlineStore.getCache('tasks') || []);
  const [notes, setNotes] = useState<Note[]>(() => offlineStore.getCache('notes') || []);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>(() => offlineStore.getCache('voice_notes') || []);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => offlineStore.getCache('notifications') || []);

  // Modals
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);

  // Entity Modals
  const [planModalState, setPlanModalState] = useState<{ isOpen: boolean; data?: PlanEvent | null }>({ isOpen: false });
  const [birthdayModalState, setBirthdayModalState] = useState<{ isOpen: boolean; data?: Birthday | null }>({ isOpen: false });
  const [taskModalState, setTaskModalState] = useState<{ isOpen: boolean; data?: Task | null }>({ isOpen: false });
  const [dayDetailDate, setDayDetailDate] = useState<string | null>(null);

  // Fetch data
  const loadData = async () => {
    try {
      const [ev, bd, hol, tk, nt, vn, ntf] = await Promise.all([
        api.getEvents().catch(() => events),
        api.getBirthdays().catch(() => birthdays),
        api.getHolidays().catch(() => holidays),
        api.getTasks().catch(() => tasks),
        api.getNotes().catch(() => notes),
        api.getVoiceNotes().catch(() => voiceNotes),
        api.getNotifications().catch(() => notifications),
      ]);

      setEvents(ev);
      setBirthdays(bd);
      setHolidays(hol);
      setTasks(tk);
      setNotes(nt);
      setVoiceNotes(vn);
      setNotifications(ntf);

      offlineStore.setCache('events', ev);
      offlineStore.setCache('birthdays', bd);
      offlineStore.setCache('holidays', hol);
      offlineStore.setCache('tasks', tk);
      offlineStore.setCache('notes', nt);
      offlineStore.setCache('voice_notes', vn);
      offlineStore.setCache('notifications', ntf);
    } catch (err) {
      console.warn('Using offline cached records');
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Check onboarding
  useEffect(() => {
    if (user && user.onboardingCompleted === false) {
      setIsOnboardingOpen(true);
    }
  }, [user]);

  // Task Toggle
  const handleToggleTask = async (id: string, completed: boolean) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, isCompleted: completed } : t));
    setTasks(updated);
    offlineStore.setCache('tasks', updated);
    try {
      await api.updateTask(id, { isCompleted: completed });
    } catch {
      offlineStore.enqueueMutation({ entity: 'tasks', action: 'update', targetId: id, data: { isCompleted: completed } });
    }
  };

  // Plan Handlers
  const handleSavePlan = async (data: Omit<PlanEvent, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (planModalState.data) {
      const updated = await api.updateEvent(planModalState.data.id, data);
      setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } else {
      const created = await api.createEvent(data);
      setEvents((prev) => [...prev, created]);
    }
    loadData();
  };

  const handleDeletePlan = async (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    await api.deleteEvent(id).catch(() => {
      offlineStore.enqueueMutation({ entity: 'events', action: 'delete', targetId: id });
    });
  };

  // Birthday Handlers
  const handleSaveBirthday = async (data: Omit<Birthday, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (birthdayModalState.data) {
      const updated = await api.updateBirthday(birthdayModalState.data.id, data);
      setBirthdays((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    } else {
      const created = await api.createBirthday(data);
      setBirthdays((prev) => [...prev, created]);
    }
    loadData();
  };

  const handleDeleteBirthday = async (id: string) => {
    setBirthdays((prev) => prev.filter((b) => b.id !== id));
    await api.deleteBirthday(id).catch(() => {
      offlineStore.enqueueMutation({ entity: 'birthdays', action: 'delete', targetId: id });
    });
  };

  // Task Handlers
  const handleSaveTask = async (data: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (taskModalState.data) {
      const updated = await api.updateTask(taskModalState.data.id, data);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } else {
      const created = await api.createTask(data);
      setTasks((prev) => [...prev, created]);
    }
    loadData();
  };

  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await api.deleteTask(id).catch(() => {
      offlineStore.enqueueMutation({ entity: 'tasks', action: 'delete', targetId: id });
    });
  };

  // Holiday Handlers
  const handleAddCustomHoliday = async (data: Omit<Holiday, 'id' | 'userId' | 'isPublic'>) => {
    const created = await api.createCustomHoliday(data);
    setHolidays((prev) => [...prev, created]);
  };

  const handleDeleteCustomHoliday = async (id: string) => {
    await api.deleteCustomHoliday(id);
    setHolidays((prev) => prev.filter((h) => h.id !== id));
  };

  // Voice Note Handlers
  const handleUpdateVoiceNote = async (id: string, updates: Partial<VoiceNote>) => {
    const updated = await api.updateVoiceNote(id, updates);
    setVoiceNotes((prev) => prev.map((v) => (v.id === id ? updated : v)));
  };

  const handleDeleteVoiceNote = async (id: string) => {
    await api.deleteVoiceNote(id);
    setVoiceNotes((prev) => prev.filter((v) => v.id !== id));
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayEventsCount = events.filter((e) => e.date === todayStr).length;
  const pendingTasksCount = tasks.filter((t) => !t.isCompleted).length;
  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <Header
        onOpenVoice={() => setIsVoiceOpen(true)}
        onOpenNotifications={() => setIsNotifOpen(true)}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenThemePicker={() => setIsThemePickerOpen(true)}
        unreadCount={unreadNotifsCount}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-20 md:pb-6">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenThemePicker={() => setIsThemePickerOpen(true)}
          counts={{
            todayEvents: todayEventsCount,
            tasksPending: pendingTasksCount,
            birthdays: birthdays.length,
            voiceNotes: voiceNotes.length,
          }}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden">
          {activeTab === 'home' && (
            <HomeView
              events={events}
              birthdays={birthdays}
              holidays={holidays}
              tasks={tasks}
              onOpenVoice={() => setIsVoiceOpen(true)}
              onOpenAddPlan={() => setPlanModalState({ isOpen: true, data: null })}
              onOpenAddTask={() => setTaskModalState({ isOpen: true, data: null })}
              onOpenAddBirthday={() => setBirthdayModalState({ isOpen: true, data: null })}
              onNavigateTab={setActiveTab}
              onToggleTask={handleToggleTask}
            />
          )}

          {(activeTab === 'today' || activeTab === 'tomorrow' || activeTab === 'my-day') && (
            <DayScheduleView
              mode={activeTab}
              events={events}
              birthdays={birthdays}
              holidays={holidays}
              tasks={tasks}
              notes={notes}
              voiceNotes={voiceNotes}
              onToggleTask={handleToggleTask}
              onOpenAddPlan={() => setPlanModalState({ isOpen: true, data: null })}
              onOpenAddTask={() => setTaskModalState({ isOpen: true, data: null })}
              onOpenVoice={() => setIsVoiceOpen(true)}
            />
          )}

          {(activeTab === 'week' || activeTab === 'next7' || activeTab === 'month') && (
            <MultiDayView
              mode={activeTab}
              events={events}
              birthdays={birthdays}
              holidays={holidays}
              tasks={tasks}
              onSelectDate={(d) => setDayDetailDate(d)}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              events={events}
              birthdays={birthdays}
              holidays={holidays}
              tasks={tasks}
              voiceNotes={voiceNotes}
              onSelectDate={(d) => setDayDetailDate(d)}
            />
          )}

          {activeTab === 'birthdays' && (
            <BirthdaysView
              birthdays={birthdays}
              onOpenAdd={() => setBirthdayModalState({ isOpen: true, data: null })}
              onEdit={(b) => setBirthdayModalState({ isOpen: true, data: b })}
              onDelete={handleDeleteBirthday}
            />
          )}

          {activeTab === 'plans' && (
            <PlansView
              events={events}
              onOpenAdd={() => setPlanModalState({ isOpen: true, data: null })}
              onEdit={(e) => setPlanModalState({ isOpen: true, data: e })}
              onDelete={handleDeletePlan}
            />
          )}

          {activeTab === 'holidays' && (
            <HolidaysView
              holidays={holidays}
              onAddCustomHoliday={handleAddCustomHoliday}
              onDeleteCustomHoliday={handleDeleteCustomHoliday}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksView
              tasks={tasks}
              onToggleTask={handleToggleTask}
              onOpenAdd={() => setTaskModalState({ isOpen: true, data: null })}
              onEdit={(tItem) => setTaskModalState({ isOpen: true, data: tItem })}
              onDelete={handleDeleteTask}
            />
          )}

          {activeTab === 'voice-notes' && (
            <VoiceNotesView
              voiceNotes={voiceNotes}
              onOpenVoice={() => setIsVoiceOpen(true)}
              onUpdateVoiceNote={handleUpdateVoiceNote}
              onDeleteVoiceNote={handleDeleteVoiceNote}
            />
          )}

          {activeTab === 'ai-assistant' && (
            <AiAssistantView onOpenVoice={() => setIsVoiceOpen(true)} />
          )}

          {activeTab === 'search' && (
            <SearchView
              events={events}
              birthdays={birthdays}
              holidays={holidays}
              tasks={tasks}
              notes={notes}
              voiceNotes={voiceNotes}
            />
          )}

          {activeTab === 'statistics' && (
            <StatisticsView
              events={events}
              birthdays={birthdays}
              holidays={holidays}
              tasks={tasks}
              voiceNotes={voiceNotes}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              events={events}
              birthdays={birthdays}
              tasks={tasks}
              notes={notes}
              onRefreshData={loadData}
              onOpenAuthModal={() => setIsAuthOpen(true)}
            />
          )}
        </main>
      </div>

      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenVoice={() => setIsVoiceOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenThemePicker={() => setIsThemePickerOpen(true)}
        isMenuOpen={isMobileMenuOpen}
        setIsMenuOpen={setIsMobileMenuOpen}
      />

      {/* Global Modals */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenAuth={() => {
          setIsProfileOpen(false);
          setIsAuthOpen(true);
        }}
        onOpenThemePicker={() => {
          setIsProfileOpen(false);
          setIsThemePickerOpen(true);
        }}
      />

      <ThemePickerModal
        isOpen={isThemePickerOpen}
        onClose={() => setIsThemePickerOpen(false)}
      />

      <VoiceModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onEventCreated={loadData}
        onVoiceNoteCreated={loadData}
      />

      <NotificationCenter
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        onNotificationsUpdated={loadData}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={() => setIsOnboardingOpen(false)}
      />

      <PlanModal
        isOpen={planModalState.isOpen}
        onClose={() => setPlanModalState({ isOpen: false, data: null })}
        onSave={handleSavePlan}
        initialData={planModalState.data}
      />

      <BirthdayModal
        isOpen={birthdayModalState.isOpen}
        onClose={() => setBirthdayModalState({ isOpen: false, data: null })}
        onSave={handleSaveBirthday}
        initialData={birthdayModalState.data}
      />

      <TaskModal
        isOpen={taskModalState.isOpen}
        onClose={() => setTaskModalState({ isOpen: false, data: null })}
        onSave={handleSaveTask}
        initialData={taskModalState.data}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <DayDetailModal
        dateStr={dayDetailDate}
        onClose={() => setDayDetailDate(null)}
        events={events}
        birthdays={birthdays}
        holidays={holidays}
        tasks={tasks}
        onOpenAddPlan={(d) => {
          setDayDetailDate(null);
          setPlanModalState({ isOpen: true, data: { date: d, title: '', priority: 'medium', repeat: 'none' } as any });
        }}
        onOpenAddTask={(d) => {
          setDayDetailDate(null);
          setTaskModalState({ isOpen: true, data: { date: d, title: '', priority: 'medium', isCompleted: false } as any });
        }}
        onToggleTask={handleToggleTask}
      />

      <OfflineBanner />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </LanguageProvider>
  );
}
