import { describe, expect, it } from "vitest";
import type { Day } from "../types";
import { buildDayTargets } from "./day-targets";
import { noteKey } from "./days";
import { stopSlug } from "./slug";

const days: Day[] = [
  {
    n: 1,
    date: "07.12 · пн",
    city: "hk",
    title: "Гонконг",
    sub: "",
    places: [
      { k: "victoria_peak", name: "Пик" },
      { k: "victoria_peak", name: "Трамвай" },
    ],
  },
  {
    n: 2,
    date: "08.12 · вт",
    city: "cq",
    title: "Чунцин",
    sub: "",
    places: [],
  },
];

describe("buildDayTargets", () => {
  it("строит ключи noteKey и подписи с городом", () => {
    const targets = buildDayTargets("hk-first", days, {}, []);
    expect(targets.map((t) => t.key)).toEqual([
      noteKey("hk-first", days[0]),
      noteKey("hk-first", days[1]),
    ]);
    expect(targets[0].label).toBe("Д1 · 07.12 · Гонконг");
    expect(targets[1].label).toBe("Д2 · 08.12 · Чунцин");
    expect(targets[0]).toMatchObject({ n: 1, date: "07.12", city: "hk" });
  });

  it("берёт slugs из withTexts: добавленные входят, скрытые уходят", () => {
    const add = { s: stopSlug("Добавленное"), n: "Добавленное" };
    const targets = buildDayTargets(
      "hk-first",
      days,
      {
        [noteKey("hk-first", days[0])]: {
          hide: stopSlug("Пик"),
          add: JSON.stringify([add]),
        },
      },
      [],
    );

    expect(targets[0].slugs).toEqual([stopSlug("Трамвай"), add.s]);
    expect(targets[1].slugs).toEqual([]);
  });
});
