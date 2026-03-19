-- ============================================================
-- MIGRATION 001 — Initial Schema
-- ============================================================

PRAGMA foreign_keys = ON;

-- Users (akun login)
CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  email       TEXT    NOT NULL UNIQUE,
  password    TEXT    NOT NULL,
  role        TEXT    NOT NULL DEFAULT 'viewer'
              CHECK(role IN ('admin','editor','viewer')),
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Family members (anggota silsilah)
CREATE TABLE IF NOT EXISTS members (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  gender        TEXT    NOT NULL CHECK(gender IN ('male','female')),
  born_year     TEXT,
  died_year     TEXT,
  photo         TEXT    DEFAULT '🧑',
  generation    INTEGER NOT NULL DEFAULT 0,
  notes         TEXT,
  spouse_id     INTEGER REFERENCES members(id) ON DELETE SET NULL,
  created_by    INTEGER REFERENCES users(id),
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Parent–child relationships
CREATE TABLE IF NOT EXISTS member_parents (
  member_id   INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  parent_id   INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  PRIMARY KEY (member_id, parent_id)
);

-- Migration tracking
CREATE TABLE IF NOT EXISTS migrations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  filename   TEXT    NOT NULL UNIQUE,
  applied_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
