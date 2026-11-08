import { DATES } from "../../data";
import { useVariant } from "../../hooks/useVariant";
import { cn } from "../../lib/cn";
import { variantDateRange } from "../../lib/days";
import { Section } from "../layout/Section";
import { Button } from "../ui";
import { VariantCard, leadSummary } from "./VariantCard";

/** Основной вариант — карточка с фото, остальные — компактные раскрывающиеся строки. */
export function VariantSection() {
  const { variants, activeId, setVariant } = useVariant();
  const main = variants.find((variant) => variant.main) ?? variants[0];
  const others = variants.filter((variant) => variant.id !== main.id);

  const select = (id: string) => {
    setVariant(id);
    const scrollToItinerary = () => {
      const target = document.getElementById("itinerary");
      if (target && typeof target.scrollIntoView === "function") {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(scrollToItinerary);
    } else {
      window.setTimeout(scrollToItinerary, 0);
    }
  };

  return (
    <Section id="variants">
      <div className="grid gap-3">
        <div className="max-w-[460px]">
          <VariantCard
            variant={main}
            active={main.id === activeId}
            onSelect={select}
          />
        </div>

        <div className="grid gap-2">
          {others.map((variant) => {
            const active = variant.id === activeId;
            const lead = leadSummary(variant.summary);

            return (
              <details key={variant.id} className="surface group scroll-mt-24">
                <summary className="flex cursor-pointer list-none flex-wrap items-baseline gap-x-3 gap-y-1 p-4 select-none [&::-webkit-details-marker]:hidden">
                  <span className="font-display text-[1rem] leading-tight font-semibold text-ink">
                    {variant.title}
                  </span>
                  <span className="text-[0.8rem] font-medium text-muted">
                    {variantDateRange(variant, DATES)}
                  </span>
                  <span
                    className={cn(
                      "tag-pill",
                      active && "border-accent/25 bg-accent-soft text-accent-ink",
                    )}
                  >
                    {active ? "показан сейчас" : "вариант"}
                  </span>
                  <span className="ml-auto text-[0.78rem] font-semibold text-muted group-open:hidden">
                    подробнее
                  </span>
                  <span className="ml-auto hidden text-[0.78rem] font-semibold text-muted group-open:inline">
                    свернуть
                  </span>
                </summary>

                <div className="grid gap-3 border-t border-line px-4 py-4">
                  {lead ? (
                    <p className="max-w-[80ch] text-[0.86rem] leading-relaxed text-muted-soft">
                      {lead}
                    </p>
                  ) : null}

                  <ul aria-label="Плюсы" className="grid gap-1 sm:grid-cols-2">
                    {variant.pros.map((item) => (
                      <li
                        key={item}
                        className="grid grid-cols-[1rem_1fr] items-start gap-1.5 text-[0.85rem] leading-snug text-ink-soft"
                      >
                        <span aria-hidden="true" className="font-bold text-[#4d7c0f]">
                          ✓
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <ul aria-label="Минусы" className="grid gap-1 sm:grid-cols-2">
                    {variant.cons.map((item) => (
                      <li
                        key={item}
                        className="grid grid-cols-[1rem_1fr] items-start gap-1.5 text-[0.85rem] leading-snug text-muted"
                      >
                        <span aria-hidden="true" className="font-bold text-accent">
                          —
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap items-end gap-3 border-t border-line pt-3">
                    <div>
                      <div className="text-[0.68rem] font-bold tracking-[0.12em] text-muted-soft uppercase">
                        бюджет
                      </div>
                      <div className="font-display text-[1.12rem] leading-snug text-accent-ink">
                        {variant.budget}
                      </div>
                    </div>
                    <Button
                      variant="soft"
                      size="sm"
                      className="ml-auto"
                      onClick={() => select(variant.id)}
                    >
                      Показать этот маршрут
                    </Button>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
