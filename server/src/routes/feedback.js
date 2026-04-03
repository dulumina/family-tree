const router = require('express').Router();
const db = require('../db/database');
const auth = require('../middleware/auth');

// POST /api/feedback
router.post('/', (req, res) => {
  const { member_id, user_name, email, content } = req.body;
  if (!content) return res.status(400).json({ error: 'Isi feedback wajib diisi' });

  try {
    const r = db.prepare(
      `INSERT INTO feedback (member_id, user_name, email, content) VALUES (?,?,?,?)`
    ).run(member_id || null, user_name || null, email || null, content);
    res.status(201).json({ id: r.lastInsertRowid, success: true });
  } catch (error) {
    console.error('Feedback Error:', error);
    res.status(500).json({ error: 'Gagal mengirim feedback' });
  }
});

// GET /api/feedback (Admin only)
router.get('/', auth('admin'), (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM feedback ORDER BY created_at DESC').all();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil feedback' });
  }
});

// PUT /api/feedback/:id (Admin only - to update status)
router.put('/:id', auth('admin'), (req, res) => {
  const { status } = req.body;
  if (!['pending','processed','rejected'].includes(status))
    return res.status(400).json({ error: 'Status tidak valid' });

  try {
    db.prepare('UPDATE feedback SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Gagal update status' });
  }
});

module.exports = router;
