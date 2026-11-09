import { Fragment, useEffect, useMemo, useState } from "react";
import { Map as MapIcon, MapPin, X } from "lucide-react";
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

const MAP_LIST_URLS: Record<string, string> = {
  hk: "https://maps.app.goo.gl/WVb7ZLsr4ebW1hqM7",
  zjj: "https://maps.app.goo.gl/X79tTZuYo3U45ydN9",
  fr: "https://maps.app.goo.gl/MZMv96EnFznmL6B1A",
};

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
  const firstMapCityIndex = useMemo(() => {
    const seen = new Set<string>();
    const result = new Map<number, string>();
    cards.forEach((c, i) => {
      const city = c.day.city;
      if (MAP_LIST_URLS[city] && !seen.has(city)) {
        seen.add(city);
        result.set(i, city);
      }
    });
    return result;
  }, [cards]);

  const toggleDay = (n: number) => {
    setOpenDays((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  };

  const scrollToMap = () => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    if (window.matchMedia("(min-width: 1024px)").matches) return;

    const scroll = () => {
      const el = document.getElementById("itinerary-map");
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(scroll);
    } else {
      window.setTimeout(scroll, 0);
    }
  };

  const focusOnDay = (n: number) => {
    setFocusDay(n);
    setMapOpen(true);
    scrollToMap();
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
          onClick={() => {
            if (mapOpen) {
              setMapOpen(false);
            } else {
              setMapOpen(true);
              scrollToMap();
            }
          }}
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
          {cards.map(({ day, key, texts }, i) => {
            const mapCity = firstMapCityIndex.get(i);
            const city = mapCity ? CITIES[mapCity] : null;
            return (
              <Fragment key={activeId + "-" + day.n}>
                {city && (
                  <div className="surface flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-line bg-paper-deep px-3 py-2 sm:px-4">
                    <span className="eyebrow" style={{ color: city.color }}>
                      {city.label}
                    </span>
                    <a
                      href={MAP_LIST_URLS[mapCity!]}
                      target="_blank"
                      rel="noopener"
                      aria-label={"Список мест на карте — " + city.label}
                      className="btn-soft min-w-0"
                    >
                      <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">Список мест на карте</span>
                    </a>
                  </div>
                )}
                <DayCard
                  day={day}
                  dayKey={key}
                  texts={texts}
                  api={edits}
                  open={openDays.has(day.n)}
                  onToggle={() => toggleDay(day.n)}
                  onFocusDay={focusOnDay}
                />
              </Fragment>
            );
          })}
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
