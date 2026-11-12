import { UpcomingDatesSection } from "@/components/home/upcoming-dates-section";
import { ExamGrid } from "@/components/home/exam-grid";
import { ExamMarquee } from "@/components/home/exam-marquee";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { TrustNote } from "@/components/home/trust-note";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <UpcomingDatesSection />
      <ExamMarquee />
      <ExamGrid />
      <HowItWorks />
      <TrustNote />
    </main>
  );
}
