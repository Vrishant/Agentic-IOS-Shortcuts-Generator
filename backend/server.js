// server.js (Robust Version)
require("dotenv").config(); // Load .env file
const express = require("express");
const cors = require("cors");
const { ShortcutAgent } = require("./mcp-agent");
const bplist = require('bplist-creator');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors()); // Allow React to connect
app.use(express.json());

const PORT = process.env.PORT || 8000;

// Validate API Key on startup
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ CRITICAL ERROR: OPENAI_API_KEY is missing in .env file");
  process.exit(1);
}
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ CRITICAL ERROR: OPENAI_API_KEY is missing in .env file");
  process.exit(1);
}

const agent = new ShortcutAgent();

// Connect Agent
(async () => {
  try {
    console.log("🔌 Connecting to MCP Server...");
    await agent.connect();
    console.log("✅ Agent connected to MCP System");
  } catch (err) {
    console.error("❌ Failed to connect agent:", err);
  }
})();

// 1. Health Check Endpoint (Open http://localhost:8000/health in browser to test)
app.get("/health", (req, res) => {
  res.json({ status: "Online", agent: "Active" });
});

// 2. Chat Endpoint
app.post("/chat", async (req, res) => {
  const { prompt } = req.body;
  
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  console.log(`📩 Received Prompt: "${prompt}"`);

  try {
    const result = await agent.processQuery(prompt);
    console.log("📤 Sending Response");
    res.json(result);
  } catch (error) {
    console.error("❌ Error processing request:", error);
    // Send the actual error to the frontend to help debug
    res.status(500).json({ 
        error: "Internal Error", 
        details: error.message 
    });
  }
});

app.post("/download", (req, res) => {
  const { shortcutCode, name } = req.body;

  if (!shortcutCode || !Array.isArray(shortcutCode)) {
    return res.status(400).json({ error: "Invalid shortcut code format" });
  }

  try {
    // 1. Map the simplified JSON to Apple's internal WFWorkflow structure
    const actions = shortcutCode.map(item => {
      return {
        "WFWorkflowActionIdentifier": item.action,
        "WFWorkflowActionParameters": item.parameters || {}
      };
    });

    // 2. Create the full Shortcut Plist structure
    const shortcutPlist = {
      "WFWorkflowClientVersion": "1200", // approximate version
      "WFWorkflowMinimumClientVersion": 900,
      "WFWorkflowIcon": {
        "WFWorkflowIconStartColor": 4282601983, // Greenish
        "WFWorkflowIconGlyphNumber": 59722 // Arbitrary glyph
      },
      "WFWorkflowActions": actions,
      "WFWorkflowInputContentItemClasses": [
        "WFAppStoreAppContentItem",
        "WFArticleContentItem",
        "WFContactContentItem",
        "WFDateContentItem",
        "WFEmailAddressContentItem",
        "WFFolderContentItem",
        "WFGenericFileContentItem",
        "WFImageContentItem",
        "WFiTunesProductContentItem",
        "WFLocationContentItem",
        "WFDCMapsLinkContentItem",
        "WFAVAssetContentItem",
        "WFPDFContentItem",
        "WFPhoneNumberContentItem",
        "WFRichTextContentItem",
        "WFSafariWebPageContentItem",
        "WFStringContentItem",
        "WFURLContentItem"
      ]
    };

    // 3. Convert JS Object -> Binary Plist Buffer
    const buffer = bplist(shortcutPlist);

    // 4. Send as downloadable file
    const filename = `${name || 'AgenticShortcut'}.shortcut`;
    
    res.setHeader('Content-Type', 'application/x-apple-shortcut');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);

  } catch (error) {
    console.error("File generation error:", error);
    res.status(500).json({ error: "Failed to generate shortcut file" });
  }
});


// // TEST ROUTE: Generates a shortcut without AI
// app.get("/test-download", (req, res) => {
//   // Hardcoded "Toggle Wi-Fi" logic
//   const mockShortcut = [
//     { "action": "is.workflow.actions.getwifi", "parameters": {} },
//     { 
//       "action": "is.workflow.actions.conditional", 
//       "parameters": { "WFControlFlowMode": 0, "WFControlCondition": "Has any value" } 
//     },
//     { "action": "is.workflow.actions.setwifi", "parameters": { "OnValue": false } },
//     { "action": "is.workflow.actions.conditional", "parameters": { "WFControlFlowMode": 1 } }, // Else
//     { "action": "is.workflow.actions.setwifi", "parameters": { "OnValue": true } },
//     { "action": "is.workflow.actions.conditional", "parameters": { "WFControlFlowMode": 2 } }  // End If
//   ];

//   // Manually trigger the download logic
//   // We reuse the logic by mocking the request body and calling the handler, 
//   // OR just copy-paste the generation logic here for simplicity.
  
//   // FASTEST WAY: Redirect internally to your POST logic (simulated)
//   // But since we can't easily internal-redirect POSTs, let's just create the buffer here:
  
//   const bplist = require('bplist-creator');
  
//   const actions = mockShortcut.map(item => ({
//     "WFWorkflowActionIdentifier": item.action,
//     "WFWorkflowActionParameters": item.parameters || {}
//   }));

//   const shortcutPlist = {
//     "WFWorkflowClientVersion": "1200",
//     "WFWorkflowMinimumClientVersion": 900,
//     "WFWorkflowIcon": {
//       "WFWorkflowIconStartColor": 4282601983,
//       "WFWorkflowIconGlyphNumber": 59722
//     },
//     "WFWorkflowActions": actions,
//     "WFWorkflowInputContentItemClasses": ["WFAppStoreAppContentItem", "WFStringContentItem"]
//   };

//   const buffer = bplist(shortcutPlist);

//   res.setHeader('Content-Type', 'application/x-apple-shortcut');
//   res.setHeader('Content-Disposition', 'attachment; filename="OfflineTest.shortcut"');
//   res.send(buffer);
// });



app.listen(PORT, () => {
  console.log(`\n🚀 Server is running!`);
  console.log(`   Health Check: http://localhost:${PORT}/health`);
  console.log(`   Listening for React requests on port ${PORT}...\n`);
});