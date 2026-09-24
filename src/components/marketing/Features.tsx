import {
  ClipboardList,
  LayoutDashboard,
  UserCheck,
  AlarmClock,
  MessageSquare,
  TrendingUp,
} from "lucide-react";

const features = [
  {
    icon: ClipboardList,
    title: "Plan projects with clarity",
    description:
      "Break complex projects into manageable tasks, set deadlines, and keep everyone aligned from day one.",
    tags: ["Tasks", "Milestones", "Deadlines"],
    gradient: "from-blue-600 to-indigo-600",
  },
  {
    icon: LayoutDashboard,
    title: "Know what's happening at a glance",
    description:
      "Your dashboard gives you an instant overview of progress, upcoming deadlines, and outstanding work.",
    tags: ["Dashboard", "Progress", "Status"],
    gradient: "from-sky-500 to-cyan-600",
  },
  {
    icon: UserCheck,
    title: "Keep everyone accountable",
    description:
      "Assign every task to the right person with clear priorities. No uncertainty about who owns what.",
    tags: ["Assignees", "Priorities", "Ownership"],
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: AlarmClock,
    title: "Never lose track of deadlines",
    description:
      "Keep upcoming work visible on the calendar and get timely reminders before things slip.",
    tags: ["Calendar", "Reminders", "Due dates"],
    gradient: "from-amber-500 to-orange-600",
  },
  {
    icon: MessageSquare,
    title: "Collaborate without the chaos",
    description:
      "Keep updates and files attached to the work they belong to — one thread, not dozens of scattered messages.",
    tags: ["Updates", "Files", "Team"],
    gradient: "from-emerald-500 to-green-600",
  },
  {
    icon: TrendingUp,
    title: "Measure progress",
    description:
      "Turn project activity into useful insights — what's completed, what's behind, and where to focus.",
    tags: ["Reports", "Insights", "Trends"],
    gradient: "from-rose-500 to-pink-600",
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 py-24 md:py-32 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold uppercase tracking-wide">
            Features
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
            Built to solve real problems,
            <span className="block text-gradient">not add more tools.</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Every feature exists to answer one question: what&apos;s in it for your team?
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group bg-white border border-border rounded-2xl p-7 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              <span className={`inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br ${feature.gradient} text-white shadow-md group-hover:scale-105 transition-transform`}>
                <feature.icon className="h-5.5 w-5.5" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-slate-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {feature.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}