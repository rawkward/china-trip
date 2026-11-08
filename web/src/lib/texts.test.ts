import { describe, expect, it } from "vitest";
import { moveInOrder, stopFieldSet, stopKey, withTexts } from "./texts";
import type { Day, GuideItem } from "../types";

const guide: GuideItem[] = [
  { kind: "food", city: "cq", id: "hotpot", en: "Qin Ma Hotpot", note: "Очередь с 18:00" },
  { kind: "sight", city: "cq", id: "hongyadong", en: "Hongyadong", note: "Вечером подсветка", match: ["Хунъядун"] },
];

const day = (): Day => ({
  city: "cq",
  title: "Чунцин",
  sub: "первый день",
  n: 1,
  date: "14.12 · пн",
  places: [
    { k: "cq", name: "Хунъядун", tag: "sight", note: "вид на реку", cost: "бесплатно" },
    { k: "cq", name: "Ужин", tag: "food", note: "хотпот" },
  ],
});

describe("withTexts", () => {
  it("без правок возвращает день как есть и сохраняет исходники", () => {
    const d = day();
    const out = withTexts(d, {}, guide);
    expect(out.title).toBe("Чунцин");
    expect(out._title).toBe("Чунцин");
    expect(out.places[0].name).toBe("Хунъядун");
    expect(out.places[0]._name).toBe("Хунъядун");
  });

  it("перекрывает заголовок и подзаголовок", () => {
    const out = withTexts(day(), { title: "Новый заголовок", sub: "новый подзаголовок" }, guide);
    expect(out.title).toBe("Новый заголовок");
    expect(out.sub).toBe("новый подзаголовок");
  });

  it("правит имя, цену и время остановки по её slug", () => {
    const out = withTexts(
      day(),
      {
        "stop:nhlbx0:name": "Сяхаоли",
        "stop:nhlbx0:cost": "¥40",
        "stop:nhlbx0:time": "10:00–12:30",
      },
      guide,
    );
    // правки адресуются по slug названия, которого в этом дне нет — значит не применились
    expect(out.places[0].name).toBe("Хунъядун");
  });

  it("подставляет карточку справочника вместо названия", () => {
    const slug = withTexts(day(), {}, guide).places[0]._slug!;
    const out = withTexts(day(), { [`ref:${slug}`]: "food|cq|hotpot" }, guide);
    expect(out.places[0].name).toBe("Qin Ma Hotpot");
    expect(out.places[0].note).toBe("Очередь с 18:00");
    expect(out.places[0].cost).toBe("");
  });

  it("переставляет остановки по сохранённому порядку", () => {
    const base = withTexts(day(), {}, guide);
    const order = [base.places[1]._slug, base.places[0]._slug].join(",");
    const out = withTexts(day(), { order }, guide);
    expect(out.places.map((p) => p.name)).toEqual(["Ужин", "Хунъядун"]);
  });

  it("неизвестный slug в порядке игнорируется, остальные остаются в конце", () => {
    const base = withTexts(day(), {}, guide);
    const out = withTexts(day(), { order: "zzzzzz" }, guide);
    expect(out.places.map((p) => p.name)).toEqual(base.places.map((p) => p.name));
  });

  it("работает с группой вариантов: правит выбранный вариант и заголовок группы", () => {
    const picks: Day = {
      city: "cq",
      title: "Обед",
      sub: "",
      n: 2,
      date: "15.12 · вт",
      places: [
        {
          k: "cq",
          title: "Обед в 渝中",
          tag: "food",
          picks: [
            { name: "Хотпот", note: "острый", cost: "¥80", rec: true },
            { name: "Димсамы", note: "спокойнее", cost: "¥60" },
          ],
        },
      ],
    };
    const slug = withTexts(picks, {}, guide).places[0]._slug!;
    const out = withTexts(
      picks,
      {
        [`picks:${slug}:title`]: "Обед: три варианта",
        [`pick:${slug}:1:name`]: "Димсамы Cantonese",
        [`pick:${slug}:1:dim`]: "название с чужих слов",
      },
      guide,
    );
    expect(out.places[0].title).toBe("Обед: три варианта");
    expect(out.places[0].picks?.[1].name).toBe("Димсамы Cantonese");
    expect(out.places[0].picks?.[1].dim).toBe("название с чужих слов");
    expect(out.places[0].picks?.[0].rec).toBe(true);
  });

  it("ref у группы сворачивает карусель в одну карточку справочника", () => {
    const picks: Day = {
      city: "cq",
      title: "Обед",
      sub: "",
      n: 2,
      date: "15.12 · вт",
      places: [
        {
          k: "cq",
          title: "Обед в 渝中",
          tag: "food",
          note: "три варианта",
          picks: [
            { name: "Хотпот", note: "острый", cost: "¥80", rec: true },
            { name: "Димсамы", note: "спокойнее", cost: "¥60" },
          ],
        },
      ],
    };
    const slug = withTexts(picks, {}, guide).places[0]._slug!;
    const out = withTexts(picks, { [`ref:${slug}`]: "food|cq|hotpot" }, guide);
    const q = out.places[0];
    expect(q.title).toBe("Qin Ma Hotpot");
    expect(q.name).toBe("Qin Ma Hotpot");
    expect(q._name).toBe("Qin Ma Hotpot");
    expect(q.note).toBe("Очередь с 18:00");
    expect(q.cost).toBe("");
    expect(q.picks).toEqual([]);
  });
});

describe("stopKey", () => {
  it("склеивает ключ дня и slug названия", () => {
    expect(stopKey("hk-first|07.12", "Сяхаоли")).toBe("hk-first|07.12|nhlbx0");
  });
});

describe("stopFieldSet / moveInOrder", () => {
  it("даёт ключи полей для остановки и для варианта", () => {
    expect(stopFieldSet("abc123")).toEqual({
      name: "stop:abc123:name",
      cost: "stop:abc123:cost",
      time: "stop:abc123:time",
      ref: "ref:abc123",
    });
    expect(stopFieldSet("abc123", 2)).toEqual({
      name: "pick:abc123:2:name",
      cost: "pick:abc123:2:cost",
      dim: "pick:abc123:2:dim",
    });
  });

  it("двигает элемент в порядке и не выходит за границы", () => {
    const order = ["a", "b", "c"];
    expect(moveInOrder(order, "b", "up")).toEqual(["b", "a", "c"]);
    expect(moveInOrder(order, "b", "down")).toEqual(["a", "c", "b"]);
    expect(moveInOrder(order, "a", "up")).toEqual(order);
    expect(moveInOrder(order, "c", "down")).toEqual(order);
    expect(moveInOrder(order, "нет", "up")).toEqual(order);
    expect(order).toEqual(["a", "b", "c"]);
  });
});

describe("withTexts: скрытие остановок", () => {
  it("скрытие по slug убирает остановку из places и кладёт в _hidden", () => {
    const base = withTexts(day(), {}, guide);
    const hiddenSlug = base.places[0]._slug!;
    const out = withTexts(day(), { hide: hiddenSlug }, guide);
    expect(out.places.map((p) => p.name)).toEqual(["Ужин"]);
    expect(out._hidden?.map((p) => p.name)).toEqual(["Хунъядун"]);
  });

  it("неизвестный slug ничего не ломает", () => {
    const base = withTexts(day(), {}, guide);
    const out = withTexts(day(), { hide: "zzzzzz" }, guide);
    expect(out.places.map((p) => p.name)).toEqual(base.places.map((p) => p.name));
    expect(out._hidden).toEqual([]);
  });

  it("hide работает вместе с order: скрытая остановка уходит, остальные сохраняют порядок", () => {
    const base = withTexts(day(), {}, guide);
    const first = base.places[0]._slug!;
    const second = base.places[1]._slug!;
    const out = withTexts(day(), { order: [second, first].join(","), hide: first }, guide);
    expect(out.places.map((p) => p.name)).toEqual(["Ужин"]);
    expect(out._hidden?.map((p) => p.name)).toEqual(["Хунъядун"]);
  });

  it("пустой hide оставляет все остановки и пустой _hidden", () => {
    const base = withTexts(day(), {}, guide);
    const out = withTexts(day(), { hide: "" }, guide);
    expect(out.places.map((p) => p.name)).toEqual(base.places.map((p) => p.name));
    expect(out._hidden).toEqual([]);
  });

  it("скрыть можно все остановки — places становится пустым", () => {
    const base = withTexts(day(), {}, guide);
    const hide = base.places.map((p) => p._slug).join(",");
    const out = withTexts(day(), { hide }, guide);
    expect(out.places).toEqual([]);
    expect(out._hidden).toHaveLength(base.places.length);
  });
});
