const faqs = [
  {
    question: "Is Nexora really free to get started?",
    answer:
      "Yes. The Starter plan is free forever and includes up to 3 projects, task management, and a simple dashboard — no credit card required.",
  },
  {
    question: "Can I invite my teammates?",
    answer:
      "Absolutely. You can add team members to any project and give each one a clear role and responsibilities.",
  },
  {
    question: "How is my data protected?",
    answer:
      "We use industry-standard security practices, role-based team permissions, and secure authentication to help keep your information safe.",
  },
  {
    question: "Can I cancel or change my plan later?",
    answer:
      "Yes. You can upgrade, downgrade, or cancel at any time. Your data stays yours.",
  },
  {
    question: "What happens when I upgrade from Starter to Business?",
    answer:
      "Your projects and tasks carry over. Upgrading simply unlocks unlimited projects, advanced dashboards, reports, and more.",
  },
  {
    question: "Do I need to set up anything complicated?",
    answer:
      "No. Create your account and your first project in minutes. There's no implementation phase or weeks of configuration.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Questions, answered.
          </h2>
        </div>

        <div className="mt-10 space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group bg-white border border-border rounded-xl"
            >
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none">
                <span className="font-medium">{faq.question}</span>
                <span className="text-muted-foreground group-open:hidden">＋</span>
                <span className="text-muted-foreground hidden group-open:inline">−</span>
              </summary>
              <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}