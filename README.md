# 🍎 Agentic Apple Shortcuts Generator

**An Agentic AI that reverse-engineers the internal macOS Shortcuts database to generate valid automation code.**

This project uses the **Model Context Protocol (MCP)** to give an LLM (Gemini 2.0 Flash) direct access to the hidden `Tools.sqlite` database inside macOS. Instead of hallucinating Action IDs, the Agent searches the live database, retrieves parameter schemas, and generates syntactically correct **Jellycuts (Swift)** code.

---

## 📸 Demo

> *Add your screenshots here: (1) The Clean UI, (2) The "Process Log" Terminal showing MCP calls, (3) The Final Code.*

---

## 🚀 Features

* **🕵️‍♂️ Reverse Engineering:** Connects directly to the internal Apple Shortcuts SQLite database to find undocumented Action IDs.
* **🤖 Agentic Workflow:** Uses **MCP** (Model Context Protocol) to let the AI "think" and "search" before answering.
* **⚡ Real-Time Transparency:** "Glass Box" UI shows exactly which database queries the Agent is running in real-time.
* **🍏 Jellycuts Generation:** Outputs valid, compile-ready code for [Jellycuts](https://jellycuts.com/), bypassing complex signing issues.
* **🌑 Cyber-Dark UI:** A modern, VS Code-inspired interface built with React.

---

## 🛠️ Tech Stack

* **Frontend:** React.js, Lucide Icons, CSS Variables (Dark Mode)
* **Backend:** Node.js, Express
* **Database:** `better-sqlite3` (Reads local macOS `Tools.sqlite`)
* **AI Model:** Google Gemini 2.0 Flash (`@google/genai` SDK)
* **Protocol:** Model Context Protocol (MCP) SDK

---

## 📋 Prerequisites

* **macOS:** This tool requires access to the local Shortcuts database found only on Macs.
* **Node.js:** v18 or higher.
* **Gemini API Key:** Get one for free at [Google AI Studio](https://aistudio.google.com/).
* **Terminal Access:** You must grant your Terminal/VS Code **Full Disk Access** to read the Apple Library folders.

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/agentic-shortcuts.git
cd agentic-shortcuts

```

### 2. Backend Setup

The backend runs the MCP Server and connects to the SQLite database.

```bash
cd backend
npm install

```

**Create a `.env` file** in the `backend` folder:

```env
GEMINI_API_KEY=your_api_key_here
PORT=8000

```

### 3. Frontend Setup

The frontend is a React dashboard.

```bash
cd ../frontend
npm install

```

---

## 🔓 Critical Step: Permissions

Apple protects the Shortcuts database (`~/Library/Shortcuts/...`). To allow the backend to read it:

1. Open **System Settings** > **Privacy & Security** > **Full Disk Access**.
2. Click the **+** button.
3. Add your **Terminal** app (e.g., iTerm2, Terminal) or **VS Code**.
4. Restart your Terminal/Editor.

*Note: The script creates a temporary copy of the database in `/tmp` to avoid file locking issues.*

---

## ▶️ Usage

### Start the Backend

```bash
# In /backend directory
node server.js

```

*You should see: `✅ Shortcuts Database mirrored` and `🚀 Server running on port 8000*`

### Start the Frontend

```bash
# In /frontend directory
npm start

```

*Opens `http://localhost:3000*`

### How to Use

1. Type a request: *"If battery is < 20%, turn on Low Power Mode."*
2. Watch the **"Show Process"** toggle to see the Agent searching the database.
3. Copy the generated **Jellycuts** code.
4. Paste it into the [Jellycuts App](https://jellycuts.com/) on your iPhone/Mac to export it as a real Shortcut.

---

## 🧠 Architecture (How it works)

1. **User Query:** Sent from React to Node.js.
2. **Agent Loop:**
* The Agent (Gemini) analyzes the request.
* It realizes it needs technical IDs (e.g., `is.workflow.actions.getbatterylevel`).
* It calls the **MCP Tool**: `search_internal_actions("battery")`.


3. **MCP Server:**
* Queries the mirrored `Tools.sqlite` file using SQL.
* Returns the JSON schema of the action.


4. **Code Generation:**
* The Agent uses the schema to construct valid Jellycuts syntax.


5. **Response:** The UI renders the explanation, the code, and the execution log.

---

## 🤝 Contributing

Pull requests are welcome! If you find new tables in the Apple Shortcuts database that reveal more functionality, please open an issue.

## 📄 License

MIT License.

---

### ⚠️ Disclaimer

This tool interacts with internal macOS databases that are not documented by Apple. It is for educational and research purposes. Always back up your Shortcuts before running generated code.