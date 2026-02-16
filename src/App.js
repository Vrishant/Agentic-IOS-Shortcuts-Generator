import React, { useState, useRef, useEffect } from "react";
import MessageBubble from "./components/MessageBubble";
import { Send, Zap, Clock, Settings, Command } from "lucide-react"; // Import icons
import "./App.css";
import { Steps } from "openai/resources/beta/threads/runs.js";

function App() {
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { role: "system", content: "Agent Ready. I can search Apple's internal database to write Shortcuts for you." }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSend = async () => {
    if (!query.trim()) return;

    const userMessage = { role: "user", content: query };
    setChatHistory((prev) => [...prev, userMessage]);
    setQuery("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: query }),
      });

      const data = await response.json();
      const botMessage = {
        role: "assistant",
        content: data.response,
        code: data.shortcutCode,
        steps: data.steps || []
      };

      setChatHistory((prev) => [...prev, botMessage]);
    } catch (error) {
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: "Error: Could not connect to Agent backend." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="app-container">
      {/* 1. SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-title">
          <Zap size={20} className="text-primary" />
          <span>Shortcut Agent</span>
        </div>
        
        <div className="nav-item active">
          <Command size={18} />
          <span>New Chat</span>
        </div>
        <div className="nav-item">
          <Clock size={18} />
          <span>History</span>
        </div>
        <div style={{ flex: 1 }}></div> {/* Spacer */}
        <div className="nav-item">
          <Settings size={18} />
          <span>Settings</span>
        </div>
      </div>

      {/* 2. MAIN CHAT */}
      <div className="chat-area">
        {/* Header */}
        <div className="chat-header">
          <div >
            <h5 className="m-0 fw-bold" style={{color: "white"}}>Agent Workspace</h5>
            <small className="text-muted" style={{color: "white"}}>Connected to Local Database</small>
          </div>
          <div className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill">
            ● System Online
          </div>
        </div>

        {/* Messages */}
        <div className="messages-container">
          {chatHistory.map((msg, index) => (
            <MessageBubble 
              key={index} 
              role={msg.role} 
              content={msg.content} 
              code={msg.code} 
            />
          ))}
          {loading && (
             <div className="d-flex align-items-center gap-2 text-muted ms-3 mt-3">
               <div className="spinner-border spinner-border-sm" role="status"></div>
               <small>Thinking...</small>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="input-container">
          <div className="input-box">
            <textarea
              className="chat-input"
              rows="1"
              placeholder="Ask for a shortcut (e.g. 'Toggle Wi-Fi')..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button 
                className="send-btn" 
                onClick={handleSend} 
                disabled={loading}
            >
              <Send size={18} />
            </button>
          </div>
          <div className="text-center mt-2">
            <small className="text-muted" style={{fontSize: '0.75rem'}}>
              AI can make mistakes. Please review the Jellycuts code.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;