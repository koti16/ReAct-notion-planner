"use client"

import { Zap, Calendar, Plus, ListOrdered, FileText } from "lucide-react"

interface QuickActionsProps {
  onAction: (text: string) => void
}

const ACTIONS = [
  { label: "Plan my day", icon: Calendar },
  { label: "Plan my week", icon: ListOrdered },
  { label: "Create task", icon: Plus },
  { label: "Prioritize tasks", icon: Zap },
  { label: "Summarize workspace", icon: FileText },
]

export function QuickActions({ onAction }: QuickActionsProps) {
  return (
    <div className="quick-actions">
      {ACTIONS.map(({ label, icon: Icon }) => (
        <button
          key={label}
          className="quick-action-btn"
          onClick={() => onAction(label)}
        >
          <Icon size={13} strokeWidth={2.5} />
          {label}
        </button>
      ))}
    </div>
  )
}
