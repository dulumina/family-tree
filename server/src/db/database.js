const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const isVercel = process.env.VERCEL === '1';
const dbPath = process.env.DB_PATH || (isVercel ? '/tmp/family.db' : path.join(__dirname, '../../data/family.db'));
const dir = path.dirname(dbPath);

if (!isVercel && !fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
