import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { LayerGroup, Map as LeafletMap, TileLayer } from "leaflet";
import type { Day } from "@/types";
import { CITIES, PLACES } from "@/data";
import {
  boundsOf,
  buildMarkerRegistry,
  dayPoints,
  gmapsUrl,
  spreadOverlaps,
  TILE_SETS,
} from "@/lib/map";
import {
  allPopupHtml,
  cityColor,
  dayPinHtml,
  dayPopupHtml,
  filterMarkers,
} from "./mapModel";
import type { CityFilter, KindFilter, MapMode } from "./mapModel";

type LeafletModule = typeof import("leaflet");

let leafletPromise: Promise<LeafletModule> | null = null;

/** Leaflet грузится только когда карта реально понадобилась — не в основном чанке. */
export function loadLeaflet(): Promise<LeafletModule> {
  if (!leafletPromise) {
    leafletPromise = import("leaflet").then((loaded) => {
      const mod = loaded as unknown as { default?: LeafletModule };
      return mod.default ?? (loaded as LeafletModule);
    });
  }
  return leafletPromise;
}

export interface UseLeafletMapOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  visible: boolean;
  focusDay: number | null;
  days: Day[];
  mode: MapMode;
  day: number;
  kind: KindFilter;
  city: CityFilter;
  tileIdx: number;
  /** меняется при «Сброс» — карта заново подгоняет границы */
  resetToken: number;
  /** на подложке слишком много ошибок — переключить на следующую */
  onTileFallback: () => void;
}

const CENTER: [number, number] = [26.5, 108.5];

export function useLeafletMap({
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
  onTileFallback,
}: UseLeafletMapOptions): void {
  const [mapEpoch, setMapEpoch] = useState(0);

  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const markerLayerRef = useRef<LayerGroup | null>(null);
  const lineLayerRef = useRef<LayerGroup | null>(null);
  const tileLayerRef = useRef<TileLayer | null>(null);
  const fallbackRef = useRef(onTileFallback);
  fallbackRef.current = onTileFallback;

  // Ленивая инициализация: пока контейнер скрыт, offsetWidth === 0 и карты нет.
  useEffect(() => {
    if (mapRef.current) return;
    const node = containerRef.current;
    if (!node || node.offsetWidth === 0) return;

    let cancelled = false;
    void loadLeaflet().then((L) => {
      if (cancelled || mapRef.current) return;
      const el = containerRef.current;
      if (!el || el.offsetWidth === 0) return;

      const map = L.map(el, {
        scrollWheelZoom: true,
        zoomAnimation: false,
        fadeAnimation: false,
      }).setView(CENTER, 5, { animate: false });

      leafletRef.current = L;
      mapRef.current = map;
      markerLayerRef.current = L.layerGroup().addTo(map);
      lineLayerRef.current = L.layerGroup().addTo(map);
      setMapEpoch((n) => n + 1);
    });

    return () => {
      cancelled = true;
    };
  }, [containerRef, visible, focusDay]);

  // Раскрыли колонку — Leaflet должен пересчитать размеры после перестройки layout.
  useEffect(() => {
    if (!mapEpoch) return;
    const map = mapRef.current;
    if (!map) return;
    const timer = window.setTimeout(() => map.invalidateSize(), 60);
    return () => window.clearTimeout(timer);
  }, [mapEpoch, visible, focusDay]);

  // Подложка: Google → Яндекс → OpenStreetMap по ошибкам тайлов.
  useEffect(() => {
    if (!mapEpoch) return;
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    const set = TILE_SETS[tileIdx] ?? TILE_SETS[0];
    let ok = 0;
    let errors = 0;
    let active = true;
    let switched = false;

    const layer = L.tileLayer(set.url, {
      attribution: set.attr,
      maxZoom: set.max,
      subdomains: set.sub ?? "abc",
    });
    layer.on("tileload", () => {
      if (active) ok++;
    });
    layer.on("tileerror", () => {
      if (!active) return;
      errors++;
      if (ok === 0 && errors >= 5 && !switched) {
        switched = true;
        if (tileIdx + 1 < TILE_SETS.length) fallbackRef.current();
      }
    });
    layer.addTo(map);
    tileLayerRef.current = layer;

    return () => {
      active = false;
      map.removeLayer(layer);
      if (tileLayerRef.current === layer) tileLayerRef.current = null;
    };
  }, [mapEpoch, tileIdx]);

  // Точки, линия, фильтры и границы — всё перерисовывается из React-состояния.
  useEffect(() => {
    if (!mapEpoch) return;
    const L = leafletRef.current;
    const map = mapRef.current;
    const markerLayer = markerLayerRef.current;
    const lineLayer = lineLayerRef.current;
    if (!L || !map || !markerLayer || !lineLayer) return;

    markerLayer.clearLayers();
    lineLayer.clearLayers();

    if (mode === "day") {
      const dayBlock = days.find((d) => d.n === day);
      const points = spreadOverlaps(dayPoints(days, PLACES, day));
      const color = cityColor(dayBlock?.city ?? "", CITIES);

      if (points.length > 1) {
        L.polyline(
          points.map((p) => [p.lat, p.lon] as [number, number]),
          { color, weight: 4, opacity: 0.8, lineJoin: "round", lineCap: "round" },
        ).addTo(lineLayer);
      }

      points.forEach((point, i) => {
        L.marker([point.lat, point.lon], {
          icon: L.divIcon({
            className: "daypin",
            html: dayPinHtml(i, color),
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          }),
        })
          .bindPopup(dayPopupHtml(i, point, day, gmapsUrl(point.lat, point.lon)))
          .addTo(markerLayer);
      });

      if (points.length) {
        map.fitBounds(boundsOf(points)!, {
          padding: [42, 42],
          maxZoom: 14,
          animate: false,
        });
      } else {
        map.setView(CENTER, 5, { animate: false });
      }
      return;
    }

    const registry = filterMarkers(buildMarkerRegistry(days, PLACES), kind, city);
    registry.forEach((record) => {
      const marker = L.circleMarker([record.lat, record.lon], {
        radius: 7,
        color: "#fff",
        weight: 1.6,
        fillColor: cityColor(record.city, CITIES),
        fillOpacity: 0.85,
        opacity: 1,
      })
        .bindPopup(allPopupHtml(record, gmapsUrl(record.lat, record.lon)))
        .addTo(markerLayer);
      marker.bringToFront();
    });

    if (registry.length) {
      map.fitBounds(boundsOf(registry)!, {
        padding: [24, 24],
        maxZoom: 13,
        animate: false,
      });
    }
  }, [mapEpoch, days, mode, day, kind, city, resetToken]);

  useEffect(() => {
    return () => {
      const map = mapRef.current;
      mapRef.current = null;
      leafletRef.current = null;
      markerLayerRef.current = null;
      lineLayerRef.current = null;
      tileLayerRef.current = null;
      if (map) map.remove();
    };
  }, []);
}
