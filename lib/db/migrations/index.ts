import type { SQLiteDatabase } from 'expo-sqlite';

interface Migration {
  version: number;
  name: string;
  up: string;
}

const migrations: Migration[] = [
  {
    version: 1,
    name: '001_init',
    up: `
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        password_hash TEXT,
        is_guest INTEGER NOT NULL DEFAULT 1,
        display_name TEXT,
        dob TEXT,
        gender TEXT,
        weight_kg REAL,
        height_cm REAL,
        goal TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS fast_session (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
        protocol TEXT NOT NULL,
        planned_duration_h REAL NOT NULL,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_fast_session_user_id ON fast_session(user_id);
      CREATE INDEX IF NOT EXISTS idx_fast_session_status ON fast_session(status);
      CREATE INDEX IF NOT EXISTS idx_fast_session_started_at ON fast_session(started_at DESC);

      CREATE TABLE IF NOT EXISTS journal_entry (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
        fast_session_id TEXT REFERENCES fast_session(id) ON DELETE SET NULL,
        mood INTEGER NOT NULL CHECK(mood BETWEEN 1 AND 5),
        energy INTEGER NOT NULL CHECK(energy BETWEEN 1 AND 10),
        hunger INTEGER NOT NULL CHECK(hunger BETWEEN 1 AND 10),
        mental_clarity INTEGER NOT NULL CHECK(mental_clarity BETWEEN 1 AND 10),
        text TEXT,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_journal_entry_user_id ON journal_entry(user_id);
      CREATE INDEX IF NOT EXISTS idx_journal_entry_fast_session_id ON journal_entry(fast_session_id);

      CREATE TABLE IF NOT EXISTS phase_reached (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
        fast_session_id TEXT NOT NULL REFERENCES fast_session(id) ON DELETE CASCADE,
        phase_id TEXT NOT NULL,
        reached_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_phase_reached_fast_session_id ON phase_reached(fast_session_id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_phase_reached_unique ON phase_reached(fast_session_id, phase_id);
    `,
  },
  {
    version: 2,
    name: '002_journal_water',
    up: `
      ALTER TABLE journal_entry ADD COLUMN water_ml INTEGER NOT NULL DEFAULT 0;
    `,
  },
  {
    version: 3,
    name: '003_user_supabase_id',
    up: `
      ALTER TABLE user ADD COLUMN supabase_id TEXT;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_user_supabase_id ON user(supabase_id) WHERE supabase_id IS NOT NULL;
    `,
  },
];

export function runMigrations(db: SQLiteDatabase): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const currentVersionRow = db.getFirstSync<{ version: number }>(
    'SELECT MAX(version) as version FROM schema_version'
  );
  const currentVersion = currentVersionRow?.version ?? 0;

  const pending = migrations.filter((m) => m.version > currentVersion);

  for (const migration of pending) {
    db.execSync(migration.up);
    db.runSync(
      'INSERT INTO schema_version (version, applied_at) VALUES (?, ?)',
      migration.version,
      new Date().toISOString()
    );
  }
}
