import Link from "next/link";
import { MessageCircle, Plus } from "lucide-react";

const faqs = [
  {
    question: "Is Xora really free to get started?",
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
      "Yes. You can upgrade, downgrade, or cancel at any time. Your data always stays yours.",
  },
  {
    question: "What happens when I upgrade from Starter to Business?",
    answer:
      "Your projects and tasks carry over automatically. Upgrading simply unlocks unlimited projects, advanced dashboards, reports, and more.",
  },
  {
    question: "Do I need to set up anything complicated?",
    answer:
      "No. Create your account and your first project in minutes. There's no implementation phase or weeks of configuration.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 py-24 md:py-32 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold uppercase tracking-wide">
              FAQ
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Questions, answered.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Everything you need to know before you get started. If
              there&apos;s something else on your mind, we&apos;re here to help.
            </p>

            <div className="mt-8 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-7 text-white shadow-lg shadow-blue-600/20">
              <span className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-white/15">
                <MessageCircle className="h-5.5 w-5.5" />
              </span>
              <h3 className="mt-4 font-bold">Still have questions?</h3>
              <p className="mt-1.5 text-sm text-blue-100 leading-relaxed">
                Reach out and our team will get back to you.
              </p>
              <Link
                href="mailto:support@xora.app"
                className="mt-5 inline-flex items-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-indigo-600 hover:brightness-95 transition-all"
              >
                Contact us
              </Link>
            </div>
          </div>

          <div className="space-y-3.5">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group bg-white border border-border rounded-2xl shadow-sm open:shadow-md transition-shadow"
              >
                <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none">
                  <span className="font-semibold text-slate-900">
                    {faq.question}
                  </span>
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 text-slate-500 shrink-0 group-open:bg-indigo-50 group-open:text-indigo-600 transition-colors">
                    <Plus className="h-4 w-4 group-open:rotate-45 transition-transform" />
                  </span>
                </summary>
                <p className="px-6 pb-6 text-sm text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}