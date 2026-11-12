/**
 * AICounsellorChat.jsx
 *
 * Self-contained AI career counsellor chat widget for PathFinder.
 * Calls /ai/chat via aiApi.js and falls back to api.js if unreachable.
 * Maintains conversation history client-side.
 *
 * Props
 * ─────
 * context    {object}  — { testResult, topCareers } forwarded to the AI (optional)
 * language   {'en'|'hi'} — default 'en'
 * onClose    {function} — called when the user dismisses the widget (optional)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sendAIChat } from '../../services/aiApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLACEHOLDER = {
  en: 'Ask me about careers, streams, or entrance exams…',
  hi: 'करियर, स्ट्रीम या परीक्षाओं के बारे में पूछें…',
};

const WELCOME_MSG = {
  en: "Hello! I'm your PathFinder AI Career Counsellor 🎓\nAsk me anything about careers, streams (PCM/PCB/Commerce), or entrance exams (JEE, NEET, CLAT, CUET) for Class 8–12 students.",
  hi: 'नमस्ते! मैं आपका PathFinder AI करियर काउंसलर हूँ 🎓\nकरियर, स्ट्रीम (PCM/PCB/Commerce) या प्रवेश परीक्षाओं (JEE, NEET, CLAT, CUET) के बारे में कुछ भी पूछें।',
};

function SourceChip({ source }) {
  if (source === 'llm') {
    return (
      <span className="inline-block text-xs text-purple-500 ml-1" title="AI enhanced">✨</span>
    );
  }
  if (source === 'fallback') {
    return (
      <span className="inline-block text-xs text-slate-400 ml-1" title="Offline fallback">⚡</span>
    );
  }
  return null;
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function Bubble({ role, content, source }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
          AI
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-indigo-600 text-white rounded-br-sm'
            : 'bg-slate-100 text-slate-800 rounded-bl-sm'
        }`}
      >
        {content}
        {!isUser && source && <SourceChip source={source} />}
      </div>
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
        AI
      </div>
      <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 bg-slate-400 rounded-full inline-block animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Suggested questions ──────────────────────────────────────────────────────
const SUGGESTIONS_EN = [
  'Which stream should I choose after 10th?',
  'Tell me about becoming a Doctor',
  'What is JEE Advanced?',
  'What salary can Software Engineers earn?',
];
const SUGGESTIONS_HI = [
  '10वीं के बाद कौन सी स्ट्रीम चुनूँ?',
  'डॉक्टर बनने के बारे में बताएं',
  'JEE Advanced क्या है?',
  'Software Engineer की सैलरी क्या होती है?',
];

// ─── Main component ───────────────────────────────────────────────────────────
export default function AICounsellorChat({
  context = null,
  language = 'en',
  onClose = null,
}) {
  // Chat history stored as { role: 'user'|'assistant', content, source? }
  const [messages, setMessages] = useState([
    { role: 'assistant', content: WELCOME_MSG[language] ?? WELCOME_MSG.en, source: 'rules' },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const send = useCallback(async (text) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || sending) return;

    // Build history for the AI (omit welcome message)
    const historyForAI = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));

    // Append user message immediately
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    setSending(true);

    try {
      const response = await sendAIChat({
        message: trimmed,
        history: historyForAI,
        context,
        language,
      });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.reply, source: response.source },
      ]);
    } catch (_err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: language === 'hi'
            ? 'क्षमा करें, अभी उत्तर देने में समस्या आ रही है। कृपया पुनः प्रयास करें।'
            : 'Sorry, I am having trouble responding right now. Please try again.',
          source: 'fallback',
        },
      ]);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, sending, messages, context, language]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const suggestions = language === 'hi' ? SUGGESTIONS_HI : SUGGESTIONS_EN;
  const showSuggestions = messages.length <= 1; // Only show on first open

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
            🎓
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">
              {language === 'hi' ? 'PathFinder AI काउंसलर' : 'PathFinder AI Counsellor'}
            </p>
            <p className="text-xs text-indigo-200 leading-tight">
              {language === 'hi' ? 'Class 8–12 करियर मार्गदर्शन' : 'Class 8–12 Career Guidance'}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-xl leading-none"
            aria-label="Close chat"
          >
            ×
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.map((msg, i) => (
          <Bubble key={i} role={msg.role} content={msg.content} source={msg.source} />
        ))}
        {sending && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Suggested questions (shown only before the first user message) */}
      {showSuggestions && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => send(s)}
              className="text-xs px-3 py-1.5 rounded-full border border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-slate-100">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={PLACEHOLDER[language] ?? PLACEHOLDER.en}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition-shadow max-h-24 overflow-y-auto"
            disabled={sending}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || sending}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label={language === 'hi' ? 'भेजें' : 'Send'}
          >
            <svg className="w-4 h-4 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1.5 text-center">
          {language === 'hi'
            ? 'AI सलाह केवल मार्गदर्शन के लिए है। प्रवेश या नौकरी की गारंटी नहीं।'
            : 'AI guidance only. No guarantee of admission or employment.'}
        </p>
      </div>
    </div>
  );
}

