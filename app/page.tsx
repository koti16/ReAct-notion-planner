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

  const [notionStatus, setNotionStatus] = useState<{
    checked: boolean;
    checking: boolean;
    connected: boolean;
    hasToken: boolean;
    hasDatabaseId: boolean;
    workspaceName?: string;
    error?: string;
  }>({
    checked: false,
    checking: true,
    connected: false,
    hasToken: false,
    hasDatabaseId: false,
  });

  const verifyNotion = useCallback(() => {
    setNotionStatus((prev) => ({ ...prev, checking: true }));
    fetch("/api/notion/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setNotionStatus({
            checked: true,
            checking: false,
            connected: Boolean(data.connected),
            hasToken: Boolean(data.hasToken),
            hasDatabaseId: Boolean(data.hasDatabaseId),
            workspaceName: data.workspaceName,
            error: data.error,
          });
        } else {
          setNotionStatus({
            checked: true,
            checking: false,
            connected: false,
            hasToken: false,
            hasDatabaseId: false,
            error: "Unable to verify Notion connection.",
          });
        }
      })
      .catch((err) => {
        setNotionStatus({
          checked: true,
          checking: false,
          connected: false,
          hasToken: false,
          hasDatabaseId: false,
          error: err?.message || "Network error while verifying Notion connection.",
        });
      });
  }, []);

  useEffect(() => {
    try {
      const s = localStorage.getItem("tasks");
      if (s) setTaskState(JSON.parse(s) as Task[]);
    } catch {}
  }, []);

  useEffect(() => {
    verifyNotion();
  }, [verifyNotion]);

  useEffect(() => {
    fetch("/api/notion/tasks")
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
      fetch("/api/notion/task", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_id: task.notionId }),
      }).catch(() => {});
    }
  };
  const addTask = (title: string, priority: string, date: string = "Today") => {
    const uid = crypto.randomUUID();
    const colorMap: Record<string, string> = { High: "coral", Medium: "violet", Low: "blue" };
    const color = colorMap[priority] || "blue";
    setTaskState((current) => [{ title, project: "Inbox", status: "To do", priority, date: date || "Today", color, uid }, ...current]);
    fetch("/api/notion/task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, status: "To do", priority, date: date || "Today" }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.id) setTaskState((current) => current.map((t) => (t.uid === uid ? { ...t, notionId: data.id } : t)));
      })
      .catch(() => {});
  };
  const syncStatus = (task: Task, status: string) => {
    if (!task.notionId) return;
    fetch("/api/notion/task", {
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
  const editDueDate = (task: Task, date: string) => {
    const d = date.trim();
    if (!d) return;
    setTaskState((current) => current.map((x) => (x === task ? { ...x, date: d } : x)));
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
        body: JSON.stringify({ message, model: "gemini-3.7-flash" }),
      });
      const data = await res.json();
      if (data.createdTask) {
        const newTask: Task = {
          title: data.createdTask.title,
          project: data.createdTask.project || "General",
          status: data.createdTask.status || "To do",
          priority: data.createdTask.priority || "High",
          date: data.createdTask.date || "Today",
          color: data.createdTask.priority === "High" ? "coral" : data.createdTask.priority === "Low" ? "green" : "blue",
          done: false,
        };
        setTaskState((prev) => [newTask, ...prev]);
      }
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
              onEditDueDate={editDueDate}
              onCycleStatus={cycleStatus}
              onCyclePriority={cyclePriority}
              onNew={() => setShowModal(true)}
            />
          )}
          {view === "AI Assistant" && <Assistant prompt={prompt} setPrompt={setPrompt} thinking={thinking} ask={ask} />}
          {view === "Planner" && (
            <Planner
              tasks={taskState}
              onReschedule={editDueDate}
              onComplete={completeTask}
              onNew={() => setShowModal(true)}
            />
          )}
          {view === "Analytics" && <Analytics tasks={taskState} />}
          {view === "Settings" && (
            <Settings
              theme={theme}
              setTheme={setTheme}
              reduceMotion={reduceMotion}
              setReduceMotion={setReduceMotion}
              notionStatus={notionStatus}
              onRecheckNotion={verifyNotion}
            />
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
  const [timeRange, setTimeRange] = useState<"week" | "month">("week");
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "Completed" || t.done).length;
  const todo = tasks.filter((t) => t.status === "To do" && !t.done).length;
  const inProgress = tasks.filter((t) => t.status === "In progress" && !t.done).length;
  
  const productivityPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const momentumChange = productivityPercent > 50 ? "+6.4%" : "-2.1%";

  // Generate dynamic SVG sparkline path based on task distribution
  const points = [
    120 - Math.min(100, (todo * 6)),
    105 - Math.min(80, (inProgress * 8)),
    110 - Math.min(90, (completed * 10)),
    95 - Math.min(75, (completed * 12)),
    80 - Math.min(60, (productivityPercent * 0.7)),
    50 - Math.min(40, (completed * 5)),
    Math.max(15, 130 - (productivityPercent * 1.1)),
  ];

  const svgPath = `M0 ${points[0]} C60 ${points[0] - 5}, 75 ${points[1]}, 130 ${points[1]} S190 ${points[2]}, 240 ${points[2]} S310 ${points[3]}, 355 ${points[3]} S430 ${points[4]}, 466 ${points[4]} S535 ${points[5]}, 580 ${points[5]} S645 ${points[6]}, 700 ${points[6]}`;
  const svgFill = `${svgPath} V150 H0Z`;

  return (
    <>
      <section className="stats-grid" id="stats-summary">
        <Stat label="Total tasks" value={String(total)} change="12%" />
        <Stat label="To do" value={String(todo)} change="4%" />
        <Stat label="In progress" value={String(inProgress)} change="8%" />
        <Stat label="Completed" value={String(completed)} change="18%" positive />
      </section>
      <section className="hero-grid">
        <article className="panel focus-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Your productivity</span>
              <h2>{productivityPercent >= 75 ? "Crushing your goals." : productivityPercent >= 40 ? "Steady momentum." : "Make today count."}</h2>
            </div>
            <select
              aria-label="Time range"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as "week" | "month")}
            >
              <option value="week">This week</option>
              <option value="month">This month</option>
            </select>
          </div>
          <div className="focus-number">
            {productivityPercent}<span>%</span>
            <small>
              {" "}
              {timeRange === "week" ? "weekly" : "monthly"} momentum <b>{momentumChange}</b>
              <span style={{ marginLeft: 8, opacity: 0.8, fontSize: 11 }}>({completed}/{total} completed)</span>
            </small>
          </div>
          <div className="line-chart">
            <svg viewBox="0 0 700 150" preserveAspectRatio="none">
              <path d={svgPath} />
              <path
                className="fill"
                d={svgFill}
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
  onEditDueDate,
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
  onEditDueDate?: (task: Task, date: string) => void;
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
            <button
              className="due-date-btn"
              onClick={() => {
                const d = window.prompt("Update due date (e.g. Today, Tomorrow, Sep 15)", task.date);
                if (d !== null && d.trim() && onEditDueDate) onEditDueDate(task, d.trim());
              }}
              title="Click to change due date"
            >
              {task.date}
            </button>
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const send = async () => {
    if (!prompt.trim()) return;
    const currentPrompt = prompt;
    setMessages((prev) => [...prev, { from: "user", text: currentPrompt }]);
    setPrompt("");
    const reply = await ask(currentPrompt);
    setMessages((prev) => [...prev, { from: "ai", text: reply }]);
  };

  const handleSuggestion = async (suggestion: string) => {
    setMessages((prev) => [...prev, { from: "user", text: suggestion }]);
    const reply = await ask(suggestion);
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
              <div style={{ whiteSpace: "pre-wrap" }}>{message.text}</div>
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
          <div ref={messagesEndRef} />
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
            <button className="suggestion" key={suggestion} onClick={() => handleSuggestion(suggestion)}>
              {suggestion}
              <span>↗</span>
            </button>
          )
        )}
      </aside>
    </div>
  );
}

function Planner({
  tasks,
  onReschedule,
  onComplete,
  onNew,
}: {
  tasks: Task[];
  onReschedule?: (task: Task, newDate: string) => void;
  onComplete?: (task: Task) => void;
  onNew?: () => void;
}) {
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
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverDayLabel, setDragOverDayLabel] = useState<string | null>(null);
  const [dragOverBacklog, setDragOverBacklog] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3200);
  };

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.d);
    d.setDate(d.getDate() + i);
    const short = d.toLocaleDateString("en-US", { weekday: "short" });
    const num = d.getDate();
    return {
      label: `${short} ${num}`,
      shortName: short,
      dayNum: num,
      isToday: d.getTime() === today().getTime(),
      date: d,
    };
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

  const isSameCalendarDay = (taskDateStr: string, targetDate: Date) => {
    if (!taskDateStr) return false;
    const s = taskDateStr.trim().toLowerCase();
    if (s === "—" || s === "none" || s === "unscheduled") return false;

    const tToday = today();
    const tTarget = new Date(targetDate);
    tTarget.setHours(0, 0, 0, 0);

    const tTomorrow = new Date(tToday);
    tTomorrow.setDate(tTomorrow.getDate() + 1);

    const tYesterday = new Date(tToday);
    tYesterday.setDate(tYesterday.getDate() - 1);

    if (s === "today") return tTarget.getTime() === tToday.getTime();
    if (s === "tomorrow") return tTarget.getTime() === tTomorrow.getTime();
    if (s === "yesterday") return tTarget.getTime() === tYesterday.getTime();

    // Check "Aug 27", "August 27", "8/27", etc.
    const shortMonth = tTarget.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toLowerCase();
    const longMonth = tTarget.toLocaleDateString("en-US", { month: "long", day: "numeric" }).toLowerCase();
    if (s === shortMonth || s === longMonth || s.includes(shortMonth)) return true;

    // Check weekday names
    const weekday = tTarget.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    const weekdayShort = tTarget.toLocaleDateString("en-US", { weekday: "short" }).toLowerCase();
    if (s === weekday || s === weekdayShort) return true;

    // Check parsed ISO date
    const parsed = new Date(taskDateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.getDate() === tTarget.getDate() && parsed.getMonth() === tTarget.getMonth();
    }

    return false;
  };

  const formatDateForTarget = (targetDate: Date) => {
    const tToday = today();
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target.getTime() - tToday.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    return target.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleDropOnDay = (targetDay: (typeof days)[0]) => {
    if (!draggedTask) return;
    const newFormattedDate = formatDateForTarget(targetDay.date);
    if (onReschedule) {
      onReschedule(draggedTask, newFormattedDate);
    }
    showToast(`Rescheduled "${draggedTask.title}" to ${targetDay.label}`);
    setDraggedTask(null);
    setDragOverDayLabel(null);
  };

  const handleDropOnBacklog = () => {
    if (!draggedTask) return;
    if (onReschedule) {
      onReschedule(draggedTask, "Unscheduled");
    }
    showToast(`Moved "${draggedTask.title}" to Backlog`);
    setDraggedTask(null);
    setDragOverBacklog(false);
  };

  const isTaskScheduledInWeek = (task: Task) => days.some((day) => isSameCalendarDay(task.date, day.date));
  const unscheduledTasks = tasks.filter((task) => !isTaskScheduledInWeek(task));

  // Upcoming deadlines from active tasks
  const upcomingTasks = [...tasks]
    .filter((t) => !t.done && t.status !== "Completed" && t.date !== "—" && t.date !== "Unscheduled")
    .slice(0, 5);

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
        <button className="filter-button" onClick={onNew}>
          + Schedule task
        </button>
      </div>

      <section className="calendar panel" id="planner-calendar-grid">
        <div className="calendar-head">
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: "10px" }}>
            Time
          </span>
          {days.map((day) => (
            <span className={day.isToday ? "today-label" : ""} key={day.label}>
              {day.label} {day.isToday ? "•" : ""}
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
            {days.map((day) => {
              const dayTasks = tasks.filter((t) => isSameCalendarDay(t.date, day.date));
              const isOver = dragOverDayLabel === day.label;

              return (
                <div
                  id={`day-col-${day.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={`day-column ${isOver ? "drag-over" : ""}`}
                  key={day.label}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (dragOverDayLabel !== day.label) {
                      setDragOverDayLabel(day.label);
                    }
                  }}
                  onDragLeave={(e) => {
                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                    setDragOverDayLabel(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDropOnDay(day);
                  }}
                >
                  {isOver && (
                    <div className="planner-drop-indicator">
                      + Move to {day.label}
                    </div>
                  )}

                  {dayTasks.map((task, taskIdx) => {
                    const isBeingDragged = draggedTask === task;
                    return (
                      <div
                        id={`planner-task-${task.uid || taskIdx}`}
                        key={task.uid || `${task.title}-${taskIdx}`}
                        className={`planner-card ${isBeingDragged ? "is-dragging" : ""}`}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", task.uid || task.title);
                          e.dataTransfer.effectAllowed = "move";
                          setDraggedTask(task);
                        }}
                        onDragEnd={() => {
                          setDraggedTask(null);
                          setDragOverDayLabel(null);
                        }}
                      >
                        <div className="planner-card-header">
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span className="drag-handle" title="Drag to reschedule">⠿</span>
                            <span className={`task-color ${task.color || "blue"}`} style={{ height: "14px", width: "4px" }} />
                          </div>
                          <span className={`pill ${task.status.toLowerCase().replace(/\s+/g, "-")}`} style={{ fontSize: "8px", padding: "2px 5px" }}>
                            {task.status}
                          </span>
                        </div>

                        <div className="planner-card-title" title={task.title}>
                          {task.title}
                        </div>

                        <div className="planner-card-footer">
                          <span style={{ color: "var(--muted)", fontSize: "9px" }}>{task.project || "General"}</span>
                          {onComplete && (
                            <button
                              className={`check ${task.done ? "done" : ""}`}
                              style={{ width: "14px", height: "14px", fontSize: "9px" }}
                              onClick={() => onComplete(task)}
                              title={task.done ? "Completed" : "Mark complete"}
                            >
                              {task.done ? "✓" : ""}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {dayTasks.length === 0 && !isOver && (
                    <div
                      className="planner-empty-slot"
                      onClick={() => onNew && onNew()}
                      title="Click to add or drag a task here"
                    >
                      Drag tasks here
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {unscheduledTasks.length > 0 && (
        <section className="planner-backlog-section panel" id="planner-backlog-panel">
          <div className="panel-heading" style={{ marginBottom: "10px" }}>
            <div>
              <span className="eyebrow">Task Backlog & Unscheduled</span>
              <h2>Drag into any day to schedule</h2>
            </div>
            <span style={{ fontSize: "11px", color: "var(--muted)" }}>{unscheduledTasks.length} available</span>
          </div>

          <div
            id="planner-backlog-tray"
            className={`planner-backlog-tray ${dragOverBacklog ? "drag-over" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setDragOverBacklog(true);
            }}
            onDragLeave={(e) => {
              if (e.currentTarget.contains(e.relatedTarget as Node)) return;
              setDragOverBacklog(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDropOnBacklog();
            }}
          >
            {unscheduledTasks.map((task, idx) => (
              <div
                id={`backlog-task-${task.uid || idx}`}
                key={task.uid || `${task.title}-${idx}`}
                className="planner-backlog-item"
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", task.uid || task.title);
                  e.dataTransfer.effectAllowed = "move";
                  setDraggedTask(task);
                }}
                onDragEnd={() => {
                  setDraggedTask(null);
                  setDragOverBacklog(false);
                }}
              >
                <span className="drag-handle">⠿</span>
                <span className={`task-color ${task.color || "blue"}`} style={{ height: "12px", width: "3px" }} />
                <strong style={{ fontSize: "11px", color: "#dce6e3" }}>{task.title}</strong>
                <span className={`priority ${task.priority.toLowerCase()}`} style={{ fontSize: "8px", padding: "2px 4px" }}>
                  {task.priority}
                </span>
                <small style={{ color: "var(--muted)", fontSize: "9px" }}>({task.date || "No date"})</small>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="upcoming panel" id="planner-upcoming-panel">
        <div className="panel-heading">
          <h2>Upcoming deadlines</h2>
          <span>Next 7 days</span>
        </div>
        <div className="deadline-list">
          {upcomingTasks.length > 0 ? (
            upcomingTasks.map((t) => (
              <div key={t.title} style={{ display: "contents" }}>
                <span>{t.date}</span>
                <strong>{t.title}</strong>
                <b>{t.priority}</b>
              </div>
            ))
          ) : (
            <div style={{ gridColumn: "1/-1", color: "var(--muted)", padding: "10px 0" }}>
              No upcoming deadlines scheduled for the current week.
            </div>
          )}
        </div>
      </section>

      {toastMessage && (
        <div className="reschedule-toast" id="reschedule-toast">
          <span style={{ color: "var(--teal)", fontSize: "14px" }}>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}

function Analytics({ tasks }: { tasks: Task[] }) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "Completed" || t.done).length;
  const inProgress = tasks.filter((t) => t.status === "In progress" && !t.done).length;
  const todo = tasks.filter((t) => t.status === "To do" && !t.done).length;

  const highPriority = tasks.filter((t) => t.priority === "High").length;
  const medPriority = tasks.filter((t) => t.priority === "Medium").length;
  const lowPriority = tasks.filter((t) => t.priority === "Low").length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const estimatedFocusHours = (completed * 1.5 + inProgress * 0.8).toFixed(1);
  const avgTaskTime = total > 0 ? Math.round(35 + (highPriority * 4) - (completed * 2)) : 0;

  // Donut chart gradient calculation
  const highPercent = total > 0 ? Math.round((highPriority / total) * 100) : 33;
  const medPercent = total > 0 ? Math.round((medPriority / total) * 100) : 33;
  const conic = `conic-gradient(var(--coral) 0 ${highPercent}%, var(--yellow) ${highPercent}% ${highPercent + medPercent}%, var(--blue) ${highPercent + medPercent}% 100%)`;

  const weeklyData: [string, number][] = [
    ["Mon", Math.min(100, Math.max(20, (todo * 12) + 20))],
    ["Tue", Math.min(100, Math.max(30, (inProgress * 15) + 30))],
    ["Wed", Math.min(100, Math.max(15, (completed * 10) + 25))],
    ["Thu", Math.min(100, Math.max(40, (completionRate * 0.8) + 15))],
    ["Fri", Math.min(100, Math.max(25, (highPriority * 18) + 20))],
    ["Sat", Math.min(100, Math.max(10, (completed * 6) + 15))],
    ["Sun", Math.min(100, Math.max(20, (total * 8) + 10))],
  ];

  return (
    <>
      <section className="stats-grid" id="analytics-stats">
        <Stat label="Completion rate" value={`${completionRate}%`} change="9%" positive={completionRate >= 50} />
        <Stat label="Focus hours" value={`${estimatedFocusHours}h`} change="12%" positive />
        <Stat label="Avg. task time" value={`${avgTaskTime > 0 ? avgTaskTime : 40}m`} change="6%" />
        <Stat label="Tasks completed" value={String(completed)} change="18%" positive />
      </section>
      <section className="analytics-grid">
        <article className="panel large-chart">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Momentum</span>
              <h2>Productivity over time</h2>
            </div>
            <span>Last 30 days</span>
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
            <span>{total} tasks</span>
          </div>
          <div className="donut" style={{ background: conic }}>
            <div>
              <strong>{total}</strong>
              <small>total tasks</small>
            </div>
          </div>
          <div className="legend">
            <span>
              <i className="coral-bg" />
              High <b>{highPriority}</b>
            </span>
            <span>
              <i className="yellow-bg" />
              Medium <b>{medPriority}</b>
            </span>
            <span>
              <i className="blue-bg" />
              Low <b>{lowPriority}</b>
            </span>
          </div>
        </article>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h2>Weekly progress</h2>
          <span>Goal: {Math.max(10, total + 5)} tasks</span>
        </div>
        <div className="weekly-bars">
          {weeklyData.map(([day, height]) => (
            <div key={day}>
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
  notionStatus,
  onRecheckNotion,
}: {
  theme: "dark" | "light" | "system";
  setTheme: (t: "dark" | "light" | "system") => void;
  reduceMotion: boolean;
  setReduceMotion: (b: boolean) => void;
  notionStatus: {
    checked: boolean;
    checking: boolean;
    connected: boolean;
    hasToken: boolean;
    hasDatabaseId: boolean;
    workspaceName?: string;
    error?: string;
  };
  onRecheckNotion: () => void;
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
      <section className="panel settings-card" id="settings-integrations-card">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Connections</span>
            <h2>Integrations & Environment</h2>
          </div>
        </div>
        <div className="connection">
          <span className="connection-icon notion">N</span>
          <div>
            <strong>Notion</strong>
            <small>
              {notionStatus.connected
                ? notionStatus.workspaceName || "Synced with live Notion database"
                : "Using local in-memory store (API keys not configured)"}
            </small>
          </div>
          {notionStatus.checking ? (
            <span className="connected" style={{ color: "var(--muted)" }}>
              Checking...
            </span>
          ) : notionStatus.connected ? (
            <span className="connected active">
              <i className="connected-dot" /> Connected
            </span>
          ) : (
            <span className="connected warning">
              <i className="connected-dot warning" /> Local mode
            </span>
          )}
        </div>

        {notionStatus.checked && !notionStatus.connected && (
          <div className="notion-notice-card" id="notion-env-warning">
            <div className="notion-notice-header">
              <div className="notion-notice-title">
                <span>⚠</span> Notion Connection Notice
              </div>
              <button
                className="recheck-btn"
                onClick={onRecheckNotion}
                disabled={notionStatus.checking}
                title="Verify environment variables"
              >
                {notionStatus.checking ? "Verifying..." : "↻ Test Connection"}
              </button>
            </div>

            <p className="notion-notice-desc">
              PlanAI is currently operating in <strong>Local Storage Mode</strong>. To sync your tasks directly with your live Notion database, add these environment variables in your <code>.env</code> file or Project Settings:
            </p>

            <div className="notion-env-list">
              <div className="notion-env-item">
                <span>NOTION_TOKEN</span>
                <span className={`notion-env-status ${notionStatus.hasToken ? "set" : "missing"}`}>
                  {notionStatus.hasToken ? "Configured" : "Missing"}
                </span>
              </div>
              <div className="notion-env-item">
                <span>NOTION_DATABASE_ID</span>
                <span className={`notion-env-status ${notionStatus.hasDatabaseId ? "set" : "missing"}`}>
                  {notionStatus.hasDatabaseId ? "Configured" : "Missing"}
                </span>
              </div>
            </div>

            <div className="notion-notice-footer">
              <span>{notionStatus.error || "Tasks created will be stored in your local session."}</span>
            </div>
          </div>
        )}

        <div className="connection">
          <span className="connection-icon sparkle">✦</span>
          <div>
            <strong>AI Provider (Gemini)</strong>
            <small>Connected to intelligent planning agent</small>
          </div>
          <span className="connected active">
            <i className="connected-dot" /> Connected
          </span>
        </div>
      </section>
    </div>
  );
}

function NewTaskModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (title: string, priority: string, date: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("High");
  const [dueDate, setDueDate] = useState("Today");
  const [isCustom, setIsCustom] = useState(false);
  const [customDate, setCustomDate] = useState("");

  const priorities = ["High", "Medium", "Low"];
  const datePresets = ["Today", "Tomorrow", "This Friday", "Next Monday", "In 1 week"];

  const handlePresetSelect = (val: string) => {
    if (val === "custom") {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      setDueDate(val);
    }
  };

  const handleCustomDateChange = (val: string) => {
    setCustomDate(val);
    if (val) {
      const parts = val.split("-");
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const formatted = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        setDueDate(formatted);
      }
    }
  };

  const create = () => {
    if (!title.trim()) return;
    onAdd(title.trim(), priority, dueDate || "Today");
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
            type="button"
            id="priority-select-btn"
            onClick={(event) => {
              event.stopPropagation();
              setPriority(priorities[(priorities.indexOf(priority) + 1) % priorities.length]);
            }}
          >
            <span>Priority:</span>
            <span>{priority} ⌄</span>
          </button>
          <select
            id="due-date-select"
            className="modal-select"
            value={isCustom ? "custom" : dueDate}
            onChange={(e) => handlePresetSelect(e.target.value)}
            aria-label="Select due date"
          >
            {datePresets.map((preset) => (
              <option key={preset} value={preset}>
                Due: {preset}
              </option>
            ))}
            <option value="custom">Custom date...</option>
          </select>
        </div>
        {isCustom && (
          <div className="modal-custom-date">
            <label htmlFor="custom-date-picker">Select date:</label>
            <input
              type="date"
              id="custom-date-picker"
              value={customDate}
              onChange={(e) => handleCustomDateChange(e.target.value)}
              className="date-input-field"
            />
          </div>
        )}
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
