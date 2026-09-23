import Link from "next/link";
import { Check } from "lucide-react";

type Plan = {
  name: string;
  tagline: string;
  price: string;
  priceNote?: string;
  cta: { label: string; href: string };
  highlighted: boolean;
  features: string[];
};

const plans: Plan[] = [
  {
    name: "Starter",
    tagline: "Organize your work",
    price: "Free",
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
    priceNote: "/user/mo or $120/year — save 17%",
    cta: { label: "Start Free Trial", href: "/register" },
    highlighted: true,
    features: [
      "Unlimited projects",
      "Advanced dashboards",
      "Reports & analytics",
      "Automations",
      "Team collaboration",
      "Priority support",
    ],
  },
  {
    name: "Scale",
    tagline: "Run your organization",
    price: "$25",
    priceNote: "/user/mo",
    cta: { label: "Contact Sales", href: "mailto:sales@nexora.app" },
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
    <section id="pricing" className="scroll-mt-20 py-20 md:py-28 bg-muted/40 border-y border-border">
      <div className="max-w-6xl mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Simple pricing. No surprises.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Choose the plan that fits the way your team works.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col bg-white rounded-2xl border p-8 ${
                plan.highlighted
                  ? "border-primary shadow-lg"
                  : "border-border"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold rounded-full px-3 py-1">
                  Most popular
                </span>
              )}

              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">
                  {plan.price}
                </span>
                {plan.priceNote && (
                  <span className="text-xs text-muted-foreground">
                    {plan.priceNote}
                  </span>
                )}
              </div>

              <ul className="mt-6 space-y-3 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-foreground">
                    <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.cta.href}
                className={`mt-8 w-full text-center rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  plan.highlighted
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border border-border hover:bg-muted"
                }`}
              >
                {plan.cta.label}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          No credit card required to get started. Cancel anytime. Upgrade or
          downgrade whenever you need. Your data stays yours.
        </p>
      </div>
    </section>
  );
}