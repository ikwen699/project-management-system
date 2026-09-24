import {
  Bell,
  CheckCircle2,
  Flag,
  FolderKanban,
  Lock,
  Plus,
  Search,
  Zap,
} from "lucide-react";

const columns = [
  {
    title: "To do",
    count: 4,
    dot: "bg-slate-400",
    tasks: [
      { title: "Draft onboarding flow", priority: "High", priorityClass: "bg-amber-50 text-amber-700", due: "Oct 02" },
      { title: "Update brand guidelines", priority: "Low", priorityClass: "bg-slate-100 text-slate-600", due: "Oct 05" },
    ],
  },
  {
    title: "In progress",
    count: 8,
    dot: "bg-blue-500",
    tasks: [
      { title: "Finalize landing page copy", priority: "High", priorityClass: "bg-amber-50 text-amber-700", due: "Sep 28" },
      { title: "Mobile layout polish", priority: "Urgent", priorityClass: "bg-red-50 text-red-700", due: "Sep 27" },
    ],
  },
  {
    title: "Done",
    count: 24,
    dot: "bg-green-500",
    tasks: [
      { title: "Set up task workflows", priority: "Done", priorityClass: "bg-green-50 text-green-700", due: "Sep 20" },
      { title: "Client kickoff call", priority: "Done", priorityClass: "bg-green-50 text-green-700", due: "Sep 18" },
    ],
  },
];

const avatars = [
  { initials: "AK", tint: "bg-blue-500" },
  { initials: "SM", tint: "bg-emerald-500" },
  { initials: "JT", tint: "bg-amber-500" },
];

export function ProductShowcase() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black,transparent)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[420px] w-[760px] rounded-full bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-violet-500/10 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 text-violet-600 text-xs font-semibold uppercase tracking-wide">
            The product
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
            See your entire project
            <span className="block text-gradient">without digging through messages.</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A live snapshot of where every project stands — progress, completed
            work, what&apos;s in motion, and what&apos;s coming next.
          </p>
        </div>

        <div className="mt-14">
          <div className="relative rounded-2xl">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-violet-500 rounded-3xl opacity-20 blur-lg" />
            <div className="relative bg-white border border-border rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-slate-50">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-border text-xs text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    app.xora.app/projects/web-redesign/board
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
                  <Search className="h-4 w-4" />
                  <Bell className="h-4 w-4" />
                </div>
              </div>

              <div className="p-5 sm:p-7">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                      <FolderKanban className="h-5 w-5" />
                    </span>
                    <div className="text-left">
                      <p className="font-bold text-slate-900">Website Redesign</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex -space-x-2">
                          {avatars.map((a) => (
                            <span
                              key={a.initials}
                              className={`inline-flex items-center justify-center h-6 w-6 rounded-full ${a.tint} text-[9px] font-bold text-white ring-2 ring-white`}
                            >
                              {a.initials}
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">+3</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-40 sm:w-48">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-bold text-indigo-600">72%</span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-blue-600 to-indigo-600" />
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid md:grid-cols-3 gap-4">
                  {columns.map((col) => (
                    <div key={col.title} className="rounded-xl bg-slate-100/80 p-3">
                      <div className="flex items-center justify-between px-1.5 pb-2">
                        <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                          <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                          {col.title}
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {col.count}
                          </span>
                        </span>
                        <Plus className="h-3.5 w-3.5 text-slate-400" />
                      </div>

                      <div className="space-y-2.5">
                        {col.tasks.map((task) => (
                          <div
                            key={task.title}
                            className="rounded-lg bg-white border border-border p-3 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-medium text-slate-800 leading-snug text-left">
                                {task.title}
                              </p>
                              <Flag className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${task.priorityClass}`}>
                                {task.priority}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {task.due}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <span className="absolute -right-3 -top-4 inline-flex items-center gap-1.5 rounded-full bg-white border border-border shadow-lg px-3 py-1.5 text-xs font-semibold text-slate-700">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              Task completed
            </span>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-border text-sm text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            72% complete
          </span>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-border text-sm text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            8 tasks in motion
          </span>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-border text-sm text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-amber-500" fill="currentColor" strokeWidth={0} />
            3 deadlines ahead
          </span>
        </div>
      </div>
    </section>
  );
}