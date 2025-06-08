import { ChatHero } from "@/components/chat-hero";
import { CreativeFeatures } from "@/components/creative-features";
import { PricingSection } from "@/components/pricing-section";
import { CreativeTestimonials } from "@/components/creative-testimonials";
import { ChatCTA } from "@/components/chat-cta";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      <ChatHero />
      <CreativeFeatures />
      <CreativeTestimonials />
      <PricingSection />
      <ChatCTA />
    </div>
  );
}
