import type { CreateJournalEntry, JournalEntry, UpdateJournalEntry } from '@/lib/schemas';

import type { IRepository } from './IRepository';

export interface IJournalEntryRepository extends IRepository<
  JournalEntry,
  CreateJournalEntry,
  UpdateJournalEntry
> {
  findByUserId(userId: string): Promise<JournalEntry[]>;
  findByFastSessionId(fastSessionId: string): Promise<JournalEntry[]>;
  countByUserId(userId: string): Promise<number>;
}
