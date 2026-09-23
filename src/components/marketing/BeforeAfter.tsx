import { XCircle, CheckCircle2 } from "lucide-react";

const before = [
  "Tasks scattered everywhere",
  "Endless status meetings",
  "“Who is handling this?”",
  "Missed deadlines",
  "Manual progress tracking",
  "Managers constantly chasing updates",
];

const after = [
  "One organized workspace",
  "Clear task ownership",
  "Real-time project visibility",
  "Deadlines everyone can see",
  "Automated progress tracking",
  "Teams that know what to do next",
];

export function BeforeAfter() {
  return (
    <section className="py-20 md:py-28 bg-muted/40 border-y border-border">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Stop managing projects like this. Start working like this.
          </h2>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="bg-white border border-border rounded-2xl p-8">
            <h3 className="text-lg font-semibold text-destructive">
              Before Nexora
            </h3>
            <ul className="mt-6 space-y-3">
              {before.map((item) => (
                <li key={item} className="flex items-start gap-3 text-muted-foreground">
                  <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border-2 border-primary rounded-2xl p-8">
            <h3 className="text-lg font-semibold text-primary">With Nexora</h3>
            <ul className="mt-6 space-y-3">
              {after.map((item) => (
                <li key={item} className="flex items-start gap-3 text-foreground">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}