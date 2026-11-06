import { describe, expect, it } from "vitest";
import {
  boundsOf,
  buildMarkerRegistry,
  dayMapsUrl,
  dayPoints,
  gmapsUrl,
  mapKindLabel,
  MAP_KINDS,
  spreadOverlaps,
  TILE_SETS,
} from "./map";
import type { Day, Places } from "../types";

const PLACES: Places = {
  hk: { name: "Hong Kong", lat: 22.3, lon: 114.17 },
  peak: { name: "The Peak", lat: 22.2711, lon: 114.1497 },
  cq: { name: "Chongqing", lat: 29.56, lon: 106.55 },
};

const days = (): Day[] => [
  {
    city: "hk",
    title: "День 1",
    sub: "",
    n: 1,
    date: "05.12 · сб",
    places: [
      { k: "hk", name: "Отель", tag: "hotel" },
      { k: "peak", name: "Пик", tag: "sight" },
      { k: "hk", name: "Ужин у отеля", tag: "food" },
    ],
  },
  {
    city: "hk",
    title: "День 2",
    sub: "",
    n: 2,
    date: "06.12 · вс",
    places: [
      { k: "peak", name: "Пик", tag: "sight" },
      { k: "unknown_key", name: "Нет координат", tag: "sight" },
      { k: "cq", name: "Чунцин", tag: "sight" },
    ],
  },
];

describe("buildMarkerRegistry", () => {
  it("схлопывает одинаковые места и собирает номера дней", () => {
    const reg = buildMarkerRegistry(days(), PLACES);
    expect(reg.map((r) => r.key)).toEqual(["hk", "peak", "cq"]);
    expect(reg[1].days).toEqual([1, 2]);
    expect(reg[0].days).toEqual([1]);
  });

  it("место без координат пропускается", () => {
    const reg = buildMarkerRegistry(days(), PLACES);
    expect(reg.some((r) => r.name === "Нет координат")).toBe(false);
  });
});

describe("dayPoints", () => {
  it("идёт в порядке плана и не повторяет одну точку", () => {
    const pts = dayPoints(days(), PLACES, 1);
    expect(pts.map((p) => p.name)).toEqual(["Отель", "Пик"]);
    expect(pts[0].tag).toBe("hotel");
  });

  it("несуществующий день — пустой список", () => {
    expect(dayPoints(days(), PLACES, 99)).toEqual([]);
  });
});

describe("spreadOverlaps", () => {
  it("разводит точки с одинаковыми координатами", () => {
    const pts = [
      { name: "a", tag: "sight" as const, lat: 22.3, lon: 114.17 },
      { name: "b", tag: "sight" as const, lat: 22.3, lon: 114.17 },
      { name: "c", tag: "sight" as const, lat: 22.3, lon: 114.17 },
    ];
    const out = spreadOverlaps(pts);
    expect(out[0]).toEqual(pts[0]);
    for (let i = 1; i < out.length; i++) {
      expect(Math.abs(out[i].lat - 22.3)).toBeGreaterThan(0);
      expect(Math.abs(out[i].lon - 114.17)).toBeGreaterThan(0);
    }
    expect(out[1].lat).not.toBeCloseTo(out[2].lat, 6);
  });

  it("не трогает далёкие точки и не мутирует вход", () => {
    const pts = [
      { name: "a", tag: "" as const, lat: 22.3, lon: 114.17 },
      { name: "b", tag: "" as const, lat: 29.56, lon: 106.55 },
    ];
    const out = spreadOverlaps(pts);
    expect(out[1]).toEqual(pts[1]);
    expect(pts[1].lat).toBe(29.56);
  });
});

describe("ссылки на карты", () => {
  it("точка — поиск по координатам", () => {
    expect(gmapsUrl(22.3, 114.17)).toBe(
      "https://www.google.com/maps/search/?api=1&query=22.3,114.17",
    );
  });

  it("пустой день ведёт просто на карты", () => {
    expect(dayMapsUrl([])).toBe("https://www.google.com/maps");
  });

  it("одна точка — поиск", () => {
    expect(dayMapsUrl([{ name: "a", tag: "", lat: 1, lon: 2 }])).toBe(
      "https://www.google.com/maps/search/?api=1&query=1,2",
    );
  });

  it("две точки — маршрут без waypoints", () => {
    const url = dayMapsUrl([
      { name: "a", tag: "", lat: 1, lon: 2 },
      { name: "b", tag: "", lat: 3, lon: 4 },
    ]);
    expect(url).toBe("https://www.google.com/maps/dir/?api=1&origin=1,2&destination=3,4");
  });

  it("много точек — не больше 9 промежуточных", () => {
    const pts = Array.from({ length: 15 }, (_, i) => ({ name: String(i), tag: "" as const, lat: i, lon: i }));
    const url = dayMapsUrl(pts);
    const waypoints = new URL(url).searchParams.get("waypoints")!.split("|");
    expect(waypoints).toHaveLength(9);
    expect(new URL(url).searchParams.get("destination")).toBe("14,14");
  });
});

describe("boundsOf", () => {
  it("охватывает все точки", () => {
    expect(
      boundsOf([
        { name: "a", tag: "", lat: 1, lon: 5 },
        { name: "b", tag: "", lat: 3, lon: 2 },
      ]),
    ).toEqual([
      [1, 2],
      [3, 5],
    ]);
  });

  it("пусто — null", () => {
    expect(boundsOf([])).toBeNull();
  });
});

describe("константы карты", () => {
  it("подложки заданы в порядке фолбэка и с атрибуцией", () => {
    expect(TILE_SETS.map((t) => t.id)).toEqual(["google", "yandex", "osm"]);
    for (const t of TILE_SETS) {
      expect(t.url).toContain("{x}");
      expect(t.attr).toContain("href");
    }
  });

  it("подписи типов на русском, неизвестный — как есть", () => {
    expect(MAP_KINDS).toHaveLength(8);
    expect(mapKindLabel("hotel")).toBe("Отели");
    expect(mapKindLabel("nope")).toBe("nope");
  });
});
