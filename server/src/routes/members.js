const router = require('express').Router();
const db = require('../db/database');
const auth = require('../middleware/auth');

// helper: fetch full member with parents
function getMemberFull(id) {
  const m = db.prepare('SELECT * FROM members WHERE id = ?').get(id);
  if (!m) return null;
  m.parentIds = db.prepare('SELECT parent_id FROM member_parents WHERE member_id = ?')
    .all(id).map(r => r.parent_id);
  return m;
}

// GET /api/members
router.get('/', auth(), (req, res) => {
  const rows = db.prepare('SELECT * FROM members ORDER BY generation, id').all();
  const parents = db.prepare('SELECT * FROM member_parents').all();
  const result = rows.map(m => ({
    ...m,
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
  const { name,gender,born_year,died_year,photo,generation,notes,spouse_id,parentIds=[] } = req.body;
  if (!name || !gender) return res.status(400).json({ error: 'Nama dan gender wajib diisi' });

  const r = db.prepare(
    `INSERT INTO members (name,gender,born_year,died_year,photo,generation,notes,spouse_id,created_by)
     VALUES (?,?,?,?,?,?,?,?,?)`
  ).run(name,gender,born_year||null,died_year||null,photo||'🧑',generation||0,notes||null,spouse_id||null,req.user.id);

  const newId = r.lastInsertRowid;

  if (spouse_id) {
    db.prepare('UPDATE members SET spouse_id = ? WHERE id = ?').run(newId, spouse_id);
  }
  const insertParent = db.prepare('INSERT OR IGNORE INTO member_parents VALUES (?,?)');
  parentIds.forEach(pid => insertParent.run(newId, pid));

  res.status(201).json(getMemberFull(newId));
});

// PUT /api/members/:id
router.put('/:id', auth('editor'), (req, res) => {
  const { name,gender,born_year,died_year,photo,generation,notes,spouse_id,parentIds=[] } = req.body;
  const id = req.params.id;

  const existing = db.prepare('SELECT * FROM members WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Tidak ditemukan' });

  // Remove old spouse link
  if (existing.spouse_id && existing.spouse_id !== spouse_id)
    db.prepare('UPDATE members SET spouse_id = NULL WHERE id = ?').run(existing.spouse_id);

  db.prepare(
    `UPDATE members SET name=?,gender=?,born_year=?,died_year=?,photo=?,generation=?,
     notes=?,spouse_id=?,updated_at=datetime('now') WHERE id=?`
  ).run(name,gender,born_year||null,died_year||null,photo||'🧑',generation||0,notes||null,spouse_id||null,id);

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
