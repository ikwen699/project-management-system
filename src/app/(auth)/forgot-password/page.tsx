"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.avif" alt="Logo" width={64} height={64} className="rounded mx-auto" />
          <p className="text-muted-foreground mt-2">
            Reset your password
          </p>
        </div>

        <div className="bg-white rounded-xl border border-border p-6">
          {submitted ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                If an account exists with that email, you&apos;ll receive a
                password reset link shortly.
              </p>
              <Link
                href="/login"
                className="mt-4 inline-block text-primary hover:underline text-sm font-medium"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
            >
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Send Reset Link
              </button>
            </form>
          )}

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
