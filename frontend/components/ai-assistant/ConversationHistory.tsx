"use client"

import { ChevronDown, ChevronRight, MessageSquare, Pencil, Plus, Trash2, X } from "lucide-react"
import { useState } from "react"

interface Conversation {
  id: string
  title: string
  preview: string
  timestamp: Date
}

interface ConversationGroup {
  label: string
  conversations: Conversation[]
}

interface ConversationHistoryProps {
  open: boolean
  onClose: () => void
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  activeId?: string
}

const MOCK_HISTORY: ConversationGroup[] = [
  {
    label: "Today",
    conversations: [
      {
        id: "1",
        title: "Plan my day",
        preview: "Here's your focused plan for today...",
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
      },
      {
        id: "2",
        title: "Organize my tasks",
        preview: "I've sorted your tasks by priority...",
        timestamp: new Date(Date.now() - 1000 * 60 * 90),
      },
    ],
  },
  {
    label: "Yesterday",
    conversations: [
      {
        id: "3",
        title: "Project planning",
        preview: "Here's a breakdown of your project...",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26),
      },
      {
        id: "4",
        title: "Weekly review",
        preview: "This week you completed 12 tasks...",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 28),
      },
    ],
  },
  {
    label: "Previous 7 days",
    conversations: [
      {
        id: "5",
        title: "Notion integration help",
        preview: "Here's how to connect Notion...",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
      },
      {
        id: "6",
        title: "Task management tips",
        preview: "Here are some best practices...",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
      },
    ],
  },
]

export function ConversationHistory({
  open,
  onClose,
  onSelectConversation,
  onNewConversation,
  activeId,
}: ConversationHistoryProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    Today: true,
    Yesterday: true,
    "Previous 7 days": true,
  })
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  function toggleGroup(label: string) {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  function formatTime(date: Date) {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  if (!open) return null

  return (
    <div className="history-panel">
      <div className="history-header">
        <span className="eyebrow">Conversations</span>
        <div className="history-header-actions">
          <button className="history-new-btn" onClick={onNewConversation} aria-label="New conversation">
            <Plus size={14} />
          </button>
          <button className="history-close-btn" onClick={onClose} aria-label="Close history">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="history-groups">
        {MOCK_HISTORY.map((group) => (
          <div key={group.label} className="history-group">
            <button className="history-group-header" onClick={() => toggleGroup(group.label)}>
              {expanded[group.label] ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              <span>{group.label}</span>
              <span className="group-count">{group.conversations.length}</span>
            </button>
            {expanded[group.label] && (
              <div className="history-items">
                {group.conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`history-item ${activeId === conv.id ? "active" : ""}`}
                    onMouseEnter={() => setHoveredId(conv.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <button
                      className="history-item-main"
                      onClick={() => onSelectConversation(conv.id)}
                    >
                      <MessageSquare size={13} className="history-item-icon" />
                      <div className="history-item-text">
                        <span className="history-item-title">{conv.title}</span>
                        <span className="history-item-time">{formatTime(conv.timestamp)}</span>
                      </div>
                    </button>
                    {hoveredId === conv.id && (
                      <div className="history-item-actions">
                        <button
                          className="history-item-btn"
                          onClick={(e) => { e.stopPropagation(); }}
                          aria-label="Rename conversation"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          className="history-item-btn danger"
                          onClick={(e) => { e.stopPropagation(); }}
                          aria-label="Delete conversation"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
