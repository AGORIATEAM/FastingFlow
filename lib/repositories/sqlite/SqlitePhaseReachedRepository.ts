import type { SQLiteDatabase } from 'expo-sqlite';

import {
  CreatePhaseReachedSchema,
  PhaseReachedSchema,
  type CreatePhaseReached,
  type PhaseId,
  type PhaseReached,
} from '@/lib/schemas';
import type { IPhaseReachedRepository } from '../interfaces/IPhaseReachedRepository';

interface PhaseReachedRow {
  id: string;
  user_id: string;
  fast_session_id: string;
  phase_id: string;
  reached_at: string;
}

function rowToPhaseReached(row: PhaseReachedRow): PhaseReached {
  return PhaseReachedSchema.parse({
    id: row.id,
    userId: row.user_id,
    fastSessionId: row.fast_session_id,
    phaseId: row.phase_id,
    reachedAt: row.reached_at,
  });
}

export class SqlitePhaseReachedRepository implements IPhaseReachedRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async findById(id: string): Promise<PhaseReached | null> {
    const row = this.db.getFirstSync<PhaseReachedRow>(
      'SELECT * FROM phase_reached WHERE id = ?',
      id
    );
    return row ? rowToPhaseReached(row) : null;
  }

  async findAll(): Promise<PhaseReached[]> {
    const rows = this.db.getAllSync<PhaseReachedRow>(
      'SELECT * FROM phase_reached ORDER BY reached_at DESC'
    );
    return rows.map(rowToPhaseReached);
  }

  async findByFastSessionId(fastSessionId: string): Promise<PhaseReached[]> {
    const rows = this.db.getAllSync<PhaseReachedRow>(
      'SELECT * FROM phase_reached WHERE fast_session_id = ? ORDER BY reached_at ASC',
      fastSessionId
    );
    return rows.map(rowToPhaseReached);
  }

  async findByUserId(userId: string): Promise<PhaseReached[]> {
    const rows = this.db.getAllSync<PhaseReachedRow>(
      'SELECT * FROM phase_reached WHERE user_id = ? ORDER BY reached_at DESC',
      userId
    );
    return rows.map(rowToPhaseReached);
  }

  async hasReachedPhase(fastSessionId: string, phaseId: PhaseId): Promise<boolean> {
    const row = this.db.getFirstSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM phase_reached WHERE fast_session_id = ? AND phase_id = ?',
      fastSessionId,
      phaseId
    );
    return (row?.count ?? 0) > 0;
  }

  async create(data: CreatePhaseReached): Promise<PhaseReached> {
    CreatePhaseReachedSchema.parse(data);
    this.db.runSync(
      'INSERT INTO phase_reached (id, user_id, fast_session_id, phase_id, reached_at) VALUES (?, ?, ?, ?, ?)',
      data.id,
      data.userId,
      data.fastSessionId,
      data.phaseId,
      data.reachedAt
    );
    const created = await this.findById(data.id);
    if (!created) throw new Error(`PhaseReached ${data.id} not found after insert`);
    return created;
  }

  // PhaseReached is an append-only log — update is not supported
  async update(_id: string, _data: never): Promise<PhaseReached> {
    throw new Error('PhaseReached entries are immutable');
  }

  async delete(id: string): Promise<void> {
    this.db.runSync('DELETE FROM phase_reached WHERE id = ?', id);
  }
}
