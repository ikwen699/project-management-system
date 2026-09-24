import {
  Briefcase,
  Users,
  Rocket,
  Building2,
  Globe,
  Sparkles,
} from "lucide-react";

const personas = [
  {
    icon: Briefcase,
    title: "Project Managers",
    description:
      "Get complete visibility without chasing your team for updates.",
    gradient: "from-blue-600 to-indigo-600",
  },
  {
    icon: Users,
    title: "Team Leaders",
    description:
      "Keep responsibilities clear and the team moving toward one goal.",
    gradient: "from-indigo-500 to-violet-600",
  },
  {
    icon: Rocket,
    title: "Startups",
    description:
      "Organize rapidly changing priorities without added complexity.",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: Building2,
    title: "Businesses",
    description: "Manage multiple projects and teams from one central system.",
    gradient: "from-sky-500 to-blue-600",
  },
  {
    icon: Globe,
    title: "Remote Teams",
    description:
      "Keep distributed teams aligned wherever they're working from.",
    gradient: "from-emerald-500 to-green-600",
  },
];

export function WhoItsFor() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute bottom-0 right-0 h-[340px] w-[340px] rounded-full bg-violet-500/10 blur-3xl" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold uppercase tracking-wide">
            Who it&apos;s for
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
            Built for people who get things done.
          </h2>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {personas.map((persona) => (
            <div
              key={persona.title}
              className="group bg-white border border-border rounded-2xl p-7 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              <span className={`inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br ${persona.gradient} text-white shadow-md group-hover:scale-105 transition-transform`}>
                <persona.icon className="h-5.5 w-5.5" />
              </span>
              <h3 className="mt-5 font-bold text-slate-900">{persona.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {persona.description}
              </p>
            </div>
          ))}

          <div className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-7 text-center hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors">
            <span className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-white border border-border text-indigo-500 shadow-sm group-hover:scale-105 transition-transform">
              <Sparkles className="h-5.5 w-5.5" />
            </span>
            <p className="mt-5 font-bold text-slate-900">
              ...and every team tired of chaos.
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              If you manage work with people, Xora fits.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}