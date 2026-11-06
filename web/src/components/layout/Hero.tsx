import { sectionCopy } from "../../content/copy";
import { useVariant } from "../../hooks/useVariant";
import { nightsWord, variantDateRange } from "../../lib/days";
import { Badge } from "../ui";

/** Первый экран: заголовок поездки, даты основного варианта и маршрут одной строкой. */
export function Hero() {
  const { variant, days } = useVariant();
  const copy = sectionCopy("overview");
  const nights = Math.max(days.length - 1, 0);

  return (
    <div id="top" className="scroll-mt-24 pt-7 pb-1 sm:pt-11">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="accent">{variantDateRange(variant, days.map((d) => d.date))}</Badge>
        <Badge>
          {days.length} дней · {nights} {nightsWord(nights)}
        </Badge>
        {variant.main ? (
          <Badge tone="solid">основной маршрут</Badge>
        ) : (
          <Badge tone="neutral">выбран вариант</Badge>
        )}
      </div>

      <h1 className="mt-4 max-w-[24ch] text-[1.85rem] leading-[1.08] sm:text-[2.5rem] lg:text-[3.1rem]">
        {copy.h1 ?? "Поездка в Китай вдвоём"}
      </h1>

      <p className="mt-3 max-w-[60ch] text-[0.98rem] leading-relaxed text-muted">
        {variant.title}
        {variant.cities.length > 0 && (
          <span className="mt-1 block text-[0.84rem] text-muted-soft">
            {variant.cities.join(" · ")}
          </span>
        )}
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
