import { useEffect, useMemo, useRef, useState } from "react";
import { CITIES, GUIDE, GUIDE_ITEMS } from "../../data";
import { useEdits } from "../../edits/EditsContext";
import { useVariant } from "../../hooks/useVariant";
import { addedStopFromGuide } from "../../lib/added-stops";
import { cn } from "../../lib/cn";
import { buildDayTargets } from "../../lib/day-targets";
import { groupGuideByCity, tagOf } from "../../lib/guide";
import { stopSlug } from "../../lib/slug";
import type { GuideItem, GuideKind, GuideTagValue } from "../../types";
import { Section } from "../layout/Section";
import { toast } from "../ui/Toast";
import type { DayTargetOption } from "../ui";
import { GuideCard } from "./GuideCard";

export interface GuideSectionProps {
  id: string;
  kind: GuideKind;
  /** раздел парков переиспользует вид sight, но со своим фильтром и своими якорями */
  only?: (it: GuideItem) => boolean;
  anchorPrefix?: string;
}

const GRID: Record<GuideKind, string> = {
  stay: "grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2",
  food: "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3",
  sight: "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3",
  tip: "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3",
};

/** Справочник одного вида: города в порядке маршрута, карточки — общим списком. */
export function GuideSection({ id, kind, only, anchorPrefix = "g-" }: GuideSectionProps) {
  const { token, guideTags, saveGuideTag, dayTexts, addStopToDay } = useEdits();
  const { activeId, days } = useVariant();
  const groups = groupGuideByCity(GUIDE_ITEMS, GUIDE.cityOrder, CITIES, kind, guideTags, only);
  const dayTargets = useMemo(
    () => buildDayTargets(activeId, days, dayTexts, GUIDE_ITEMS),
    [activeId, days, dayTexts],
  );
  const [cityFilter, setCityFilter] = useState<string>("all");
  const detailsRefs = useRef(new Map<string, HTMLDetailsElement>());
  const rootRef = useRef<HTMLDivElement>(null);

  const visibleGroups = cityFilter === "all" ? groups : groups.filter((g) => g.city === cityFilter);

  useEffect(() => {
    detailsRefs.current.forEach((el, city) => {
      el.open = cityFilter !== "all" && city === cityFilter;
    });
  }, [cityFilter]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const revealByHash = () => {
      const hash = window.location.hash.slice(1);
      if (!hash) return;
      let id = hash;
      try {
        id = decodeURIComponent(hash);
      } catch {
        return;
      }
      const target = document.getElementById(id);
      const root = rootRef.current;
      if (!target || !root || !root.contains(target)) return;

      const details = target.closest("details");
      if (details && !details.open) details.open = true;

      if (typeof target.scrollIntoView === "function") {
        target.scrollIntoView({ block: "start" });
      }
    };

    revealByHash();
    window.addEventListener("hashchange", revealByHash);
    return () => window.removeEventListener("hashchange", revealByHash);
  }, []);

  const handleTag = (key: string, tag: GuideTagValue) => {
    void saveGuideTag(key, tag);
  };

  const handleCity = (city: string) => {
    setCityFilter((current) => (current === city ? "all" : city));
  };

  const dayOptionsFor = (item: GuideItem): DayTargetOption[] => {
    const slug = stopSlug(item.en);
    return dayTargets.map((target) => ({
      key: target.key,
      label: target.label,
      taken: target.slugs.indexOf(slug) !== -1,
    }));
  };

  const handleAddToDay = async (item: GuideItem, dayKey: string): Promise<boolean> => {
    const target = dayTargets.find((it) => it.key === dayKey);
    if (!target) return false;
    const result = await addStopToDay(dayKey, addedStopFromGuide(item));
    if (result.ok) {
      toast("добавлено в " + target.label, "success");
      return true;
    }
    if (result.reason === "limit") toast("в дне уже 8 добавленных остановок", "error");
    else if (result.reason === "duplicate") toast("такая остановка уже есть в дне", "error");
    return false;
  };

  return (
    <Section id={id}>
      <div ref={rootRef} className="grid gap-6">
        {groups.length > 1 ? (
          <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
            <button
              type="button"
              className={cn("chip shrink-0", cityFilter === "all" && "chip-on")}
              aria-pressed={cityFilter === "all"}
              onClick={() => setCityFilter("all")}
            >
              Все города
            </button>
            {groups.map((group) => (
              <button
                key={group.city}
                type="button"
                className={cn("chip shrink-0", cityFilter === group.city && "chip-on")}
                aria-pressed={cityFilter === group.city}
                onClick={() => handleCity(group.city)}
              >
                {group.label}
              </button>
            ))}
          </div>
        ) : null}
        {visibleGroups.map((group) => (
          <details
            key={group.city}
            ref={(el) => {
              if (el) detailsRefs.current.set(group.city, el);
              else detailsRefs.current.delete(group.city);
            }}
            className="group"
          >
            <summary className="flex cursor-pointer list-none items-baseline gap-2 select-none [&::-webkit-details-marker]:hidden">
              <span className="font-display text-[1.08rem] font-semibold sm:text-[1.2rem]">
                {group.label}
              </span>
              <span className="text-[0.72rem] font-semibold text-muted-soft">
                {group.total}
              </span>
              <span className="ml-auto text-[0.78rem] font-semibold text-muted group-open:hidden">
                развернуть
              </span>
              <span className="ml-auto hidden text-[0.78rem] font-semibold text-muted group-open:inline">
                свернуть
              </span>
            </summary>

            <section aria-label={group.label} className="mt-3">
              <div className={GRID[kind]}>
                {[...group.main, ...group.alts].map((item) => (
                  <GuideCard
                    key={item.id}
                    item={item}
                    kind={kind}
                    tag={tagOf(item, guideTags)}
                    token={token}
                    onTag={handleTag}
                    anchorPrefix={anchorPrefix}
                    dayOptions={dayOptionsFor(item)}
                    onAddToDay={(dayKey) => handleAddToDay(item, dayKey)}
                  />
                ))}
              </div>
            </section>
          </details>
        ))}
      </div>
    </Section>
  );
}
