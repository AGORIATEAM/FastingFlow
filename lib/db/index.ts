import * as SQLite from 'expo-sqlite';

import { runMigrations } from './migrations';

let _db: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (_db === null) {
    _db = SQLite.openDatabaseSync('fastlife.db');
    _db.execSync('PRAGMA journal_mode = WAL;');
    _db.execSync('PRAGMA foreign_keys = ON;');
    runMigrations(_db);
  }
  return _db;
}
