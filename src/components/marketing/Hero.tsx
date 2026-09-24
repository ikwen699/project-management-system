import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Filter,
  FolderKanban,
  Lock,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

const trustItems = [
  "No credit card required",
  "Free to get started",
  "Cancel anytime",
  "Setup in minutes",
];

const statCards = [
  { icon: FolderKanban, label: "Active projects", value: "3", tint: "bg-blue-50 text-blue-600" },
  { icon: Sparkles, label: "Tasks completed", value: "24", tint: "bg-green-50 text-green-600" },
  { icon: Clock, label: "In progress", value: "8", tint: "bg-amber-50 text-amber-600" },
  { icon: CheckCircle2, label: "Due this week", value: "3", tint: "bg-violet-50 text-violet-600" },
];

const heroTasks = [
  { title: "Finalize landing page copy", tag: "High", tagClass: "bg-amber-50 text-amber-700", done: true },
  { title: "Set up new task workflows", tag: "Medium", tagClass: "bg-blue-50 text-blue-700", done: true },
  { title: "Client review of Week 2 deliverable", tag: "Urgent", tagClass: "bg-red-50 text-red-700", done: false },
  { title: "Plan Q3 milestone timeline", tag: "Medium", tagClass: "bg-blue-50 text-blue-700", done: false },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[480px] w-[820px] rounded-full bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-violet-500/20 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-16 md:pt-28 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-white/70 backdrop-blur text-xs font-medium text-muted-foreground shadow-sm animate-fade-up">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
          Project management, without the chaos
        </div>

        <h1 className="mt-6 text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05] text-slate-900 animate-fade-up">
          Take your projects from
          <span className="block text-gradient">Chaos to Complete.</span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-up-delay">
          One powerful workspace to plan projects, organize teams, track
          progress, manage deadlines, and deliver work — without the endless
          back-and-forth.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up-delay">
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 w-full sm:w-auto justify-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-blue-600/25 hover:brightness-110 hover:shadow-xl hover:shadow-blue-600/30 transition-all"
          >
            Start Managing Projects
            <ArrowRight className="h-4.5 w-4.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <a
            href="#how-it-works"
            className="group inline-flex items-center gap-2 w-full sm:w-auto justify-center border border-border bg-white px-8 py-4 rounded-xl font-semibold hover:bg-muted shadow-sm transition-all"
          >
            <Play className="h-4 w-4 fill-current text-indigo-500 group-hover:scale-110 transition-transform" />
            See How It Works
          </a>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          No complicated setup. No scattered spreadsheets. No guessing
          what&apos;s happening.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {trustItems.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-border bg-white/70 backdrop-blur text-sm text-muted-foreground shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="relative rounded-2xl">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-violet-500 rounded-3xl opacity-20 blur-lg" />
          <div className="relative bg-white border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-up">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-slate-50">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 flex justify-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-border text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  app.xora.app/dashboard
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
                <Search className="h-4 w-4" />
                <Filter className="h-4 w-4" />
              </div>
            </div>

            <div className="flex">
              <aside className="hidden md:flex flex-col w-44 bg-slate-900 text-slate-300 px-3 py-4 gap-6">
                <div className="flex items-center gap-2 px-2">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                    <Zap className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
                  </span>
                  <span className="text-sm font-bold text-white">Xora</span>
                </div>
                {["Dashboard", "Projects", "Calendar", "Notifications"].map(
                  (item, i) => (
                    <span
                      key={item}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium ${
                        i === 0
                          ? "bg-white/10 text-white"
                          : "text-slate-400"
                      }`}
                    >
                      {item}
                    </span>
                  )
                )}
              </aside>

              <div className="flex-1 p-5 sm:p-7">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">Good morning, Alex</p>
                    <p className="text-lg font-bold text-slate-900">Website Redesign</p>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5" /> On track
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {statCards.map((stat) => (
                    <div
                      key={stat.label}
                      className="flex items-center gap-3 rounded-xl border border-border bg-white px-3.5 py-3"
                    >
                      <span className={`inline-flex items-center justify-center h-8 w-8 rounded-lg ${stat.tint}`}>
                        <stat.icon className="h-4 w-4" />
                      </span>
                      <div className="text-left">
                        <p className="text-base font-bold leading-none text-slate-900">
                          {stat.value}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {stat.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-900">Project progress</span>
                    <span className="font-bold text-indigo-600">72%</span>
                  </div>
                  <div className="mt-2 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-blue-600 to-indigo-600" />
                  </div>

                  <ul className="mt-4 space-y-2">
                    {heroTasks.map((task) => (
                      <li
                        key={task.title}
                        className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-slate-50"
                      >
                        <span
                          className={`inline-flex items-center justify-center h-4.5 w-4.5 rounded-full border ${
                            task.done
                              ? "bg-green-50 border-green-300 text-green-600"
                              : "border-slate-300 text-transparent"
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </span>
                        <span className="flex-1 text-xs text-left text-slate-700">
                          {task.title}
                        </span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${task.tagClass}`}>
                          {task.tag}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <span className="absolute -right-3 -top-4 inline-flex items-center gap-1.5 rounded-full bg-white border border-border shadow-lg px-3 py-1.5 text-xs font-semibold text-slate-700">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Task completed
          </span>
          <span className="absolute -left-4 bottom-8 inline-flex items-center gap-1.5 rounded-full bg-white border border-border shadow-lg px-3 py-1.5 text-xs font-semibold text-slate-700">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            Deadline in 2 days
          </span>
        </div>
      </div>
    </section>
  );
}