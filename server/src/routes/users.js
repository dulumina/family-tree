const router = require('express').Router();
const db = require('../db/database');
const auth = require('../middleware/auth');

// GET /api/users  (admin only)
router.get('/', auth('admin'), (req, res) => {
  const rows = db.prepare('SELECT id,name,email,role,created_at FROM users ORDER BY id').all();
  res.json(rows);
});

// PATCH /api/users/:id/role
router.patch('/:id/role', auth('admin'), (req, res) => {
  const { role } = req.body;
  if (!['viewer','editor','admin'].includes(role))
    return res.status(400).json({ error: 'Role tidak valid' });
  db.prepare("UPDATE users SET role=?,updated_at=datetime('now') WHERE id=?").run(role, req.params.id);
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
