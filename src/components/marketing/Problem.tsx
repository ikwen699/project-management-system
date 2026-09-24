import { ArrowRight, XCircle } from "lucide-react";

const pains = [
  {
    title: "Scattered work",
    description: "Tasks live across WhatsApp, email, spreadsheets, and notebooks.",
  },
  {
    title: "Missed deadlines",
    description: "Assignments slip through with no one noticing until it's too late.",
  },
  {
    title: "Status chasing",
    description: "\u201cWhat's the status of this?\u201d on repeat, all day long.",
  },
  {
    title: "No clear ownership",
    description: "It's anyone's guess who is responsible for what.",
  },
  {
    title: "Losing momentum",
    description: "Projects start strong, then slowly grind to a halt.",
  },
  {
    title: "No big picture",
    description: "Hard to see the details and the whole project at the same time.",
  },
];

export function Problem() {
  return (
    <section className="relative py-24 md:py-32 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold uppercase tracking-wide">
            The problem
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
            Your projects shouldn&apos;t feel like a daily fire drill.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Sound familiar? Maybe some of these are happening in your team today:
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {pains.map((pain, i) => (
            <div
              key={pain.title}
              className="group bg-white border border-border rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-red-50 text-red-500 group-hover:scale-105 transition-transform">
                  <XCircle className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold text-slate-300">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{pain.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                {pain.description}
              </p>
            </div>
          ))}

          <a
            href="#how-it-works"
            className="group flex flex-col justify-between bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all"
          >
            <p className="text-sm text-blue-100">Sound familiar?</p>
            <p className="mt-2 font-semibold leading-snug">
              There&apos;s a better way to run your projects.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
              Show me how
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </a>
        </div>

        <div className="mt-14 mx-auto max-w-3xl rounded-2xl bg-white border border-border p-6 sm:p-8 text-center shadow-sm">
          <p className="text-lg sm:text-xl text-slate-700">
            The problem isn&apos;t that your team isn&apos;t working hard.
          </p>
          <p className="mt-2 text-lg sm:text-xl font-bold text-slate-900">
            It&apos;s that the work isn&apos;t organized in{" "}
            <span className="text-gradient">one system</span>.
          </p>
        </div>
      </div>
    </section>
  );
}