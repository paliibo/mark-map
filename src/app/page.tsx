import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteNav } from "@/components/landing/site-nav";
import { TechStrip } from "@/components/landing/tech-strip";

export default function LandingPage() {
  return (
    <>
      <SiteNav />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <TechStrip />
      </main>
      <SiteFooter />
    </>
  );
}
