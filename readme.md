# 🌳 Pohon Silsilah Keluarga — Full Stack App
## Stack: Node.js · Express · SQLite (better-sqlite3) · React · Vite

---

## 📁 Struktur Proyek

```
family-tree/
├── server/
│   ├── src/
│   │   ├── db/
│   │   │   ├── database.js        # Koneksi SQLite
│   │   │   └── migrations/
│   │   │       ├── 001_init.sql
│   │   │       └── 002_seed.sql
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── members.js
│   │   │   └── users.js
│   │   └── index.js
│   ├── package.json
│   └── .env
├── client/
│   ├── src/
│   │   ├── api/
│   │   │   └── index.js
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Register.jsx
│   │   │   ├── Tree/
│   │   │   │   ├── TreeView.jsx
│   │   │   │   └── NodeCard.jsx
│   │   │   ├── Members/
│   │   │   │   ├── MemberList.jsx
│   │   │   │   └── MemberForm.jsx
│   │   │   ├── Admin/
│   │   │   │   └── UserManage.jsx
│   │   │   └── UI/
│   │   │       ├── Modal.jsx
│   │   │       ├── Toast.jsx
│   │   │       └── Navbar.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── AppPage.jsx
│   │   │   └── AuthPage.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## ⚙️ SETUP & INSTALL

```bash
# 1. Clone / buat folder
mkdir family-tree && cd family-tree

# 2. Setup server
mkdir -p server/src/db/migrations server/src/middleware server/src/routes
cd server && npm init -y
npm install express better-sqlite3 bcryptjs jsonwebtoken cors dotenv
npm install -D nodemon

# 3. Setup client
cd ../client && npm create vite@latest . -- --template react
npm install axios react-router-dom

# 4. Jalankan migrasi & server
cd ../server && node src/db/migrate.js

# 5. Jalankan dev
# Terminal 1 - Server:
cd server && npm run dev
# Terminal 2 - Client:
cd client && npm run dev
```

---

## 🗄️ SERVER

### `server/.env`
```env
PORT=3001
JWT_SECRET=pohon_silsilah_secret_key_2024
DB_PATH=./data/family.db
```

### `server/package.json`
```json
{
  "name": "family-tree-server",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "migrate": "node src/db/migrate.js"
  },
  "dependencies": {
    "better-sqlite3": "^9.4.3",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.18.3",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

---

### `server/src/db/migrations/001_init.sql`
```sql
-- ============================================================
-- MIGRATION 001 — Initial Schema
-- ============================================================

PRAGMA foreign_keys = ON;

-- Users (akun login)
CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  email       TEXT    NOT NULL UNIQUE,
  password    TEXT    NOT NULL,
  role        TEXT    NOT NULL DEFAULT 'viewer'
              CHECK(role IN ('admin','editor','viewer')),
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Family members (anggota silsilah)
CREATE TABLE IF NOT EXISTS members (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  gender        TEXT    NOT NULL CHECK(gender IN ('male','female')),
  born_year     TEXT,
  died_year     TEXT,
  photo         TEXT    DEFAULT '🧑',
  generation    INTEGER NOT NULL DEFAULT 0,
  notes         TEXT,
  spouse_id     INTEGER REFERENCES members(id) ON DELETE SET NULL,
  created_by    INTEGER REFERENCES users(id),
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Parent–child relationships
CREATE TABLE IF NOT EXISTS member_parents (
  member_id   INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  parent_id   INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  PRIMARY KEY (member_id, parent_id)
);

-- Migration tracking
CREATE TABLE IF NOT EXISTS migrations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  filename   TEXT    NOT NULL UNIQUE,
  applied_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

---

### `server/src/db/migrations/002_seed.sql`
```sql
-- ============================================================
-- MIGRATION 002 — Seed Data
-- ============================================================

-- Admin user (password: admin123)
INSERT OR IGNORE INTO users (name, email, password, role) VALUES
('Administrator','admin@keluarga.id',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhu2',
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
```

---

### `server/src/db/database.js`
```js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbPath = process.env.DB_PATH || './data/family.db';
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
```

---

### `server/src/db/migrate.js`
```js
const fs = require('fs');
const path = require('path');
const db = require('./database');

const migrationsDir = path.join(__dirname, 'migrations');

// Ensure migrations table exists
db.exec(`
  CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL UNIQUE,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const applied = db.prepare('SELECT filename FROM migrations').all().map(r => r.filename);
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

let ran = 0;
for (const file of files) {
  if (applied.includes(file)) {
    console.log(`⏭  Skip: ${file}`);
    continue;
  }
  const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
  try {
    db.exec(sql);
    db.prepare('INSERT INTO migrations (filename) VALUES (?)').run(file);
    console.log(`✅ Applied: ${file}`);
    ran++;
  } catch (e) {
    console.error(`❌ Failed: ${file}\n`, e.message);
    process.exit(1);
  }
}

if (ran === 0) console.log('✔  All migrations up to date.');
else console.log(`\n🎉 ${ran} migration(s) applied successfully.`);
process.exit(0);
```

---

### `server/src/middleware/auth.js`
```js
const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(requiredRole) {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token tidak ditemukan' });
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = payload;
      if (requiredRole) {
        const levels = { viewer: 0, editor: 1, admin: 2 };
        if (levels[payload.role] < levels[requiredRole])
          return res.status(403).json({ error: 'Akses ditolak' });
      }
      next();
    } catch {
      res.status(401).json({ error: 'Token tidak valid' });
    }
  };
};
```

---

### `server/src/routes/auth.js`
```js
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');

const sign = user => jwt.sign(
  { id: user.id, name: user.name, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Semua field wajib diisi' });

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ error: 'Email sudah terdaftar' });

  const hash = await bcrypt.hash(password, 10);
  const result = db.prepare(
    'INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)'
  ).run(name, email, hash, 'viewer');

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ token: sign(user), user: { id:user.id, name:user.name, email:user.email, role:user.role } });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Email atau password salah' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Email atau password salah' });

  res.json({ token: sign(user), user: { id:user.id, name:user.name, email:user.email, role:user.role } });
});
```

---

### `server/src/routes/members.js`
```js
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
```

---

### `server/src/routes/users.js`
```js
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
```

---

### `server/src/index.js`
```js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth',    require('./routes/auth'));
app.use('/api/members', require('./routes/members'));
app.use('/api/users',   require('./routes/users'));

app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running → http://localhost:${PORT}`));
```

---

## 🎨 CLIENT

### `client/vite.config.js`
```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': { target: 'http://localhost:3001', changeOrigin: true } }
  }
});
```

### `client/package.json` (dependencies)
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.0",
    "axios": "^1.7.2"
  }
}
```

---

### `client/src/api/index.js`
```js
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login:    d => api.post('/auth/login', d),
  register: d => api.post('/auth/register', d),
};
export const membersApi = {
  getAll:  () => api.get('/members'),
  create:  d  => api.post('/members', d),
  update:  (id,d) => api.put(`/members/${id}`, d),
  remove:  id => api.delete(`/members/${id}`),
};
export const usersApi = {
  getAll:    () => api.get('/users'),
  setRole:   (id,role) => api.patch(`/users/${id}/role`, { role }),
  remove:    id => api.delete(`/users/${id}`),
};

export default api;
```

---

### `client/src/context/AuthContext.jsx`
```jsx
import { createContext, useContext, useState, useCallback } from 'react';
import { authApi } from '../api';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login({ email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { data } = await authApi.register({ name, email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const isAdmin  = user?.role === 'admin';
  const isEditor = user?.role === 'editor' || isAdmin;

  return <Ctx.Provider value={{ user, login, register, logout, isAdmin, isEditor }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
```

---

### `client/src/components/UI/Toast.jsx`
```jsx
import { useState, useCallback, useEffect } from 'react';

let _push = null;
export function useToast() {
  return { toast: msg => _push?.(msg) };
}

export function ToastContainer() {
  const [items, setItems] = useState([]);
  _push = useCallback(msg => {
    const id = Date.now();
    setItems(s => [...s, { id, msg }]);
    setTimeout(() => setItems(s => s.filter(x => x.id !== id)), 3000);
  }, []);

  return (
    <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, display:'flex', flexDirection:'column', gap:8 }}>
      {items.map(({ id, msg }) => (
        <div key={id} style={{ background:'#1e293b', color:'#fff', padding:'12px 20px', borderRadius:12, fontSize:14, fontWeight:600, boxShadow:'0 8px 24px #0003', animation:'slideIn .3s ease' }}>
          {msg}
        </div>
      ))}
    </div>
  );
}
```

---

### `client/src/components/UI/Modal.jsx`
```jsx
export default function Modal({ title, onClose, children, width = 460 }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'#0007', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:20, padding:28, width, maxWidth:'92vw', maxHeight:'88vh', overflowY:'auto', boxShadow:'0 24px 60px #0004' }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ margin:0, fontSize:18, color:'#1e293b' }}>{title}</h2>
          <button onClick={onClose} style={{ border:'none', background:'#f1f5f9', borderRadius:8, width:32, height:32, cursor:'pointer', fontSize:20 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
```

---

### `client/src/components/UI/Navbar.jsx`
```jsx
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ tab, setTab }) {
  const { user, logout, isAdmin } = useAuth();
  const tabs = [['tree','🌲 Pohon'], ['list','📋 Daftar'], ...(isAdmin ? [['admin','⚙️ Admin']] : [])];
  return (
    <header style={{ background:'linear-gradient(135deg,#667eea,#764ba2)', boxShadow:'0 2px 16px #0003' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', height:58 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:26 }}>🌳</span>
          <span style={{ color:'#fff', fontWeight:700, fontSize:17 }}>Pohon Silsilah Keluarga</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {isAdmin && <span style={{ background:'#f59e0b', color:'#fff', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>ADMIN</span>}
          <span style={{ color:'#e2e8f0', fontSize:13 }}>👤 {user?.name}</span>
          <button onClick={logout} style={{ background:'#fff2', border:'1px solid #fff4', color:'#fff', borderRadius:8, padding:'5px 14px', cursor:'pointer', fontSize:13 }}>Keluar</button>
        </div>
      </div>
      <div style={{ display:'flex', padding:'0 16px' }}>
        {tabs.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding:'12px 20px', border:'none', background:'transparent', color: tab===k ? '#fff' : '#c4b5fd', fontWeight:700, fontSize:14, borderBottom: tab===k ? '3px solid #fff' : '3px solid transparent', cursor:'pointer' }}>
            {label}
          </button>
        ))}
      </div>
    </header>
  );
}
```

---

### `client/src/components/Tree/TreeView.jsx`
```jsx
import { useState, useRef, useCallback } from 'react';

const NODE_W = 126, NODE_H = 88, GAP_X = 48, GAP_Y = 108;

function buildLayout(members) {
  const gens = [...new Set(members.map(m => m.generation))].sort((a,b)=>a-b);
  const pos = {};
  gens.forEach((g, gi) => {
    const row = members.filter(m => m.generation === g);
    const totalW = row.length * NODE_W + (row.length - 1) * GAP_X;
    const sx = -totalW / 2;
    row.forEach((m, i) => { pos[m.id] = { x: sx + i * (NODE_W + GAP_X), y: gi * (NODE_H + GAP_Y) }; });
  });
  return pos;
}

export default function TreeView({ members, selected, onSelect }) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const dragging = useRef(false);
  const last = useRef(null);
  const svgH = Math.max(...members.map(m=>m.generation), 0) * (NODE_H + GAP_Y) + NODE_H + 80;

  const pos = buildLayout(members);
  const CX = 600, CY = 50;

  const edges = [];
  members.forEach(m => {
    (m.parentIds || []).forEach(pid => {
      if (pos[pid] && pos[m.id]) {
        const p = pos[pid], c = pos[m.id];
        edges.push({ type:'parent', x1:CX+p.x+NODE_W/2, y1:CY+p.y+NODE_H, x2:CX+c.x+NODE_W/2, y2:CY+c.y });
      }
    });
    if (m.spouse_id && pos[m.spouse_id] && pos[m.id] && m.id < m.spouse_id) {
      const a = pos[m.id], b = pos[m.spouse_id];
      edges.push({ type:'spouse', x1:CX+a.x+NODE_W, y1:CY+a.y+NODE_H/2, x2:CX+b.x, y2:CY+b.y+NODE_H/2 });
    }
  });

  const onMD = e => { dragging.current=true; last.current={x:e.clientX-pan.x, y:e.clientY-pan.y}; };
  const onMM = e => { if(dragging.current) setPan({x:e.clientX-last.current.x, y:e.clientY-last.current.y}); };
  const onMU = () => { dragging.current=false; };
  const onWheel = e => { e.preventDefault(); setZoom(z=>Math.min(2.5,Math.max(0.25,z-e.deltaY*.001))); };

  return (
    <div style={{ position:'relative', width:'100%', height:'100%', background:'linear-gradient(135deg,#f8faff,#eef2ff)', borderRadius:16, overflow:'hidden', cursor: dragging.current?'grabbing':'grab' }}
      onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU}>
      <div style={{ position:'absolute', top:12, right:12, zIndex:10, display:'flex', gap:6 }}>
        {[['+',0.15],['-',-0.15],['↺',0]].map(([lbl,d])=>(
          <button key={lbl} onClick={()=>d===0?(setPan({x:0,y:0}),setZoom(1)):setZoom(z=>Math.min(2.5,Math.max(0.25,z+d)))}
            style={{ width:32,height:32,borderRadius:8,border:'none',background:'#fff',boxShadow:'0 2px 8px #0002',cursor:'pointer',fontWeight:700,fontSize:16 }}>{lbl}</button>
        ))}
      </div>
      <svg width="100%" height="100%" onWheel={onWheel} style={{ userSelect:'none' }}>
        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
          {edges.map((e,i)=>
            e.type==='spouse'
              ? <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="#f472b6" strokeWidth={2.5} strokeDasharray="6,4" />
              : <path key={i} d={`M${e.x1},${e.y1} C${e.x1},${(e.y1+e.y2)/2} ${e.x2},${(e.y1+e.y2)/2} ${e.x2},${e.y2}`}
                  fill="none" stroke="#94a3b8" strokeWidth={2} />
          )}
          {members.map(m=>{
            const p=pos[m.id]; if(!p) return null;
            const px=CX+p.x, py=CY+p.y, sel=selected?.id===m.id;
            const bg = sel ? (m.gender==='male'?'#3b82f6':'#ec4899') : (m.gender==='male'?'#eff6ff':'#fdf2f8');
            const stroke = m.gender==='male'?'#3b82f6':'#ec4899';
            return (
              <g key={m.id} onClick={()=>onSelect(m)} style={{cursor:'pointer'}}>
                <rect x={px} y={py} width={NODE_W} height={NODE_H} rx={13}
                  fill={bg} stroke={stroke} strokeWidth={sel?3:1.5}
                  filter={sel?'drop-shadow(0 4px 14px rgba(99,102,241,.4))':'drop-shadow(0 2px 6px rgba(0,0,0,.08))'} />
                <text x={px+NODE_W/2} y={py+27} textAnchor="middle" fontSize={22}>{m.photo}</text>
                <text x={px+NODE_W/2} y={py+50} textAnchor="middle" fontSize={10} fontWeight="700" fill={sel?'#fff':'#1e293b'}>
                  {m.name.length>15?m.name.slice(0,14)+'…':m.name}
                </text>
                <text x={px+NODE_W/2} y={py+65} textAnchor="middle" fontSize={9} fill={sel?'#e2e8f0':'#64748b'}>
                  {m.born_year||'?'}{m.died_year?`–${m.died_year}`:''}
                </text>
                {m.died_year && <text x={px+NODE_W-9} y={py+14} fontSize={11} textAnchor="middle">✝</text>}
              </g>
            );
          })}
        </g>
      </svg>
      <div style={{ position:'absolute', bottom:12, left:12, background:'#ffffffcc', borderRadius:10, padding:'6px 12px', fontSize:11, color:'#64748b', backdropFilter:'blur(6px)' }}>
        🖱 Drag geser · Scroll zoom · Klik node detail
      </div>
    </div>
  );
}
```

---

### `client/src/components/Members/MemberForm.jsx`
```jsx
import { useState } from 'react';

const PHOTOS = ['👴','👵','👨','👩','🧑','👧','👦','🧓','👶','🧔'];

export default function MemberForm({ members, initial, onSave, onClose }) {
  const [f, setF] = useState(initial || {
    name:'', gender:'male', born_year:'', died_year:'', photo:'🧑',
    generation:0, notes:'', spouse_id:'', parentIds:[]
  });
  const s = (k,v) => setF(p=>({...p,[k]:v}));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
      {/* Photo picker */}
      <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
        {PHOTOS.map(p => (
          <button key={p} onClick={()=>s('photo',p)}
            style={{ fontSize:22, padding:6, borderRadius:8, border: f.photo===p?'2px solid #6366f1':'2px solid #e2e8f0', background: f.photo===p?'#eef2ff':'transparent', cursor:'pointer' }}>{p}</button>
        ))}
      </div>

      {[['Nama Lengkap *','name','text'],['Tahun Lahir','born_year','text'],['Tahun Wafat','died_year','text']].map(([lbl,key,type])=>(
        <div key={key} style={{ marginBottom:12 }}>
          <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#475569', marginBottom:4 }}>{lbl}</label>
          <input type={type} value={f[key]||''} onChange={e=>s(key,e.target.value)}
            style={{ width:'100%', padding:'9px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box' }} />
        </div>
      ))}

      {[['Jenis Kelamin','gender',[['male','Laki-laki'],['female','Perempuan']]],
        ['Generasi','generation',[[0,'Gen 1 - Kakek/Nenek'],[1,'Gen 2 - Orang Tua'],[2,'Gen 3 - Anak'],[3,'Gen 4 - Cucu'],[4,'Gen 5+']]]
      ].map(([lbl,key,opts])=>(
        <div key={key} style={{ marginBottom:12 }}>
          <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#475569', marginBottom:4 }}>{lbl}</label>
          <select value={f[key]} onChange={e=>s(key, key==='generation'?+e.target.value:e.target.value)}
            style={{ width:'100%', padding:'9px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:14 }}>
            {opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      ))}

      <div style={{ marginBottom:12 }}>
        <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#475569', marginBottom:4 }}>Orang Tua</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {members.filter(m=>m.id!==initial?.id).map(m=>(
            <label key={m.id} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, cursor:'pointer',
              background: f.parentIds.includes(m.id)?'#eef2ff':'#f8fafc',
              padding:'4px 8px', borderRadius:8, border:`1px solid ${f.parentIds.includes(m.id)?'#6366f1':'#e2e8f0'}` }}>
              <input type="checkbox" checked={f.parentIds.includes(m.id)}
                onChange={e=>s('parentIds', e.target.checked?[...f.parentIds,m.id]:f.parentIds.filter(x=>x!==m.id))} />
              {m.photo} {m.name}
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginBottom:12 }}>
        <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#475569', marginBottom:4 }}>Pasangan</label>
        <select value={f.spouse_id||''} onChange={e=>s('spouse_id',e.target.value||null)}
          style={{ width:'100%', padding:'9px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:14 }}>
          <option value=''>— Tidak ada —</option>
          {members.filter(m=>m.id!==initial?.id).map(m=>(
            <option key={m.id} value={m.id}>{m.photo} {m.name}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom:20 }}>
        <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#475569', marginBottom:4 }}>Catatan</label>
        <textarea value={f.notes||''} onChange={e=>s('notes',e.target.value)} rows={2}
          style={{ width:'100%', padding:'9px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:14, resize:'vertical', boxSizing:'border-box' }} />
      </div>

      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <button onClick={onClose} style={{ padding:'9px 20px', borderRadius:10, border:'2px solid #6366f1', background:'transparent', color:'#6366f1', fontWeight:600, cursor:'pointer' }}>Batal</button>
        <button onClick={()=>f.name&&onSave(f)}
          style={{ padding:'9px 20px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', fontWeight:600, cursor:'pointer' }}>
          Simpan
        </button>
      </div>
    </div>
  );
}
```

---

### `client/src/components/Members/MemberList.jsx`
```jsx
import { useAuth } from '../../context/AuthContext';

export default function MemberList({ members, onEdit, onDelete }) {
  const { isAdmin, isEditor } = useAuth();
  const gens = [...new Set(members.map(m=>m.generation))].sort((a,b)=>a-b);
  const genLabel = g => ['Gen 1 — Kakek/Nenek','Gen 2 — Orang Tua','Gen 3 — Anak','Gen 4 — Cucu','Gen 5+'][g]??`Gen ${g+1}`;

  return (
    <div>
      {gens.map(g => (
        <div key={g} style={{ marginBottom:24 }}>
          <div style={{ fontWeight:700, color:'#6366f1', fontSize:15, marginBottom:10, padding:'6px 0', borderBottom:'2px solid #eef2ff' }}>{genLabel(g)}</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:10 }}>
            {members.filter(m=>m.generation===g).map(m=>{
              const accent = m.gender==='male'?'#3b82f6':'#ec4899';
              return (
                <div key={m.id} style={{ background: m.gender==='male'?'#eff6ff':'#fdf2f8', border:`1.5px solid ${accent}30`, borderRadius:14, padding:14, display:'flex', gap:12, alignItems:'flex-start' }}>
                  <div style={{ fontSize:34 }}>{m.photo}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14 }}>{m.name}</div>
                    <div style={{ fontSize:12, color:'#64748b' }}>{m.gender==='male'?'Laki-laki':'Perempuan'}</div>
                    <div style={{ fontSize:12, color:'#475569' }}>
                      Lahir: {m.born_year||'-'} {m.died_year?`| Wafat: ${m.died_year}`:''}
                    </div>
                    {m.notes&&<div style={{ fontSize:11, color:'#94a3b8', fontStyle:'italic', marginTop:4 }}>{m.notes}</div>}
                  </div>
                  {(isAdmin||isEditor) && (
                    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                      <button onClick={()=>onEdit(m)} style={{ padding:'4px 10px', borderRadius:7, border:'none', background:'#3b82f6', color:'#fff', fontSize:12, cursor:'pointer' }}>Edit</button>
                      {isAdmin&&<button onClick={()=>onDelete(m.id)} style={{ padding:'4px 10px', borderRadius:7, border:'none', background:'#ef4444', color:'#fff', fontSize:12, cursor:'pointer' }}>Hapus</button>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

### `client/src/components/Admin/UserManage.jsx`
```jsx
import { useState, useEffect } from 'react';
import { usersApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../UI/Toast';

export default function UserManage() {
  const [users, setUsers] = useState([]);
  const { user: me } = useAuth();
  const { toast } = useToast();

  const load = async () => { const {data}=await usersApi.getAll(); setUsers(data); };
  useEffect(()=>{ load(); }, []);

  const changeRole = async (id, role) => {
    await usersApi.setRole(id, role);
    toast('✅ Role berhasil diubah');
    load();
  };
  const delUser = async id => {
    if (!confirm('Yakin hapus pengguna ini?')) return;
    await usersApi.remove(id);
    toast('🗑 Pengguna dihapus');
    load();
  };

  return (
    <div>
      <h3 style={{ margin:'0 0 16px', color:'#1e293b' }}>⚙️ Manajemen Pengguna</h3>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {users.map(u => (
          <div key={u.id} style={{ background:'#fff', borderRadius:12, padding:'14px 18px', display:'flex', alignItems:'center', gap:12, boxShadow:'0 2px 8px #0001', border:'1px solid #e2e8f0' }}>
            <div style={{ fontSize:30 }}>👤</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, color:'#1e293b' }}>{u.name}</div>
              <div style={{ fontSize:13, color:'#64748b' }}>{u.email}</div>
              <div style={{ fontSize:11, color:'#94a3b8' }}>Bergabung: {new Date(u.created_at).toLocaleDateString('id-ID')}</div>
            </div>
            <select value={u.role} disabled={u.id===me.id}
              onChange={e=>changeRole(u.id,e.target.value)}
              style={{ padding:'6px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:13, fontWeight:600,
                color: u.role==='admin'?'#7c3aed':u.role==='editor'?'#0284c7':'#64748b' }}>
              <option value="viewer">👁 Penonton</option>
              <option value="editor">✏️ Editor</option>
              <option value="admin">👑 Admin</option>
            </select>
            {u.id!==me.id && (
              <button onClick={()=>delUser(u.id)}
                style={{ padding:'6px 12px', borderRadius:8, border:'none', background:'#fee2e2', color:'#ef4444', fontWeight:600, cursor:'pointer', fontSize:13 }}>
                Hapus
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### `client/src/pages/AuthPage.jsx`
```jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name:'', email:'', password:'' });
  const [err, setErr] = useState('');
  const { login, register } = useAuth();
  const s = (k,v) => setForm(p=>({...p,[k]:v}));

  const handle = async () => {
    setErr('');
    try {
      if (mode==='login') await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
    } catch(e) {
      setErr(e.response?.data?.error || 'Terjadi kesalahan');
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#fff', borderRadius:24, padding:36, width:360, boxShadow:'0 24px 60px #0004' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:52, marginBottom:8 }}>🌳</div>
          <h1 style={{ margin:0, fontSize:22, color:'#1e293b' }}>{mode==='login'?'Masuk':'Daftar Akun'}</h1>
          <p style={{ margin:'4px 0 0', color:'#64748b', fontSize:14 }}>Pohon Silsilah Keluarga</p>
        </div>

        {mode==='register' && (
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#475569', marginBottom:5 }}>Nama Lengkap</label>
            <input value={form.name} onChange={e=>s('name',e.target.value)} placeholder="Nama Anda"
              style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box' }} />
          </div>
        )}
        {[['Email','email','email'],['Password','password','password']].map(([lbl,key,type])=>(
          <div key={key} style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#475569', marginBottom:5 }}>{lbl}</label>
            <input type={type} value={form[key]} onChange={e=>s(key,e.target.value)}
              placeholder={key==='email'?'email@contoh.com':'••••••••'}
              onKeyDown={e=>e.key==='Enter'&&handle()}
              style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box' }} />
          </div>
        ))}
        {err && <div style={{ color:'#ef4444', fontSize:13, marginBottom:12 }}>{err}</div>}
        <button onClick={handle} style={{ width:'100%', padding:'11px', borderRadius:11, border:'none', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer', marginBottom:14 }}>
          {mode==='login'?'Masuk':'Daftar Sekarang'}
        </button>
        <div style={{ textAlign:'center', fontSize:13, color:'#64748b' }}>
          {mode==='login'?'Belum punya akun?':'Sudah punya akun?'}{' '}
          <span style={{ color:'#6366f1', cursor:'pointer', fontWeight:600 }} onClick={()=>setMode(mode==='login'?'register':'login')}>
            {mode==='login'?'Daftar':'Masuk'}
          </span>
        </div>
        {mode==='login' && (
          <div style={{ marginTop:16, padding:12, background:'#f8fafc', borderRadius:10, fontSize:12, color:'#94a3b8', textAlign:'center' }}>
            Demo: <b>admin@keluarga.id</b> / <b>admin123</b>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### `client/src/pages/AppPage.jsx`
```jsx
import { useState, useEffect, useCallback } from 'react';
import { membersApi } from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/UI/Navbar';
import Modal from '../components/UI/Modal';
import TreeView from '../components/Tree/TreeView';
import MemberList from '../components/Members/MemberList';
import MemberForm from '../components/Members/MemberForm';
import UserManage from '../components/Admin/UserManage';
import { useToast } from '../components/UI/Toast';

const genLabel = g => ['G1 Kakek/Nenek','G2 Orang Tua','G3 Anak','G4 Cucu','G5+'][g]??`G${g+1}`;

export default function AppPage() {
  const [tab, setTab] = useState('tree');
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [visGens, setVisGens] = useState([0,1,2,3,4]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const { isAdmin, isEditor } = useAuth();
  const { toast } = useToast();

  const load = useCallback(async () => {
    const { data } = await membersApi.getAll();
    setMembers(data);
    const allGens = [...new Set(data.map(m=>m.generation))];
    setVisGens(allGens);
  }, []);

  useEffect(()=>{ load(); }, [load]);

  const maxGen = Math.max(...members.map(m=>m.generation), 0);
  const allGens = Array.from({length:maxGen+1},(_,i)=>i);

  const filtered = members.filter(m =>
    visGens.includes(m.generation) &&
    (!search || m.name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSave = async f => {
    try {
      if (editTarget) { await membersApi.update(editTarget.id, f); toast('✅ Anggota diperbarui!'); }
      else { await membersApi.create(f); toast('✅ Anggota baru ditambahkan!'); }
      setShowForm(false); setEditTarget(null); load();
    } catch(e) { toast('❌ '+( e.response?.data?.error||'Gagal menyimpan')); }
  };

  const handleDelete = async id => {
    if (!confirm('Yakin hapus anggota ini?')) return;
    await membersApi.remove(id);
    toast('🗑 Anggota dihapus'); setSelected(null); load();
  };

  const toggleGen = g => setVisGens(gs => gs.includes(g)?gs.filter(x=>x!==g):[...gs,g]);

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', display:'flex', flexDirection:'column' }}>
      <Navbar tab={tab} setTab={setTab} />

      {/* Toolbar */}
      <div style={{ background:'#fff', padding:'10px 20px', display:'flex', gap:12, alignItems:'center', flexWrap:'wrap', borderBottom:'1px solid #f1f5f9', boxShadow:'0 1px 4px #0001' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari anggota keluarga..."
            style={{ width:'100%', padding:'8px 12px 8px 34px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:14, outline:'none', boxSizing:'border-box' }} />
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
          <span style={{ fontSize:12, color:'#64748b' }}>Lapisan:</span>
          {allGens.map(g=>(
            <button key={g} onClick={()=>toggleGen(g)}
              style={{ padding:'5px 12px', borderRadius:20, border:'1.5px solid #6366f1',
                background: visGens.includes(g)?'#6366f1':'transparent',
                color: visGens.includes(g)?'#fff':'#6366f1',
                fontSize:12, fontWeight:600, cursor:'pointer' }}>
              {genLabel(g)}
            </button>
          ))}
        </div>
        {isEditor && (
          <button onClick={()=>{setEditTarget(null);setShowForm(true);}}
            style={{ padding:'8px 18px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
            + Tambah Anggota
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex:1, padding:20, overflow:'auto' }}>
        {tab==='tree' && (
          <div style={{ display:'flex', gap:16, height:'calc(100vh - 200px)' }}>
            <div style={{ flex:1, borderRadius:16, overflow:'hidden', boxShadow:'0 4px 20px #0001', border:'1px solid #e2e8f0' }}>
              <TreeView members={filtered} selected={selected} onSelect={setSelected} />
            </div>
            {selected && (
              <div style={{ width:260, background:'#fff', borderRadius:16, padding:20, boxShadow:'0 4px 20px #0001', border:'1px solid #e2e8f0', overflowY:'auto' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
                  <span style={{ fontWeight:700, color:'#1e293b' }}>Detail</span>
                  <button onClick={()=>setSelected(null)} style={{ border:'none', background:'#f1f5f9', borderRadius:6, width:24, height:24, cursor:'pointer' }}>×</button>
                </div>
                <div style={{ textAlign:'center', marginBottom:14 }}>
                  <div style={{ fontSize:52 }}>{selected.photo}</div>
                  <div style={{ fontWeight:700, fontSize:16 }}>{selected.name}</div>
                  <div style={{ fontSize:12, color:'#64748b' }}>{genLabel(selected.generation)}</div>
                </div>
                {[['⚧️ Gender', selected.gender==='male'?'Laki-laki':'Perempuan'],
                  ['🎂 Lahir', selected.born_year||'-'],
                  ['✝️ Wafat', selected.died_year||'Masih hidup'],
                  ['🔗 Orang Tua', (selected.parentIds||[]).map(pid=>members.find(m=>m.id===pid)?.name).filter(Boolean).join(', ')||'-'],
                  ['💑 Pasangan', members.find(m=>m.id===selected.spouse_id)?.name||'-']
                ].map(([lbl,val])=>(
                  <div key={lbl} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:8 }}>
                    <span style={{ color:'#64748b' }}>{lbl}</span>
                    <span style={{ color:'#1e293b', fontWeight:500, textAlign:'right', maxWidth:140 }}>{val}</span>
                  </div>
                ))}
                {selected.notes && <div style={{ marginTop:10, padding:10, background:'#f8fafc', borderRadius:8, fontSize:12, color:'#64748b', fontStyle:'italic' }}>{selected.notes}</div>}
                {(isAdmin||isEditor) && (
                  <div style={{ display:'flex', gap:8, marginTop:14 }}>
                    <button onClick={()=>{setEditTarget(selected);setShowForm(true);}}
                      style={{ flex:1, padding:'8px', borderRadius:9, border:'none', background:'#6366f1', color:'#fff', fontWeight:600, cursor:'pointer' }}>Edit</button>
                    {isAdmin && <button onClick={()=>handleDelete(selected.id)}
                      style={{ flex:1, padding:'8px', borderRadius:9, border:'none', background:'#ef4444', color:'#fff', fontWeight:600, cursor:'pointer' }}>Hapus</button>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab==='list' && (
          <MemberList members={filtered} onEdit={m=>{setEditTarget(m);setShowForm(true);}} onDelete={handleDelete} />
        )}

        {tab==='admin' && isAdmin && <UserManage />}
      </div>

      {showForm && (
        <Modal title={editTarget?'✏️ Edit Anggota':'➕ Tambah Anggota'} onClose={()=>{setShowForm(false);setEditTarget(null);}}>
          <MemberForm members={members} initial={editTarget} onSave={handleSave} onClose={()=>{setShowForm(false);setEditTarget(null);}} />
        </Modal>
      )}
    </div>
  );
}
```

---

### `client/src/App.jsx`
```jsx
import { useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import AppPage from './pages/AppPage';
import { ToastContainer } from './components/UI/Toast';

export default function App() {
  const { user } = useAuth();
  return (
    <>
      {user ? <AppPage /> : <AuthPage />}
      <ToastContainer />
    </>
  );
}
```

---

### `client/src/main.jsx`
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
```

---

## 🚀 CARA JALANKAN

```bash
# 1. Install semua dependensi
cd server && npm install
cd ../client && npm install

# 2. Jalankan migrasi database
cd ../server
node src/db/migrate.js
# Output:
# ✅ Applied: 001_init.sql
# ✅ Applied: 002_seed.sql
# 🎉 2 migration(s) applied successfully.

# 3. Jalankan server (terminal 1)
npm run dev
# 🚀 Server running → http://localhost:3001

# 4. Jalankan client (terminal 2)
cd ../client && npm run dev
# ➜ http://localhost:5173
```

---

## 🔑 API Endpoints

| Method | Endpoint              | Auth    | Deskripsi        |
| ------ | --------------------- | ------- | ---------------- |
| POST   | `/api/auth/register`  | ❌       | Daftar akun baru |
| POST   | `/api/auth/login`     | ❌       | Login, dapat JWT |
| GET    | `/api/members`        | viewer+ | Semua anggota    |
| POST   | `/api/members`        | editor+ | Tambah anggota   |
| PUT    | `/api/members/:id`    | editor+ | Edit anggota     |
| DELETE | `/api/members/:id`    | admin   | Hapus anggota    |
| GET    | `/api/users`          | admin   | Semua pengguna   |
| PATCH  | `/api/users/:id/role` | admin   | Ubah role        |
| DELETE | `/api/users/:id`      | admin   | Hapus pengguna   |

---

## 🔐 Role System

| Role   | Lihat | Tambah/Edit | Hapus | Kelola User |
| ------ | ----- | ----------- | ----- | ----------- |
| viewer | ✅     | ❌           | ❌     | ❌           |
| editor | ✅     | ✅           | ❌     | ❌           |
| admin  | ✅     | ✅           | ✅     | ✅           |

Default akun: `admin@keluarga.id` / `admin123`