"use client"

import { CalendarDays, Check, Edit3, Plus } from "lucide-react"

export interface PreviewTask {
  id: string
  title: string
  priority: "High" | "Medium" | "Low"
  due: string
  completed?: boolean
}

interface TaskPreviewProps {
  tasks: PreviewTask[]
  onComplete: (id: string) => void
  onEdit: (id: string) => void
  onAddToPlanner: (id: string) => void
}

export function TaskPreview({ tasks, onComplete, onEdit, onAddToPlanner }: TaskPreviewProps) {
  if (!tasks.length) return null

  return (
    <div className="task-preview-list">
      {tasks.map((task) => (
        <div key={task.id} className="task-preview-card">
          <div className="task-preview-check" onClick={() => onComplete(task.id)}>
            <span className={`preview-circle ${task.completed ? "done" : ""}`} />
          </div>
          <div className="task-preview-body">
            <p className={`task-preview-title ${task.completed ? "done" : ""}`}>
              {task.title}
            </p>
            <div className="task-preview-meta">
              <span className={`priority-tag ${task.priority.toLowerCase()}`}>
                {task.priority} priority
              </span>
              <span className="due-tag">
                <CalendarDays size={10} />
                {task.due}
              </span>
            </div>
          </div>
          <div className="task-preview-actions">
            <button
              className="task-action-btn"
              onClick={() => onComplete(task.id)}
              aria-label="Mark complete"
            >
              <Check size={13} />
            </button>
            <button
              className="task-action-btn"
              onClick={() => onEdit(task.id)}
              aria-label="Edit task"
            >
              <Edit3 size={13} />
            </button>
            <button
              className="task-action-btn"
              onClick={() => onAddToPlanner(task.id)}
              aria-label="Add to planner"
            >
              <Plus size={13} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
