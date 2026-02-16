import React, { useState } from 'react';
import { Copy, Check, Terminal, Code, User, Bot } from 'lucide-react';

const MessageBubble = ({ role, content, code }) => {
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);

  const formatCode = (input) => {
    if (!input) return null;
    if (typeof input === 'object') return JSON.stringify(input, null, 2);
    return input;
  };

  const displayCode = formatCode(code);

  const handleCopy = () => {
    navigator.clipboard.writeText(displayCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`d-flex mb-4 ${isUser ? 'justify-content-end' : 'justify-content-start'}`}>
      
      {/* Avatar (Left for Bot) */}
      {!isUser && (
        <div className="me-3 d-flex flex-column justify-content-end pb-2">
           <div className="rounded-circle d-flex align-items-center justify-content-center" 
                style={{width: '32px', height: '32px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)'}}>
              <Bot size={16} className="text-info"/>
           </div>
        </div>
      )}

      {/* Bubble */}
      <div 
        className="position-relative shadow-sm"
        style={{ 
          maxWidth: '80%', 
          borderRadius: '16px',
          borderTopLeftRadius: !isUser ? '4px' : '16px',
          borderBottomRightRadius: isUser ? '4px' : '16px',
          backgroundColor: isUser ? 'var(--user-bubble)' : 'var(--ai-bubble)',
          border: isUser ? 'none' : '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          padding: '1.25rem'
        }}
      >
        {/* Header Name */}
        {!isUser && (
            <div className="d-flex align-items-center gap-2 mb-2">
               <span className="fw-bold" style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>Shortcut Agent</span>
            </div>
        )}

        {/* Text Content */}
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.95rem' }}>
          {content}
        </div>

        {/* Code Card */}
        {displayCode && (
          <div className="mt-3 rounded overflow-hidden" style={{ border: '1px solid #30363d', background: '#0d1117' }}>
            <div className="d-flex justify-content-between align-items-center px-3 py-2" style={{ background: '#161b22', borderBottom: '1px solid #30363d' }}>
              <div className="d-flex align-items-center gap-2">
                  <Code size={14} className="text-secondary"/>
                  <span className="font-monospace text-secondary" style={{fontSize: '0.8rem'}}>shortcut.jelly</span>
              </div>
              
              <button 
                  onClick={handleCopy} 
                  className="btn btn-sm text-decoration-none p-0 d-flex align-items-center gap-1"
                  style={{ color: 'var(--text-secondary)' }}
                  title="Copy Code"
              >
                {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                <span style={{fontSize: '11px'}}>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            
            <pre className="m-0 p-3 overflow-auto custom-scrollbar" style={{ maxHeight: '300px', fontSize: '0.85rem', color: '#a5d6ff' }}>
              <code>{displayCode}</code>
            </pre>
          </div>
        )}
      </div>

       {/* Avatar (Right for User) */}
       {isUser && (
        <div className="ms-3 d-flex flex-column justify-content-end pb-2">
           <div className="rounded-circle d-flex align-items-center justify-content-center" 
                style={{width: '32px', height: '32px', background: 'var(--user-bubble)'}}>
              <User size={16} className="text-white"/>
           </div>
        </div>
      )}

    </div>
  );
};

export default MessageBubble;