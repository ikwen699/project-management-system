const steps = [
  {
    title: "Create your project",
    description:
      "Set your objectives, timeline, team members, and milestones.",
  },
  {
    title: "Break the work down",
    description: "Turn the project into clear, actionable tasks.",
  },
  {
    title: "Assign responsibilities",
    description: "Give every task an owner and a deadline.",
  },
  {
    title: "Track progress",
    description:
      "See what's moving, what's stuck, and what's approaching its deadline.",
  },
  {
    title: "Deliver with confidence",
    description: "Keep everyone aligned until the project is complete.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 py-20 md:py-28 bg-slate-900 text-slate-100"
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            From idea to completion in a few simple steps.
          </h2>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-6"
            >
              <span className="text-sm font-bold text-primary">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}