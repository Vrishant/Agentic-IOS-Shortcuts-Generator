const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');
const fs = require('fs-extra');

const dbPath = path.join(os.tmpdir(), 'shortcuts_mcp_mirror.sqlite');

// Ensure DB exists (copy it if you haven't already via the previous script)
if (!fs.existsSync(dbPath)) {
    const original = path.join(os.homedir(), 'Library/Shortcuts/ToolKit/Tools-active');
    fs.copySync(original, dbPath);
}

const db = new Database(dbPath, { readonly: true });

function printColumns(tableName) {
    try {
        const cols = db.prepare(`PRAGMA table_info(${tableName})`).all();
        console.log(`\n=== ${tableName} COLUMNS ===`);
        console.log(cols.map(c => c.name).join(", "));
        
        const row = db.prepare(`SELECT * FROM ${tableName} LIMIT 1`).get();
        console.log(`SAMPLE ROW:`, JSON.stringify(row, null, 2));
    } catch (e) {
        console.log(`Could not read ${tableName}: ${e.message}`);
    }
}

printColumns('ToolLocalizations');
printColumns('Parameters');
printColumns('ParameterLocalizations');