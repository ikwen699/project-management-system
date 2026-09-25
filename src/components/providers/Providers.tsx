"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

const FORM_CONTROL_SELECTOR =
  'input:not([data-skip-enter]):not([type="hidden"]), select:not([data-skip-enter]), textarea:not([data-skip-enter])';

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: any;
}) {
  // Global "Enter moves to the next field" behaviour within forms.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Enter") return;
      if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (!target || (tag !== "input" && tag !== "select" && tag !== "textarea")) {
        return;
      }
      if (target.getAttribute("data-skip-enter") !== null) return;
      if (
        (target as HTMLInputElement).type === "button" ||
        (target as HTMLInputElement).type === "submit" ||
        (target as HTMLInputElement).type === "checkbox" ||
        (target as HTMLInputElement).type === "radio"
      ) {
        return;
      }

      const form = target.closest("form");
      if (!form) return;

      const controls = Array.from(
        form.querySelectorAll<HTMLElement>(FORM_CONTROL_SELECTOR)
      ).filter((el) => {
        const style = window.getComputedStyle(el);
        return style.display !== "none" && style.visibility !== "hidden";
      });

      const index = controls.indexOf(target as HTMLElement);
      const next = controls[index + 1];
      if (next) {
        e.preventDefault();
        (next as HTMLElement).focus();
      }
      // No next field: let the browser submit the form.
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <SessionProvider session={session}>
      {children}
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
    </SessionProvider>
  );
}