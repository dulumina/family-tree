const router = require('express').Router();
const db = require('../db/database');
const auth = require('../middleware/auth');

const bcrypt = require('bcryptjs');

// GET /api/users  (admin only)
router.get('/', auth('admin'), (req, res) => {
  const rows = db.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.member_id, m.name as member_name, u.created_at 
    FROM users u 
    LEFT JOIN members m ON u.member_id = m.id 
    ORDER BY u.id
  `).all();
  res.json(rows);
});

// POST /api/users (admin only)
router.post('/', auth('admin'), (req, res) => {
  const { name, email, password, role, member_id } = req.body;
  if (!name || !email || !password || !role) 
    return res.status(400).json({ error: 'Data tidak lengkap' });

  const hash = bcrypt.hashSync(password, 10);
  try {
    db.prepare(`
      INSERT INTO users (name, email, password, role, member_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, email, hash, role, member_id || null);
    res.status(201).json({ success: true });
  } catch(e) {
    res.status(400).json({ error: 'Email sudah terdaftar' });
  }
});

// PATCH /api/users/:id/role  (also handles member_id update)
router.patch('/:id/role', auth('admin'), (req, res) => {
  const { role, member_id } = req.body;
  if (role && !['viewer','editor','admin'].includes(role))
    return res.status(400).json({ error: 'Role tidak valid' });

  let sql = 'UPDATE users SET updated_at=datetime(\'now\')';
  let params = [];
  if (role) { sql += ', role=?'; params.push(role); }
  if (member_id !== undefined) { sql += ', member_id=?'; params.push(member_id); }
  sql += ' WHERE id=?';
  params.push(req.params.id);

  db.prepare(sql).run(...params);
  res.json({ success: true });
});

// DELETE /api/users/:id
router.delete('/:id', auth('admin'), (req, res) => {
  if (Number(req.params.id) === req.user.id)
    return res.status(400).json({ error: 'Tidak bisa hapus akun sendiri' });
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
