import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Protocol } from '@/lib/schemas';

type Language = 'fr' | 'en';
type Theme = 'dark' | 'light' | 'system';

interface AppSettingsState {
  language: Language;
  theme: Theme;
  notificationsEnabled: boolean;
  reminderIntervalH: number;
  preferredProtocol: Protocol;
  freeDurationH: number; // custom duration for the 'free' protocol
  // Profile data collected during setup
  firstName: string;
  targetWeightKg: number | null;
  heightCm: number | null;
  ageYears: number | null;
  gender: string;
  primaryGoal: string | null;

  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setReminderIntervalH: (hours: number) => void;
  setPreferredProtocol: (protocol: Protocol) => void;
  setFreeDurationH: (hours: number) => void;
  setProfileData: (
    data: Partial<
      Pick<
        AppSettingsState,
        'firstName' | 'targetWeightKg' | 'heightCm' | 'ageYears' | 'gender' | 'primaryGoal'
      >
    >
  ) => void;
}

export const useAppSettingsStore = create<AppSettingsState>()(
  persist(
    (set) => ({
      language: 'fr',
      theme: 'system',
      notificationsEnabled: true,
      reminderIntervalH: 4,
      preferredProtocol: '16:8',
      freeDurationH: 16,
      firstName: '',
      targetWeightKg: null,
      heightCm: null,
      ageYears: null,
      gender: 'Homme',
      primaryGoal: 'weight',

      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setReminderIntervalH: (hours) => set({ reminderIntervalH: hours }),
      setPreferredProtocol: (protocol) => set({ preferredProtocol: protocol }),
      setFreeDurationH: (hours) => set({ freeDurationH: hours }),
      setProfileData: (data) => set(data),
    }),
    {
      name: 'app-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
