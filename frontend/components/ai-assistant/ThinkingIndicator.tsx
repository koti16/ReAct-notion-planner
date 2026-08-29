"use client"

import { Bot } from "lucide-react"
import { useEffect, useState } from "react"

export function ThinkingIndicator() {
  const [dots, setDots] = useState("")

  useEffect(() => {
    const cycle = ["", ".", "..", "..."]
    let i = 0
    const interval = setInterval(() => {
      setDots(cycle[i % cycle.length])
      i++
    }, 400)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="chat-message ai-message thinking-message">
      <div className="ai-avatar thinking-avatar">
        <Bot size={16} strokeWidth={2} />
      </div>
      <div className="message-bubble ai-bubble thinking-bubble">
        <span className="thinking-text">Thinking{dots}</span>
      </div>
    </div>
  )
}
