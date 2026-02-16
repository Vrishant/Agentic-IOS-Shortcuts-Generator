// mcp-server.js
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");
const { ACTIONS } = require("./data");

// Initialize MCP Server
const server = new McpServer({
  name: "AppleShortcutsReference",
  version: "1.0.0"
});

// TOOL 1: Search for an action
server.tool(
  "search_actions",
  "Search for available Apple Shortcut actions/code blocks based on a query.",
  {
    query: z.string().describe("The keyword to search for (e.g., 'message', 'location', 'health')")
  },
  async ({ query }) => {
    const results = ACTIONS.filter(act => 
      act.name.toLowerCase().includes(query.toLowerCase()) || 
      act.description.toLowerCase().includes(query.toLowerCase())
    );

    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(results.map(r => ({ name: r.name, description: r.description }))) 
      }]
    };
  }
);

// TOOL 2: Get specific details for code generation
server.tool(
  "get_action_details",
  "Get the strict syntax and parameters for a specific action to ensure correct code generation.",
  {
    actionName: z.string().describe("The exact name of the action (e.g., 'Send Message')")
  },
  async ({ actionName }) => {
    const action = ACTIONS.find(a => a.name.toLowerCase() === actionName.toLowerCase());
    
    if (!action) {
      return { content: [{ type: "text", text: "Action not found." }] };
    }

    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(action, null, 2) 
      }]
    };
  }
);

// Start the Server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error in mcp-server:", error);
  process.exit(1);
});