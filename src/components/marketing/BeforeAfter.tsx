import { XCircle, CheckCircle2, Zap } from "lucide-react";

const before = [
  "Tasks scattered everywhere",
  "Endless status meetings",
  "\u201cWho is handling this?\u201d",
  "Missed deadlines",
  "Manual progress tracking",
  "Managers chasing updates",
];

const after = [
  "One organized workspace",
  "Clear task ownership",
  "Real-time project visibility",
  "Deadlines everyone can see",
  "Automated progress tracking",
  "Teams that know what to do next",
];

export function BeforeAfter() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute top-24 -left-24 h-[320px] w-[320px] rounded-full bg-primary/10 blur-3xl" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-semibold uppercase tracking-wide">
            Before and after
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Two ways to run your projects.
          </h2>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2 lg:gap-8 items-stretch">
          <div className="relative rounded-2xl border border-border bg-card p-7 sm:p-9 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-priority-urgent/15 text-priority-urgent">
                <XCircle className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-bold text-priority-urgent">Before Xora</h3>
                <p className="text-xs text-muted-foreground">
                  Stop managing projects like this
                </p>
              </div>
            </div>
            <ul className="mt-7 space-y-3.5">
              {before.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-sm text-muted-foreground"
                >
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-priority-urgent/15 shrink-0">
                    <XCircle className="h-3.5 w-3.5 text-priority-urgent" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 p-7 sm:p-9 text-white shadow-xl shadow-violet-600/25">
            <div className="absolute top-0 right-0 h-24 w-24 bg-accent rounded-full blur-2xl" />
            <div className="relative flex items-center gap-3">
              <span className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-primary/20">
                <Zap className="h-5 w-5" fill="currentColor" strokeWidth={0} />
              </span>
              <div>
                <h3 className="font-bold">With Xora</h3>
                <p className="text-xs text-violet-100">
                  Start working like this
                </p>
              </div>
            </div>
            <ul className="mt-7 space-y-3.5">
              {after.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-sm text-violet-50"
                >
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/20 shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}