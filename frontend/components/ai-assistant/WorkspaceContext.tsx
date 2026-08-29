"use client"

import { Bot, CalendarDays, CheckCircle2, Circle, LayoutDashboard, ListTodo } from "lucide-react"

export function WorkspaceContext() {
  return (
    <aside className="workspace-context-panel">
      <div className="context-section">
        <h4 className="context-title">
          <LayoutDashboard size={13} strokeWidth={2.5} />
          Workspace Context
        </h4>
        <div className="context-stats">
          <div className="context-stat">
            <ListTodo size={13} />
            <span className="stat-label">Active tasks</span>
            <strong className="stat-value">12</strong>
          </div>
          <div className="context-stat overdue">
            <Circle size={13} />
            <span className="stat-label">Overdue</span>
            <strong className="stat-value">3</strong>
          </div>
          <div className="context-stat today">
            <CalendarDays size={13} />
            <span className="stat-label">Due today</span>
            <strong className="stat-value">4</strong>
          </div>
          <div className="context-stat priority">
            <Circle size={13} />
            <span className="stat-label">High priority</span>
            <strong className="stat-value">2</strong>
          </div>
          <div className="context-stat completed">
            <CheckCircle2 size={13} />
            <span className="stat-label">Completed this week</span>
            <strong className="stat-value">6</strong>
          </div>
        </div>
      </div>

      <div className="context-divider" />

      <div className="context-section">
        <h4 className="context-title">
          <Bot size={13} strokeWidth={2.5} />
          Assistant Context
        </h4>
        <div className="context-features">
          <div className="context-feature connected">
            <span className="feature-dot" />
            <span>Tasks</span>
          </div>
          <div className="context-feature connected">
            <span className="feature-dot" />
            <span>Planner</span>
          </div>
          <div className="context-feature connected">
            <span className="feature-dot" />
            <span>Workspace</span>
          </div>
          <div className="context-feature disconnected">
            <span className="feature-dot" />
            <span>Notion connection</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
