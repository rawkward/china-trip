import { cn } from "@/lib/cn";
import type { Day } from "@/types";
import { Select } from "../ui";
import { cityColor, cityLabel } from "./mapModel";
import type { CityFilter, KindFilter, KindOption, MapMode } from "./mapModel";

export interface MapToolsProps {
  mode: MapMode;
  day: number;
  days: Day[];
  kind: KindFilter;
  city: CityFilter;
  kinds: KindOption[];
  cities: string[];
  tileLabel: string;
  dayUrl: string;
  onModeChange: (mode: MapMode) => void;
  onDayChange: (n: number) => void;
  onKindChange: (kind: KindFilter) => void;
  onCityChange: (city: CityFilter) => void;
  onReset: () => void;
  onNextTile: () => void;
}

const chipBase = "chip shrink-0";

export function MapTools({
  mode,
  day,
  days,
  kind,
  city,
  kinds,
  cities,
  tileLabel,
  dayUrl,
  onModeChange,
  onDayChange,
  onKindChange,
  onCityChange,
  onReset,
  onNextTile,
}: MapToolsProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2 border-b border-line bg-surface p-2.5">
      <div className="flex min-w-0 items-center gap-1.5">
        <button
          type="button"
          className={cn(chipBase, mode === "all" && "chip-on")}
          aria-pressed={mode === "all"}
          onClick={() => onModeChange("all")}
        >
          Все точки
        </button>
        <button
          type="button"
          className={cn(chipBase, mode === "day" && "chip-on")}
          aria-pressed={mode === "day"}
          onClick={() => onModeChange("day")}
        >
          По дням
        </button>
        <button type="button" className={cn(chipBase, "ml-auto")} onClick={onReset}>
          Сброс
        </button>
      </div>

      {mode === "day" ? (
        <>
          <div className="flex min-w-0 items-center gap-2">
            <Select
              aria-label="День маршрута"
              className="min-w-0 flex-1 py-1.5 text-[0.8rem]"
              value={day}
              onChange={(e) => onDayChange(Number(e.target.value))}
            >
              {days.map((d) => (
                <option key={d.n} value={d.n}>
                  {`Д${d.n} · ${d.date || "—"} · ${cityLabel(d.city)}`}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
            <a
              className="link-quiet text-[0.78rem] font-semibold whitespace-nowrap"
              href={dayUrl}
              target="_blank"
              rel="noopener"
            >
              Маршрут дня в Google Maps ↗
            </a>
          </div>
          <div className="text-[0.72rem] leading-snug text-muted">
            Точки дня пронумерованы по порядку плана и соединены линией маршрута.
          </div>
        </>
      ) : (
        <>
          <div className="flex min-w-0 gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
            <button
              type="button"
              className={cn(chipBase, kind === "all" && "chip-on")}
              aria-pressed={kind === "all"}
              onClick={() => onKindChange("all")}
            >
              Все типы
            </button>
            {kinds.map((k) => (
              <button
                key={k.k}
                type="button"
                className={cn(chipBase, kind === k.k && "chip-on")}
                aria-pressed={kind === k.k}
                onClick={() => onKindChange(k.k)}
              >
                {k.label}
              </button>
            ))}
          </div>
          <div className="flex min-w-0 gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
            <button
              type="button"
              className={cn(chipBase, city === "all" && "chip-on")}
              aria-pressed={city === "all"}
              onClick={() => onCityChange("all")}
            >
              Все города
            </button>
            {cities.map((c) => (
              <button
                key={c}
                type="button"
                className={cn(chipBase, city === c && "chip-on")}
                aria-pressed={city === c}
                style={
                  city === c
                    ? undefined
                    : { borderColor: `${cityColor(c)}55`, color: cityColor(c) }
                }
                onClick={() => onCityChange(c)}
              >
                {cityLabel(c)}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="flex min-w-0 items-center justify-between gap-2">
        <span className="text-[0.72rem] text-muted">Подложка: {tileLabel}</span>
        <button type="button" className={chipBase} onClick={onNextTile}>
          Другая карта
        </button>
      </div>
    </div>
  );
}

export function MapLegend({ cities }: { cities: string[] }) {
  if (!cities.length) return null;
  return (
    <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 border-t border-line bg-surface px-3 py-2 text-[0.72rem] text-muted">
      {cities.map((c) => (
        <span key={c} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-2.5 shrink-0 rounded-full"
            style={{ background: cityColor(c) }}
          />
          {cityLabel(c)}
        </span>
      ))}
    </div>
  );
}
