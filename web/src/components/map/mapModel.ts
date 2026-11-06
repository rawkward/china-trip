import { CITIES } from "@/data";
import type { Cities, DayTag } from "@/types";
import { MAP_KINDS, mapKindLabel } from "@/lib/map";
import type { MapPoint, MarkerRecord } from "@/lib/map";

export type MapMode = "all" | "day";
export type KindFilter = "all" | DayTag;
export type CityFilter = "all" | string;

export interface KindOption {
  k: DayTag;
  label: string;
}

/** Типы, которые реально встречаются в наборе точек, в порядке MAP_KINDS. */
export function presentKinds(registry: MarkerRecord[]): KindOption[] {
  return MAP_KINDS.filter((kind) => registry.some((r) => r.tag === kind.k));
}

/** Города в порядке первого появления точки — так же строится легенда. */
export function cityOrderOf(registry: MarkerRecord[]): string[] {
  const order: string[] = [];
  for (const r of registry) {
    if (!order.includes(r.city)) order.push(r.city);
  }
  return order;
}

export function filterMarkers(
  registry: MarkerRecord[],
  kind: KindFilter,
  city: CityFilter,
): MarkerRecord[] {
  return registry.filter(
    (r) => (city === "all" || r.city === city) && (kind === "all" || r.tag === kind),
  );
}

export function cityColor(city: string, cities: Cities = CITIES): string {
  return cities[city]?.color ?? "#8a8278";
}

export function cityLabel(city: string, cities: Cities = CITIES): string {
  return cities[city]?.label ?? city;
}

export function escapeHtml(value: string): string {
  return String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ??
      c,
  );
}

export function allPopupHtml(record: MarkerRecord, href: string): string {
  const days = record.days.length
    ? `<div class="text-muted">дни: ${record.days.map((n) => `Д${n}`).join(", ")}</div>`
    : "";
  return (
    `<div class="text-[0.8rem] leading-snug">` +
    `<strong>${escapeHtml(record.name)}</strong>` +
    days +
    `<div><a class="text-accent font-semibold" href="${escapeHtml(href)}" target="_blank" rel="noopener">Google Maps ↗</a></div>` +
    `</div>`
  );
}

export function dayPopupHtml(index: number, point: MapPoint, day: number, href: string): string {
  const tag = point.tag ? ` · ${escapeHtml(mapKindLabel(point.tag))}` : "";
  return (
    `<div class="text-[0.8rem] leading-snug">` +
    `<strong>${index + 1}. ${escapeHtml(point.name)}</strong>` +
    `<div class="text-muted">Д${day}${tag}</div>` +
    `<div><a class="text-accent font-semibold" href="${escapeHtml(href)}" target="_blank" rel="noopener">Google Maps ↗</a></div>` +
    `</div>`
  );
}

export function dayPinHtml(index: number, color: string): string {
  return `<span style="background:${escapeHtml(color)}">${index + 1}</span>`;
}
