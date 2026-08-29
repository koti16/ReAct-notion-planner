"use client"

import { ArrowUp, Mic, Paperclip, SendHorizontal, X } from "lucide-react"
import { useRef, useState } from "react"

interface ChatComposerProps {
  onSend: (text: string) => void
  disabled?: boolean
}

export function ChatComposer({ onSend, disabled }: ChatComposerProps) {
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value)
    const el = e.target
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  return (
    <div className="chat-composer">
      <textarea
        ref={textareaRef}
        className="composer-input"
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything about your workspace..."
        rows={1}
        disabled={disabled}
        aria-label="Chat input"
      />
      <div className="composer-actions">
        <button className="composer-btn attachment" aria-label="Attach file">
          <Paperclip size={16} />
        </button>
        <button className="composer-btn mic" aria-label="Voice input">
          <Mic size={16} />
        </button>
        <button
          className="composer-btn send"
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          aria-label="Send message"
        >
          <SendHorizontal size={16} />
        </button>
      </div>
    </div>
  )
}
