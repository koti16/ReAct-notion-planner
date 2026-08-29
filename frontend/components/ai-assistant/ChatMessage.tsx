"use client"

import ReactMarkdown from "react-markdown"
import { Bot } from "lucide-react"

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const time = message.timestamp.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  if (message.role === "user") {
    return (
      <div className="chat-message user-message">
        <div className="message-bubble user-bubble">
          <p>{message.content}</p>
          <span className="message-time">{time}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-message ai-message">
      <div className="ai-avatar">
        <Bot size={16} strokeWidth={2} />
      </div>
      <div className="message-bubble ai-bubble">
        <div className="ai-markdown">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        <span className="message-time">{time}</span>
      </div>
    </div>
  )
}
