import { sectionCopy } from "../../content/copy";
import { useVariant } from "../../hooks/useVariant";
import { nightsWord, variantDateRange } from "../../lib/days";
import { Badge } from "../ui";

/** Первый экран: заголовок поездки, даты основного варианта и короткие факты. */
export function Hero() {
  const { variant, days, activeId } = useVariant();
  const copy = sectionCopy("overview");
  const nights = Math.max(days.length - 1, 0);

  return (
    <div id="top" className="scroll-mt-24 pt-8 pb-2 sm:pt-12">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="accent">{variantDateRange(variant, days.map((d) => d.date))}</Badge>
        <Badge>
          {days.length} дней · {nights} {nightsWord(nights)}
        </Badge>
        {variant.main && <Badge tone="solid">основной маршрут</Badge>}
        {!variant.main && <Badge tone="muted">выбран вариант: {variant.title}</Badge>}
      </div>

      <h1 className="mt-4 max-w-[22ch] text-[2.1rem] leading-[1.06] sm:text-[3rem] lg:text-[3.4rem]">
        {copy.h1 ?? "Поездка в Китай вдвоём"}
      </h1>

      <p className="mt-3 max-w-[62ch] text-[1.05rem] leading-relaxed text-muted">
        {activeId === variant.id && variant.summary.split(". ").slice(0, 2).join(". ")}.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <a href="#itinerary" className="btn-primary">
          Смотреть дни
        </a>
        <a href="#variants" className="btn-soft">
          Все варианты
        </a>
        <a href="#budget" className="btn-ghost">
          Бюджет
        </a>
      </div>
    </div>
  );
}
