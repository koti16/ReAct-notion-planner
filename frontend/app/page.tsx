"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowRight, CheckCircle2, Clock3, ListTodo, Plus, RefreshCw, Zap } from "lucide-react"
import { AIChat } from "../components/AIChat"
import { Header } from "../components/Header"
import { Sidebar } from "../components/Sidebar"
import { TaskList } from "../components/TaskList"
import { TasksPage } from "../components/TasksPage"
import { api, type ConnectionStatus, type Task } from "../services/api"

function metricStatus(status: string) { const value = status.toLowerCase(); return value.includes("done") || value.includes("complete") ? "done" : value.includes("progress") ? "progress" : "pending" }

export default function Home() {
  const [active, setActive] = useState("Dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [connection, setConnection] = useState<ConnectionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [creating, setCreating] = useState(false)

  async function loadData() { setLoading(true); setError(""); try { const [loadedTasks, status] = await Promise.all([api.tasks(), api.connection()]); setTasks(loadedTasks); setConnection(status) } catch { setError("Could not connect to the planner backend.") } finally { setLoading(false) } }
  useEffect(() => { loadData() }, [])

  const metrics = useMemo(() => ({ total: tasks.length, done: tasks.filter((task) => metricStatus(task.status) === "done").length, progress: tasks.filter((task) => metricStatus(task.status) === "progress").length, pending: tasks.filter((task) => metricStatus(task.status) === "pending").length }), [tasks])
  async function createTask(event: React.FormEvent) { event.preventDefault(); if (!newTitle.trim()) return; setCreating(true); try { const task = await api.createTask({ title: newTitle.trim(), status: "To do", priority: "Medium" }); setTasks((current) => [task, ...current]); setNewTitle(""); setShowForm(false) } catch { setError("The task could not be created.") } finally { setCreating(false) } }
  async function toggleTask(task: Task) { if (!task.id) return; const status = metricStatus(task.status) === "done" ? "To do" : "Done"; try { await api.updateTask({ id: task.id, status, priority: task.priority }); setTasks((current) => current.map((item) => item.id === task.id ? { ...item, status } : item)) } catch { setError("The task could not be updated.") } }
  async function removeTask(task: Task) { if (!task.id || !window.confirm(`Delete “${task.title}”?`)) return; try { await api.deleteTask(task.id); setTasks((current) => current.filter((item) => item.id !== task.id)) } catch { setError("The task could not be deleted.") } }

  return <div className="app-shell"><Sidebar active={active} onNavigate={setActive} open={sidebarOpen} onClose={() => setSidebarOpen(false)} /><div className="page-area"><Header active={active} onMenu={() => setSidebarOpen(true)} />{active === "Tasks" ? <TasksPage /> : <main className="dashboard"><section className="welcome-row"><div><span className="eyebrow coral">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span><h2>Good morning, Alex<span className="wave">✦</span></h2><p>Here’s what’s happening with your workspace today.</p></div><div className={`connection ${connection?.connected ? "online" : "offline"}`}><span /><div><strong>{connection?.connected ? "Notion connected" : "Notion not connected"}</strong><small>{connection?.workspaceName || "Using local workspace"}</small></div><button onClick={loadData} aria-label="Refresh connection"><RefreshCw size={15} /></button></div></section>{error && <div className="error-banner">{error}</div>}<section className="metric-grid"><div className="metric-card dark"><span className="metric-icon"><ListTodo size={18} /></span><small>Total tasks</small><strong>{metrics.total}</strong><span className="metric-note"><Zap size={12} /> Workspace overview</span></div><div className="metric-card"><span className="metric-icon peach"><CheckCircle2 size={18} /></span><small>Completed</small><strong>{metrics.done}</strong><span className="metric-note positive">↑ Keep it going</span></div><div className="metric-card"><span className="metric-icon lilac"><Clock3 size={18} /></span><small>In progress</small><strong>{metrics.progress}</strong><span className="metric-note">Active right now</span></div><div className="metric-card"><span className="metric-icon mint"><ListTodo size={18} /></span><small>Pending</small><strong>{metrics.pending}</strong><span className="metric-note">Ready for focus</span></div></section><section className="content-grid"><div className="tasks-panel panel"><div className="panel-heading"><div><span className="eyebrow">Your workspace</span><h3>Today’s tasks <span>{metrics.total}</span></h3></div><div className="heading-actions"><button className="refresh-button" onClick={loadData} aria-label="Refresh tasks"><RefreshCw size={15} /></button><button className="primary-button" onClick={() => setShowForm((value) => !value)}><Plus size={16} /> New task</button></div></div>{showForm && <form className="new-task-form" onSubmit={createTask}><input autoFocus value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="What needs to get done?" /><button disabled={creating}>{creating ? "Adding..." : "Add task"}</button></form>}<TaskList tasks={tasks} loading={loading} onStatus={toggleTask} onDelete={removeTask} /><button className="view-all" onClick={() => setActive("Tasks")}>View all tasks <ArrowRight size={15} /></button></div><div className="right-column"><AIChat onTaskCreated={loadData} /><section className="quick-panel panel"><div className="panel-heading"><div><span className="eyebrow">Shortcuts</span><h3>Quick actions</h3></div></div><button onClick={() => setShowForm(true)}><span className="quick-icon coral-bg"><Plus size={17} /></span><span><strong>Create a task</strong><small>Add something to your list</small></span><ArrowRight size={16} /></button><button onClick={() => setActive("Planner")}><span className="quick-icon gold-bg"><Clock3 size={17} /></span><span><strong>Plan your day</strong><small>Build a focused schedule</small></span><ArrowRight size={16} /></button></section></div></section></main>}</div></div>
}