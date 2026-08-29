"use client"

import { useState } from "react"
import { Check, X, Trash2, AlertTriangle, Loader2 } from "lucide-react"

export interface ActionCardData {
  id: string
  title: string
  items: string[]
  actionLabel: string
  destructive?: boolean
  onConfirm: (id: string) => void
  onCancel: (id: string) => void
}

interface AIActionCardProps {
  card: ActionCardData
  status?: "idle" | "loading" | "success" | "error"
  errorMessage?: string | null
}

export function AIActionCard({ card, status = "idle", errorMessage }: AIActionCardProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const isBusy = status === "loading" || status === "success"

  function handleConfirm() {
    if (isBusy) return
    if (card.destructive) {
      setShowConfirm(true)
    } else {
      card.onConfirm(card.id)
    }
  }

  function handleFinalConfirm() {
    if (isBusy) return
    card.onConfirm(card.id)
  }

  function handleCancel() {
    if (isBusy) return
    card.onCancel(card.id)
  }

  return (
    <div className="ai-action-card">
      <div className="ai-action-header">
        <p className="ai-action-title">{card.title}</p>
      </div>
      <div className="ai-action-items">
        {card.items.map((item, i) => (
          <div key={i} className="ai-action-item">
            <span className="action-item-dot" />
            {item}
          </div>
        ))}
      </div>
      {status === "error" && errorMessage && (
        <div className="ai-action-error" role="alert">
          <AlertTriangle size={13} />
          <span>{errorMessage}</span>
        </div>
      )}
      {status === "success" && (
        <div className="ai-action-success" role="status">
          <Check size={13} />
          <span>Tasks created successfully.</span>
        </div>
      )}
      <div className="ai-action-footer">
        {showConfirm ? (
          <div className="confirm-destructive">
            <AlertTriangle size={14} />
            <span>Are you sure?</span>
            <button className="confirm-yes" onClick={handleFinalConfirm} disabled={isBusy}>Yes, delete</button>
            <button className="confirm-no" onClick={() => setShowConfirm(false)} disabled={isBusy}>Cancel</button>
          </div>
        ) : (
          <>
            <button
              className={`action-confirm ${card.destructive ? "destructive" : ""}`}
              onClick={handleConfirm}
              disabled={isBusy}
            >
              {status === "loading" ? (
                <>
                  <Loader2 size={13} className="action-spinner" />
                  Creating…
                </>
              ) : status === "success" ? (
                <>
                  <Check size={13} />
                  Created
                </>
              ) : (
                card.actionLabel
              )}
            </button>
            <button className="action-cancel" onClick={handleCancel} disabled={isBusy}>
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  )
}
