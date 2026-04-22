import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type Language = 'fr' | 'en';
type Theme = 'dark' | 'light' | 'system';

interface AppSettingsState {
  language: Language;
  theme: Theme;
  notificationsEnabled: boolean;
  reminderIntervalH: number;

  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setReminderIntervalH: (hours: number) => void;
}

export const useAppSettingsStore = create<AppSettingsState>()(
  persist(
    (set) => ({
      language: 'fr',
      theme: 'system',
      notificationsEnabled: true,
      reminderIntervalH: 4,

      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setReminderIntervalH: (hours) => set({ reminderIntervalH: hours }),
    }),
    {
      name: 'app-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
