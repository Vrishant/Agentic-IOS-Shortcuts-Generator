// backend/db-server.js
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");
const Database = require('better-sqlite3');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// --- SETUP DATABASE MIRROR ---
// We copy the DB to temp to avoid locking issues with the live system
const ORIGINAL_DB = path.join(os.homedir(), 'Library/Shortcuts/ToolKit/Tools-active');
const MIRROR_DB = path.join(os.tmpdir(), 'shortcuts_mcp_mirror.sqlite');

try {
  fs.copySync(ORIGINAL_DB, MIRROR_DB);
  console.error(`✅ Shortcuts Database mirrored to ${MIRROR_DB}`);
} catch (e) {
  console.error("❌ Failed to copy Shortcuts DB. Ensure Full Disk Access is enabled for Terminal/VSCode.");
  process.exit(1);
}

const db = new Database(MIRROR_DB, { readonly: true });

// --- MCP SERVER DEFINITION ---
const server = new McpServer({
  name: "AppleShortcutsInternalDB",
  version: "1.0.0"
});

/**
 * TOOL 1: Search Internal Actions
 * Finds actions by joining the 'Tools' table with 'ToolLocalizations'
 */
server.tool(
  "search_internal_actions",
  "Search for Apple Shortcut actions by name or keyword.",
  {
    query: z.string().describe("Search term (e.g. 'message', 'wifi', 'battery')")
  },
  async ({ query }) => {
    try {
      // SQL: Find tools where the human name matches the query
      // We prioritize English ('en') but fall back to any if needed.
      const sql = `
        SELECT 
            t.id AS actionId, 
            loc.name AS actionName, 
            loc.descriptionSummary AS description
        FROM Tools t
        JOIN ToolLocalizations loc ON t.rowId = loc.toolId
        WHERE 
            (loc.name LIKE ? OR loc.descriptionSummary LIKE ?)
            AND loc.locale LIKE 'en%'
        LIMIT 25
      `;
      
      const rows = db.prepare(sql).all(`%${query}%`, `%${query}%`);
      
      return {
        content: [{ 
            type: "text", 
            text: JSON.stringify(rows, null, 2) 
        }]
      };
    } catch (error) {
      return { content: [{ type: "text", text: `Database Error: ${error.message}` }] };
    }
  }
);

/**
 * TOOL 2: Get Action Schema (Parameters)
 * Fetches the specific inputs required for an action.
 */
server.tool(
  "get_action_schema",
  "Get the strict parameters, keys, and types for a specific action ID.",
  {
    actionId: z.string().describe("The internal action ID (e.g. 'com.apple.mobilephone.call')")
  },
  async ({ actionId }) => {
    try {
      // 1. Fetch Action Metadata
      const toolSql = `
        SELECT t.rowId, t.id, loc.name, loc.descriptionSummary
        FROM Tools t
        JOIN ToolLocalizations loc ON t.rowId = loc.toolId
        WHERE t.id = ? AND loc.locale LIKE 'en%'
        LIMIT 1
      `;
      const tool = db.prepare(toolSql).get(actionId);

      if (!tool) {
          return { content: [{ type: "text", text: `Action ID '${actionId}' not found.` }] };
      }

      // 2. Fetch Parameters (Inputs)
      // We join Parameters with ParameterLocalizations to get the "Key" (for code) and "Name" (for understanding)
      const paramSql = `
        SELECT 
            p.key AS internalKey,
            p.typeId AS dataType,
            ploc.name AS humanName,
            ploc.description AS description
        FROM Parameters p
        LEFT JOIN ParameterLocalizations ploc 
            ON p.toolId = ploc.toolId 
            AND p.key = ploc.key
        WHERE 
            p.toolId = ? 
            AND (ploc.locale IS NULL OR ploc.locale LIKE 'en%')
        ORDER BY p.sortOrder ASC
      `;
      
      const params = db.prepare(paramSql).all(tool.rowId);

      // 3. Construct the response
      return {
        content: [{ 
          type: "text", 
          text: JSON.stringify({
             action: {
                 name: tool.name,
                 id: tool.id,
                 description: tool.descriptionSummary
             },
             parameters: params
          }, null, 2) 
        }]
      };
    } catch (error) {
      return { content: [{ type: "text", text: `Database Error: ${error.message}` }] };
    }
  }
);

// --- START SERVER ---
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🚀 MCP Database Server running on stdio");
}

main().catch(console.error);