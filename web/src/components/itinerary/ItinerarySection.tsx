import { Section } from "../layout/Section";

/** ЗАГЛУШКА — заменяется портом маршрута по дням + карты. */
export function ItinerarySection() {
  return (
    <Section id="itinerary">
      <div className="rounded-card border border-dashed border-line-strong p-6 text-muted">
        Маршрут по дням (в работе)
      </div>
    </Section>
  );
}
