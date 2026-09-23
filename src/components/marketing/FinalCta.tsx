import Link from "next/link";

export function FinalCta() {
  return (
    <section className="py-20 md:py-28 bg-slate-900 text-slate-100">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Ready to get your projects under control?
        </h2>
        <p className="mt-5 text-lg text-slate-400 leading-relaxed">
          Stop chasing updates. Stop searching through scattered conversations.
          Give your team one place to plan, collaborate, and get work done.
        </p>

        <div className="mt-8">
          <Link
            href="/register"
            className="inline-block bg-primary text-primary-foreground px-10 py-4 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Start Free →
          </Link>
        </div>

        <p className="mt-4 text-sm text-slate-400">
          Set up your first project in minutes. No credit card required.
        </p>
      </div>
    </section>
  );
}