const Database = require('better-sqlite3');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// 1. Locate the file (Handle the symlink)
const originalDbPath = path.join(os.homedir(), 'Library/Shortcuts/ToolKit/Tools-active');
const tempDbPath = path.join(__dirname, 'shortcuts_dump.sqlite');

try {
  // 2. Copy to local folder to avoid permission/lock issues
  console.log(`Copying DB from ${originalDbPath}...`);
  fs.copySync(originalDbPath, tempDbPath);
  console.log("✅ Database copied successfully.\n");

  // 3. Open the DB
  const db = new Database(tempDbPath, { readonly: true });

  // 4. List all tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log("=== TABLES FOUND ===");
  console.log(tables.map(t => t.name).join(", "));
  console.log("\n");

  // 5. Inspect the 'Tools' table (or whatever the main actions table is named)
  // Based on your info, it likely contains 'Tool', 'Action', or is just named 'Tools'
  const actionTable = tables.find(t => t.name.includes('Tool') || t.name.includes('Action'));
  
  if (actionTable) {
    console.log(`=== COLUMNS IN '${actionTable.name}' ===`);
    const columns = db.prepare(`PRAGMA table_info(${actionTable.name})`).all();
    console.log(columns.map(c => c.name).join(", "));
    
    // Sample Data
    console.log(`\n=== FIRST 2 ROWS of '${actionTable.name}' ===`);
    const rows = db.prepare(`SELECT * FROM ${actionTable.name} LIMIT 2`).all();
    console.log(JSON.stringify(rows, null, 2));
  }

} catch (err) {
  console.error("❌ Error:", err.message);
  console.error("Ensure your Terminal has Full Disk Access!");
}