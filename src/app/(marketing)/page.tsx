import type { Metadata } from "next";
import { Hero } from "@/components/marketing/Hero";
import { Problem } from "@/components/marketing/Problem";
import { Solution } from "@/components/marketing/Solution";
import { Features } from "@/components/marketing/Features";
import { BeforeAfter } from "@/components/marketing/BeforeAfter";
import { ProductShowcase } from "@/components/marketing/ProductShowcase";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { WhoItsFor } from "@/components/marketing/WhoItsFor";
import { Trust } from "@/components/marketing/Trust";
import { Pricing } from "@/components/marketing/Pricing";
import { Faq } from "@/components/marketing/Faq";
import { FinalCta } from "@/components/marketing/FinalCta";

export const metadata: Metadata = {
  title: "Xora — Take Your Projects From Chaos to Complete",
  description:
    "One powerful workspace to plan projects, organize teams, track progress, manage deadlines, and deliver work without the endless back-and-forth. Free to get started.",
};

export default function MarketingPage() {
  return (
    <>
      <Hero />
      <Problem />
      <Solution />
      <Features />
      <BeforeAfter />
      <ProductShowcase />
      <HowItWorks />
      <WhoItsFor />
      <Trust />
      <Pricing />
      <Faq />
      <FinalCta />
    </>
  );
}