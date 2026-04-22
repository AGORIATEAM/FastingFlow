import { createContext, useContext, type ReactNode } from 'react';

import { getDatabase } from '@/lib/db';
import type {
  IFastSessionRepository,
  IJournalEntryRepository,
  IPhaseReachedRepository,
  IUserRepository,
} from './interfaces';
import {
  SqliteFastSessionRepository,
  SqliteJournalEntryRepository,
  SqlitePhaseReachedRepository,
  SqliteUserRepository,
} from './sqlite';

interface Repositories {
  users: IUserRepository;
  fastSessions: IFastSessionRepository;
  journalEntries: IJournalEntryRepository;
  phasesReached: IPhaseReachedRepository;
}

const RepositoriesContext = createContext<Repositories | null>(null);

let _repositories: Repositories | null = null;

function getRepositories(): Repositories {
  if (_repositories === null) {
    const db = getDatabase();
    _repositories = {
      users: new SqliteUserRepository(db),
      fastSessions: new SqliteFastSessionRepository(db),
      journalEntries: new SqliteJournalEntryRepository(db),
      phasesReached: new SqlitePhaseReachedRepository(db),
    };
  }
  return _repositories;
}

interface RepositoriesProviderProps {
  children: ReactNode;
}

export function RepositoriesProvider({ children }: RepositoriesProviderProps) {
  const repositories = getRepositories();
  return (
    <RepositoriesContext.Provider value={repositories}>{children}</RepositoriesContext.Provider>
  );
}

export function useRepositories(): Repositories {
  const ctx = useContext(RepositoriesContext);
  if (ctx === null) {
    throw new Error('useRepositories must be used within a RepositoriesProvider');
  }
  return ctx;
}
