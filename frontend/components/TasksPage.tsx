"use client"

import { CalendarDays, CheckCircle2, Circle, Clock3, Edit3, Filter, ListTodo, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"

type TaskStatus = "Completed" | "In Progress" | "Pending"
type TaskPriority = "High" | "Medium" | "Low"
type DisplayTask = { id: number; title: string; description: string; status: TaskStatus; priority: TaskPriority; due: string; workspace: string }

const sampleTasks: DisplayTask[] = [
  { id: 1, title: "Review Q3 product roadmap", description: "Align milestones with the design and engineering teams.", status: "In Progress", priority: "High", due: "Today, 4:00 PM", workspace: "Product" },
  { id: 2, title: "Prepare LangGraph research notes", description: "Summarize the agent patterns worth testing this week.", status: "Pending", priority: "Medium", due: "Tomorrow", workspace: "Personal" },
  { id: 3, title: "Send follow-up to design team", description: "Share feedback on the latest dashboard exploration.", status: "Completed", priority: "Low", due: "Aug 28", workspace: "Product" },
  { id: 4, title: "Set up weekly planning ritual", description: "Create a recurring Friday block for reviewing priorities.", status: "Pending", priority: "Low", due: "Sep 02", workspace: "Personal" },
  { id: 5, title: "Update onboarding checklist", description: "Add the new workspace setup steps and useful links.", status: "In Progress", priority: "Medium", due: "Sep 04", workspace: "Operations" },
]

const statusKind = (status: TaskStatus) => status === "Completed" ? "done" : status === "In Progress" ? "progress" : "pending"

export function TasksPage() {
  const [tasks, setTasks] = useState(sampleTasks)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("All statuses")
  const [priority, setPriority] = useState("All priorities")
  const [sort, setSort] = useState("Due date")
  const [showForm, setShowForm] = useState(false)
  const [newTask, setNewTask] = useState("")

  const filteredTasks = useMemo(() => {
    const result = tasks.filter((task) => {
      const matchesQuery = `${task.title} ${task.description} ${task.workspace}`.toLowerCase().includes(query.toLowerCase())
      return matchesQuery && (status === "All statuses" || task.status === status) && (priority === "All priorities" || task.priority === priority)
    })
    return sort === "Task name" ? [...result].sort((a, b) => a.title.localeCompare(b.title)) : result
  }, [priority, query, sort, status, tasks])
  const counts = { total: tasks.length, completed: tasks.filter((task) => task.status === "Completed").length, progress: tasks.filter((task) => task.status === "In Progress").length, pending: tasks.filter((task) => task.status === "Pending").length }

  function addTask(event: React.FormEvent) { event.preventDefault(); if (!newTask.trim()) return; setTasks((current) => [{ id: Date.now(), title: newTask.trim(), description: "New task in your workspace.", status: "Pending", priority: "Medium", due: "Today", workspace: "Personal" }, ...current]); setNewTask(""); setShowForm(false) }
  function removeTask(id: number) { setTasks((current) => current.filter((task) => task.id !== id)) }

  return <main className="tasks-page"><section className="tasks-hero"><div><span className="eyebrow coral">Workspace / Tasks</span><h2>Tasks</h2><p>Manage and organize your workspace tasks.</p></div><button className="primary-button" onClick={() => setShowForm((value) => !value)}><Plus size={16} /> New Task</button></section><section className="task-summary"><div className="task-stat"><span className="stat-symbol dark-symbol"><ListTodo size={17} /></span><div><small>Total Tasks</small><strong>{counts.total}</strong></div></div><div className="task-stat"><span className="stat-symbol green-symbol"><CheckCircle2 size={17} /></span><div><small>Completed</small><strong>{counts.completed}</strong></div></div><div className="task-stat"><span className="stat-symbol violet-symbol"><Clock3 size={17} /></span><div><small>In Progress</small><strong>{counts.progress}</strong></div></div><div className="task-stat"><span className="stat-symbol amber-symbol"><Circle size={17} /></span><div><small>Pending</small><strong>{counts.pending}</strong></div></div></section><section className="task-board panel"><div className="task-board-heading"><div><span className="eyebrow">All work</span><h3>Workspace tasks</h3></div><span className="task-count">{filteredTasks.length} visible</span></div>{showForm && <form className="task-create-bar" onSubmit={addTask}><input autoFocus value={newTask} onChange={(event) => setNewTask(event.target.value)} placeholder="Add a task to your workspace..." /><button type="submit">Add task</button></form>}<div className="filters"><label className="filter-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks" /></label><label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option><option>Completed</option><option>In Progress</option><option>Pending</option></select></label><label><span>Priority</span><select value={priority} onChange={(event) => setPriority(event.target.value)}><option>All priorities</option><option>High</option><option>Medium</option><option>Low</option></select></label><label><span>Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option>Due date</option><option>Task name</option></select></label><button className="filter-button" aria-label="More filters"><Filter size={15} /></button></div><div className="task-table-head"><span>Task</span><span>Status</span><span>Priority</span><span>Due date</span><span /></div><div className="task-rows">{filteredTasks.length ? filteredTasks.map((task) => <article className="full-task-row" key={task.id}><span className={`task-check ${statusKind(task.status)}`}>{task.status === "Completed" && <CheckCircle2 size={15} />}</span><div className="full-task-main"><strong>{task.title}</strong><p>{task.description}</p><span className="workspace-label">{task.workspace}</span></div><span className={`status ${statusKind(task.status)}`}>{task.status}</span><span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span><div className="due-date"><CalendarDays size={14} />{task.due}</div><div className="task-actions"><button aria-label={`Edit ${task.title}`}><Edit3 size={15} /></button><button aria-label={`Delete ${task.title}`} onClick={() => removeTask(task.id)}><Trash2 size={15} /></button><button aria-label="More actions"><MoreHorizontal size={16} /></button></div></article>) : <div className="empty-state"><Search size={24} /><strong>No tasks match these filters</strong><p>Try a different search or clear one of the filters.</p></div>}</div></section></main>
}