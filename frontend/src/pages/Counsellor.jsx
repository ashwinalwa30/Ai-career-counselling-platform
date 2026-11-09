/*
  Counsellor.jsx — AI chat page at /dashboard/counsellor.
  Student messages appear on the right; counsellor replies on the left with an avatar.
  Suggested chips seed the first message; the input supports Enter-to-send.
*/
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence }      from 'framer-motion'
import { Send, Sparkles }               from 'lucide-react'

import { sendChatMessage } from '../services/api'
import usePageTitle         from '../hooks/usePageTitle'

// ── Constants ─────────────────────────────────────────────────────────────────

/*
  SUGGESTED_QUESTIONS — seed chips shown before the student sends their first
  message. They disappear once the conversation starts.
*/
const SUGGESTED_QUESTIONS = [
  'Which stream suits me?',
  'What after Class 10?',
  'Is Data Science right for me?',
  'How do I prepare for JEE?',
  'What does a CA actually do?',
  'Tell me about civil services',
]

// Opening message from the counsellor shown immediately on page load
const WELCOME_MESSAGE = {
  id:     'welcome',
  role:   'counsellor',
  text:   "Hi! I'm your AI career counsellor. I can answer questions about streams, entrance exams, career paths, college choices, and more.\n\nTake the aptitude test for personalised advice — or just ask me anything below.",
  ts:     Date.now(),
}

// ── Sub-components ────────────────────────────────────────────────────────────

/*
  CounsellorAvatar — small teal circle with a sparkle icon used for every
  counsellor message. Keeps visual weight consistent without a photo.
*/
function CounsellorAvatar() {
  return (
    <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center flex-shrink-0 self-end mb-1">
      <Sparkles size={14} className="text-white" />
    </div>
  )
}

/*
  TypingIndicator — three animated dots shown while waiting for the API reply.
  Communicates that the counsellor is "thinking".
*/
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5 max-w-[85%]">
      <CounsellorAvatar />
      <div className="bg-surface border border-edge rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1.5 items-center h-4">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-muted"
              style={{
                animation: 'bounce 1.2s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/*
  ChatBubble — renders one message. Student bubbles are teal on the right;
  counsellor bubbles are surface-coloured on the left with an avatar.
  Newlines in the reply text are preserved; **bold** markers are rendered as <strong>.
*/
function ChatBubble({ message }) {
  const isStudent = message.role === 'student'

  /*
    parseBold — converts "**text**" markers to <strong> elements.
    Simple enough to avoid importing a Markdown library for this one pattern.
  */
  function parseBold(text) {
    const parts = text.split(/(\*\*[^*]+\*\*)/)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>
      }
      return part
    })
  }

  // Split on newlines to render multi-paragraph replies naturally
  const lines = message.text.split('\n').filter(l => l.length > 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-end gap-2.5 ${isStudent ? 'flex-row-reverse ml-auto' : ''} max-w-[85%]`}
    >
      {!isStudent && <CounsellorAvatar />}

      <div
        className={`
          rounded-2xl px-4 py-2.5
          ${isStudent
            ? 'bg-teal text-white rounded-br-sm'
            : 'bg-surface border border-edge text-ink rounded-bl-sm'
          }
        `}
      >
        {lines.map((line, i) => (
          <p key={i} className={`text-sm font-sans leading-relaxed ${i > 0 ? 'mt-1.5' : ''}`}>
            {parseBold(line)}
          </p>
        ))}
      </div>
    </motion.div>
  )
}

/*
  SuggestedChips — horizontally scrollable chips shown before the first user
  message. Clicking a chip populates and submits the input immediately.
*/
function SuggestedChips({ onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="px-4 pb-3"
    >
      <p className="text-[10px] font-sans font-semibold uppercase tracking-wide text-muted mb-2">
        Suggested questions
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 -mb-1">
        {SUGGESTED_QUESTIONS.map(q => (
          <button
            key={q}
            onClick={() => onSelect(q)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-sans font-semibold
              bg-surface border border-edge text-muted hover:text-ink hover:border-teal/40
              transition-colors cursor-pointer whitespace-nowrap"
          >
            {q}
          </button>
        ))}
      </div>
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

/*
  Counsellor — main chat page component.
  Maintains a messages array; appends student message immediately then waits
  for the API reply before removing the typing indicator and appending the reply.
*/
export default function Counsellor() {
  usePageTitle('AI Counsellor')
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [input,    setInput]    = useState('')
  const [typing,   setTyping]   = useState(false)

  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)

  // Auto-scroll to the bottom whenever a new message arrives or typing starts
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  // Whether the student has sent their first message (hides the chips once they do)
  const hasStudentMessage = messages.some(m => m.role === 'student')

  async function sendMessage(text) {
    const trimmed = text.trim()
    if (!trimmed || typing) return

    // Append the student's message immediately
    const studentMsg = { id: Date.now(), role: 'student', text: trimmed, ts: Date.now() }
    setMessages(prev => [...prev, studentMsg])
    // Mark "Chat with the AI counsellor" step as done in the dashboard next-steps list
    localStorage.setItem('pf-chat-sent', 'true')
    setInput('')
    setTyping(true)

    try {
      const res     = await sendChatMessage(trimmed)
      const reply   = res.data.reply
      const botMsg  = { id: Date.now() + 1, role: 'counsellor', text: reply, ts: Date.now() }
      setMessages(prev => [...prev, botMsg])
    } catch {
      const errMsg = {
        id:   Date.now() + 1,
        role: 'counsellor',
        text: "Sorry, I couldn't reach the server. Please try again in a moment.",
        ts:   Date.now(),
      }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setTyping(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    /*
      The chat UI fills the available viewport height from DashboardLayout.
      flex-col + flex-1 + min-h-0 is the standard trick to make a child div
      scrollable inside a flex container without overflowing the parent.
    */
    <div className="flex flex-col h-full">

      {/* Page header */}
      <div className="px-4 sm:px-6 pt-5 pb-3 border-b border-edge flex-shrink-0">
        <h1 className="font-serif text-xl font-semibold text-ink">AI Counsellor</h1>
        <p className="text-xs font-sans text-muted mt-0.5">
          Ask anything about careers, streams, exams, or colleges.
        </p>
      </div>

      {/* Message feed — scrollable, centred with max-width to stay readable on wide screens */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 space-y-3">
          {messages.map(msg => (
            <ChatBubble key={msg.id} message={msg} />
          ))}

          <AnimatePresence>
            {typing && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <TypingIndicator />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Invisible anchor element — scrollIntoView targets this */}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Suggested chips — shown only before the student's first message */}
      <AnimatePresence>
        {!hasStudentMessage && (
          <SuggestedChips onSelect={q => sendMessage(q)} />
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="px-4 sm:px-6 py-3 border-t border-edge flex-shrink-0 bg-surface">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me about careers, exams, streams…"
            rows={1}
            disabled={typing}
            className="flex-1 resize-none py-2.5 px-3.5 text-sm font-sans bg-paper border border-edge
              rounded-xl text-ink placeholder:text-muted
              focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal
              transition-colors disabled:opacity-50
              min-h-[42px] max-h-32 overflow-y-auto leading-relaxed"
            style={{ height: 'auto' }}
            onInput={e => {
              // Auto-grow the textarea up to max-h-32
              e.target.style.height = 'auto'
              e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || typing}
            aria-label="Send message"
            className="w-10 h-10 rounded-xl bg-teal hover:bg-teal-dark disabled:opacity-40
              disabled:cursor-not-allowed flex items-center justify-center
              transition-colors cursor-pointer flex-shrink-0"
          >
            <Send size={15} className="text-white" />
          </button>
        </div>
        <p className="text-center text-[10px] font-sans text-muted mt-2">
          Press Enter to send · Shift+Enter for a new line
        </p>
      </div>

    </div>
  )
}
