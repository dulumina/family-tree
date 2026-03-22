-- ============================================================
-- SEED FAMILY DATA (50 Members, 7 Generations)
-- ============================================================

-- ============================================================
-- GENERASI 1 (0) : 2 orang
-- ============================================================
INSERT OR IGNORE INTO members (id,name,gender,born_year,photo,generation,notes) VALUES
(1,'R. Haryanto','male','1920','👴',0,'Leluhur Mbah Haryanto'),
(2,'Ny. Sulastri','female','1925','👵',0,'Istri Haryanto');

UPDATE members SET spouse_id=2 WHERE id=1;
UPDATE members SET spouse_id=1 WHERE id=2;

-- ============================================================
-- GENERASI 2 (1) : 6 orang
-- ============================================================
INSERT OR IGNORE INTO members (id,name,gender,born_year,photo,generation,notes,spouse_id) VALUES
(3,'Budi Haryanto','male','1945','👨',1, 'Anak Pertama', 4),
(4,'Siti Aminah','female','1948','👩',1, 'Menantu', 3),
(5,'Wina Haryanto','female','1947','👩',1, 'Anak Kedua', 6),
(6,'Ahmad Fauzi','male','1945','👨',1, 'Menantu', 5),
(7,'Dedi Haryanto','male','1950','👨',1, 'Anak Ketiga', 8),
(8,'Lina Marlina','female','1952','👩',1, 'Menantu', 7);

INSERT OR IGNORE INTO member_parents VALUES
(3,1), (3,2),
(5,1), (5,2),
(7,1), (7,2);

-- ============================================================
-- GENERASI 3 (2) : 13 orang
-- ============================================================
INSERT OR IGNORE INTO members (id,name,gender,born_year,photo,generation,notes,spouse_id) VALUES
(9,'Andi Budianto','male','1970','🧑',2,'Cucu',10),
(10,'Rina','female','1972','👧',2,'Menantu Cucu',9),
(11,'Dina Budianto','female','1973','👧',2,'Cucu',12),
(12,'Herman','male','1970','🧑',2,'Menantu Cucu',11),
(13,'Eka Fauzi','male','1968','🧑',2,'Cucu',null),
(14,'Fikri Fauzi','male','1971','🧑',2,'Cucu',15),
(15,'Gita','female','1975','👧',2,'Menantu Cucu',14),
(16,'Hana Fauzi','female','1975','👧',2,'Cucu',17),
(17,'Irwan','male','1973','🧑',2,'Menantu Cucu',16),
(18,'Ira Dedi','female','1975','👧',2,'Cucu',19),
(19,'Jaka','male','1972','🧑',2,'Menantu Cucu',18),
(20,'Kevin Dedi','male','1978','🧑',2,'Cucu',21),
(21,'Lita','female','1980','👧',2,'Menantu Cucu',20);

INSERT OR IGNORE INTO member_parents VALUES
(9,3), (9,4),
(11,3), (11,4),
(13,5), (13,6),
(14,5), (14,6),
(16,5), (16,6),
(18,7), (18,8),
(20,7), (20,8);

-- ============================================================
-- GENERASI 4 (3) : 13 orang
-- ============================================================
INSERT OR IGNORE INTO members (id,name,gender,born_year,photo,generation,notes,spouse_id) VALUES
(22,'Gilang Andi','male','1995','👨',3,'Cicit',23),
(23,'Mita','female','1997','👩',3,'Menantu Cicit',22),
(24,'Nisa Andi','female','1998','👩',3,'Cicit',25),
(25,'Oki','male','1995','👨',3,'Menantu Cicit',24),
(26,'Prama Herman','male','1996','👨',3,'Cicit',null),
(27,'Qori Fikri','female','1999','👩',3,'Cicit',null),
(28,'Rama Fikri','male','2002','👨',3,'Cicit',null),
(29,'Surya Irwan','male','2000','👨',3,'Cicit',30),
(30,'Tari','female','2002','👩',3,'Menantu Cicit',29),
(31,'Umi Irwan','female','2003','👩',3,'Cicit',null),
(32,'Vina Jaka','female','2001','👩',3,'Cicit',null),
(33,'Wawan Kevin','male','2005','👨',3,'Cicit',34),
(34,'Xena','female','2006','👩',3,'Menantu Cicit',33);

INSERT OR IGNORE INTO member_parents VALUES
(22,9), (22,10),
(24,9), (24,10),
(26,11), (26,12),
(27,14), (27,15),
(28,14), (28,15),
(29,16), (29,17),
(31,16), (31,17),
(32,18), (32,19),
(33,20), (33,21);

-- ============================================================
-- GENERASI 5 (4) : 9 orang
-- ============================================================
INSERT OR IGNORE INTO members (id,name,gender,born_year,photo,generation,notes,spouse_id) VALUES
(35,'Yoga Gilang','male','2020','🧑',4,'Piut',36),
(36,'Zoya','female','2022','👧',4,'Menantu',35),
(37,'Ari Gilang','female','2023','👧',4,'Piut',null),
(38,'Bayu Oki','male','2022','🧑',4,'Piut',null),
(39,'Cika Surya','female','2025','👧',4,'Piut',40),
(40,'Dani','male','2023','🧑',4,'Menantu',39),
(41,'Elang Surya','male','2028','🧑',4,'Piut',null),
(42,'Fara Wawan','female','2030','👧',4,'Piut',null),
(43,'Galih Wawan','male','2032','🧑',4,'Piut',null);

INSERT OR IGNORE INTO member_parents VALUES
(35,22), (35,23),
(37,22), (37,23),
(38,24), (38,25),
(39,29), (39,30),
(41,29), (41,30),
(42,33), (42,34),
(43,33), (43,34);

-- ============================================================
-- GENERASI 6 (5) : 5 orang
-- ============================================================
INSERT OR IGNORE INTO members (id,name,gender,born_year,photo,generation,notes,spouse_id) VALUES
(44,'Hadi Yoga','male','2045','🧒',5,'Anggota G6',45),
(45,'Inez','female','2046','👧',5,'Menantu',44),
(46,'Jihan Yoga','female','2048','👧',5,'Anggota G6',null),
(47,'Kiki Dani','male','2050','🧒',5,'Anggota G6',null),
(48,'Luki Dani','male','2052','🧒',5,'Anggota G6',null);

INSERT OR IGNORE INTO member_parents VALUES
(44,35), (44,36),
(46,35), (46,36),
(47,39), (47,40),
(48,39), (48,40);

-- ============================================================
-- GENERASI 7 (6) : 2 orang
-- ============================================================
INSERT OR IGNORE INTO members (id,name,gender,born_year,photo,generation,notes,spouse_id) VALUES
(49,'Mario Hadi','male','2070','👶',6,'Anggota G7',null),
(50,'Nova Hadi','female','2073','👶',6,'Anggota G7',null);

INSERT OR IGNORE INTO member_parents VALUES
(49,44), (49,45),
(50,44), (50,45);
