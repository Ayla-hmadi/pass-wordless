import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export function getDB(): SQLite.SQLiteDatabase {
  if (_db) return _db;
  _db = SQLite.openDatabaseSync('vault.db');
  _db.execSync(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS entries (
      id         TEXT    PRIMARY KEY,
      nonce      TEXT    NOT NULL,
      ciphertext TEXT    NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS finance_categories (
      id         TEXT    PRIMARY KEY,
      name       TEXT    NOT NULL,
      icon       TEXT    NOT NULL,
      color      TEXT    NOT NULL,
      type       TEXT    NOT NULL,
      is_custom  INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS finance_payment_methods (
      id         TEXT    PRIMARY KEY,
      name       TEXT    NOT NULL,
      icon       TEXT    NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS finance_transactions (
      id                  TEXT    PRIMARY KEY,
      type                TEXT    NOT NULL,
      amount_cents        INTEGER NOT NULL,
      currency            TEXT    NOT NULL DEFAULT 'USD',
      category_id         TEXT    NOT NULL,
      payment_method_id   TEXT,
      label               TEXT    NOT NULL,
      notes               TEXT,
      date                INTEGER NOT NULL,
      is_recurring        INTEGER NOT NULL DEFAULT 0,
      recurring_id        TEXT,
      investment_platform TEXT,
      investment_url      TEXT,
      created_at          INTEGER NOT NULL,
      updated_at          INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS finance_budgets (
      id           TEXT    PRIMARY KEY,
      category_id  TEXT    NOT NULL UNIQUE,
      amount_cents INTEGER NOT NULL,
      period       TEXT    NOT NULL DEFAULT 'monthly',
      created_at   INTEGER NOT NULL,
      updated_at   INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS finance_recurring (
      id                TEXT    PRIMARY KEY,
      type              TEXT    NOT NULL,
      amount_cents      INTEGER NOT NULL,
      currency          TEXT    NOT NULL DEFAULT 'USD',
      category_id       TEXT    NOT NULL,
      payment_method_id TEXT,
      label             TEXT    NOT NULL,
      notes             TEXT,
      frequency         TEXT    NOT NULL,
      start_date        INTEGER NOT NULL,
      next_due_date     INTEGER NOT NULL,
      is_active         INTEGER NOT NULL DEFAULT 1,
      created_at        INTEGER NOT NULL,
      updated_at        INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS savings_goals (
      id           TEXT    PRIMARY KEY,
      name         TEXT    NOT NULL,
      icon         TEXT    NOT NULL,
      color        TEXT    NOT NULL,
      target_cents INTEGER NOT NULL,
      deadline     INTEGER,
      is_completed INTEGER NOT NULL DEFAULT 0,
      created_at   INTEGER NOT NULL,
      updated_at   INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS savings_contributions (
      id           TEXT    PRIMARY KEY,
      goal_id      TEXT    NOT NULL,
      amount_cents INTEGER NOT NULL,
      notes        TEXT,
      date         INTEGER NOT NULL,
      created_at   INTEGER NOT NULL
    );
  `);
  return _db;
}
