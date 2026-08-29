"use client"

import { History, Plus, Sparkles, Wifi, WifiOff } from "lucide-react"

interface AssistantHeaderProps {
  onNewConversation: () => void
  onToggleHistory: () => void
  historyOpen: boolean
  isOnline?: boolean
}

export function AssistantHeader({ onNewConversation, onToggleHistory, historyOpen, isOnline }: AssistantHeaderProps) {
  return (
    <div className="ai-header">
      <div className="ai-header-left">
        <span className="eyebrow coral">Workspace / AI Assistant</span>
        <h2>AI Assistant</h2>
        <p className="ai-subtitle">Plan, organize, and manage your workspace with natural language.</p>
      </div>
      <div className="ai-header-actions">
        <div className="ai-status-indicator">
          <span className={`status-dot ${isOnline ? "online" : "offline"}`} />
          {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span>{isOnline ? "Backend online" : "Backend offline"}</span>
        </div>
        <button
          className="ai-header-btn"
          onClick={onToggleHistory}
          aria-label="Toggle conversation history"
        >
          <History size={16} />
          <span>History</span>
        </button>
        <button
          className="ai-header-btn primary"
          onClick={onNewConversation}
          aria-label="Start new conversation"
        >
          <Plus size={16} />
          <span>New conversation</span>
        </button>
      </div>
    </div>
  )
}
