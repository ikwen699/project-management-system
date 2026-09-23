import {
  ShieldCheck,
  Cloud,
  UserCog,
  RefreshCw,
  Eye,
  Rocket,
  Tag,
  Lock,
  HeartHandshake,
} from "lucide-react";

const transparency = [
  {
    icon: Rocket,
    title: "Simple setup",
    description: "Get your workspace running without weeks of implementation.",
  },
  {
    icon: Tag,
    title: "Transparent pricing",
    description: "Know what you're paying before you commit.",
  },
  {
    icon: Lock,
    title: "Your data, your workspace",
    description: "Control your projects, team members, and permissions.",
  },
  {
    icon: HeartHandshake,
    title: "Human support",
    description: "Get help when you need it.",
  },
];

const security = [
  {
    icon: ShieldCheck,
    title: "Your data is protected",
    description:
      "We use industry-standard security practices to help keep your information safe.",
  },
  {
    icon: Cloud,
    title: "Your work stays accessible",
    description:
      "Your projects are stored securely so your team can access the information they need.",
  },
  {
    icon: UserCog,
    title: "You control access",
    description:
      "Manage team permissions and control who can access sensitive projects and information.",
  },
  {
    icon: RefreshCw,
    title: "Your work stays synchronized",
    description:
      "Keep your team working from the same up-to-date project information.",
  },
  {
    icon: Eye,
    title: "Full visibility",
    description:
      "Know what's happening across your projects without relying on scattered messages or manual updates.",
  },
];

export function Trust() {
  return (
    <section className="py-20 md:py-28 bg-muted/40 border-t border-border">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Built with your team&apos;s work in mind.
            </h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
              You&apos;re trusting a system with client information, deadlines,
              and project strategy. That trust has to be earned — with
              transparency, not with promises.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {transparency.map((item) => (
                <div key={item.title} className="bg-white border border-border rounded-xl p-5">
                  <item.icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-3 font-semibold text-sm">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Your projects deserve a system you can trust.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Your project-management system isn&apos;t just storing tasks — it
              holds client information, business documents, conversations, and
              project strategy. Here&apos;s how we protect it:
            </p>

            <ul className="mt-6 space-y-4">
              {security.map((item) => (
                <li key={item.title} className="flex items-start gap-4 bg-white border border-border rounded-xl p-5">
                  <item.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-sm">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-6 text-sm text-muted-foreground">
              Try Nexora free. Explore the workspace before you commit.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}