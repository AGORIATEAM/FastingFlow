import type { SQLiteDatabase } from 'expo-sqlite';

import {
  CreateUserSchema,
  UpdateUserSchema,
  UserSchema,
  type CreateUser,
  type UpdateUser,
  type User,
} from '@/lib/schemas';
import type { IUserRepository } from '../interfaces/IUserRepository';

interface UserRow {
  id: string;
  email: string | null;
  password_hash: string | null;
  is_guest: number;
  display_name: string | null;
  dob: string | null;
  gender: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  goal: string | null;
  created_at: string;
  updated_at: string;
}

function rowToUser(row: UserRow): User {
  return UserSchema.parse({
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    isGuest: row.is_guest === 1,
    displayName: row.display_name,
    dob: row.dob,
    gender: row.gender,
    weightKg: row.weight_kg,
    heightCm: row.height_cm,
    goal: row.goal,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export class SqliteUserRepository implements IUserRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async findById(id: string): Promise<User | null> {
    const row = this.db.getFirstSync<UserRow>('SELECT * FROM user WHERE id = ?', id);
    return row ? rowToUser(row) : null;
  }

  async findAll(): Promise<User[]> {
    const rows = this.db.getAllSync<UserRow>('SELECT * FROM user');
    return rows.map(rowToUser);
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = this.db.getFirstSync<UserRow>('SELECT * FROM user WHERE email = ?', email);
    return row ? rowToUser(row) : null;
  }

  async create(data: CreateUser): Promise<User> {
    CreateUserSchema.parse(data);
    const now = new Date().toISOString();
    this.db.runSync(
      `INSERT INTO user (id, email, password_hash, is_guest, display_name, dob, gender, weight_kg, height_cm, goal, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      data.id,
      data.email,
      data.passwordHash,
      data.isGuest ? 1 : 0,
      data.displayName,
      data.dob,
      data.gender,
      data.weightKg,
      data.heightCm,
      data.goal,
      now,
      now
    );
    const created = await this.findById(data.id);
    if (!created) throw new Error(`User ${data.id} not found after insert`);
    return created;
  }

  async update(id: string, data: UpdateUser): Promise<User> {
    UpdateUserSchema.parse(data);
    const now = new Date().toISOString();
    const sets: string[] = ['updated_at = ?'];
    const values: (string | number | null)[] = [now];

    if (data.email !== undefined) {
      sets.push('email = ?');
      values.push(data.email);
    }
    if (data.passwordHash !== undefined) {
      sets.push('password_hash = ?');
      values.push(data.passwordHash);
    }
    if (data.isGuest !== undefined) {
      sets.push('is_guest = ?');
      values.push(data.isGuest ? 1 : 0);
    }
    if (data.displayName !== undefined) {
      sets.push('display_name = ?');
      values.push(data.displayName);
    }
    if (data.dob !== undefined) {
      sets.push('dob = ?');
      values.push(data.dob);
    }
    if (data.gender !== undefined) {
      sets.push('gender = ?');
      values.push(data.gender);
    }
    if (data.weightKg !== undefined) {
      sets.push('weight_kg = ?');
      values.push(data.weightKg);
    }
    if (data.heightCm !== undefined) {
      sets.push('height_cm = ?');
      values.push(data.heightCm);
    }
    if (data.goal !== undefined) {
      sets.push('goal = ?');
      values.push(data.goal);
    }

    this.db.runSync(`UPDATE user SET ${sets.join(', ')} WHERE id = ?`, ...values, id);
    const updated = await this.findById(id);
    if (!updated) throw new Error(`User ${id} not found after update`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.db.runSync('DELETE FROM user WHERE id = ?', id);
  }

  async promoteGuestToRegistered(id: string, email: string, passwordHash: string): Promise<User> {
    return this.update(id, { email, passwordHash, isGuest: false });
  }
}
