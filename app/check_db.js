const path = require('path');
const Database = require(path.join(__dirname, 'node_modules', 'better-sqlite3'));
const db = new Database(path.join(__dirname, 'data', 'hackhunt.db'));

const counts = db.prepare("SELECT format, COUNT(*) as cnt FROM hackathons GROUP BY format").all();
console.log("Format counts:", JSON.stringify(counts));

const offline = db.prepare("SELECT title, format, location_text, source_platform FROM hackathons WHERE format != 'Online' LIMIT 8").all();
console.log("\nOffline/Hybrid samples:");
offline.forEach(r => console.log(`  [${r.source_platform}] ${r.title} | ${r.format} | ${r.location_text}`));

const total = db.prepare("SELECT COUNT(*) as cnt FROM hackathons").get();
console.log("\nTotal:", total.cnt);
