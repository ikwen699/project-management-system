"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { PlanBanner } from "@/components/billing/PlanBanner";
import { FeedbackModal } from "@/components/feedback/FeedbackModal";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar onOpenFeedback={() => setShowFeedback(true)} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onOpenFeedback={() => setShowFeedback(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/30">
          <PlanBanner />
          {children}
        </main>
      </div>
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
    </div>
  );
}