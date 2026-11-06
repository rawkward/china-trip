import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { PLACES } from "@/data";
import { cn } from "@/lib/cn";
import { buildMarkerRegistry, dayMapsUrl, dayPoints, TILE_SETS } from "@/lib/map";
import { useVariant } from "@/hooks/useVariant";
import { MapLegend, MapTools } from "./MapTools";
import type { CityFilter, KindFilter, MapMode } from "./mapModel";
import { cityOrderOf, presentKinds } from "./mapModel";
import { useLeafletMap } from "./useLeafletMap";

export interface RouteMapProps {
  visible: boolean;
  focusDay: number | null;
  onDayChange?: (n: number) => void;
}

export function RouteMap({ visible, focusDay, onDayChange }: RouteMapProps) {
  const { days } = useVariant();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [mode, setMode] = useState<MapMode>("all");
  const [day, setDay] = useState<number>(() => days[0]?.n ?? 1);
  const [kind, setKind] = useState<KindFilter>("all");
  const [city, setCity] = useState<CityFilter>("all");
  const [tileIdx, setTileIdx] = useState(0);
  const [resetToken, setResetToken] = useState(0);

  const registry = useMemo(() => buildMarkerRegistry(days, PLACES), [days]);
  const kinds = useMemo(() => presentKinds(registry), [registry]);
  const cities = useMemo(() => cityOrderOf(registry), [registry]);
  const dayUrl = useMemo(() => dayMapsUrl(dayPoints(days, PLACES, day)), [days, day]);
  const tile = TILE_SETS[tileIdx] ?? TILE_SETS[0];

  useEffect(() => {
    if (focusDay == null) return;
    setMode("day");
    setDay(focusDay);
  }, [focusDay]);

  useEffect(() => {
    if (days.length && !days.some((d) => d.n === day)) setDay(days[0].n);
  }, [days, day]);

  useLeafletMap({
    containerRef,
    visible,
    focusDay,
    days,
    mode,
    day,
    kind,
    city,
    tileIdx,
    resetToken,
    onTileFallback: () =>
      setTileIdx((i) => (i + 1 < TILE_SETS.length ? i + 1 : i)),
  });

  return (
    <div className={cn("min-w-0", visible ? "block" : "hidden lg:block")}>
      <div
        role="region"
        aria-label="Карта маршрута"
        className="surface flex h-[420px] min-w-0 flex-col overflow-hidden lg:h-[560px]"
      >
        <MapTools
          mode={mode}
          day={day}
          days={days}
          kind={kind}
          city={city}
          kinds={kinds}
          cities={cities}
          tileLabel={tile.label}
          dayUrl={dayUrl}
          onModeChange={setMode}
          onDayChange={(n) => {
            setDay(n);
            onDayChange?.(n);
          }}
          onKindChange={setKind}
          onCityChange={setCity}
          onReset={() => {
            setMode("all");
            setKind("all");
            setCity("all");
            setResetToken((n) => n + 1);
          }}
          onNextTile={() => setTileIdx((i) => (i + 1) % TILE_SETS.length)}
        />
        <div className="relative min-h-0 min-w-0 flex-1 bg-paper-deep">
          <div ref={containerRef} className="h-full w-full" />
        </div>
        <MapLegend cities={cities} />
      </div>
    </div>
  );
}
