import type { SQLiteDatabase } from 'expo-sqlite';

import {
  CreateJournalEntrySchema,
  JournalEntrySchema,
  UpdateJournalEntrySchema,
  type CreateJournalEntry,
  type JournalEntry,
  type UpdateJournalEntry,
} from '@/lib/schemas';
import type { IJournalEntryRepository } from '../interfaces/IJournalEntryRepository';

interface JournalEntryRow {
  id: string;
  user_id: string;
  fast_session_id: string | null;
  mood: number;
  energy: number;
  hunger: number;
  mental_clarity: number;
  text: string | null;
  created_at: string;
}

function rowToEntry(row: JournalEntryRow): JournalEntry {
  return JournalEntrySchema.parse({
    id: row.id,
    userId: row.user_id,
    fastSessionId: row.fast_session_id,
    mood: row.mood,
    energy: row.energy,
    hunger: row.hunger,
    mentalClarity: row.mental_clarity,
    text: row.text,
    createdAt: row.created_at,
  });
}

export class SqliteJournalEntryRepository implements IJournalEntryRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async findById(id: string): Promise<JournalEntry | null> {
    const row = this.db.getFirstSync<JournalEntryRow>(
      'SELECT * FROM journal_entry WHERE id = ?',
      id
    );
    return row ? rowToEntry(row) : null;
  }

  async findAll(): Promise<JournalEntry[]> {
    const rows = this.db.getAllSync<JournalEntryRow>(
      'SELECT * FROM journal_entry ORDER BY created_at DESC'
    );
    return rows.map(rowToEntry);
  }

  async findByUserId(userId: string): Promise<JournalEntry[]> {
    const rows = this.db.getAllSync<JournalEntryRow>(
      'SELECT * FROM journal_entry WHERE user_id = ? ORDER BY created_at DESC',
      userId
    );
    return rows.map(rowToEntry);
  }

  async findByFastSessionId(fastSessionId: string): Promise<JournalEntry[]> {
    const rows = this.db.getAllSync<JournalEntryRow>(
      'SELECT * FROM journal_entry WHERE fast_session_id = ? ORDER BY created_at DESC',
      fastSessionId
    );
    return rows.map(rowToEntry);
  }

  async countByUserId(userId: string): Promise<number> {
    const row = this.db.getFirstSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM journal_entry WHERE user_id = ?',
      userId
    );
    return row?.count ?? 0;
  }

  async create(data: CreateJournalEntry): Promise<JournalEntry> {
    CreateJournalEntrySchema.parse(data);
    const now = new Date().toISOString();
    this.db.runSync(
      `INSERT INTO journal_entry (id, user_id, fast_session_id, mood, energy, hunger, mental_clarity, text, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      data.id,
      data.userId,
      data.fastSessionId,
      data.mood,
      data.energy,
      data.hunger,
      data.mentalClarity,
      data.text,
      now
    );
    const created = await this.findById(data.id);
    if (!created) throw new Error(`JournalEntry ${data.id} not found after insert`);
    return created;
  }

  async update(id: string, data: UpdateJournalEntry): Promise<JournalEntry> {
    UpdateJournalEntrySchema.parse(data);
    const sets: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.mood !== undefined) {
      sets.push('mood = ?');
      values.push(data.mood);
    }
    if (data.energy !== undefined) {
      sets.push('energy = ?');
      values.push(data.energy);
    }
    if (data.hunger !== undefined) {
      sets.push('hunger = ?');
      values.push(data.hunger);
    }
    if (data.mentalClarity !== undefined) {
      sets.push('mental_clarity = ?');
      values.push(data.mentalClarity);
    }
    if (data.text !== undefined) {
      sets.push('text = ?');
      values.push(data.text);
    }

    if (sets.length > 0) {
      this.db.runSync(`UPDATE journal_entry SET ${sets.join(', ')} WHERE id = ?`, ...values, id);
    }
    const updated = await this.findById(id);
    if (!updated) throw new Error(`JournalEntry ${id} not found after update`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.db.runSync('DELETE FROM journal_entry WHERE id = ?', id);
  }
}
