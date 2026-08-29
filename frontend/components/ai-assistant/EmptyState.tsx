"use client"

import { Bot } from "lucide-react"

interface EmptyStateProps {
  onSuggestionClick: (prompt: string) => void
}

const SUGGESTIONS = [
  {
    title: "Plan my day",
    description: "Get a structured schedule for today",
    icon: "☀",
  },
  {
    title: "What should I focus on today?",
    description: "Prioritize based on your tasks",
    icon: "🎯",
  },
  {
    title: "Organize my overdue tasks",
    description: "Clear out what's been piling up",
    icon: "📋",
  },
  {
    title: "Create a plan for my project",
    description: "Break down work into clear steps",
    icon: "🚀",
  },
]

export function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="ai-empty-state">
      <div className="ai-orb-wrapper">
        <div className="ai-orb">
          <Bot size={28} strokeWidth={1.5} />
          <div className="ai-orb-ring" />
        </div>
      </div>
      <h3 className="ai-empty-title">How can I help you today?</h3>
      <p className="ai-empty-subtitle">
        Ask me to organize your tasks, plan your day, or manage your workspace.
      </p>
      <div className="ai-suggestion-grid">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.title}
            className="ai-suggestion-card"
            onClick={() => onSuggestionClick(s.title)}
          >
            <span className="suggestion-icon">{s.icon}</span>
            <strong>{s.title}</strong>
            <span>{s.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
