import { XCircle } from "lucide-react";

const pains = [
  "Tasks scattered across WhatsApp, email, spreadsheets, and notebooks",
  "Missed deadlines and forgotten assignments",
  "Team members asking, “What's the status of this?”",
  "Managers spending hours chasing updates",
  "No clear ownership of tasks",
  "Projects that start strong but slowly lose momentum",
  "Difficulty seeing the big picture while managing the details",
];

export function Problem() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Your projects shouldn&apos;t feel like a daily fire drill.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Maybe your team is dealing with:
          </p>
        </div>

        <ul className="mt-10 max-w-2xl mx-auto space-y-3">
          {pains.map((pain) => (
            <li
              key={pain}
              className="flex items-start gap-3 bg-white border border-border rounded-xl px-5 py-4 text-muted-foreground"
            >
              <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              {pain}
            </li>
          ))}
        </ul>

        <p className="mt-10 max-w-2xl mx-auto text-center text-lg">
          The problem isn&apos;t that your team isn&apos;t working hard.
          <br />
          <span className="font-semibold text-foreground">
            It&apos;s that the work isn&apos;t organized in one system.
          </span>
        </p>
      </div>
    </section>
  );
}