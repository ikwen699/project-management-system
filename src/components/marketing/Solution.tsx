import {
  ChevronRight,
  ClipboardList,
  UserPlus,
  MessageSquare,
  TrendingUp,
  Rocket,
} from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    title: "Plan",
    description: "Set objectives, timelines, and milestones.",
    gradient: "from-blue-600 to-indigo-600",
  },
  {
    icon: UserPlus,
    title: "Assign",
    description: "Give every task an owner and a deadline.",
    gradient: "from-indigo-500 to-violet-600",
  },
  {
    icon: MessageSquare,
    title: "Collaborate",
    description: "Keep updates and files where the work happens.",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: TrendingUp,
    title: "Track",
    description: "See progress and deadlines at a glance.",
    gradient: "from-sky-500 to-blue-600",
  },
  {
    icon: Rocket,
    title: "Deliver",
    description: "Stay aligned until every project is complete.",
    gradient: "from-rose-500 to-orange-500",
  },
];

export function Solution() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute -top-32 right-0 h-[360px] w-[360px] rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold uppercase tracking-wide">
            The solution
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
            Everything your team needs.
            <span className="block text-gradient">One place to manage it.</span>
          </h2>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
            Xora brings your projects, tasks, people, deadlines, and progress
            into one organized workspace — a shared source of truth for
            everyone. No more switching between tools or asking for updates.
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0 lg:gap-x-5">
          {steps.map((step, i) => (
            <div key={step.title} className="relative">
              <div
                className={`hidden lg:flex absolute top-1/2 -right-5 -translate-y-1/2 z-10 ${
                  i === steps.length - 1 ? "hidden" : ""
                }`}
              >
                <ChevronRight className="h-5 w-5 text-slate-300" />
              </div>
              <div className="group h-full bg-white border border-border rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
                <span className={`inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br ${step.gradient} text-white shadow-md group-hover:scale-105 transition-transform`}>
                  <step.icon className="h-5.5 w-5.5" />
                </span>
                <p className="mt-4 text-xs font-bold text-slate-400">
                  Step {i + 1}
                </p>
                <h3 className="mt-1 font-bold text-slate-900">{step.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-14 mx-auto max-w-2xl text-center text-muted-foreground leading-relaxed">
          Everyone knows what they&apos;re responsible for. Everyone can see
          what&apos;s happening. And you can see where every project stands.
        </p>
      </div>
    </section>
  );
}