-- Migration 004 — Add more member details and feedback table
ALTER TABLE members ADD COLUMN birth_place TEXT;
ALTER TABLE members ADD COLUMN birth_date TEXT;
ALTER TABLE members ADD COLUMN is_alive INTEGER DEFAULT 1;
ALTER TABLE members ADD COLUMN death_date TEXT;
ALTER TABLE members ADD COLUMN burial_place TEXT;

CREATE TABLE IF NOT EXISTS feedback (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id     INTEGER REFERENCES members(id) ON DELETE SET NULL,
  user_name     TEXT,
  email         TEXT,
  content       TEXT    NOT NULL,
  status        TEXT    NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processed','rejected')),
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
