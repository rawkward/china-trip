import { stopSlug } from "@/lib/slug";
import type { DayTag, Stop } from "@/types";

export const TAG_ICON: Record<DayTag, string> = {
  sight: "📍",
  food: "🍜",
  transport: "🚄",
  hotel: "🛏️",
  shopping: "🛍️",
  spa: "♨️",
  festival: "🎪",
  optional: "🎧",
};

export function tagIcon(tag: DayTag | undefined): string {
  return TAG_ICON[tag ?? "sight"] ?? "•";
}

/** Стабильный slug остановки: слой правок кладёт его в `_slug`. */
export function slugOfStop(stop: Stop): string {
  return stop._slug ?? stopSlug(stop._name ?? stop.name ?? stop.title ?? "");
}
