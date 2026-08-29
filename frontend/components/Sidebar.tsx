"use client"
import { BarChart3, CalendarDays, CheckSquare2, LayoutDashboard, MessageSquareText, Settings, Sparkles, X } from "lucide-react"

const items = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Tasks", icon: CheckSquare2, href: "/" },
  { label: "Planner", icon: CalendarDays, href: "/" },
  { label: "AI Assistant", icon: MessageSquareText, href: "/ai-assistant" },
  { label: "Analytics", icon: BarChart3, href: "/" },
  { label: "Settings", icon: Settings, href: "/" },
]

export function Sidebar({ active, onNavigate, open, onClose }: { active: string; onNavigate: (item: string) => void; open: boolean; onClose: () => void }) {
  return (
    <>
      {open && <button className="sidebar-overlay" aria-label="Close navigation" onClick={onClose} />}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark"><Sparkles size={17} /></span>
          <span>ReAct <b>Planner</b></span>
          <button className="mobile-close" onClick={onClose} aria-label="Close navigation"><X size={18} /></button>
        </div>
        <p className="nav-label">Workspace</p>
        <nav>
          {items.map(({ label, icon: Icon, href }) => {
            const isAI = label === "AI Assistant"
            const className = `nav-item ${active === label ? "active" : ""}`
            if (isAI) {
              return (
                <a key={label} className={className} href={href} onClick={() => onClose()}>
                  <Icon size={18} /><span>{label}</span><i className="nav-dot" />
                </a>
              )
            }
            return (
              <button key={label} className={className} onClick={() => { onNavigate(label); onClose() }}>
                <Icon size={18} /><span>{label}</span>
              </button>
            )
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <span className="upgrade-icon"><Sparkles size={16} /></span>
            <strong>Plan with clarity</strong>
            <p>Turn thoughts into momentum.</p>
            <button>Explore Pro <span>↗</span></button>
          </div>
          <div className="profile">
            <span className="avatar">AR</span>
            <div><strong>Alex Rivera</strong><span>Personal workspace</span></div>
            <button aria-label="Open profile">•••</button>
          </div>
        </div>
      </aside>
    </>
  )
}