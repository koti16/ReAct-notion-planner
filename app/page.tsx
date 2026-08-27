"use client";

import { useEffect, useRef, useState } from "react";

type View = "Dashboard" | "Tasks" | "AI Assistant" | "Planner" | "Analytics" | "Settings";
type Task = { title: string; project: string; status: string; priority: string; date: string; color: string; done?: boolean; uid?: string; notionId?: string };

const navItems: { label: View; icon: string }[] = [
  { label: "Dashboard", icon: "⌂" }, { label: "Tasks", icon: "□" }, { label: "AI Assistant", icon: "✦" },
  { label: "Planner", icon: "▦" }, { label: "Analytics", icon: "◒" }, { label: "Settings", icon: "⚙" },
];
const seedTasks: Task[] = [
  { title: "Finalize Q3 product strategy", project: "Product launch", status: "In progress", priority: "High", date: "Today", color: "coral" },
  { title: "Review design system updates", project: "Brand refresh", status: "Completed", priority: "Medium", date: "Today", color: "violet", done: true },
  { title: "Prepare weekly team update", project: "Operations", status: "To do", priority: "Low", date: "Tomorrow", color: "blue" },
  { title: "Research onboarding patterns", project: "Product launch", status: "To do", priority: "Medium", date: "Aug 27", color: "green" },
];

export default function HomePage() {
  const [view, setView] = useState<View>("Dashboard");
  const [taskState, setTaskState] = useState(seedTasks);
  const [query, setQuery] = useState("");
  const [prompt, setPrompt] = useState("");
  const [thinking, setThinking] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const resolved = theme === "system" ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : theme;
    document.documentElement.setAttribute("data-theme", resolved);
    document.documentElement.setAttribute("data-reduce", reduceMotion ? "on" : "off");
  }, [theme, reduceMotion]);

  useEffect(() => {
    try {
      const s = localStorage.getItem("tasks");
      if (s) setTaskState(JSON.parse(s) as Task[]);
    } catch {}
  }, []);

  useEffect(() => {
    fetch("/notion/tasks")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.tasks?.length) return;
        const norm = (v: string | null) => {
          const s = (v ?? "").toLowerCase();
          if (s.includes("done") || s.includes("complete")) return "Completed";
          if (s.includes("progress")) return "In progress";
          return "To do";
        };
        const pmap: Record<string, string> = { high: "High", medium: "Medium", low: "Low" };
        const remote: Task[] = data.tasks.map((t: { id: string; title: string; status: string | null; priority: string | null }) => ({
          title: t.title || "Untitled",
          project: "Notion",
          status: norm(t.status),
          priority: pmap[(t.priority ?? "").toLowerCase()] ?? "Medium",
          date: "—",
          color: "violet",
          notionId: t.id,
          done: norm(t.status) === "Completed",
        }));
        setTaskState((current) => {
          const remoteTitles = new Set(remote.map((r) => r.title.toLowerCase()));
          const localOnly = current.filter((t) => !t.notionId && !remoteTitles.has(t.title.toLowerCase()));
          return [...localOnly, ...remote];
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(taskState));
  }, [taskState]);

  const filteredTasks = taskState.filter((task) => task.title.toLowerCase().includes(query.toLowerCase()));
  const completeTask = (task: Task) => {
    const newStatus = task.done ? "To do" : "Completed";
    setTaskState((current) => current.map((t) => (t === task ? { ...t, done: !t.done, status: newStatus } : t)));
    syncStatus(task, newStatus);
  };
  const deleteTask = (task: Task) => {
    setTaskState((current) => current.filter((t) => t !== task));
    if (task.notionId) {
      fetch("/notion/task", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_id: task.notionId }),
      }).catch(() => {});
    }
  };
  const addTask = (title: string, priority: string) => {
    const uid = crypto.randomUUID();
    setTaskState((current) => [{ title, project: "Inbox", status: "To do", priority, date: "Today", color: "blue", uid }, ...current]);
    fetch("/notion/task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, status: "To do", priority }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.id) setTaskState((current) => current.map((t) => (t.uid === uid ? { ...t, notionId: data.id } : t)));
      })
      .catch(() => {});
  };
  const syncStatus = (task: Task, status: string) => {
    if (!task.notionId) return;
    fetch("/notion/task", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page_id: task.notionId, status }),
    }).catch(() => {});
  };
  const editTaskTitle = (task: Task, title: string) => {
    const t = title.trim();
    if (!t) return;
    setTaskState((current) => current.map((x) => (x === task ? { ...x, title: t } : x)));
  };
  const cycleStatus = (task: Task) => {
    const order = ["To do", "In progress", "Completed"];
    const next = order[(order.indexOf(task.status) + 1) % order.length];
    setTaskState((current) => current.map((x) => (x === task ? { ...x, status: next, done: next === "Completed" } : x)));
    syncStatus(task, next);
  };
  const cyclePriority = (task: Task) => {
    const order = ["High", "Medium", "Low"];
    const next = order[(order.indexOf(task.priority) + 1) % order.length];
    setTaskState((current) => current.map((x) => (x === task ? { ...x, priority: next } : x)));
  };
  const ask = async (override?: string) => {
    const message = (override ?? prompt).trim();
    if (!message) return "Please type a message first.";
    setThinking(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      return data.answer ?? "Hmm, I couldn't get a response.";
    } catch {
      return "Connection error — please try again.";
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="app-shell" id="app-shell">
      <aside className="sidebar" id="main-sidebar">
        <div className="brand">
          <span className="brand-mark">✦</span>
          <span>
            Plan<span className="brand-accent">AI</span>
          </span>
        </div>
        <div className="workspace-switcher">
          <span className="workspace-dot" /> Alex&apos;s workspace <span className="chevron">⌄</span>
        </div>
        <div className="nav-label">Workspace</div>
        <nav className="nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              id={`nav-item-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={`nav-item ${view === item.label ? "active" : ""}`}
              key={item.label}
              onClick={() => setView(item.label)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.label === "AI Assistant" && <span className="new-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="spark">✦</span>
          <strong>Plan with intelligence</strong>
          <small>Let AI turn your ideas into action.</small>
          <button id="open-assistant-btn" onClick={() => setView("AI Assistant")}>
            Open assistant <span>→</span>
          </button>
        </div>
        <div className="sidebar-bottom">
          <div className="profile">
            <span className="avatar">AM</span>
            <div>
              <strong>Alex Morgan</strong>
              <small>Personal workspace</small>
            </div>
            <span className="more">•••</span>
          </div>
        </div>
      </aside>
      <main className="main" id="main-content">
        <header className="topbar" id="topbar">
          <div>
            <div className="breadcrumb">
              Workspace <span>/</span> {view}
            </div>
            <h1>{view === "Dashboard" ? "Good morning, Alex" : view}</h1>
            <p className="subtitle">
              {view === "Dashboard"
                ? "Plan smarter. Get more done."
                : view === "AI Assistant"
                ? "Your thinking partner, connected to Notion."
                : `Stay on top of your ${view.toLowerCase()}.`}
            </p>
          </div>
          <div className="top-actions">
            <button id="search-nav-btn" className="icon-button" aria-label="Search" onClick={() => setView("Tasks")}>
              ⌕
            </button>
            <div className="notif-wrap">
              <button
                id="notif-bell-btn"
                className="icon-button notification"
                aria-label="Notifications"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                ♧<i />
              </button>
              {showNotifications && (
                <div className="notif-panel" id="notifications-panel">
                  <div className="notif-head">
                    <strong>Notifications</strong>
                    <button className="notif-close" onClick={() => setShowNotifications(false)}>
                      ✕
                    </button>
                  </div>
                  <div className="notif-item">
                    <b>{taskState.filter((t) => t.status === "To do").length} tasks to do</b>
                    <small>Waiting on you</small>
                  </div>
                  <div className="notif-item">
                    <b>{taskState.filter((t) => t.status === "In progress").length} in progress</b>
                    <small>Still in the works</small>
                  </div>
                  <div className="notif-item">
                    <b>Latest: {taskState[0] ? taskState[0].title : "No tasks yet"}</b>
                    <small>Most recently added</small>
                  </div>
                </div>
              )}
            </div>
            <button id="create-task-top-btn" className="primary-button" onClick={() => setShowModal(true)}>
              + New task
            </button>
          </div>
        </header>
        <div className="view-stage" key={view} id={`view-stage-${view.toLowerCase().replace(/\s+/g, "-")}`}>
          {view === "Dashboard" && (
            <Dashboard
              tasks={taskState}
              onComplete={completeTask}
              onAssistant={() => setView("AI Assistant")}
              onViewAll={() => setView("Tasks")}
            />
          )}
          {view === "Tasks" && (
            <TasksView
              tasks={filteredTasks}
              query={query}
              setQuery={setQuery}
              onComplete={completeTask}
              onDelete={deleteTask}
              onEdit={editTaskTitle}
              onCycleStatus={cycleStatus}
              onCyclePriority={cyclePriority}
              onNew={() => setShowModal(true)}
            />
          )}
          {view === "AI Assistant" && <Assistant prompt={prompt} setPrompt={setPrompt} thinking={thinking} ask={ask} />}
          {view === "Planner" && <Planner tasks={taskState} />}
          {view === "Analytics" && <Analytics />}
          {view === "Settings" && (
            <Settings theme={theme} setTheme={setTheme} reduceMotion={reduceMotion} setReduceMotion={setReduceMotion} />
          )}
        </div>
      </main>
      {showModal && <NewTaskModal onClose={() => setShowModal(false)} onAdd={addTask} />}
    </div>
  );
}

function Stat({ label, value, change, positive }: { label: string; value: string; change: string; positive?: boolean }) {
  return (
    <article className="stat-card">
      <div className="stat-label">
        {label}
        <span className="stat-icon">↗</span>
      </div>
      <div className="stat-value">{value}</div>
      <div className={`trend ${positive ? "positive" : ""}`}>
        <b>↑ {change}</b> from last week
      </div>
    </article>
  );
}

function TaskRow({ task, onComplete }: { task: Task; onComplete: () => void }) {
  return (
    <div className="task-row">
      <button
        className={`check ${task.done ? "done" : ""}`}
        onClick={onComplete}
        aria-label={`Complete ${task.title}`}
      >
        {task.done ? "✓" : ""}
      </button>
      <span className={`task-color ${task.color}`} />
      <div className="task-copy">
        <strong>{task.title}</strong>
        <small>
          {task.project} <span>·</span> {task.date}
        </small>
      </div>
      <span className={`pill ${task.status.toLowerCase().replace(" ", "-")}`}>{task.status}</span>
      <span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span>
    </div>
  );
}

function Activity({ icon, title, detail, time, color }: { icon: string; title: string; detail: string; time: string; color: string }) {
  return (
    <div className="activity">
      <span className={`activity-icon ${color}`}>{icon}</span>
      <div>
        <strong>{title}</strong>
        <small>{detail}</small>
      </div>
      <time>{time}</time>
    </div>
  );
}

function Dashboard({
  tasks,
  onComplete,
  onAssistant,
  onViewAll,
}: {
  tasks: Task[];
  onComplete: (task: Task) => void;
  onAssistant: () => void;
  onViewAll: () => void;
}) {
  return (
    <>
      <section className="stats-grid" id="stats-summary">
        <Stat label="Total tasks" value={String(tasks.length)} change="12%" />
        <Stat label="To do" value={String(tasks.filter((t) => t.status === "To do").length)} change="4%" />
        <Stat label="In progress" value={String(tasks.filter((t) => t.status === "In progress").length)} change="8%" />
        <Stat label="Completed" value={String(tasks.filter((t) => t.status === "Completed").length)} change="18%" positive />
      </section>
      <section className="hero-grid">
        <article className="panel focus-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Your productivity</span>
              <h2>Make today count.</h2>
            </div>
            <select aria-label="Time range">
              <option>This week</option>
              <option>This month</option>
            </select>
          </div>
          <div className="focus-number">
            82<span>%</span>
            <small>
              {" "}
              weekly momentum <b>↑ 6.4%</b>
            </small>
          </div>
          <div className="line-chart">
            <svg viewBox="0 0 700 150" preserveAspectRatio="none">
              <path d="M0 124 C60 118, 75 94, 130 105 S190 72, 240 89 S310 94, 355 53 S430 74, 466 61 S535 78, 580 34 S645 51, 700 18" />
              <path
                className="fill"
                d="M0 124 C60 118, 75 94, 130 105 S190 72, 240 89 S310 94, 355 53 S430 74, 466 61 S535 78, 580 34 S645 51, 700 18 V150 H0Z"
              />
            </svg>
          </div>
          <div className="chart-labels">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </article>
        <article className="panel ai-card">
          <span className="ai-orbit">✦</span>
          <span className="eyebrow">PlanAI assistant</span>
          <h2>What&apos;s on your mind?</h2>
          <p>Tell me what you want to accomplish and I&apos;ll help shape it into a plan.</p>
          <button id="start-convo-btn" className="assistant-cta" onClick={onAssistant}>
            Start a conversation <span>↗</span>
          </button>
        </article>
      </section>
      <section className="lower-grid">
        <article className="panel">
          <div className="panel-heading">
            <h2>Today&apos;s tasks</h2>
            <button id="view-all-tasks-btn" className="text-button" onClick={onViewAll}>
              View all →
            </button>
          </div>
          <div className="task-list">
            {tasks.slice(0, 3).map((task) => (
              <TaskRow task={task} key={task.title} onComplete={() => onComplete(task)} />
            ))}
          </div>
        </article>
        <article className="panel activity-panel">
          <div className="panel-heading">
            <h2>Recent activity</h2>
            <button className="text-button">See all</button>
          </div>
          <Activity icon="✓" title="Task completed" detail="Review design system updates" time="2m ago" color="green" />
          <Activity icon="✦" title="AI created a plan" detail="Q3 product strategy" time="1h ago" color="violet" />
          <Activity icon="+" title="New task added" detail="Research onboarding patterns" time="3h ago" color="blue" />
        </article>
      </section>
    </>
  );
}

function TasksView({
  tasks,
  query,
  setQuery,
  onComplete,
  onDelete,
  onEdit,
  onCycleStatus,
  onCyclePriority,
  onNew,
}: {
  tasks: Task[];
  query: string;
  setQuery: (value: string) => void;
  onComplete: (task: Task) => void;
  onDelete: (task: Task) => void;
  onEdit: (task: Task, title: string) => void;
  onCycleStatus: (task: Task) => void;
  onCyclePriority: (task: Task) => void;
  onNew: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Priority");
  const statuses = ["All", "To do", "In progress", "Completed"];
  const filtered = tasks.filter((task) => statusFilter === "All" || task.status === statusFilter);
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "Priority") return ({ High: 3, Medium: 2, Low: 1 }[b.priority] ?? 0) - ({ High: 3, Medium: 2, Low: 1 }[a.priority] ?? 0);
    if (sortBy === "Due date") return a.date.localeCompare(b.date);
    return a.title.localeCompare(b.title);
  });
  const count = (status: string) => tasks.filter((t) => t.status === status).length;

  return (
    <>
      <div className="view-toolbar" id="tasks-toolbar">
        <div className="search-box">
          <span>⌕</span>
          <input id="search-tasks-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks..." />
        </div>
        <select
          id="filter-status-select"
          className="filter-button"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter by status"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          id="sort-tasks-select"
          className="filter-button"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          aria-label="Sort by"
        >
          <option>Priority</option>
          <option>Due date</option>
          <option>Title</option>
        </select>
        <button id="add-task-toolbar-btn" className="primary-button" onClick={onNew}>
          + New task
        </button>
      </div>
      <div className="task-summary">
        <span>
          All tasks <b>{tasks.length}</b>
        </span>
        <span>
          To do <b>{count("To do")}</b>
        </span>
        <span>
          In progress <b>{count("In progress")}</b>
        </span>
        <span>
          Completed <b>{count("Completed")}</b>
        </span>
      </div>
      <section className="full-panel panel">
        <div className="table-head">
          <span>Task</span>
          <span>Status</span>
          <span>Priority</span>
          <span>Due date</span>
          <span />
        </div>
        {sorted.map((task) => (
          <div className="table-row" key={task.title}>
            <div className="table-task">
              <button
                className={`check ${task.done ? "done" : ""}`}
                onClick={() => onComplete(task)}
                aria-label={`Complete ${task.title}`}
              >
                {task.done ? "✓" : ""}
              </button>
              <span className={`task-color ${task.color}`} />
              <div>
                <strong>{task.title}</strong>
                <small>{task.project}</small>
              </div>
              <button
                className="row-menu"
                onClick={() => {
                  const t = window.prompt("Edit task title", task.title);
                  if (t !== null) onEdit(task, t);
                }}
                aria-label={`Edit ${task.title}`}
              >
                ✎
              </button>
            </div>
            <button
              className={`pill ${task.status.toLowerCase().replace(" ", "-")}`}
              onClick={() => onCycleStatus(task)}
              title="Click to change status"
            >
              {task.status}
            </button>
            <button
              className={`priority ${task.priority.toLowerCase()}`}
              onClick={() => onCyclePriority(task)}
              title="Click to change priority"
            >
              {task.priority}
            </button>
            <span className="due-date">{task.date}</span>
            <button className="row-menu" onClick={() => onDelete(task)} aria-label={`Delete ${task.title}`}>
              🗑
            </button>
          </div>
        ))}
      </section>
    </>
  );
}

function Assistant({
  prompt,
  setPrompt,
  thinking,
  ask,
}: {
  prompt: string;
  setPrompt: (value: string) => void;
  thinking: boolean;
  ask: (override?: string) => Promise<string>;
}) {
  const [messages, setMessages] = useState([{ from: "ai", text: "Hey Alex. What are we making space for today?" }]);
  const fileRef = useRef<HTMLInputElement>(null);

  const send = async () => {
    if (!prompt.trim()) return;
    const currentPrompt = prompt;
    setMessages((prev) => [...prev, { from: "user", text: currentPrompt }]);
    setPrompt("");
    const reply = await ask(currentPrompt);
    setMessages((prev) => [...prev, { from: "ai", text: reply }]);
  };

  const handleFile = async (file: File) => {
    setMessages((prev) => [...prev, { from: "user", text: `📎 ${file.name}` }]);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/ocr", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setMessages((prev) => [...prev, { from: "ai", text: `Couldn't read ${file.name}: ${data.detail ?? "unknown error"}` }]);
        return;
      }
      const reply = await ask(
        `I attached a file called "${file.name}". Here is its extracted text:\n\n${data.text}\n\nSummarize it and list any tasks or action items you find.`
      );
      setMessages((prev) => [...prev, { from: "ai", text: reply }]);
    } catch {
      setMessages((prev) => [...prev, { from: "ai", text: "Connection error — please try again." }]);
    }
  };

  return (
    <div className="assistant-layout" id="assistant-layout">
      <section className="panel chat-window" id="chat-window">
        <div className="chat-header">
          <span className="ai-avatar">✦</span>
          <div>
            <strong>PlanAI assistant</strong>
            <small>
              <i /> Connected to Notion & ReAct Agent
            </small>
          </div>
          <button className="icon-button" aria-label="More options">
            •••
          </button>
        </div>
        <div className="messages" id="messages-container">
          {messages.map((message, index) => (
            <div className={`message ${message.from}`} key={`${message.text}-${index}`}>
              <span className="message-avatar">{message.from === "ai" ? "✦" : "AM"}</span>
              <div>{message.text}</div>
            </div>
          ))}
          {thinking && (
            <div className="message ai">
              <span className="message-avatar">✦</span>
              <div className="typing">
                <i />
                <i />
                <i />
              </div>
            </div>
          )}
        </div>
        <div className="chat-compose">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            hidden
            onChange={(event) => {
              const f = event.target.files?.[0];
              if (f) handleFile(f);
              event.target.value = "";
            }}
          />
          <button id="attach-file-btn" onClick={() => fileRef.current?.click()} aria-label="Attach image or PDF">
            📎
          </button>
          <input
            id="chat-input"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && send()}
            placeholder="Ask anything about your work, or create tasks..."
          />
          <button id="send-chat-btn" onClick={send} aria-label="Send message">
            ↑
          </button>
        </div>
      </section>
      <aside className="assistant-aside" id="assistant-sidebar">
        <span className="eyebrow">Try asking</span>
        <h3>Start with an idea</h3>
        {["Create a high priority task", "Show my tasks for today", "Plan my week", "What needs my attention?"].map(
          (suggestion) => (
            <button className="suggestion" key={suggestion} onClick={() => setPrompt(suggestion)}>
              {suggestion}
              <span>↗</span>
            </button>
          )
        )}
      </aside>
    </div>
  );
}

function Planner({ tasks }: { tasks: Task[] }) {
  const mondayOf = (d: Date) => {
    const g = new Date(d);
    const day = (g.getDay() + 6) % 7;
    g.setDate(g.getDate() - day);
    g.setHours(0, 0, 0, 0);
    return g;
  };
  const today = () => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  };
  const [weekStart, setWeekStart] = useState<{ d: Date }>({ d: mondayOf(new Date()) });
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.d);
    d.setDate(d.getDate() + i);
    const short = d.toLocaleDateString("en-US", { weekday: "short" });
    const num = d.getDate();
    return { label: `${short} ${num}`, isToday: d.getTime() === today().getTime(), date: d };
  });
  const end = new Date(weekStart.d);
  end.setDate(end.getDate() + 6);
  const title = `${weekStart.d.toLocaleDateString("en-US", { month: "long", day: "numeric" })} – ${end.toLocaleDateString(
    "en-US",
    { month: "long", day: "numeric", year: "numeric" }
  )}`;
  const shift = (n: number) => {
    const d = new Date(weekStart.d);
    d.setDate(d.getDate() + n);
    setWeekStart({ d });
  };

  return (
    <>
      <div className="calendar-toolbar" id="planner-toolbar">
        <button className="icon-button" onClick={() => shift(-7)} aria-label="Previous week">
          ‹
        </button>
        <h2>{title}</h2>
        <button className="icon-button" onClick={() => shift(7)} aria-label="Next week">
          ›
        </button>
        <button className="filter-button today" onClick={() => setWeekStart({ d: mondayOf(new Date()) })}>
          Today
        </button>
        <button className="filter-button">Week ⌄</button>
      </div>
      <section className="calendar panel">
        <div className="calendar-head">
          <span />
          {days.map((day) => (
            <span className={day.isToday ? "today-label" : ""} key={day.label}>
              {day.label}
            </span>
          ))}
        </div>
        <div className="calendar-body">
          <div className="time-labels">
            {["9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM"].map((time) => (
              <span key={time}>{time}</span>
            ))}
          </div>
          <div className="calendar-columns">
            {days.map((day, index) => (
              <div className="day-column" key={day.label}>
                <div className="drop-zone" style={{ top: index === 0 ? "16%" : index === 3 ? "44%" : "70%" }}>
                  <span className={`task-color ${tasks[index % tasks.length]?.color || "blue"}`} />
                  {tasks[index % tasks.length]?.title || "Scheduled task"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="upcoming panel">
        <div className="panel-heading">
          <h2>Upcoming deadlines</h2>
          <span>Next 7 days</span>
        </div>
        <div className="deadline-list">
          <span>Today</span>
          <strong>Finalize Q3 product strategy</strong>
          <b>4:00 PM</b>
          <span>Aug 27</span>
          <strong>Research onboarding patterns</strong>
          <b>All day</b>
        </div>
      </section>
    </>
  );
}

function Analytics() {
  return (
    <>
      <section className="stats-grid" id="analytics-stats">
        <Stat label="Completion rate" value="76%" change="9%" positive />
        <Stat label="Focus hours" value="34.8h" change="12%" positive />
        <Stat label="Avg. task time" value="42m" change="6%" />
        <Stat label="Tasks completed" value="23" change="18%" positive />
      </section>
      <section className="analytics-grid">
        <article className="panel large-chart">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Momentum</span>
              <h2>Productivity over time</h2>
            </div>
            <span>Last 30 days ⌄</span>
          </div>
          <div className="line-chart tall">
            <svg viewBox="0 0 700 190" preserveAspectRatio="none">
              <path d="M0 158 C75 135, 90 146, 150 125 S220 155, 280 112 S355 80, 400 105 S465 67, 515 80 S600 30, 700 45" />
              <path
                className="fill"
                d="M0 158 C75 135, 90 146, 150 125 S220 155, 280 112 S355 80, 400 105 S465 67, 515 80 S600 30, 700 45 V190 H0Z"
              />
            </svg>
          </div>
        </article>
        <article className="panel distribution">
          <div className="panel-heading">
            <h2>Priority distribution</h2>
            <span>48 tasks</span>
          </div>
          <div className="donut">
            <div>
              <strong>48</strong>
              <small>total tasks</small>
            </div>
          </div>
          <div className="legend">
            <span>
              <i className="coral-bg" />
              High <b>12</b>
            </span>
            <span>
              <i className="yellow-bg" />
              Medium <b>24</b>
            </span>
            <span>
              <i className="blue-bg" />
              Low <b>12</b>
            </span>
          </div>
        </article>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h2>Weekly progress</h2>
          <span>Goal: 30 tasks</span>
        </div>
        <div className="weekly-bars">
          {[
            ["Mon", 60],
            ["Tue", 78],
            ["Wed", 44],
            ["Thu", 92],
            ["Fri", 68],
            ["Sat", 35],
            ["Sun", 55],
          ].map(([day, height]) => (
            <div key={day as string}>
              <span style={{ height: `${height}%` }} />
              <small>{day}</small>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function Settings({
  theme,
  setTheme,
  reduceMotion,
  setReduceMotion,
}: {
  theme: "dark" | "light" | "system";
  setTheme: (t: "dark" | "light" | "system") => void;
  reduceMotion: boolean;
  setReduceMotion: (b: boolean) => void;
}) {
  return (
    <div className="settings-grid" id="settings-grid">
      <section className="panel settings-card">
        <div className="settings-title">
          <span className="avatar large">AM</span>
          <div>
            <h2>Alex Morgan</h2>
            <p>alex.morgan@example.com</p>
          </div>
          <button className="filter-button">Edit profile</button>
        </div>
        <div className="setting-row">
          <div>
            <strong>Appearance</strong>
            <small>Choose how PlanAI looks for you</small>
          </div>
          <div className="segmented">
            {(["dark", "light", "system"] as const).map((t) => (
              <button key={t} className={theme === t ? "selected" : ""} onClick={() => setTheme(t)}>
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="setting-row">
          <div>
            <strong>Reduce motion</strong>
            <small>Use fewer animations throughout the app</small>
          </div>
          <button
            id="toggle-reduce-motion-btn"
            className={`toggle ${reduceMotion ? "on" : ""}`}
            onClick={() => setReduceMotion(!reduceMotion)}
            aria-pressed={reduceMotion}
          >
            <i />
          </button>
        </div>
      </section>
      <section className="panel settings-card">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Connections</span>
            <h2>Integrations</h2>
          </div>
        </div>
        <div className="connection">
          <span className="connection-icon notion">N</span>
          <div>
            <strong>Notion</strong>
            <small>Tasks are synced with your workspace</small>
          </div>
          <span className="connected">Connected</span>
        </div>
        <div className="connection">
          <span className="connection-icon sparkle">✦</span>
          <div>
            <strong>AI provider</strong>
            <small>Ready to plan alongside you</small>
          </div>
          <span className="connected">Connected</span>
        </div>
      </section>
    </div>
  );
}

function NewTaskModal({ onClose, onAdd }: { onClose: () => void; onAdd: (title: string, priority: string) => void }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("High");
  const priorities = ["High", "Medium", "Low"];
  const create = () => {
    if (!title.trim()) return;
    onAdd(title.trim(), priority);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} id="new-task-modal-backdrop">
      <div className="modal" onClick={(event) => event.stopPropagation()} id="new-task-modal">
        <span className="eyebrow">Quick capture</span>
        <h2>Create a new task</h2>
        <p>Give your next action a clear home.</p>
        <input
          id="new-task-title-input"
          autoFocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && create()}
          placeholder="What needs to be done?"
        />
        <div className="modal-fields">
          <button
            id="priority-select-btn"
            onClick={(event) => {
              event.stopPropagation();
              setPriority(priorities[(priorities.indexOf(priority) + 1) % priorities.length]);
            }}
          >
            {priority} priority <span>⌄</span>
          </button>
          <button>
            Due date <span>Today ⌄</span>
          </button>
        </div>
        <div className="modal-actions">
          <button id="cancel-task-btn" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button id="create-task-confirm-btn" className="primary-button" onClick={create}>
            Create task
          </button>
        </div>
      </div>
    </div>
  );
}
