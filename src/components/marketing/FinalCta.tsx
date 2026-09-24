import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const assurances = [
  "No credit card required",
  "Free to get started",
  "Set up in minutes",
];

export function FinalCta() {
  return (
    <section className="relative py-24 md:py-32 bg-slate-950 overflow-hidden">
      <div className="absolute inset-0 bg-grid-dark [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[440px] w-[820px] rounded-full bg-gradient-to-r from-blue-600/25 via-indigo-600/25 to-violet-600/25 blur-3xl" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-semibold uppercase tracking-wide">
          Get started today
        </span>

        <h2 className="mt-5 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Ready to get your projects
          <span className="block text-gradient-light">under control?</span>
        </h2>

        <p className="mt-6 text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
          Stop chasing updates. Stop searching through scattered conversations.
          Give your team one place to plan, collaborate, and get work done.
        </p>

        <div className="mt-9">
          <Link
            href="/register"
            className="group inline-flex items-center gap-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-4.5 rounded-2xl font-bold text-lg shadow-2xl shadow-blue-600/40 hover:brightness-110 hover:scale-105 transition-all"
          >
            Start Free
            <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <p className="mt-4 text-sm text-slate-400">
            Set up your first project in minutes.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {assurances.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300"
            >
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}