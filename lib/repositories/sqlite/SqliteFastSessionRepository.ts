import type { SQLiteDatabase } from 'expo-sqlite';

import {
  CreateFastSessionSchema,
  FastSessionSchema,
  UpdateFastSessionSchema,
  type CreateFastSession,
  type FastSession,
  type FastSessionStatus,
  type UpdateFastSession,
} from '@/lib/schemas';
import type { IFastSessionRepository } from '../interfaces/IFastSessionRepository';

interface FastSessionRow {
  id: string;
  user_id: string;
  protocol: string;
  planned_duration_h: number;
  started_at: string;
  ended_at: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function rowToSession(row: FastSessionRow): FastSession {
  return FastSessionSchema.parse({
    id: row.id,
    userId: row.user_id,
    protocol: row.protocol,
    plannedDurationH: row.planned_duration_h,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export class SqliteFastSessionRepository implements IFastSessionRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async findById(id: string): Promise<FastSession | null> {
    const row = this.db.getFirstSync<FastSessionRow>('SELECT * FROM fast_session WHERE id = ?', id);
    return row ? rowToSession(row) : null;
  }

  async findAll(): Promise<FastSession[]> {
    const rows = this.db.getAllSync<FastSessionRow>(
      'SELECT * FROM fast_session ORDER BY started_at DESC'
    );
    return rows.map(rowToSession);
  }

  async findByUserId(userId: string): Promise<FastSession[]> {
    const rows = this.db.getAllSync<FastSessionRow>(
      'SELECT * FROM fast_session WHERE user_id = ? ORDER BY started_at DESC',
      userId
    );
    return rows.map(rowToSession);
  }

  async findActiveByUserId(userId: string): Promise<FastSession | null> {
    const row = this.db.getFirstSync<FastSessionRow>(
      "SELECT * FROM fast_session WHERE user_id = ? AND status = 'active' LIMIT 1",
      userId
    );
    return row ? rowToSession(row) : null;
  }

  async findByStatus(userId: string, status: FastSessionStatus): Promise<FastSession[]> {
    const rows = this.db.getAllSync<FastSessionRow>(
      'SELECT * FROM fast_session WHERE user_id = ? AND status = ? ORDER BY started_at DESC',
      userId,
      status
    );
    return rows.map(rowToSession);
  }

  async findRecentByUserId(userId: string, limit: number): Promise<FastSession[]> {
    const rows = this.db.getAllSync<FastSessionRow>(
      'SELECT * FROM fast_session WHERE user_id = ? ORDER BY started_at DESC LIMIT ?',
      userId,
      limit
    );
    return rows.map(rowToSession);
  }

  async create(data: CreateFastSession): Promise<FastSession> {
    CreateFastSessionSchema.parse(data);
    const now = new Date().toISOString();
    this.db.runSync(
      `INSERT INTO fast_session (id, user_id, protocol, planned_duration_h, started_at, ended_at, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      data.id,
      data.userId,
      data.protocol,
      data.plannedDurationH,
      data.startedAt,
      data.endedAt,
      data.status,
      data.notes,
      now,
      now
    );
    const created = await this.findById(data.id);
    if (!created) throw new Error(`FastSession ${data.id} not found after insert`);
    return created;
  }

  async update(id: string, data: UpdateFastSession): Promise<FastSession> {
    UpdateFastSessionSchema.parse(data);
    const now = new Date().toISOString();
    const sets: string[] = ['updated_at = ?'];
    const values: (string | number | null)[] = [now];

    if (data.startedAt !== undefined) {
      sets.push('started_at = ?');
      values.push(data.startedAt);
    }
    if (data.endedAt !== undefined) {
      sets.push('ended_at = ?');
      values.push(data.endedAt);
    }
    if (data.status !== undefined) {
      sets.push('status = ?');
      values.push(data.status);
    }
    if (data.notes !== undefined) {
      sets.push('notes = ?');
      values.push(data.notes);
    }
    if (data.protocol !== undefined) {
      sets.push('protocol = ?');
      values.push(data.protocol);
    }
    if (data.plannedDurationH !== undefined) {
      sets.push('planned_duration_h = ?');
      values.push(data.plannedDurationH);
    }

    this.db.runSync(`UPDATE fast_session SET ${sets.join(', ')} WHERE id = ?`, ...values, id);
    const updated = await this.findById(id);
    if (!updated) throw new Error(`FastSession ${id} not found after update`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.db.runSync('DELETE FROM fast_session WHERE id = ?', id);
  }
}
