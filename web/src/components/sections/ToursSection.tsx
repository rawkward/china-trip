import { TOURS } from "../../content/tours";
import { Badge } from "../ui";
import { Section } from "../layout/Section";

/** Экскурсии-примеры: что предлагают готовые туры и стоит ли это денег. */
export function ToursSection() {
  return (
    <Section id="tours">
      <div className="grid gap-4">
        {TOURS.map((tour) => (
          <article key={tour.title} className="surface p-5">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge tone="accent">{tour.tag}</Badge>
              <span className="text-[0.82rem] font-semibold text-ink">{tour.price}</span>
            </div>
            <h3 className="text-[1.15rem] leading-snug">
              <a href={tour.url} target="_blank" rel="noopener">
                {tour.title}
              </a>
            </h3>
            <p className="mt-1 text-[0.82rem] text-muted">{tour.meta}</p>
            <p className="mt-3 text-[0.9rem] leading-relaxed text-ink-soft">{tour.note}</p>
            <dl className="mt-3 grid gap-2 border-t border-line pt-3 text-[0.86rem] leading-relaxed">
              <div>
                <dt className="font-semibold text-ink">Стоит ли денег</dt>
                <dd className="text-muted">{tour.verdict}</dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">Под наш маршрут</dt>
                <dd className="text-muted">{tour.fit}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </Section>
  );
}
