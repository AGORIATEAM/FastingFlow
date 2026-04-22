import { create } from 'zustand';

import type { User } from '@/lib/schemas';

interface UserState {
  user: User | null;
  isLoading: boolean;

  setUser: (user: User | null) => void;
  setIsLoading: (loading: boolean) => void;
  updateUser: (partial: Partial<User>) => void;
  isGuest: () => boolean;
  isAuthenticated: () => boolean;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  updateUser: (partial) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : null,
    })),

  isGuest: () => get().user?.isGuest ?? true,

  isAuthenticated: () => {
    const user = get().user;
    return user !== null && !user.isGuest;
  },
}));
