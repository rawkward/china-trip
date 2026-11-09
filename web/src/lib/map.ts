import type { Day, DayTag, Places, Stop } from "../types";

export interface MapPoint {
  name: string;
  tag: DayTag | "";
  lat: number;
  lon: number;
}

export interface MarkerRecord extends MapPoint {
  key: string;
  city: string;
  days: number[];
}

export interface TileSet {
  id: string;
  label: string;
  url: string;
  sub: string[] | null;
  attr: string;
  max: number;
}

export const TILE_SETS: TileSet[] = [
  {
    id: "google",
    label: "Google",
    url: "https://mt{s}.google.com/vt/lyrs=m&hl=ru&x={x}&y={y}&z={z}",
    sub: ["0", "1", "2", "3"],
    attr: '&copy; <a href="https://www.google.com/maps">Google</a>',
    max: 20,
  },
  {
    id: "yandex",
    label: "Яндекс",
    url: "https://core-renderer-tiles.maps.yandex.net/tiles?l=map&x={x}&y={y}&z={z}&scale=1&lang=ru_RU",
    sub: null,
    attr: '&copy; <a href="https://yandex.ru/maps">Яндекс</a>',
    max: 19,
  },
  {
    id: "osm",
    label: "OpenStreetMap",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    sub: null,
    attr: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    max: 19,
  },
];

export const MAP_KINDS: { k: DayTag; label: string }[] = [
  { k: "hotel", label: "Отели" },
  { k: "food", label: "Заведения" },
  { k: "sight", label: "Места" },
  { k: "shopping", label: "Магазины" },
  { k: "transport", label: "Транспорт" },
  { k: "festival", label: "Фестиваль" },
  { k: "optional", label: "Альтернативы" },
  { k: "spa", label: "Бани и спа" },
];

export function mapKindLabel(k: string): string {
  return MAP_KINDS.find((x) => x.k === k)?.label ?? k;
}

/** Уникальные точки маршрута: одна запись на ключ места, с номерами дней. */
export function buildMarkerRegistry(days: Day[], places: Places): MarkerRecord[] {
  const out: MarkerRecord[] = [];
  const seen = new Map<string, MarkerRecord>();
  for (const d of days) {
    for (const p of d.places ?? []) {
      const pl = places[p.k];
      if (!pl) continue;
      let rec = seen.get(p.k);
      if (!rec) {
        rec = {
          key: p.k,
          name: p.name || p.title || p.k,
          tag: p.tag ?? "",
          city: d.city,
          lat: pl.lat,
          lon: pl.lon,
          days: [],
        };
        seen.set(p.k, rec);
        out.push(rec);
      }
      if (rec.days.indexOf(d.n) === -1) rec.days.push(d.n);
    }
  }
  return out;
}

interface DayPointEntry {
  point: MapPoint;
  number: number;
  key: string;
  isNew: boolean;
}

function placeKey(p: Stop, places: Places): string | null {
  const pl = places[p.k];
  if (!pl) return null;
  return p.k + "|" + Math.round(pl.lat * 1e5) + "|" + Math.round(pl.lon * 1e5);
}

/**
 * Общая ветка нумерации: одна и та же точка (ключ места + округлённые
 * координаты) получает один номер, счётчик растёт только на новой точке.
 */
function dayPointEntry(
  p: Stop,
  places: Places,
  seen: Map<string, number>,
  counter: { n: number },
): DayPointEntry | null {
  const pl = places[p.k];
  const key = placeKey(p, places);
  if (!pl || key === null) return null;
  let number = seen.get(key);
  const isNew = number === undefined;
  if (number === undefined) {
    number = counter.n++;
    seen.set(key, number);
  }
  return {
    point: { name: p.name || p.title || p.k, tag: p.tag ?? "", lat: pl.lat, lon: pl.lon },
    number,
    key,
    isNew,
  };
}

/** Точки одного дня в порядке плана, без повторов одного места. */
export function dayPoints(days: Day[], places: Places, n: number): MapPoint[] {
  const d = days.find((x) => x.n === n);
  const out: MapPoint[] = [];
  const seen = new Map<string, number>();
  const counter = { n: 1 };
  for (const p of d?.places ?? []) {
    const entry = dayPointEntry(p, places, seen, counter);
    if (!entry || !entry.isNew) continue;
    out.push(entry.point);
  }
  return out;
}

/** Номер метки на карте дня для каждой остановки; null — места нет в places. */
export function stopNumbers(day: Day | undefined, places: Places): (number | null)[] {
  const seen = new Map<string, number>();
  const counter = { n: 1 };
  return (day?.places ?? []).map((p) => {
    const entry = dayPointEntry(p, places, seen, counter);
    return entry ? entry.number : null;
  });
}

/**
 * Остановки одного квартала делят координаты — разводим их по маленькой
 * окружности, иначе номера на карте прячутся друг под другом. Сдвиг — на
 * десятки метров, а не на сотни: в плотном городе больший радиус уводит
 * метку в соседнюю улицу или в воду, и она перестаёт указывать на своё
 * заведение.
 */
export function spreadOverlaps(points: MapPoint[]): MapPoint[] {
  // Считаем по ИСХОДНЫМ координатам: две остановки одного здания стоят в одной точке.
  // Старая страница сравнивала уже сдвинутые точки, поэтому третья и следующие
  // совпадали со второй и закрывали друг друга.
  const origins: MapPoint[] = [];
  return points.map((pt) => {
    let clash = 0;
    for (const o of origins) {
      if (Math.abs(o.lat - pt.lat) < 0.0004 && Math.abs(o.lon - pt.lon) < 0.0004) clash++;
    }
    const next = { ...pt };
    if (clash) {
      const a = clash * 2.399;
      const r = 0.0004 + Math.floor(clash / 7) * 0.0004;
      next.lat += Math.sin(a) * r;
      next.lon += Math.cos(a) * r;
    }
    origins.push(pt);
    return next;
  });
}

/**
 * Точки, стоящие в пределах ~300–350 м друг от друга (0.003°), на мелком зуме
 * всё равно наезжают друг на друга: маркер 24×24 px шире этого расстояния.
 * Разводим ТОЛЬКО иконки по маленькой окружности в пикселях — координата,
 * попап и линия маршрута остаются на настоящей точке.
 */
export function fanOffsets(points: MapPoint[]): { dx: number; dy: number }[] {
  const origins: MapPoint[] = [];
  return points.map((pt) => {
    let clash = 0;
    for (const o of origins) {
      if (Math.abs(o.lat - pt.lat) < 0.003 && Math.abs(o.lon - pt.lon) < 0.003) clash++;
    }
    origins.push(pt);
    if (!clash) return { dx: 0, dy: 0 };
    const a = clash * 2.399;
    return { dx: Math.cos(a) * 26, dy: Math.sin(a) * 26 };
  });
}

export function gmapsUrl(lat: number, lon: number): string {
  return "https://www.google.com/maps/search/?api=1&query=" + lat + "," + lon;
}

/** Ссылка «маршрут дня» в Google Maps (до 9 промежуточных точек). */
export function dayMapsUrl(points: MapPoint[]): string {
  if (!points.length) return "https://www.google.com/maps";
  if (points.length === 1) return gmapsUrl(points[0].lat, points[0].lon);
  const origin = points[0].lat + "," + points[0].lon;
  const dest = points[points.length - 1].lat + "," + points[points.length - 1].lon;
  const mids = points
    .slice(1, points.length - 1)
    .slice(0, 9)
    .map((p) => p.lat + "," + p.lon);
  let url = "https://www.google.com/maps/dir/?api=1&origin=" + origin + "&destination=" + dest;
  if (mids.length) url += "&waypoints=" + mids.join("|");
  return url;
}

/** Центр и «подходящий» зум по набору точек — для fitBounds без Leaflet. */
export function boundsOf(points: MapPoint[]): [[number, number], [number, number]] | null {
  if (!points.length) return null;
  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLon = points[0].lon;
  let maxLon = points[0].lon;
  for (const p of points) {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLon = Math.min(minLon, p.lon);
    maxLon = Math.max(maxLon, p.lon);
  }
  return [
    [minLat, minLon],
    [maxLat, maxLon],
  ];
}
