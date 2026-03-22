const fs = require('fs');
const path = require('path');
const db = require('./database');

const seedsDir = path.join(__dirname, 'seeds');

function runSeeds() {
  console.log('🌱 Running database seeds...');
  
  if (!fs.existsSync(seedsDir)) {
     console.log('⚠️  Seeds directory not found, skipping.');
     return;
  }
  const files = fs.readdirSync(seedsDir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(seedsDir, file), 'utf8');
    try {
      db.exec(sql);
      console.log(`✅ Seeded: ${file}`);
    } catch (e) {
      console.error(`❌ Failed: ${file}\n`, e.message);
      if (require.main === module) process.exit(1);
      throw e;
    }
  }

  console.log('🎉 Seeding complete.');
}

if (require.main === module) {
  runSeeds();
}

module.exports = runSeeds;
