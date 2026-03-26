const router = require('express').Router();
const db = require('../db/database');
const auth = require('../middleware/auth');

// --- EXPORT ---

router.get('/export/json', auth('admin'), (req, res) => {
  const members = db.prepare('SELECT * FROM members').all();
  const parents = db.prepare('SELECT * FROM member_parents').all();
  res.json({ members, parents });
});

router.get('/export/gedcom', auth('admin'), (req, res) => {
  const members = db.prepare('SELECT * FROM members').all();
  const parents = db.prepare('SELECT * FROM member_parents').all();

  let ged = `0 HEAD\n1 CHAR UTF-8\n1 GEDC\n2 VERS 5.5.1\n2 FORM LINEAGE-LINKED\n`;

  // Individuals
  members.forEach(m => {
    ged += `0 @I${m.id}@ INDI\n`;
    ged += `1 NAME ${m.name.replace(/\//g, '')} /${m.name.split(' ').pop()}/\n`;
    ged += `1 SEX ${m.gender === 'male' ? 'M' : 'F'}\n`;
    if (m.born_year) {
      ged += `1 BIRT\n2 DATE ${m.born_year}\n`;
    }
    if (m.died_year) {
      ged += `1 DEAT\n2 DATE ${m.died_year}\n`;
    }
    if (m.notes) {
      ged += `1 NOTE ${m.notes}\n`;
    }
  });

  // Families
  // Group children by their set of parents
  const famMap = {}; // { "p1_p2": [childIds] }
  members.forEach(m => {
    const parentIds = parents.filter(p => p.member_id === m.id).map(p => p.parent_id).sort();
    if (parentIds.length > 0) {
      const key = parentIds.join('_');
      if (!famMap[key]) famMap[key] = [];
      famMap[key].push(m.id);
    }
  });

  Object.entries(famMap).forEach(([pids, children], idx) => {
    const ids = pids.split('_');
    ged += `0 @F${idx+1}@ FAM\n`;
    ids.forEach(pid => {
      const p = members.find(m => m.id == pid);
      if (p) {
        if (p.gender === 'male') ged += `1 HUSB @I${p.id}@\n`;
        else ged += `1 WIFE @I${p.id}@\n`;
      }
    });
    children.forEach(cid => {
      ged += `1 CHIL @I${cid}@\n`;
    });
  });

  ged += `0 TRLR\n`;
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', 'attachment; filename="family-tree.ged"');
  res.send(ged);
});

// --- IMPORT ---

router.post('/import/json', auth('admin'), (req, res) => {
  const { members, parents } = req.body;
  if (!Array.isArray(members)) return res.status(400).json({ error: 'Format JSON tidak valid' });

  try {
    const idMap = {}; // mapping old IDs to new IDs
    
    // Disable FK for import mass
    db.exec('PRAGMA foreign_keys = OFF');
    db.prepare('DELETE FROM member_parents').run();
    db.prepare('DELETE FROM members').run();

    const insertMember = db.prepare(`
      INSERT INTO members (name, gender, born_year, died_year, photo, generation, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    members.forEach(m => {
      const r = insertMember.run(m.name, m.gender, m.born_year, m.died_year, m.photo || '🧑', m.generation || 0, m.notes, req.user.id);
      idMap[m.id] = r.lastInsertRowid;
    });

    // Update spouse links
    members.forEach(m => {
      if (m.spouse_id && idMap[m.spouse_id]) {
        db.prepare('UPDATE members SET spouse_id = ? WHERE id = ?').run(idMap[m.spouse_id], idMap[m.id]);
      }
    });

    // Insert parents
    const insertParent = db.prepare('INSERT INTO member_parents (member_id, parent_id) VALUES (?, ?)');
    parents.forEach(p => {
      if (idMap[p.member_id] && idMap[p.parent_id]) {
        insertParent.run(idMap[p.member_id], idMap[p.parent_id]);
      }
    });

    db.exec('PRAGMA foreign_keys = ON');
    res.json({ success: true, count: members.length });
  } catch (err) {
    db.exec('PRAGMA foreign_keys = ON');
    res.status(500).json({ error: err.message });
  }
});

router.post('/import/gedcom', auth('admin'), (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Konten GEDCOM kosong' });

  try {
    const lines = content.split('\n');
    const individuals = []; // { id, name, gender, born, died, notes }
    const families = []; // { id, husb, wife, children: [] }
    
    let currentIndi = null;
    let currentFam = null;
    let lastTag = '';

    lines.forEach(line => {
      const match = line.trim().match(/^(\d+)\s+(@?\w+@?)\s*(.*)$/);
      if (!match) return;
      const level = parseInt(match[1]);
      const tagOrId = match[2];
      const value = match[3];

      if (level === 0) {
        if (tagOrId.startsWith('@I') && value === 'INDI') {
          currentIndi = { id: tagOrId.replace(/@/g, ''), name: '', gender: 'male', born: null, died: null, notes: '' };
          individuals.push(currentIndi);
          currentFam = null;
          lastTag = 'INDI';
        } else if (tagOrId.startsWith('@F') && value === 'FAM') {
          currentFam = { id: tagOrId.replace(/@/g, ''), husb: null, wife: null, children: [] };
          families.push(currentFam);
          currentIndi = null;
          lastTag = 'FAM';
        } else {
          currentIndi = null;
          currentFam = null;
        }
      } else if (currentIndi) {
        if (tagOrId === 'NAME') currentIndi.name = value.replace(/\//g, '').trim();
        else if (tagOrId === 'SEX') currentIndi.gender = value.toUpperCase() === 'F' ? 'female' : 'male';
        else if (tagOrId === 'BIRT' || tagOrId === 'DEAT') lastTag = tagOrId;
        else if (tagOrId === 'DATE') {
          if (lastTag === 'BIRT') currentIndi.born = value;
          else if (lastTag === 'DEAT') currentIndi.died = value;
        } else if (tagOrId === 'NOTE') currentIndi.notes = value;
      } else if (currentFam) {
        if (tagOrId === 'HUSB') currentFam.husb = value.replace(/@/g, '');
        else if (tagOrId === 'WIFE') currentFam.wife = value.replace(/@/g, '');
        else if (tagOrId === 'CHIL') currentFam.children.push(value.replace(/@/g, ''));
      }
    });

    // Map GEDCOM IDs to DB IDs
    const idMap = {};
    db.exec('PRAGMA foreign_keys = OFF');
    db.prepare('DELETE FROM member_parents').run();
    db.prepare('DELETE FROM members').run();

    const insertMember = db.prepare(`
      INSERT INTO members (name, gender, born_year, died_year, photo, generation, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    individuals.forEach(m => {
      const r = insertMember.run(m.name || 'Unknown', m.gender, m.born, m.died, '🧑', 0, m.notes, req.user.id);
      idMap[m.id] = r.lastInsertRowid;
    });

    // Apply Family Links
    families.forEach(f => {
      if (f.husb && f.wife && idMap[f.husb] && idMap[f.wife]) {
        db.prepare('UPDATE members SET spouse_id = ? WHERE id = ?').run(idMap[f.wife], idMap[f.husb]);
        db.prepare('UPDATE members SET spouse_id = ? WHERE id = ?').run(idMap[f.husb], idMap[f.wife]);
      }
      f.children.forEach(cid => {
        if (idMap[cid]) {
          if (f.husb && idMap[f.husb]) db.prepare('INSERT INTO member_parents VALUES (?,?)').run(idMap[cid], idMap[f.husb]);
          if (f.wife && idMap[f.wife]) db.prepare('INSERT INTO member_parents VALUES (?,?)').run(idMap[cid], idMap[f.wife]);
        }
      });
    });

    // Post-process: Calculate generations (simple)
    const allMembers = db.prepare('SELECT id FROM members').all();
    const map = {};
    allMembers.forEach(m => {
      const parents = db.prepare('SELECT parent_id FROM member_parents WHERE member_id = ?').all(m.id);
      map[m.id] = { id:m.id, pids: parents.map(p=>p.parent_id), gen: -1 };
    });

    const getGen = id => {
       if (map[id].gen !== -1) return map[id].gen;
       if (map[id].pids.length === 0) return map[id].gen = 0;
       return map[id].gen = Math.max(...map[id].pids.map(getGen)) + 1;
    };
    allMembers.forEach(m => {
      const gen = getGen(m.id);
      db.prepare('UPDATE members SET generation = ? WHERE id = ?').run(gen, m.id);
    });

    db.exec('PRAGMA foreign_keys = ON');
    res.json({ success: true, count: individuals.length });
  } catch (err) {
    db.exec('PRAGMA foreign_keys = ON');
    res.status(500).json({ error: err.message });
  }
});

// --- UTILS ---

router.post('/seed', auth('admin'), (req, res) => {
  try {
    const runSeeds = require('../db/seed');
    runSeeds();
    res.json({ success: true, message: 'Data demo berhasil dimuat' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/clear', auth('admin'), (req, res) => {
  try {
    db.exec('PRAGMA foreign_keys = OFF');
    db.prepare('DELETE FROM member_parents').run();
    db.prepare('DELETE FROM members').run();
    db.exec('PRAGMA foreign_keys = ON');
    res.json({ success: true, message: 'Data silsilah berhasil dikosongkan' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
