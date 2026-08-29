"use client"

import { useState, useRef, useEffect } from "react"
import { AssistantHeader } from "../../components/ai-assistant/AssistantHeader"
import { EmptyState } from "../../components/ai-assistant/EmptyState"
import { ChatMessage, type Message } from "../../components/ai-assistant/ChatMessage"
import { ThinkingIndicator } from "../../components/ai-assistant/ThinkingIndicator"
import { QuickActions } from "../../components/ai-assistant/QuickActions"
import { ChatComposer } from "../../components/ai-assistant/ChatComposer"
import { TaskPreview, type PreviewTask } from "../../components/ai-assistant/TaskPreview"
import { AIActionCard, type ActionCardData } from "../../components/ai-assistant/AIActionCard"
import { ConversationHistory } from "../../components/ai-assistant/ConversationHistory"
import { WorkspaceContext } from "../../components/ai-assistant/WorkspaceContext"
import { ErrorState } from "../../components/ai-assistant/ErrorState"
import { Sidebar } from "../../components/Sidebar"
import { Header } from "../../components/Header"
import { api } from "../../services/api"

// Mock data for AI responses
const MOCK_RESPONSES: Record<string, { text: string; tasks?: PreviewTask[] }> = {
  "Plan my day": {
    text: `Here's your focused plan for today:

1. **Finish the Planner UI** — Complete the drag-and-drop integration
2. **Test task management** — Verify all CRUD operations work
3. **Work on the AI Assistant** — Finish the chat interface
4. **Commit the completed changes** — Keep the repo clean

I'd recommend starting with the Planner UI since that's where you left off.`,
    tasks: [
      { id: "t1", title: "Finish the Planner UI", priority: "High", due: "Today" },
      { id: "t2", title: "Test task management", priority: "High", due: "Today" },
      { id: "t3", title: "Work on the AI Assistant", priority: "Medium", due: "Today" },
      { id: "t4", title: "Commit the completed changes", priority: "Low", due: "Today" },
    ],
  },
  "What should I focus on today?": {
    text: `Based on your workspace, here's what deserves your attention:

**High Priority (2 tasks)**
- Review Q3 product roadmap (Due today, 4:00 PM)
- Prepare LangGraph research notes (Due tomorrow)

**With deadlines approaching**
- Set up weekly planning ritual (Sep 02)
- Update onboarding checklist (Sep 04)

Focus on the roadmap first — it's blocking other people's work.`,
    tasks: [
      { id: "t5", title: "Review Q3 product roadmap", priority: "High", due: "Today, 4:00 PM" },
      { id: "t6", title: "Prepare LangGraph research notes", priority: "High", due: "Tomorrow" },
    ],
  },
  "Organize my overdue tasks": {
    text: `I found 3 overdue tasks in your workspace. Here's what I'd recommend:

1. **Send follow-up to design team** — Low priority, but the conversation is stale. Schedule 10 min.
2. **Review Q3 product roadmap** — High priority. Needs attention today.
3. **Prepare LangGraph research notes** — Medium priority. Move to this week.

Want me to reschedule these?`,
  },
  "Create a plan for my project": {
    text: `I'd be happy to help plan your project! To give you a useful structure, I need a bit more context:

- **What project are you working on?**
- **What's the target deadline?**
- **Are there specific milestones or deliverables?**

Share a few details and I'll break it down into clear, actionable steps.`,
  },
}
function getMockResponse(userText: string) {
  const lower = userText.toLowerCase()
  for (const [key, value] of Object.entries(MOCK_RESPONSES)) {
    if (lower.includes(key.toLowerCase())) return value
  }
  return {
    text: `That's a great question! Here's what I can tell you:

Based on your current workspace, you have **12 active tasks** across multiple priorities. The AI Assistant can help you:

- **Organize tasks** by priority or deadline
- **Plan your day** with a structured schedule
- **Find overdue work** that needs attention
- **Break down projects** into actionable steps

Try asking me to "plan my day" or "what should I focus on today" for an immediate, actionable response.`,
  }
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [thinking, setThinking] = useState(false)
  const [error] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>()
  const [previewTasks, setPreviewTasks] = useState<PreviewTask[]>([])
  const [actionCard, setActionCard] = useState<ActionCardData | null>(null)
  const [actionCardStatus, setActionCardStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [actionCardError, setActionCardError] = useState<string | null>(null)
  const [showActionCard, setShowActionCard] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [active] = useState("AI Assistant")
  const [backendOnline, setBackendOnline] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const hasMessages = messages.length > 0

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, thinking])

  useEffect(() => {
    let cancelled = false
    async function checkBackend() {
      try {
        const result = await api.health()
        if (!cancelled) setBackendOnline(result?.status === "healthy")
      } catch {
        if (!cancelled) setBackendOnline(false)
      }
    }
    checkBackend()
    return () => { cancelled = true }
  }, [])

  async function handleCreateTasks(_id: string) {
    if (actionCardStatus === "loading" || actionCardStatus === "success") return
    if (previewTasks.length === 0) return
    setActionCardStatus("loading")
    setActionCardError(null)
    try {
      await Promise.all(
        previewTasks.map((task) =>
          api.createTask({ title: task.title, status: "To do", priority: task.priority })
        )
      )
      setActionCardStatus("success")
      setTimeout(() => {
        setShowActionCard(false)
        setPreviewTasks([])
        setActionCard(null)
        setActionCardStatus("idle")
      }, 1500)
    } catch (err) {
      setActionCardStatus("error")
      setActionCardError(err instanceof Error ? err.message : "Failed to create tasks. Please try again.")
    }
  }

  function handleCancelTasks(_id: string) {
    setShowActionCard(false)
    setPreviewTasks([])
    setActionCard(null)
    setActionCardStatus("idle")
    setActionCardError(null)
  }

  function handleSend(text: string) {
    const userMsg: Message = { id: `user-${Date.now()}`, role: "user", content: text, timestamp: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setThinking(true)
    setPreviewTasks([])
    setShowActionCard(false)
    setActionCardStatus("idle")
    setActionCardError(null)

    setTimeout(() => {
      const response = getMockResponse(text)
      const aiMsg: Message = { id: `ai-${Date.now()}`, role: "assistant", content: response.text, timestamp: new Date() }
      setMessages((prev) => [...prev, aiMsg])
      setThinking(false)
      if (response.tasks && response.tasks.length > 0) {
        setPreviewTasks(response.tasks)
        setActionCard({
          id: "action-1",
          title: "Create these tasks?",
          items: response.tasks.map((t) => t.title),
          actionLabel: "Create Tasks",
          onConfirm: handleCreateTasks,
          onCancel: handleCancelTasks,
        })
        setShowActionCard(true)
      }
    }, 1800)
  }

  function handleSuggestion(prompt: string) { handleSend(prompt) }

  function handleNewConversation() {
    setMessages([])
    setPreviewTasks([])
    setShowActionCard(false)
    setActionCard(null)
    setActionCardStatus("idle")
    setActionCardError(null)
    setThinking(false)
    setHistoryOpen(false)
    setActiveConversationId(undefined)
  }

  function handleSelectConversation(id: string) {
    setActiveConversationId(id)
    setHistoryOpen(false)
    handleSend("Plan my day")
  }

  function handleTaskComplete(id: string) {
    setPreviewTasks((prev) => prev.map((t) => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  function handleTaskEdit(id: string) { console.log("Edit task:", id) }
  function handleAddToPlanner(id: string) { console.log("Add to planner:", id) }

  return (
    <div className="app-shell">
      <Sidebar
        active={active}
        onNavigate={() => {}}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <ConversationHistory
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        activeId={activeConversationId}
      />
      <div className="page-area">
        <Header onMenu={() => setSidebarOpen(true)} active={active} />
        <AssistantHeader
          onNewConversation={handleNewConversation}
          onToggleHistory={() => setHistoryOpen((v) => !v)}
          historyOpen={historyOpen}
          isOnline={backendOnline}
        />
        <div className="ai-page-content">
          <main className="ai-chat-area">
            {!hasMessages && !thinking && !error && (
              <EmptyState onSuggestionClick={handleSuggestion} />
            )}
            {error && <ErrorState onRetry={handleNewConversation} />}
            {(hasMessages || thinking) && !error && (
              <div className="chat-messages">
                {messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
                {thinking && <ThinkingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            )}
            {hasMessages && !thinking && <QuickActions onAction={handleSend} />}
            {previewTasks.length > 0 && !thinking && (
              <div className="preview-section">
                <p className="preview-label">Recommended tasks</p>
                <TaskPreview
                  tasks={previewTasks}
                  onComplete={handleTaskComplete}
                  onEdit={handleTaskEdit}
                  onAddToPlanner={handleAddToPlanner}
                />
              </div>
            )}
            {showActionCard && actionCard && (
              <div className="action-card-section">
                <AIActionCard
                  card={actionCard}
                  status={actionCardStatus}
                  errorMessage={actionCardError}
                />
              </div>
            )}
            <div className="chat-composer-wrapper">
              <ChatComposer onSend={handleSend} disabled={thinking} />
            </div>
          </main>
          <WorkspaceContext />
        </div>
      </div>
    </div>
  )
}
