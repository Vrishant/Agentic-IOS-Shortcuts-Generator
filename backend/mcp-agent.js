// // mcp-agent.js
// const process = require("process");
// const { GoogleGenAI } = require("@google/genai");
// const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
// const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
// const dotenv = require("dotenv");
// const path = require("path");
// dotenv.config();

// class ShortcutAgent {
//   constructor() {
//     // 1. Initialize the NEW GenAI Client
//     // It automatically looks for GEMINI_API_KEY in process.env, 
//     // but passing it explicitly is safer for local dev.
//     this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
//     // Initialize MCP Client
//     this.mcp = new Client({ name: "shortcut-agent-client", version: "1.0.0" });
//   }

//   // 2. Connect to the MCP Server
//   async connect() {
//     const serverPath = path.resolve(__dirname, "mcp-shortcuts-db/db-server.js");
//     const transport = new StdioClientTransport({
//       command: "node", 
//       args: [serverPath],
//     });

//     await this.mcp.connect(transport);
    
//     // Load and sanitize tools
//     const toolsResult = await this.mcp.listTools();
//     this.tools = toolsResult.tools.map((tool) => {
//       // Remove $schema if present (Google doesn't like it)
//       const { $schema, ...cleanParams } = tool.inputSchema;
//       return {
//         name: tool.name,
//         description: tool.description,
//         parameters: cleanParams, 
//       };
//     });

//     console.log("✅ Agent connected to MCP. Tools loaded for GenAI.");
//   }

//   // 3. The Agentic Loop
//   async processQuery(userQuery) {
//     const modelId = "gemini-2.5-flash"; // Or "gemini-1.5-flash"

//     // Define the system instructions and user prompt
//     const prompt = `
//       SYSTEM: You are an expert Apple Shortcuts Developer.
//       1. Use the available tools to find the correct 'action' and 'syntax'. 
//       2. NEVER guess the code. Look it up using the tools.
//       3. Output a strict JSON object: { "response": "explanation", "shortcutCode": "code" }

//       USER: ${userQuery}
//     `;

//     try {
//       // --- FIRST CALL: Check if tools are needed ---
//       console.log(`[Agent] Sending query to ${modelId}...`);
      
//       let response = await this.ai.models.generateContent({
//         model: modelId,
//         contents: [{ role: "user", parts: [{ text: prompt }] }],
//         config: {
//           tools: [{ functionDeclarations: this.tools }], // New SDK Tool Format
//         }
//       });

//       // Handle Tool Calls (The new SDK returns 'functionCalls' in the parts)
//       let candidates = response.candidates || [];
//       let firstPart = candidates[0]?.content?.parts?.[0];

//       // Loop to handle multiple tool calls (simplified for single turn)
//       while (firstPart && firstPart.functionCall) {
//         const fCall = firstPart.functionCall;
//         console.log(`[Agent] 🛠️ Calling Tool: ${fCall.name}`);

//         // Execute the tool via MCP
//         const mcpResult = await this.mcp.callTool({
//           name: fCall.name,
//           arguments: fCall.args,
//         });

//         console.log(`[Agent] 🔙 Tool Result:`, JSON.stringify(mcpResult).slice(0, 50) + "...");

//         // Send the result back to Gemini
//         // We construct a new history with the result
//         response = await this.ai.models.generateContent({
//           model: modelId,
//           contents: [
//             { role: "user", parts: [{ text: prompt }] },
//             { role: "model", parts: [firstPart] }, // The function call request
//             { 
//               role: "function", 
//               parts: [{ 
//                 functionResponse: {
//                   name: fCall.name,
//                   response: { content: mcpResult.content }
//                 }
//               }] 
//             }
//           ],
//           config: { tools: [{ functionDeclarations: this.tools }] }
//         });

//         // Update loop variable
//         candidates = response.candidates || [];
//         firstPart = candidates[0]?.content?.parts?.[0];
//       }

//       // --- FINAL OUTPUT ---
//       const finalText = firstPart?.text || "";
      
//       try {
//         const cleanText = finalText.replace(/```json/g, '').replace(/```/g, '').trim();
//         return JSON.parse(cleanText);
//       } catch (e) {
//         return { response: finalText, shortcutCode: "// Could not parse strictly as JSON" };
//       }

//     } catch (error) {
//       console.error("GenAI Error:", error);
//       return { response: "Error: " + error.message, shortcutCode: "// Error" };
//     }
//   }
// }

// module.exports = { ShortcutAgent };

// mcp-agent.js
const { GoogleGenAI } = require("@google/genai");
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
const dotenv = require("dotenv");
const path = require("path");
const process = require("process");

dotenv.config();

class ShortcutAgent {
  constructor() {
    // 1. Initialize the NEW GenAI Client
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Initialize MCP Client
    this.mcp = new Client({ name: "shortcut-agent-client", version: "1.0.0" });
  }

  // 2. Connect to the MCP Server
  async connect() {
    // Ensure this path points to where your db-server.js actually lives
    const serverPath = path.resolve(__dirname, "mcp-shortcuts-db/db-server.js");
    
    const transport = new StdioClientTransport({
      command: "node", 
      args: [serverPath],
    });

    await this.mcp.connect(transport);
    
    // Load and sanitize tools
    const toolsResult = await this.mcp.listTools();
    this.tools = toolsResult.tools.map((tool) => {
      // Remove $schema if present (Google doesn't like it)
      const { $schema, ...cleanParams } = tool.inputSchema;
      return {
        name: tool.name,
        description: tool.description,
        parameters: cleanParams, 
      };
    });

    console.log("✅ Agent connected to MCP. Tools loaded for GenAI.");
  }

  // 3. The Agentic Loop
  async processQuery(userQuery) {
    // Use the latest flash model
    const modelId = "gemini-2.5-flash"; 

    // --- UPGRADED SYSTEM PROMPT ---
    const systemInstruction = `
      SYSTEM: You are an expert Apple Shortcuts Developer using an internal SQL database.
      
      ### CORE RULES:
      1. **Search Broadly:** If "Get Wi-Fi" fails, search for "Network", "Details", or "Device".
      2. **Toggle Logic:** If an action only supports "Turn On" or "Turn Off", script it:
         - IF (State == On) -> Turn Off
         - ELSE -> Turn On
      3. **Exact Syntax:** Use 'get_action_schema' to find exact parameter keys.
      4. **Anti-Looping:** If you search for an action twice and can't find it, STOP SEARCHING. Use a comment in the code like: // Action "X" not found, please add manually.
      
      OUTPUT FORMAT (JSON ONLY):
      {
        "response": "Brief explanation...",
        "shortcutCode": "The code..."
      }
    `;

    // Maintain conversation history for multi-turn reasoning
    let chatHistory = [
      { role: "user", parts: [{ text: systemInstruction + "\n\nUSER QUERY: " + userQuery }] }
    ];

    try {
      let turns = 0;
      // const MAX_TURNS = ;
      const MAX_TURNS = 10;

      while (turns < MAX_TURNS) {
        console.log(`[Agent] Sending query to ${modelId} (Turn ${turns + 1})...`);
        
        // Call Gemini with current history
        const result = await this.ai.models.generateContent({
          model: modelId,
          contents: chatHistory,
          config: {
            tools: [{ functionDeclarations: this.tools }],
          }
        });

        const candidates = result.candidates || [];
        const responsePart = candidates[0]?.content?.parts?.[0];

        // 1. Check if Gemini wants to call a tool
        if (responsePart && responsePart.functionCall) {
          const fCall = responsePart.functionCall;
          console.log(`[Agent] 🛠️ Calling Tool: ${fCall.name}`);
          
          // Add Gemini's request to history
          chatHistory.push({ role: "model", parts: [responsePart] });

          // Execute Tool via MCP
          let mcpResult;
          try {
             mcpResult = await this.mcp.callTool({
              name: fCall.name,
              arguments: fCall.args,
            });
          } catch (toolError) {
             mcpResult = { content: [{ type: "text", text: "Error executing tool: " + toolError.message }] };
          }

          const resultSnippet = JSON.stringify(mcpResult).slice(0, 100) + "...";
          console.log(`[Agent] 🔙 Tool Result: ${resultSnippet}`);

          // Add Tool Response to history
          chatHistory.push({
            role: "function",
            parts: [{
              functionResponse: {
                name: fCall.name,
                response: { content: mcpResult.content }
              }
            }]
          });

          // Loop continues to let Gemini handle the tool result
          turns++;
        
        } else {
          // 2. No tool call? This is the final answer.
          const finalText = responsePart?.text || "";
          
          try {
            const cleanText = finalText.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanText);
          } catch (e) {
            return { response: finalText, shortcutCode: "// Could not parse strictly as JSON" };
          }
        }
      }
      
      return { response: "Agent timed out (too many steps).", shortcutCode: "// Error: infinite loop" };

    } catch (error) {
      console.error("GenAI Error:", error);
      return { response: "Error: " + error.message, shortcutCode: "// Error" };
    }
  }
}

module.exports = { ShortcutAgent };