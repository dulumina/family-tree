-- ============================================================
-- MIGRATION 002 — Seed Data (7 Generasi)
-- ============================================================

-- ============================================================
-- ADMIN
-- ============================================================
INSERT OR IGNORE INTO users (name, email, password, role) VALUES
('Administrator','admin@keluarga.id',
 '$2b$10$QIMB83wrlVCQkERD8OvzYusuCaN5ZiDPkiA.wCzB7/D6AQYTw/G7a',
 'admin');

-- ============================================================
-- GENERASI 1 (0)
-- ============================================================
INSERT OR IGNORE INTO members (id,name,gender,born_year,died_year,photo,generation,notes) VALUES
(1,'Kakek Sutarno','male','1940','2010','👴',0,'Pendiri keluarga besar'),
(2,'Nenek Suminah','female','1945',NULL,'👵',0,'Ibu rumah tangga');

UPDATE members SET spouse_id=2 WHERE id=1;
UPDATE members SET spouse_id=1 WHERE id=2;

-- ============================================================
-- GENERASI 2 (1)
-- ============================================================
INSERT OR IGNORE INTO members (id,name,gender,born_year,photo,generation,spouse_id,notes) VALUES
(3,'Budi Santoso','male','1965','👨',1,4,'Anak pertama'),
(4,'Sari Dewi','female','1968','👩',1,3,'Istri Budi'),
(5,'Rina Wati','female','1970','👩',1,6,'Anak kedua'),
(6,'Hendra K','male','1967','👨',1,5,'Suami Rina');

INSERT OR IGNORE INTO member_parents VALUES
(3,1),(3,2),
(5,1),(5,2);

-- ============================================================
-- GENERASI 3 (2)
-- ============================================================
INSERT OR IGNORE INTO members (id,name,gender,born_year,photo,generation,notes) VALUES
(7,'Andi Santoso','male','1990','🧑',2,'Cucu pertama'),
(8,'Dina Santoso','female','1993','👧',2,'Cucu kedua'),
(9,'Bagas K','male','1995','🧑',2,'Cucu ketiga'),
(10,'Citra K','female','1998','👧',2,'Cucu keempat');

INSERT OR IGNORE INTO member_parents VALUES
(7,3),(7,4),
(8,3),(8,4),
(9,5),(9,6),
(10,5),(10,6);

-- ============================================================
-- GENERASI 4 (3)
-- ============================================================
INSERT OR IGNORE INTO members (id,name,gender,born_year,photo,generation,notes) VALUES
(11,'Rafi Santoso','male','2015','👶',3,'Anak Andi'),
(12,'Lia Santoso','female','2018','👶',3,'Anak Andi'),
(13,'Dito K','male','2020','👶',3,'Anak Bagas');

INSERT OR IGNORE INTO member_parents VALUES
(11,7),
(12,7),
(13,9);

-- ============================================================
-- GENERASI 5 (4)
-- ============================================================
INSERT OR IGNORE INTO members (id,name,gender,born_year,photo,generation,notes) VALUES
(14,'Alya Santoso','female','2038','👶',4,'Anak Rafi'),
(15,'Fikri Santoso','male','2040','👶',4,'Anak Rafi');

INSERT OR IGNORE INTO member_parents VALUES
(14,11),
(15,11);

-- ============================================================
-- GENERASI 6 (5)
-- ============================================================
INSERT OR IGNORE INTO members (id,name,gender,born_year,photo,generation,notes) VALUES
(16,'Nara Santoso','female','2065','👶',5,'Anak Alya');

INSERT OR IGNORE INTO member_parents VALUES
(16,14);

-- ============================================================
-- GENERASI 7 (6)
-- ============================================================
INSERT OR IGNORE INTO members (id,name,gender,born_year,photo,generation,notes) VALUES
(17,'Zayn Santoso','male','2090','👶',6,'Keturunan generasi ke-7');

INSERT OR IGNORE INTO member_parents VALUES
(17,16);