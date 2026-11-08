import { Fragment, useEffect, useMemo, useState } from "react";
import { Map as MapIcon, X } from "lucide-react";
import { useEdits } from "@/edits/EditsContext";
import { useVariant } from "@/hooks/useVariant";
import { CITIES, GUIDE_ITEMS } from "@/data";
import { noteKey, nightsWord, routeGroups } from "@/lib/days";
import { withTexts } from "@/lib/texts";
import { cn } from "@/lib/cn";
import { Section } from "../layout/Section";
import { RouteMap } from "../map/RouteMap";
import { Button } from "../ui";
import { toast } from "../ui/Toast";
import { DayCard } from "./DayCard";
import { MissedBlock } from "./MissedBlock";

/**
 * «Маршрут по дням»: сводка ночей, аккордеон дней и колонка карты.
 * Все правки читаются из общего EditsContext и сразу попадают в разметку.
 */
export function ItinerarySection() {
  const { activeId, days } = useVariant();
  const edits = useEdits();
  const { token, dayTexts, error } = edits;

  const [openDays, setOpenDays] = useState<Set<number>>(() => new Set());
  const [mapOpen, setMapOpen] = useState(false);
  const [focusDay, setFocusDay] = useState<number | null>(null);

  useEffect(() => {
    if (error) toast(error, "error");
  }, [error]);

  const summary = useMemo(() => routeGroups(days), [days]);
  const cards = useMemo(
    () =>
      days.map((day) => {
        const key = noteKey(activeId, day);
        const texts = dayTexts[key] ?? {};
        return { day: withTexts(day, texts, GUIDE_ITEMS), key, texts };
      }),
    [days, activeId, dayTexts],
  );
  const mapDays = useMemo(() => cards.map((c) => c.day), [cards]);

  const toggleDay = (n: number) => {
    setOpenDays((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  };

  const focusOnDay = (n: number) => {
    setFocusDay(n);
    setMapOpen(true);
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    if (window.matchMedia("(min-width: 1024px)").matches) return;

    const scrollToMap = () => {
      const el = document.getElementById("itinerary-map");
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(scrollToMap);
    } else {
      window.setTimeout(scrollToMap, 0);
    }
  };

  return (
    <Section
      id="itinerary"
      action={
        <Button
          variant="soft"
          size="sm"
          className="lg:hidden"
          aria-expanded={mapOpen}
          aria-controls="itinerary-map"
          onClick={() => setMapOpen((v) => !v)}
        >
          {mapOpen ? <X className="size-3.5" aria-hidden="true" /> : <MapIcon className="size-3.5" aria-hidden="true" />}
          Карта
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-1.5 text-[0.82rem] sm:gap-2">
        {summary.groups.map((group, i) => {
          const city = CITIES[group.city] ?? { label: group.city, color: "#8a8278" };
          return (
            <Fragment key={group.city + "-" + i}>
              {i > 0 && (
                <span aria-hidden="true" className="font-bold text-accent">
                  →
                </span>
              )}
              <span
                className="inline-flex max-w-full items-baseline gap-1 rounded-full border border-line bg-surface px-2.5 py-1 font-semibold"
                style={{ color: city.color }}
              >
                <span className="truncate">{city.label}</span>
                <span className="shrink-0 text-[0.72rem] font-medium text-muted">
                  ·{" "}
                  {group.nights > 0
                    ? group.nights + " " + nightsWord(group.nights)
                    : "вылет домой"}
                </span>
              </span>
            </Fragment>
          );
        })}
        <span className="ml-0.5 text-[0.76rem] text-muted">
          всего {summary.total} {nightsWord(summary.total)}
        </span>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-start">
        <div id="dayList" className="flex min-w-0 flex-col gap-3">
          {cards.map(({ day, key, texts }) => (
            <DayCard
              key={activeId + "-" + day.n}
              day={day}
              dayKey={key}
              texts={texts}
              api={edits}
              open={openDays.has(day.n)}
              onToggle={() => toggleDay(day.n)}
              onFocusDay={focusOnDay}
            />
          ))}
        </div>

        <div
          id="itinerary-map"
          className={cn(
            "min-w-0 scroll-mt-16 lg:sticky lg:top-20 lg:block lg:scroll-mt-20",
            mapOpen ? "block" : "hidden",
          )}
        >
          <RouteMap
            visible={mapOpen}
            focusDay={focusDay}
            onDayChange={setFocusDay}
            days={mapDays}
          />
        </div>
      </div>

      <MissedBlock />

      {!token && <span className="sr-only">Правка текстов закрыта</span>}
    </Section>
  );
}
