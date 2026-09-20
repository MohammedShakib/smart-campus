import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, MessageSquare, Send, Sparkles, X } from 'lucide-react';
import { api } from '../../utils/api';
import '../../styles/chatbot.css';

const QUICK_PROMPTS = [
  'Campus shuttle schedule',
  'How to submit a ticket?',
  'Office hours info',
  'Campus facilities',
];

function renderMarkdown(text) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBlockLines = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${index}`}>
            <code>{codeBlockLines.join('\n')}</code>
          </pre>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    elements.push(
      <span key={`line-${index}`}>
        {processInline(line)}
        {index < lines.length - 1 ? <br /> : null}
      </span>
    );
  }

  if (inCodeBlock && codeBlockLines.length > 0) {
    elements.push(
      <pre key="code-end">
        <code>{codeBlockLines.join('\n')}</code>
      </pre>
    );
  }

  return elements;
}

function processInline(text) {
  const parts = [];
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      parts.push(<strong key={match.index}>{match[2]}</strong>);
    } else if (match[4]) {
      parts.push(<em key={match.index}>{match[4]}</em>);
    } else if (match[6]) {
      parts.push(<code key={match.index}>{match[6]}</code>);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  function toggleChat() {
    if (isOpen) {
      setIsClosing(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsClosing(false);
      }, 250);
      return;
    }

    setIsOpen(true);
    setHasUnread(false);
  }

  async function sendMessage(text) {
    const userMessage = (text || input).trim();
    if (!userMessage || isLoading) return;

    const history = messages.map((message) => ({
      role: message.role === 'user' ? 'user' : 'assistant',
      text: message.text,
    }));

    setMessages((current) => [...current, { role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api('/api/chatbot', {
        method: 'POST',
        body: JSON.stringify({ message: userMessage, history }),
      });

      const reply = response?.data?.reply || 'Sorry, I could not generate a response.';
      setMessages((current) => [...current, { role: 'assistant', text: reply }]);

      if (!isOpen) {
        setHasUnread(true);
      }
    } catch (err) {
      const errorText = err.message === 'SESSION_REQUIRED'
        ? 'Your session has expired. Please log in again.'
        : err.message === 'FORBIDDEN'
          ? 'You do not have access to CampusAI.'
          : err.message || 'Sorry, I encountered an error. Please try again.';
      setMessages((current) => [...current, { role: 'assistant', text: errorText }]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      <button
        type="button"
        className={`chatbot-fab${isOpen ? ' chatbot-fab--open' : ''}`}
        onClick={toggleChat}
        aria-label={isOpen ? 'Close CampusAI chatbot' : 'Open CampusAI chatbot'}
      >
        <span className="chatbot-fab-icon">
          {isOpen ? <X size={24} /> : <Bot size={26} />}
        </span>
        {hasUnread && !isOpen && <span className="chatbot-fab-badge" />}
      </button>

      {isOpen && (
        <div className={`chatbot-panel${isClosing ? ' chatbot-panel--closing' : ''}`}>
          <div className="chatbot-header">
            <div className="chatbot-header-avatar">
              <Sparkles size={20} />
            </div>
            <div className="chatbot-header-info">
              <strong>CampusAI</strong>
              <span>
                <span className="chatbot-status-dot" />
                Smart Campus Assistant
              </span>
            </div>
            <button type="button" className="chatbot-close-btn" onClick={toggleChat} aria-label="Close chat">
              <X size={16} />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.length === 0 && !isLoading && (
              <div className="chatbot-welcome">
                <div className="chatbot-welcome-icon">
                  <MessageSquare size={26} />
                </div>
                <h3>Hi, I&apos;m CampusAI</h3>
                <p>Your Smart Campus assistant for campus services, schedules, and facilities.</p>
                <div className="chatbot-chips">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="chatbot-chip"
                      onClick={() => sendMessage(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`chatbot-msg chatbot-msg--${message.role === 'user' ? 'user' : 'bot'}`}>
                <div className="chatbot-msg-avatar">
                  {message.role === 'user' ? 'You' : <Bot size={16} />}
                </div>
                <div className="chatbot-msg-bubble">
                  {message.role === 'user' ? message.text : renderMarkdown(message.text)}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="chatbot-typing">
                <div className="chatbot-typing-avatar">
                  <Bot size={16} />
                </div>
                <div className="chatbot-typing-bubble" aria-label="CampusAI is typing">
                  <span className="chatbot-typing-dot" />
                  <span className="chatbot-typing-dot" />
                  <span className="chatbot-typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input-area">
            <textarea
              ref={inputRef}
              className="chatbot-input"
              placeholder="Ask CampusAI anything..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isLoading}
            />
            <button
              type="button"
              className="chatbot-send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
