import Link from "next/link";
import { Check, Sparkles } from "lucide-react";

type Plan = {
  name: string;
  tagline: string;
  price: string;
  priceSuffix: string;
  priceNote?: string;
  cta: { label: string; href: string };
  highlighted: boolean;
  features: string[];
};

const plans: Plan[] = [
  {
    name: "Starter",
    tagline: "Organize your work",
    price: "$0",
    priceSuffix: "",
    priceNote: "Free forever",
    cta: { label: "Start Free", href: "/register" },
    highlighted: false,
    features: [
      "Up to 3 projects",
      "Basic task management",
      "Simple dashboard",
      "Basic collaboration",
    ],
  },
  {
    name: "Business",
    tagline: "Run your team",
    price: "$12",
    priceSuffix: "/user/mo",
    priceNote: "or $120/year per user — save 17%",
    cta: { label: "Start Free Trial", href: "/register" },
    highlighted: true,
    features: [
      "Unlimited projects",
      "Advanced dashboards",
      "Reports and analytics",
      "Automations",
      "Team collaboration",
      "Priority support",
    ],
  },
  {
    name: "Scale",
    tagline: "Run your organization",
    price: "$25",
    priceSuffix: "/user/mo",
    priceNote: "Annual billing available",
    cta: { label: "Contact Sales", href: "mailto:sales@xora.app" },
    highlighted: false,
    features: [
      "Advanced permissions",
      "Custom workflows",
      "Advanced reporting",
      "Multiple teams",
      "Dedicated support",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_50%_45%_at_50%_50%,black,transparent)]" />
      <div className="absolute top-24 left-1/2 -translate-x-1/2 h-[360px] w-[700px] rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-semibold uppercase tracking-wide">
            Pricing
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
            Simple pricing.
            <span className="block text-gradient">No surprises.</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the plan that fits the way your team works. Start free, scale
            when you&apos;re ready.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3 lg:items-center">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-3xl p-8 ${
                plan.highlighted
                  ? "bg-gradient-to-b from-slate-900 to-slate-950 text-white shadow-2xl shadow-indigo-500/20 lg:py-12 lg:scale-[1.04] ring-1 ring-slate-800"
                  : "bg-white border border-border shadow-sm"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold rounded-full px-4 py-1.5 shadow-lg">
                  <Sparkles className="h-3 w-3" fill="currentColor" strokeWidth={0} />
                  Most popular
                </span>
              )}

              <h3 className="text-lg font-bold">{plan.name}</h3>
              <p className={`mt-1 text-sm ${plan.highlighted ? "text-slate-400" : "text-muted-foreground"}`}>
                {plan.tagline}
              </p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold tracking-tight">
                  {plan.price}
                </span>
                <span className={`text-sm ${plan.highlighted ? "text-slate-400" : "text-muted-foreground"}`}>
                  {plan.priceSuffix}
                </span>
              </div>
              {plan.priceNote && (
                <p className={`mt-1.5 text-xs ${plan.highlighted ? "text-blue-300" : "text-muted-foreground"}`}>
                  {plan.priceNote}
                </p>
              )}

              <ul className={`mt-8 space-y-3.5 flex-1 ${plan.highlighted ? "text-slate-200" : ""}`}>
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full shrink-0 ${
                      plan.highlighted ? "bg-blue-500/20 text-blue-300" : "bg-green-50 text-green-600"
                    }`}>
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.cta.href}
                className={`mt-9 w-full text-center rounded-xl px-4 py-3.5 text-sm font-semibold transition-all ${
                  plan.highlighted
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25 hover:brightness-110"
                    : "border border-border hover:bg-muted hover:shadow-sm"
                }`}
              >
                {plan.cta.label}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          {[
            "No credit card required to get started",
            "Cancel anytime",
            "Upgrade or downgrade whenever you need",
            "Your data stays yours",
          ].map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-border text-sm text-muted-foreground"
            >
              <Check className="h-3.5 w-3.5 text-green-600" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}