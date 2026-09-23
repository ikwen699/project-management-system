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
      "Break complex projects into manageable tasks, assign responsibilities, set deadlines, and keep everyone aligned from day one.",
  },
  {
    icon: LayoutDashboard,
    title: "Know what's happening at a glance",
    description:
      "Your dashboard gives you an instant overview of project progress, upcoming deadlines, completed work, and outstanding tasks.",
  },
  {
    icon: UserCheck,
    title: "Keep everyone accountable",
    description:
      "Assign every task to the right person with clear deadlines and priorities. No more uncertainty about who is responsible for what.",
  },
  {
    icon: AlarmClock,
    title: "Never lose track of deadlines",
    description:
      "Keep upcoming work visible on the calendar and receive timely reminders so important tasks don't quietly slip through the cracks.",
  },
  {
    icon: MessageSquare,
    title: "Collaborate without the chaos",
    description:
      "Keep project updates and files connected to the work they're actually about — one thread per project, instead of dozens of scattered messages.",
  },
  {
    icon: TrendingUp,
    title: "Measure progress",
    description:
      "Turn project activity into useful insights. Understand what's completed, what's behind schedule, and where attention is needed.",
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Built to solve real problems, not add more tools.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Every feature exists to answer one question:“Why should I care?”
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white border border-border rounded-2xl p-6 hover:shadow-sm transition-shadow"
            >
              <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-primary/10 text-primary">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}