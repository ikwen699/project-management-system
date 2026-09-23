import {
  Briefcase,
  Users,
  Rocket,
  Building2,
  Globe,
} from "lucide-react";

const personas = [
  {
    icon: Briefcase,
    title: "Project Managers",
    description:
      "Get complete visibility without constantly chasing your team for updates.",
  },
  {
    icon: Users,
    title: "Team Leaders",
    description:
      "Keep responsibilities clear and make sure everyone is moving toward the same goal.",
  },
  {
    icon: Rocket,
    title: "Startups",
    description:
      "Organize rapidly changing priorities without adding unnecessary complexity.",
  },
  {
    icon: Building2,
    title: "Businesses",
    description:
      "Manage multiple projects and teams from one centralized system.",
  },
  {
    icon: Globe,
    title: "Remote Teams",
    description:
      "Keep distributed teams aligned regardless of where they're working.",
  },
];

export function WhoItsFor() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Built for people who get things done.
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {personas.map((persona) => (
            <div
              key={persona.title}
              className="bg-white border border-border rounded-2xl p-6"
            >
              <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-primary/10 text-primary">
                <persona.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{persona.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {persona.description}
              </p>
            </div>
          ))}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border text-center p-6">
            <p className="font-semibold">...and every team that&apos;s tired of chaos.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              If you manage work with people, Nexora fits.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}