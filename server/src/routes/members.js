const router = require('express').Router();
const db = require('../db/database');
const auth = require('../middleware/auth');

function generateAvatar(m) {
  const gender = m.gender; // 'male' or 'female'
  const isDead = m.is_alive === 0 || !!m.died_year || !!m.death_date;
  
  const born = m.birth_date ? new Date(m.birth_date).getFullYear() : parseInt(m.born_year, 10);
  const died = m.death_date ? new Date(m.death_date).getFullYear() : parseInt(m.died_year, 10);
  const currentYear = new Date().getFullYear();
  
  let age = null;
  if (!isNaN(born)) {
    age = isDead && !isNaN(died) ? died - born : currentYear - born;
  }

  if (age !== null) {
    if (age <= 5) return '👶';
    if (age <= 12) return gender === 'male' ? '👦' : '👧';
    if (age <= 17) return '🧑'; // Remaja
    if (age >= 60) return gender === 'male' ? '👴' : '👵';
    return gender === 'male' ? '👨' : '👩';
  }

  return gender === 'male' ? '👨' : '👩';
}

// helper: fetch full member with parents
function getMemberFull(id) {
  const m = db.prepare('SELECT * FROM members WHERE id = ?').get(id);
  if (!m) return null;
  m.photo = generateAvatar(m);
  m.parentIds = db.prepare('SELECT parent_id FROM member_parents WHERE member_id = ?')
    .all(id).map(r => r.parent_id);
  return m;
}

// GET /api/members
router.get('/', auth(), (req, res) => {
  const { q } = req.query;
  let query = 'SELECT * FROM members';
  let params = [];
  
  if (q) {
    query += ' WHERE name LIKE ?';
    params.push(`%${q}%`);
  }
  
  query += ' ORDER BY generation, id';
  
  const rows = db.prepare(query).all(...params);
  const parents = db.prepare('SELECT * FROM member_parents').all();
  const result = rows.map(m => ({
    ...m,
    photo: generateAvatar(m),
    parentIds: parents.filter(p => p.member_id === m.id).map(p => p.parent_id)
  }));
  res.json(result);
});

// GET /api/members/:id
router.get('/:id', auth(), (req, res) => {
  const m = getMemberFull(req.params.id);
  if (!m) return res.status(404).json({ error: 'Anggota tidak ditemukan' });
  res.json(m);
});

// POST /api/members
router.post('/', auth('editor'), (req, res) => {
  const { 
    name, gender, born_year, died_year, photo, generation, notes, spouse_id, parentIds = [],
    birth_place, birth_date, is_alive, death_date, burial_place
  } = req.body;
  if (!name || !gender) return res.status(400).json({ error: 'Nama dan gender wajib diisi' });

  // Auto-calculate year from date if missing
  const bYear = born_year || (birth_date ? new Date(birth_date).getFullYear().toString() : null);
  const dYear = died_year || (death_date ? new Date(death_date).getFullYear().toString() : null);

  try {
    const r = db.prepare(
      `INSERT INTO members (
        name, gender, born_year, died_year, photo, generation, notes, spouse_id, created_by,
        birth_place, birth_date, is_alive, death_date, burial_place
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(
      name, gender, bYear, dYear, photo || '🧑', generation || 0, notes || null, spouse_id || null, req.user.id,
      birth_place || null, birth_date || null, is_alive === undefined ? 1 : is_alive, death_date || null, burial_place || null
    );

    const newId = r.lastInsertRowid;

    if (spouse_id) {
      db.prepare('UPDATE members SET spouse_id = ? WHERE id = ?').run(newId, spouse_id);
    }
    const insertParent = db.prepare('INSERT OR IGNORE INTO member_parents VALUES (?,?)');
    parentIds.forEach(pid => insertParent.run(newId, pid));

    res.status(201).json(getMemberFull(newId));
  } catch (error) {
    console.error('Database Error:', error);
    if (error.message.includes('FOREIGN KEY')) {
      return res.status(400).json({ 
        error: 'Gagal menambah data: ID pasangan atau ID user tidak valid. Silakan Logout dan Login kembali.' 
      });
    }
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});


// PUT /api/members/:id
router.put('/:id', auth('editor'), (req, res) => {
  const { 
    name, gender, born_year, died_year, photo, generation, notes, spouse_id, parentIds = [],
    birth_place, birth_date, is_alive, death_date, burial_place
  } = req.body;
  const id = req.params.id;

  const existing = db.prepare('SELECT * FROM members WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Tidak ditemukan' });

  // Auto-calculate year from date if missing
  const bYear = born_year || (birth_date ? new Date(birth_date).getFullYear().toString() : null);
  const dYear = died_year || (death_date ? new Date(death_date).getFullYear().toString() : null);

  // Remove old spouse link
  if (existing.spouse_id && existing.spouse_id !== spouse_id)
    db.prepare('UPDATE members SET spouse_id = NULL WHERE id = ?').run(existing.spouse_id);

  db.prepare(
    `UPDATE members SET 
      name=?, gender=?, born_year=?, died_year=?, photo=?, generation=?,
      notes=?, spouse_id=?, birth_place=?, birth_date=?, is_alive=?, 
      death_date=?, burial_place=?, updated_at=datetime('now') 
     WHERE id=?`
  ).run(
    name, gender, bYear, dYear, photo || '🧑', generation || 0, 
    notes || null, spouse_id || null, birth_place || null, birth_date || null, 
    is_alive === undefined ? 1 : is_alive, death_date || null, burial_place || null, id
  );

  if (spouse_id)
    db.prepare('UPDATE members SET spouse_id = ? WHERE id = ?').run(id, spouse_id);

  db.prepare('DELETE FROM member_parents WHERE member_id = ?').run(id);
  const ins = db.prepare('INSERT OR IGNORE INTO member_parents VALUES (?,?)');
  parentIds.forEach(pid => ins.run(id, pid));

  res.json(getMemberFull(id));
});

// DELETE /api/members/:id
router.delete('/:id', auth('admin'), (req, res) => {
  const m = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
  if (!m) return res.status(404).json({ error: 'Tidak ditemukan' });
  if (m.spouse_id)
    db.prepare('UPDATE members SET spouse_id = NULL WHERE id = ?').run(m.spouse_id);
  db.prepare('DELETE FROM members WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
