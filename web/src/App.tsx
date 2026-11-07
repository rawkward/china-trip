import { Footer } from "./components/layout/Footer";
import { Hero } from "./components/layout/Hero";
import { Rule } from "./components/layout/Section";
import { TopBar } from "./components/layout/TopBar";
import { Toaster } from "./components/ui/Toast";
import { VariantSection } from "./components/variants/VariantSection";
import { ItinerarySection } from "./components/itinerary/ItinerarySection";
import { GuideSection } from "./components/guide/GuideSection";
import { BookingSection } from "./components/sections/BookingSection";
import { ChecklistSection } from "./components/sections/ChecklistSection";
import { ToursSection } from "./components/sections/ToursSection";
import { LinksSection } from "./components/sections/LinksSection";
import { NotesSection } from "./components/sections/NotesSection";
import { BudgetApp } from "./components/budget/BudgetApp";
import { EditsProvider } from "./edits/EditsContext";
import { VariantProvider } from "./hooks/useVariant";
import { isPark } from "./lib/guide";

export default function App() {
  return (
    <VariantProvider>
      <EditsProvider>
        <a
          href="#itinerary"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[1200] focus:rounded-lg focus:bg-ink focus:px-3 focus:py-2 focus:text-paper"
        >
          К маршруту
        </a>
        <TopBar />
        <main className="mx-auto w-full max-w-[1180px] px-4 sm:px-5">
          <Hero />
          <VariantSection />
          <Rule />
          <ItinerarySection />
          <Rule />
          <GuideSection id="stay" kind="stay" />
          <Rule />
          <GuideSection id="food" kind="food" />
          <Rule />
          <GuideSection id="sights" kind="sight" />
          <Rule />
          <GuideSection id="parks" kind="sight" only={isPark} anchorPrefix="gp-" />
          <Rule />
          <GuideSection id="tips" kind="tip" />
          <Rule />
          <BookingSection />
          <Rule />
          <ChecklistSection />
          <Rule />
          <ToursSection />
          <Rule />
          <LinksSection />
          <Rule />
          <BudgetApp />
          <Rule />
          <NotesSection />
        </main>
        <Footer />
        <Toaster />
      </EditsProvider>
    </VariantProvider>
  );
}
