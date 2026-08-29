"use client"
import{useState,useCallback,useMemo,useEffect}from"react"
import{Trash2,GripVertical,ChevronLeft,ChevronRight}from"lucide-react"
import{api}from"../services/api"
type TS="Completed"|"In Progress"|"Pending"
type TP="High"|"Medium"|"Low"
type DT={id:number|string,title:string,status:TS,priority:TP,due:string}
const WD=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
const gd=(d:Date,i:number)=>{const x=new Date(d);x.setDate(x.getDate()+i);return x.toISOString().split("T")[0]}
const fl=(s:string)=>new Date(s+"T00:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})
const fs=(h:number)=>{const p=h>=12?"PM":"AM";const n=h===0?12:h>12?h-12:h;return`${n}:00 ${p}`}

export function DraggablePlanner(){
const[t,st]=useState<DT[]>([])
const[ld,sl]=useState(true)
const[er,se]=useState("")
const[ws,wsf]=useState(()=>{const n=new Date();const d=n.getDay();const x=n.getDate()-d+(d===0?-6:1);const m=new Date(n.setDate(x));m.setHours(0,0,0,0);return m})
const[sf,sff]=useState(false)
const[nt,ntf]=useState("")
const[did,sdid]=useState<string|null>(null)
const[dtd,std]=useState<string|null>(null)
const[dts,sdts]=useState<number|null>(null)
useEffect(()=>{ldd()},[])
async function ldd(){sl(true);try{const[r]=await Promise.all([api.tasks()]);const d:DT[]=r.map((t,i)=>({id:i+1,title:t.title,status:(t.status as TS)||"Pending",priority:(t.priority as TP)||"Medium",due:t.date||"Today"}));st(d)}catch{se("Could not connect.")}finally{sl(false)}}
const hds=useCallback((e:React.DragEvent,t2:DT)=>{e.dataTransfer.setData("task-id",String(t2.id));sdid(String(t2.id))},[])
const hde=useCallback((e:React.DragEvent,di:number,si?:number)=>{e.preventDefault();std(gd(ws,di));if(si!==undefined)sdts(si)},[ws])
const hdo=useCallback((e:React.DragEvent,di:number,si?:number)=>{e.preventDefault();const dd=gd(ws,di);std(p=>{if(p!==dd)return dd;return p});if(si!==undefined)sdts(si)},[ws])
const hdl=useCallback(()=>{},[])
const hdp=useCallback(async(e:React.DragEvent,di:number,si?:number)=>{e.preventDefault();const id=e.dataTransfer.getData("task-id");const td=gd(ws,di);if(!id)return;const dt=t.find(x=>String(x.id)===id);if(!dt)return;const tl=fl(td);const sd=dt.due.split(",")[0].trim()===tl;let nt2:DT[];if(!sd){nt2=t.map(x=>String(x.id)===id?{...x,due:`${tl}, ${si!==undefined?fs(si):"9:00 AM"}`}:x);st(nt2);try{await api.updateTask({id:dt.id.toString(),status:dt.status,priority:dt.priority})}catch{se("Failed to update.")}}else if(si!==undefined){nt2=t.map(x=>String(x.id)===id?{...x,due:`${tl}, ${fs(si)}`}:x);st(nt2)}sdid(null);std(null);sdts(null)},[t,ws])
const hde2=useCallback(()=>{sdid(null);std(null);sdts(null)},[])
const dts2=useMemo(()=>{const r:Record<string,DT[]>={};t.forEach(x=>{const k=x.due.split(",")[0].trim();if(!r[k])r[k]=[];r[k].push(x)});return r},[t])
async function at(e:React.FormEvent){e.preventDefault();if(!nt.trim())return;try{const t2=await api.createTask({title:nt.trim(),status:"To do",priority:"Medium"});st([{id:String(t2.id||Date.now()),title:t2.title,status:"Pending",priority:"Medium",due:"Today, 9:00 AM"},...t]);ntf("");sff(false)}catch{se("Task creation failed.")}}
async function rt(id:number|string){if(!window.confirm("Delete?"))return;try{const t2=t.find(x=>x.id===id);if(t2?.id)await api.deleteTask(t2.id.toString());st(t=>t.filter(x=>x.id!==id))}catch{se("Delete failed.")}}
function nw(d:number){wsf(p=>{const n=new Date(p);n.setDate(n.getDate()+d*7);return n})}
function gtd(){const n=new Date();const d=n.getDay();const x=n.getDate()-d+(d===0?-6:1);const m=new Date(n.setDate(x));m.setHours(0,0,0,0);wsf(m)}
if(ld)return<div className="planner-loading">Loading...</div>
return(<main className="planner-page"><section className="planner-header"><div className="planner-title"><span className="eyebrow coral">Planner</span><h2>Weekly Planner</h2><p>Drag tasks between days</p></div><div className="planner-nav"><button onClick={()=>nw(-1)} aria-label="Prev"><ChevronLeft size={20}/></button><span className="week-label">{ws.toLocaleDateString("en-US",{month:"short",day:"numeric"})} - {new Date(ws.getTime()+6*86400000).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</span><button onClick={gtd} className="today-button">Today</button><button onClick={()=>nw(1)} aria-label="Next"><ChevronRight size={20}/></button><button onClick={()=>sff(true)} className="add-task-button">+ Add</button></div></section>{er&&<div className="error-banner">{er}</div>}<div className="planner-grid"><div className="time-column">{Array.from({length:14},(_,i)=>i+8).map(h=><div key={h} className="time-slot"><span className="time-label">{fs(h)}</span></div>)}</div><div className="days-grid">{WD.map((dn,di)=>{const dd=gd(ws,di);const dk=fl(dd);const tf=dts2[dk]||[];const it=new Date().toDateString()===new Date(dd+"T00:00:00").toDateString();const idt=dtd===dd;return(<div key={dn} className={`day-column ${it?"today":""} ${idt?"drop-target":""}`} onDragEnter={e=>hde(e,di)} onDragOver={e=>hdo(e,di)} onDragLeave={hdl} onDrop={e=>hdp(e,di)}><div className="day-header"><span className={it?"today-badge":""}>{dn}</span><span className="day-date">{dd.split("-").slice(1).join("/")}</span><span className="task-count">{tf.length}</span></div><div className="day-content">{Array.from({length:14},(_,i)=>i+8).map(h=>{const sk=`${dk}, ${fs(h)}`;const ts=tf.filter(t=>t.due===sk);const isd=dtd===dd&&dts===h;return(<div key={h} className={`time-slot ${isd?"slot-drop-target":""}`} onDragEnter={e=>hde(e,di,h)} onDragOver={e=>hdo(e,di,h)} onDragLeave={hdl} onDrop={e=>hdp(e,di,h)}>{ts.map(t=>(<article key={t.id} className={`planner-task ${did===String(t.id)?"dragging":""}`} draggable onDragStart={e=>hds(e,t)} onDragEnd={hde2} style={{borderLeftColor:t.priority==="High"?"#ef4444":t.priority==="Medium"?"#f59e0b":"#10b981"}}><div className="task-drag-handle" aria-label={`Drag ${t.title}`}><GripVertical size={12}/></div><div className="task-content"><strong>{t.title}</strong><span className="task-meta">{t.priority}</span></div><button className="task-delete" onClick={()=>rt(t.id)} aria-label={`Delete ${t.title}`}><Trash2 size={12}/></button></article>))}{isd&&!ts.length&&<div className="empty-drop-indicator">Drop here</div>}</div>)})}</div></div>)})}</div></div>{sf&&<form className="task-create-form" onSubmit={at}><input autoFocus value={nt} onChange={e=>ntf(e.target.value)} placeholder="Add a task..."/><button type="submit">Add</button><button type="button" onClick={()=>sff(false)}>Cancel</button></form>}</main>)
}