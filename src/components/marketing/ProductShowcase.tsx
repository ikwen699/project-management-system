import { FolderKanban, CalendarDays, CheckCircle2, Clock, ListTodo } from "lucide-react";

const statCards = [
  { icon: CheckCircle2, label: "Tasks completed", value: "24", color: "text-green-600" },
  { icon: ListTodo, label: "Tasks in progress", value: "8", color: "text-blue-600" },
  { icon: Clock, label: "Tasks pending", value: "4", color: "text-muted-foreground" },
  { icon: CalendarDays, label: "Upcoming deadlines", value: "3", color: "text-amber-600" },
];

export function ProductShowcase() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            See your entire project without digging through dozens of messages.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Your dashboard gives you a live snapshot of where every project
            stands — progress, completed work, what&apos;s in motion, and what&apos;s
            coming next.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_340px] items-center">
          <div className="bg-secondary rounded-2xl">
            <div className="bg-white border border-border rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10">
                    <FolderKanban className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Website Redesign</p>
                    <p className="text-xs text-muted-foreground">
                      Project · Active
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-status-completed bg-completed-bg text-completed-text rounded-full px-3 py-1">
                  On track
                </span>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Project progress</span>
                  <span className="font-semibold text-primary">72%</span>
                </div>
                <div className="mt-2 h-2.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full w-[72%] rounded-full bg-primary" />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                {statCards.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center gap-3 rounded-xl border border-border px-4 py-3"
                  >
                    <stat.icon className={`h-5 w-5 shrink-0 ${stat.color}`} />
                    <div>
                      <p className="text-lg font-bold leading-none">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <span className="inline-flex items-center gap-2 text-sm font-semibold">
                <span className="h-2 w-2 rounded-full bg-green-500" /> 72% complete
              </span>
              <p className="mt-1 text-sm text-muted-foreground">
                More than two thirds done, with everything still on schedule.
              </p>
            </div>
            <div>
              <span className="inline-flex items-center gap-2 text-sm font-semibold">
                <span className="h-2 w-2 rounded-full bg-blue-500" /> 8 tasks in motion
              </span>
              <p className="mt-1 text-sm text-muted-foreground">
                Know exactly who is working on what, right now.
              </p>
            </div>
            <div>
              <span className="inline-flex items-center gap-2 text-sm font-semibold">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> 3 deadlines ahead
              </span>
              <p className="mt-1 text-sm text-muted-foreground">
                Nothing slips through — the next due dates are always visible.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-12 text-center text-sm text-muted-foreground">
          This is the kind of clarity your team gets the moment they sign in.
        </p>
      </div>
    </section>
  );
}