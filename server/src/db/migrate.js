const fs = require('fs');
const path = require('path');
const db = require('./database');

const migrationsDir = path.join(__dirname, 'migrations');

function runMigrations() {
  console.log('🚀 Checking database migrations...');
  
  // Ensure migrations table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const applied = db.prepare('SELECT filename FROM migrations').all().map(r => r.filename);
  if (!fs.existsSync(migrationsDir)) {
     console.log('⚠️  Migrations directory not found, skipping.');
     return;
  }
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  let ran = 0;
  for (const file of files) {
    if (applied.includes(file)) continue;
    
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    try {
      db.exec(sql);
      db.prepare('INSERT INTO migrations (filename) VALUES (?)').run(file);
      console.log(`✅ Applied: ${file}`);
      ran++;
    } catch (e) {
      console.error(`❌ Failed: ${file}\n`, e.message);
      if (require.main === module) process.exit(1);
      throw e;
    }
  }

  if (ran === 0) console.log('✔  Database up to date.');
  else console.log(`🎉 ${ran} migration(s) applied.`);
}

if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;
