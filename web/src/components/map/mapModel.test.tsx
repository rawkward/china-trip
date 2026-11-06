import { describe, expect, it } from "vitest";
import type { MarkerRecord } from "@/lib/map";
import {
  allPopupHtml,
  cityColor,
  cityOrderOf,
  dayPinHtml,
  dayPopupHtml,
  escapeHtml,
  filterMarkers,
  presentKinds,
} from "./mapModel";

const registry: MarkerRecord[] = [
  { key: "a", name: "Отель <A>", tag: "hotel", lat: 1, lon: 2, city: "hk", days: [1, 2] },
  { key: "b", name: "Кафе", tag: "food", lat: 3, lon: 4, city: "cq", days: [3] },
  { key: "c", name: "Парк", tag: "sight", lat: 5, lon: 6, city: "hk", days: [4] },
];

describe("mapModel", () => {
  it("оставляет только присутствующие типы в порядке MAP_KINDS", () => {
    expect(presentKinds(registry).map((k) => k.k)).toEqual(["hotel", "food", "sight"]);
  });

  it("города идут в порядке первого появления", () => {
    expect(cityOrderOf(registry)).toEqual(["hk", "cq"]);
  });

  it("фильтрует по типу и городу одновременно", () => {
    expect(filterMarkers(registry, "hotel", "all").map((r) => r.key)).toEqual(["a"]);
    expect(filterMarkers(registry, "all", "hk").map((r) => r.key)).toEqual(["a", "c"]);
    expect(filterMarkers(registry, "sight", "cq")).toEqual([]);
  });

  it("экранирует имена и собирает поп-апы", () => {
    expect(escapeHtml('a<b>&"\'')).toBe("a&lt;b&gt;&amp;&quot;&#39;");
    expect(allPopupHtml(registry[0], "https://maps.example/1")).toContain(
      "Отель &lt;A&gt;",
    );
    expect(allPopupHtml(registry[0], "https://maps.example/1")).toContain("дни: Д1, Д2");
    expect(dayPopupHtml(0, registry[0], 2, "https://maps.example/1")).toContain(
      "1. Отель &lt;A&gt;",
    );
    expect(dayPopupHtml(0, registry[0], 2, "https://maps.example/1")).toContain("Д2");
    expect(dayPinHtml(2, cityColor("hk"))).toContain(">3</span>");
  });
});
