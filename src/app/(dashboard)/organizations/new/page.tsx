"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Building2, Plus, X } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ORG_TYPES, TEAM_SUGGESTIONS } from "@/lib/orgs";

interface TeamDraft {
  name: string;
  id: string;
}

export default function NewOrganizationPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [customType, setCustomType] = useState("");
  const [description, setDescription] = useState("");
  const [teams, setTeams] = useState<TeamDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function addTeam(teamName: string) {
    const trimmed = teamName.trim();
    if (!trimmed) return;
    if (teams.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) return;
    setTeams([...teams, { name: trimmed, id: crypto.randomUUID() }]);
  }

  function removeTeam(id: string) {
    setTeams(teams.filter((t) => t.id !== id));
  }

  const resolvedType = customType.trim() || type;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Organisation name is required");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type: resolvedType,
          description: description.trim() || "",
          teams: teams.map((t) => ({ name: t.name, type: t.name })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create organisation");
        return;
      }

      toast.success("Organisation created!");
      router.push(`/organizations/${data.id}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/organizations"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Organisations
        </Link>
        <h1 className="text-2xl font-bold">Create Organisation</h1>
        <p className="text-muted-foreground">
          Set up your organisation, then add teams and members.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-border p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Organisation Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corporation"
              className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Organisation Type
            </label>
            <div className="flex flex-wrap gap-2">
              {ORG_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setType(t);
                    setCustomType("");
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    type === t && !customType
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="Or type a custom type..."
                className="flex-1 border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {resolvedType || "Not set"}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does your organisation do?"
              rows={2}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Teams <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {TEAM_SUGGESTIONS.map((t) => {
                const active = teams.some(
                  (team) => team.name.toLowerCase() === t.toLowerCase()
                );
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() =>
                      active
                        ? removeTeam(teams.find((team) => team.name === t)!.id)
                        : addTeam(t)
                    }
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      active
                        ? "bg-primary/10 text-primary border-primary"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                placeholder="Add a custom team..."
                className="flex-1 border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTeam((e.currentTarget as HTMLInputElement).value);
                    (e.currentTarget as HTMLInputElement).value = "";
                  }
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                  addTeam(input?.value || "");
                  if (input) input.value = "";
                }}
                className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                aria-label="Add team"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {teams.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {teams.map((t) => (
                  <span
                    key={t.id}
                    className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-lg text-sm"
                  >
                    {t.name}
                    <button
                      type="button"
                      onClick={() => removeTeam(t.id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${t.name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Organisation"}
            </button>
            <Link
              href="/organizations"
              className="border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}