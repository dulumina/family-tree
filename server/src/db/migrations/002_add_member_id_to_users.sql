-- MIGRATION 003 — Add member_id to users
ALTER TABLE users ADD COLUMN member_id INTEGER REFERENCES members(id) ON DELETE SET NULL;
