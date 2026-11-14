import { CITIES } from "../data";
import type { Day, DayTextsMap, GuideItem } from "../types";
import { noteKey } from "./days";
import { stopSlug } from "./slug";
import { withTexts } from "./texts";

export interface DayTarget {
  /** noteKey(activeId, day) */
  key: string;
  n: number;
  date: string;
  /** id города */
  city: string;
  /** «Д5 · 12.12 · Чунцин» */
  label: string;
  /** slug-и остановок дня после правок (withTexts) */
  slugs: string[];
}

function dateOnly(date: string): string {
  const m = /(\d{2}\.\d{2})/.exec(date ?? "");
  if (m) return m[1];
  return (date ?? "").split(" · ")[0].trim();
}

/** Дни варианта в виде целей для добавления/переноса остановки. */
export function buildDayTargets(
  variantId: string,
  days: Day[],
  dayTexts: Record<string, DayTextsMap>,
  items: GuideItem[],
): DayTarget[] {
  return days.map((day) => {
    const key = noteKey(variantId, day);
    const texts = dayTexts[key] ?? {};
    const patched = withTexts(day, texts, items);
    const slugs = patched.places.map(
      (place) => place._slug ?? stopSlug(place.name ?? place.title),
    );
    const date = dateOnly(day.date);
    const city = CITIES[day.city]?.label ?? day.city;
    const label = ["Д" + day.n, date, city].filter((part) => part.length > 0).join(" · ");
    return { key, n: day.n, date, city: day.city, label, slugs };
  });
}
