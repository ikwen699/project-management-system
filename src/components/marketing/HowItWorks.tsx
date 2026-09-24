import Link from "next/link";
import { ArrowRight } from "lucide-react";

const steps = [
  {
    title: "Create your project",
    description: "Set objectives, timeline, team members, and milestones.",
    gradient: "from-blue-500 to-indigo-500",
  },
  {
    title: "Break the work down",
    description: "Turn the project into clear, actionable tasks.",
    gradient: "from-indigo-500 to-violet-500",
  },
  {
    title: "Assign responsibilities",
    description: "Give every task an owner and a deadline.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    title: "Track progress",
    description: "See what's moving, what's stuck, and what's due next.",
    gradient: "from-sky-500 to-blue-500",
  },
  {
    title: "Deliver with confidence",
    description: "Keep everyone aligned until the project is complete.",
    gradient: "from-rose-500 to-orange-500",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 relative py-24 md:py-32 bg-slate-950 overflow-hidden"
    >
      <div className="absolute inset-0 bg-grid-dark [mask-image:radial-gradient(ellipse_55%_55%_at_50%_30%,black,transparent)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[420px] w-[760px] rounded-full bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-violet-600/20 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-semibold uppercase tracking-wide">
            How it works
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
            From idea to completion
            <span className="block text-gradient-light">in a few simple steps.</span>
          </h2>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="relative group bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 hover:-translate-y-1 transition-all"
            >
              <span className={`inline-flex items-center justify-center h-9 w-12 rounded-lg bg-gradient-to-br ${step.gradient} text-white text-sm font-extrabold shadow-md`}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 font-bold text-white">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 bg-white text-slate-900 px-7 py-3.5 rounded-xl font-semibold shadow-lg shadow-white/10 hover:shadow-xl hover:shadow-white/20 hover:brightness-95 transition-all"
          >
            Start your first project
            <ArrowRight className="h-4.5 w-4.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <p className="mt-3 text-sm text-slate-400">
            It takes minutes, not weeks of setup.
          </p>
        </div>
      </div>
    </section>
  );
}