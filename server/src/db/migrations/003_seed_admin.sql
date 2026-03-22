-- ============================================================
-- MIGRATION 003 — Seed Admin User
-- ============================================================

INSERT OR IGNORE INTO users (name, email, password, role) VALUES
('Administrator','admin@keluarga.id',
 '$2b$10$QIMB83wrlVCQkERD8OvzYusuCaN5ZiDPkiA.wCzB7/D6AQYTw/G7a',
 'admin');
