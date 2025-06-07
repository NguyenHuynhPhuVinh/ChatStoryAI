import { ChatHero } from "@/components/chat-hero";
import { ChatFeatures } from "@/components/chat-features";
import { ChatDemo } from "@/components/chat-demo";
import { ChatTestimonials } from "@/components/chat-testimonials";
import { ChatCTA } from "@/components/chat-cta";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      <ChatHero />
      <ChatFeatures />
      <ChatDemo />
      <ChatTestimonials />
      <ChatCTA />
    </div>
  );
}
