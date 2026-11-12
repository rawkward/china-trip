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

const GCJ_A = 6378245.0;
const GCJ_EE = 0.00669342162296594323;
const GCJ_PI = 3.1415926535897932384626;

function transformLat(x: number, y: number): number {
  let ret =
    -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * GCJ_PI) + 20.0 * Math.sin(2.0 * x * GCJ_PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(y * GCJ_PI) + 40.0 * Math.sin((y / 3.0) * GCJ_PI)) * 2.0) / 3.0;
  ret +=
    ((160.0 * Math.sin((y / 12.0) * GCJ_PI) + 320 * Math.sin((y * GCJ_PI) / 30.0)) * 2.0) / 3.0;
  return ret;
}

function transformLon(x: number, y: number): number {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * GCJ_PI) + 20.0 * Math.sin(2.0 * x * GCJ_PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(x * GCJ_PI) + 40.0 * Math.sin((x / 3.0) * GCJ_PI)) * 2.0) / 3.0;
  ret +=
    ((150.0 * Math.sin((x / 12.0) * GCJ_PI) + 300.0 * Math.sin((x / 30.0) * GCJ_PI)) * 2.0) /
    3.0;
  return ret;
}

/** WGS-84 → GCJ-02: подложка Google в материковом Китае рисует карту в GCJ-02. */
export function wgs2gcj(lat: number, lon: number): [number, number] {
  let dLat = transformLat(lon - 105.0, lat - 35.0);
  let dLon = transformLon(lon - 105.0, lat - 35.0);
  const radLat = (lat / 180.0) * GCJ_PI;
  let magic = Math.sin(radLat);
  magic = 1 - GCJ_EE * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / (((GCJ_A * (1 - GCJ_EE)) / (magic * sqrtMagic)) * GCJ_PI);
  dLon = (dLon * 180.0) / ((GCJ_A / sqrtMagic) * Math.cos(radLat) * GCJ_PI);
  return [lat + dLat, lon + dLon];
}

function inBox(
  lat: number,
  lon: number,
  latMin: number,
  latMax: number,
  lonMin: number,
  lonMax: number,
): boolean {
  return lat >= latMin && lat <= latMax && lon >= lonMin && lon <= lonMax;
}

/** Материковый Китай без Гонконга, Макао и Тайваня — там GCJ-02 не применяется. */
export function isMainlandChina(lat: number, lon: number): boolean {
  if (!inBox(lat, lon, 18, 54, 73, 135)) return false;
  if (inBox(lat, lon, 22.15, 22.6, 113.8, 114.5)) return false;
  if (inBox(lat, lon, 22.05, 22.25, 113.5, 113.7)) return false;
  if (inBox(lat, lon, 21.8, 25.5, 119.9, 122.1)) return false;
  return true;
}

/** Координаты для отрисовки на подложке: Google в материковом Китае — GCJ-02. */
export function toTilePoint<T extends { lat: number; lon: number }>(p: T, tileId: string): T {
  if (tileId === "google" && isMainlandChina(p.lat, p.lon)) {
    const [lat, lon] = wgs2gcj(p.lat, p.lon);
    return { ...p, lat, lon };
  }
  return p;
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
