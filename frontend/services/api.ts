export interface Task {
  id?: string | null
  title: string
  status: string
  priority: string
  date?: string
  project?: string
}

export interface ConnectionStatus { connected: boolean; workspaceName?: string; error?: string | null }
export interface ChatResponse { answer: string; createdTask?: Task | null }

const API_URL = process.env.NEXT_PUBLIC_API_URL || ""

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { "Content-Type": "application/json", ...options?.headers } })
  if (!response.ok) throw new Error((await response.text()) || `Request failed (${response.status})`)
  return response.json()
}

export const api = {
  health: () => request<{ status: string }>("/health"),
  connection: () => request<ConnectionStatus>("/api/notion/status"),
  tasks: async () => (await request<{ tasks: Task[] }>("/api/notion/tasks")).tasks,
  createTask: (task: Pick<Task, "title" | "status" | "priority">) => request<{ task: Task }>("/api/notion/task", { method: "POST", body: JSON.stringify(task) }).then((result) => result.task),
  updateTask: (task: Pick<Task, "id" | "status" | "priority">) => request<{ ok: boolean }>("/api/notion/task", { method: "PUT", body: JSON.stringify({ page_id: task.id, status: task.status, priority: task.priority }) }),
  deleteTask: (id: string) => request<{ ok: boolean }>("/api/notion/task", { method: "DELETE", body: JSON.stringify({ page_id: id }) }),
  chat: (prompt: string) => request<ChatResponse>("/api/chat", { method: "POST", body: JSON.stringify({ prompt }) }),
}