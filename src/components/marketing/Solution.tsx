const steps = [
  { title: "Plan", description: "Set objectives, timelines, and milestones." },
  { title: "Assign", description: "Give every task an owner and a deadline." },
  { title: "Collaborate", description: "Keep conversations and files where the work happens." },
  { title: "Track", description: "See progress and upcoming deadlines at a glance." },
  { title: "Deliver", description: "Stay aligned until every project is complete." },
];

export function Solution() {
  return (
    <section className="py-20 md:py-28 bg-muted/40 border-y border-border">
      <div className="max-w-6xl mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Everything your team needs. One place to manage it.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
            Nexora brings your projects, tasks, people, deadlines, and progress
            together in one organized workspace. Instead of switching between
            tools and constantly asking for updates, your team gets a shared
            source of truth.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="bg-white border border-border rounded-xl p-5"
            >
              <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                {i + 1}
              </div>
              <h3 className="mt-3 font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-10 mx-auto max-w-2xl text-center text-muted-foreground leading-relaxed">
          Everyone knows what they&apos;re responsible for. Everyone can see
          what&apos;s happening. And you can see where every project stands.
        </p>
      </div>
    </section>
  );
}