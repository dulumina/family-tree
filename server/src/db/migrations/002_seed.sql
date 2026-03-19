-- ============================================================
-- MIGRATION 002 — Seed Data
-- ============================================================

-- Admin user (password: admin123)
INSERT OR IGNORE INTO users (name, email, password, role) VALUES
('Administrator','admin@keluarga.id',
 '$2b$10$QIMB83wrlVCQkERD8OvzYusuCaN5ZiDPkiA.wCzB7/D6AQYTw/G7a',
 'admin');

-- Generasi 1
INSERT OR IGNORE INTO members (id,name,gender,born_year,died_year,photo,generation,notes) VALUES
(1,'Kakek Sutarno','male','1940','2010','👴',0,'Pendiri keluarga besar'),
(2,'Nenek Suminah','female','1945',NULL,'👵',0,'Ibu rumah tangga');

-- Pasangan G1
UPDATE members SET spouse_id=2 WHERE id=1;
UPDATE members SET spouse_id=1 WHERE id=2;

-- Generasi 2
INSERT OR IGNORE INTO members (id,name,gender,born_year,died_year,photo,generation,spouse_id,notes) VALUES
(3,'Budi Santoso','male','1965',NULL,'👨',1,4,'Anak pertama'),
(4,'Sari Dewi','female','1968',NULL,'👩',1,3,'Istri Budi'),
(5,'Rina Wati','female','1970',NULL,'👩',1,6,'Anak kedua'),
(6,'Hendra K','male','1967',NULL,'👨',1,5,'Suami Rina');

-- Generasi 3
INSERT OR IGNORE INTO members (id,name,gender,born_year,died_year,photo,generation,notes) VALUES
(7,'Andi Santoso','male','1990',NULL,'🧑',2,'Cucu pertama'),
(8,'Dina Santoso','female','1993',NULL,'👧',2,'Cucu kedua'),
(9,'Bagas K','male','1995',NULL,'🧑',2,'Cucu ketiga'),
(10,'Citra K','female','1998',NULL,'👧',2,'Cucu keempat');

-- Parent relations G2 ← G1
INSERT OR IGNORE INTO member_parents VALUES (3,1),(3,2),(5,1),(5,2);

-- Parent relations G3 ← G2
INSERT OR IGNORE INTO member_parents VALUES
(7,3),(7,4),(8,3),(8,4),
(9,5),(9,6),(10,5),(10,6);
