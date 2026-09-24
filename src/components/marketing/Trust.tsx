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
    gradient: "from-blue-600 to-indigo-600",
  },
  {
    icon: Tag,
    title: "Transparent pricing",
    description: "Know what you're paying before you commit.",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: Lock,
    title: "Your data, your workspace",
    description: "Control your projects, members, and permissions.",
    gradient: "from-sky-500 to-blue-600",
  },
  {
    icon: HeartHandshake,
    title: "Human support",
    description: "Get help when you need it from real people.",
    gradient: "from-emerald-500 to-green-600",
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
      "Projects are stored securely so your team can reach them from anywhere.",
  },
  {
    icon: UserCog,
    title: "You control access",
    description:
      "Manage team permissions and control who sees sensitive projects.",
  },
  {
    icon: RefreshCw,
    title: "Your work stays synchronized",
    description:
      "Your team always works from the same up-to-date project information.",
  },
  {
    icon: Eye,
    title: "Full visibility",
    description:
      "Know what's happening across projects without scattered messages or manual updates.",
  },
];

export function Trust() {
  return (
    <section id="trust" className="scroll-mt-20 py-24 md:py-32 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold uppercase tracking-wide">
            Trust
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
            Built with your team&apos;s
            <span className="block text-gradient">work in mind.</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            You&apos;re trusting a system with client information, deadlines, and
            project strategy. That trust is earned with transparency — not
            promises.
          </p>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-2">
          <div className="grid gap-4 sm:grid-cols-2 content-start">
            {transparency.map((item) => (
              <div
                key={item.title}
                className="bg-white border border-border rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <span className={`inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br ${item.gradient} text-white shadow-sm`}>
                  <item.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-bold text-slate-900">{item.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div>
            <div className="rounded-2xl bg-slate-900 p-7 sm:p-9 text-slate-200 shadow-xl overflow-hidden relative">
              <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl" />
              <div className="relative">
                <h3 className="text-xl font-bold text-white">
                  Your projects deserve a system you can trust.
                </h3>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  Xora isn&apos;t just storing tasks — it holds client
                  information, documents, conversations, and strategy. Here&apos;s
                  how we protect it:
                </p>

                <ul className="mt-7 space-y-4">
                  {security.map((item) => (
                    <li key={item.title} className="flex items-start gap-4">
                      <span className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-white/10 text-blue-300 shrink-0">
                        <item.icon className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <h4 className="font-semibold text-white text-sm">
                          {item.title}
                        </h4>
                        <p className="mt-0.5 text-sm text-slate-400 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              Try Xora free. Explore the workspace before you commit.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}