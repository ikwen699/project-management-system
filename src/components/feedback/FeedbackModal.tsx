"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Bug, Lightbulb, MoreHorizontal, X } from "lucide-react";
import toast from "react-hot-toast";

interface FeedbackModalProps {
  onClose: () => void;
}

const categories = [
  { value: "BUG" as const, label: "Bug Report", icon: Bug, description: "Something isn't working" },
  { value: "SUGGESTION" as const, label: "Suggestion", icon: Lightbulb, description: "Idea to improve the app" },
  { value: "OTHER" as const, label: "Other", icon: MoreHorizontal, description: "Something else" },
];

export function FeedbackModal({ onClose }: FeedbackModalProps) {
  const pathname = usePathname();
  const [category, setCategory] = useState<"BUG" | "SUGGESTION" | "OTHER">("SUGGESTION");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError("Subject and message are required");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, subject: subject.trim(), message: message.trim(), page: pathname }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send feedback");
        return;
      }
      toast.success("Feedback sent — thank you!");
      onClose();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 animate-in fade-in-0 zoom-in-95">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Send Feedback</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <div className="flex gap-2" role="radiogroup" aria-label="Feedback category">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    category === cat.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                  aria-pressed={category === cat.value}
                >
                  <cat.icon className="h-5 w-5" />
                  <span>{cat.label}</span>
                  <span className="text-xs text-muted-foreground">{cat.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="subject">
              Subject
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary"
              className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              required
              maxLength={120}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="message">
              Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the issue or suggestion in detail..."
              rows={5}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
              data-skip-enter
              required
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Current page: <code className="bg-muted px-1 rounded">{pathname}</code>
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send Feedback"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}