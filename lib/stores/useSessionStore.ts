import { create } from 'zustand';

import type { FastSession, PhaseReached, Protocol } from '@/lib/schemas';

interface SessionState {
  activeSession: FastSession | null;
  phasesReached: PhaseReached[];
  elapsedMs: number;

  setActiveSession: (session: FastSession | null) => void;
  setPhasesReached: (phases: PhaseReached[]) => void;
  addPhaseReached: (phase: PhaseReached) => void;
  setElapsedMs: (ms: number) => void;
  startSession: (session: FastSession) => void;
  endSession: () => void;
  getElapsedHours: () => number;
  getProtocol: () => Protocol | null;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  activeSession: null,
  phasesReached: [],
  elapsedMs: 0,

  setActiveSession: (session) => set({ activeSession: session }),

  setPhasesReached: (phases) => set({ phasesReached: phases }),

  addPhaseReached: (phase) =>
    set((state) => ({
      phasesReached: [...state.phasesReached, phase],
    })),

  setElapsedMs: (ms) => set({ elapsedMs: ms }),

  startSession: (session) =>
    set({
      activeSession: session,
      phasesReached: [],
      elapsedMs: 0,
    }),

  endSession: () =>
    set({
      activeSession: null,
      phasesReached: [],
      elapsedMs: 0,
    }),

  getElapsedHours: () => {
    const { activeSession } = get();
    if (!activeSession) return 0;
    const startedAt = new Date(activeSession.startedAt).getTime();
    const now = Date.now();
    return (now - startedAt) / (1000 * 60 * 60);
  },

  getProtocol: () => {
    const { activeSession } = get();
    return activeSession?.protocol ?? null;
  },
}));
