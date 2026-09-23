import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

const trustItems = [
  "No credit card required",
  "Free to get started",
  "Cancel anytime",
  "Setup in minutes",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 pt-20 pb-16 md:pt-28 md:pb-20 text-center">
        <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full border border-border bg-muted/50 text-xs font-medium text-muted-foreground">
          Project management, without the chaos
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
          Take Your Projects From
          <br className="hidden md:block" />{" "}
          <span className="text-primary">Chaos to Complete.</span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          One powerful workspace to plan projects, organize teams, track
          progress, manage deadlines, and deliver work without the endless
          back-and-forth.
        </p>

        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Whether you&apos;re managing a small team or multiple projects,
          Nexora gives everyone one clear place to know what needs to be done,
          who owns it, and when it needs to be finished.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="w-full sm:w-auto text-center bg-primary text-primary-foreground px-8 py-3.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Start Managing Projects →
          </Link>
          <a
            href="#how-it-works"
            className="w-full sm:w-auto text-center border border-border px-8 py-3.5 rounded-xl font-semibold hover:bg-muted transition-colors"
          >
            See How It Works
          </a>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          No complicated setup. No scattered spreadsheets. No guessing
          what&apos;s happening.
        </p>
      </div>

      <div className="border-y border-border bg-muted/40">
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
          {trustItems.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground"
            >
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}