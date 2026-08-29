"use client"

import { RefreshCw } from "lucide-react"

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  message = "Unable to connect to the AI Assistant.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="ai-error-state">
      <div className="error-icon">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="19" stroke="var(--coral)" strokeWidth="1.5" strokeDasharray="4 3" />
          <path d="M20 12v10M20 26v2" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <p className="error-message">{message}</p>
      {onRetry && (
        <button className="error-retry-btn" onClick={onRetry}>
          <RefreshCw size={14} />
          Try again
        </button>
      )}
    </div>
  )
}
