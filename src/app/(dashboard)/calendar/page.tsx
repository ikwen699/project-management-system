"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import toast from "react-hot-toast";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: string;
  projectId: string;
  projectName: string;
  color: string;
  duration?: number;
}

type ViewType = "month" | "week" | "day";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getWeekDays(date: Date) {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function isSameDay(d1: Date, d2: Date) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>("month");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<"milestone" | "meeting">("milestone");
  const [createDate, setCreateDate] = useState("");

  const loadEvents = useCallback(async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    let start: Date, end: Date;
    if (view === "month") {
      start = new Date(year, month, 1);
      end = new Date(year, month + 1, 0, 23, 59, 59);
    } else if (view === "week") {
      const wd = getWeekDays(currentDate);
      start = wd[0]; end = wd[6];
    } else {
      start = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      end = new Date(start.getTime() + 86400000);
    }
    try {
      const res = await fetch(`/api/calendar?start=${start.toISOString()}&end=${end.toISOString()}`);
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch { setEvents([]); }
    setLoading(false);
  }, [currentDate, view]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  function navigate(dir: number) {
    const d = new Date(currentDate);
    if (view === "month") d.setMonth(d.getMonth() + dir);
    else if (view === "week") d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  }

  function openCreate(date: Date, type: "milestone" | "meeting") {
    setCreateDate(date.toISOString().split("T")[0]);
    setCreateType(type);
    setShowCreateModal(true);
  }

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });
  const today = new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">View deadlines, milestones, and meetings</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-border rounded-lg overflow-hidden">
            {(["month", "week", "day"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-sm capitalize transition-colors ${view === v ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                {v}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 border border-border rounded-lg overflow-hidden">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted transition-colors" aria-label="Previous">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm hover:bg-muted transition-colors">Today</button>
            <button onClick={() => navigate(1)} className="p-2 hover:bg-muted transition-colors" aria-label="Next">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-1">
            <button onClick={() => openCreate(currentDate, "milestone")} className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              <Plus className="h-3 w-3" /> Milestone
            </button>
            <button onClick={() => openCreate(currentDate, "meeting")} className="flex items-center gap-1 border border-border px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
              <Plus className="h-3 w-3" /> Meeting
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border"><h2 className="text-lg font-semibold">{monthName}</h2></div>
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : view === "month" ? (
          <MonthView currentDate={currentDate} events={events} today={today} onDayClick={(d) => openCreate(d, "milestone")} />
        ) : view === "week" ? (
          <WeekView currentDate={currentDate} events={events} today={today} onDayClick={(d) => openCreate(d, "milestone")} />
        ) : (
          <DayView currentDate={currentDate} events={events} today={today} />
        )}
      </div>

      {showCreateModal && (
        <QuickCreateModal type={createType} date={createDate} onClose={() => setShowCreateModal(false)} onCreated={() => { setShowCreateModal(false); loadEvents(); }} />
      )}
    </div>
  );
}

function MonthView({ currentDate, events, today, onDayClick }: { currentDate: Date; events: CalendarEvent[]; today: Date; onDayClick: (d: Date) => void }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = new Date(year, month, 1).getDay();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(new Date(year, month, i));
  while (cells.length < 42) cells.push(null);

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-border">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2 border-r last:border-r-0 border-border">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((date, i) => {
          if (!date) return <div key={i} className="min-h-[100px] bg-muted/20 border-r border-b border-border last:border-r-0" />;
          const dayEvents = events.filter((e) => isSameDay(new Date(e.date), date));
          const isToday = isSameDay(date, today);
          return (
            <div key={i} className="min-h-[100px] p-1 border-r border-b border-border last:border-r-0 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => onDayClick(date)}>
              <div className={`text-xs font-medium mb-1 ${isToday ? "bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center" : "text-muted-foreground"}`}>
                {date.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((e) => (
                  <div key={e.id} className="text-[10px] px-1 py-0.5 rounded truncate" style={{ backgroundColor: e.color + "20", color: e.color }} title={`${e.title} (${e.projectName})`}>{e.title}</div>
                ))}
                {dayEvents.length > 3 && <div className="text-[10px] text-muted-foreground px-1">+{dayEvents.length - 3} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ currentDate, events, today, onDayClick }: { currentDate: Date; events: CalendarEvent[]; today: Date; onDayClick: (d: Date) => void }) {
  const weekDays = getWeekDays(currentDate);
  return (
    <div>
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((d) => {
          const isToday = isSameDay(d, today);
          return (
            <div key={d.toISOString()} className="text-center py-2 border-r last:border-r-0 border-border">
              <div className="text-xs text-muted-foreground">{d.toLocaleDateString("default", { weekday: "short" })}</div>
              <div className={`text-lg font-semibold ${isToday ? "text-primary" : ""}`}>{d.getDate()}</div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-7 min-h-[400px]">
        {weekDays.map((d) => {
          const dayEvents = events.filter((e) => isSameDay(new Date(e.date), d));
          return (
            <div key={d.toISOString()} className="p-1 border-r last:border-r-0 border-border hover:bg-muted/30 cursor-pointer" onClick={() => onDayClick(d)}>
              {dayEvents.map((e) => (
                <div key={e.id} className="text-xs px-2 py-1 mb-1 rounded" style={{ backgroundColor: e.color + "20", color: e.color }}>{e.title}</div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayView({ currentDate, events, today }: { currentDate: Date; events: CalendarEvent[]; today: Date }) {
  const dayEvents = events.filter((e) => isSameDay(new Date(e.date), currentDate));
  const isToday = isSameDay(currentDate, today);
  return (
    <div className="p-4">
      <div className={`text-center mb-4 ${isToday ? "text-primary font-bold" : ""}`}>
        <div className="text-sm text-muted-foreground">{currentDate.toLocaleDateString("default", { weekday: "long" })}</div>
        <div className="text-3xl font-bold">{currentDate.getDate()}</div>
      </div>
      <div className="space-y-1">
        {dayEvents.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No events this day</p>
        ) : dayEvents.map((e) => (
          <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
            <div className="w-1 h-8 rounded-full" style={{ backgroundColor: e.color }} />
            <div>
              <p className="text-sm font-medium">{e.title}</p>
              <p className="text-xs text-muted-foreground">{e.projectName}{e.duration ? ` - ${e.duration}min` : ""}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickCreateModal({ type, date, onClose, onCreated }: { type: "milestone" | "meeting"; date: string; onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState(date);
  const [duration, setDuration] = useState("30");
  const [projectId, setProjectId] = useState("");
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/projects").then((r) => r.json()).then(setProjects);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !projectId) { toast.error("Title and project are required"); return; }
    setLoading(true);
    try {
      const url = type === "milestone" ? `/api/projects/${projectId}/milestones` : `/api/projects/${projectId}/meetings`;
      const body = type === "milestone"
        ? { title, description, date: eventDate }
        : { title, description, date: eventDate, duration: parseInt(duration) };
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Failed"); return; }
      toast.success(`${type === "milestone" ? "Milestone" : "Meeting"} created!`);
      onCreated();
    } catch { toast.error("Something went wrong"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">New {type === "milestone" ? "Milestone" : "Meeting"}</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Project</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" required>
              <option value="">Select project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Date</label>
              <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" required />
            </div>
            {type === "meeting" && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Duration (min)</label>
                <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min="5" className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
              {loading ? "Creating..." : "Create"}
            </button>
            <button type="button" onClick={onClose} className="border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
