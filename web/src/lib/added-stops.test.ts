import { describe, expect, it } from "vitest";
import {
  addedStopFromGuide,
  addedStopFromStop,
  addedStopToStop,
  parseAddedStops,
  planStopMove,
  serializeAddedStops,
  tagForGuideKind,
} from "./added-stops";

describe("parseAddedStops", () => {
  it("разбирает валидный список и обрезает поля", () => {
    const raw = JSON.stringify([
      {
        s: "a1b2c3",
        n: "  Музей  ",
        t: "sight",
        c: " ¥50 ",
        d: " заметка ",
        g: " mplus ",
      },
    ]);
    expect(parseAddedStops(raw)).toEqual([
      { s: "a1b2c3", n: "Музей", t: "sight", c: "¥50", d: "заметка", g: "mplus" },
    ]);
  });

  it("терпим к мусору и невалидным элементам", () => {
    expect(parseAddedStops("не json")).toEqual([]);
    expect(parseAddedStops("")).toEqual([]);
    expect(parseAddedStops(undefined)).toEqual([]);
    expect(parseAddedStops('{"s":"a1b2c3"}')).toEqual([]);
    const raw = JSON.stringify([
      null,
      42,
      { s: "bad", n: "Плохой slug" },
      { s: "a1b2c3", n: "   " },
      { s: "d4e5f6", n: "  Годная  ", t: "party" },
    ]);
    expect(parseAddedStops(raw)).toEqual([{ s: "d4e5f6", n: "Годная" }]);
  });

  it("не берёт больше восьми элементов и обрезает длинные поля", () => {
    const list = Array.from({ length: 10 }, (_, i) => ({
      s: "s" + String(i).padStart(5, "0"),
      n: "Имя " + i,
      d: "я".repeat(400),
    }));
    const parsed = parseAddedStops(JSON.stringify(list));
    expect(parsed).toHaveLength(8);
    expect(parsed[0].d).toHaveLength(300);
  });
});

describe("serializeAddedStops", () => {
  it("пишет компактный JSON и сбрасывает пустой список в строку", () => {
    const list = [{ s: "a1b2c3", n: "Музей", t: "sight" as const }];
    expect(serializeAddedStops(list)).toBe('[{"s":"a1b2c3","n":"Музей","t":"sight"}]');
    expect(serializeAddedStops([])).toBe("");
  });
});

describe("addedStopToStop", () => {
  it("превращает добавленную остановку в Stop с производными полями", () => {
    expect(addedStopToStop({ s: "a1b2c3", n: "Музей", t: "food", c: "¥50", d: "заметка", g: "mplus" })).toEqual({
      k: "",
      name: "Музей",
      tag: "food",
      cost: "¥50",
      note: "заметка",
      _slug: "a1b2c3",
      _name: "Музей",
      _guide: "mplus",
      _added: true,
    });
  });

  it("по умолчанию ставит тег sight", () => {
    expect(addedStopToStop({ s: "a1b2c3", n: "Место" }).tag).toBe("sight");
  });
});

describe("tagForGuideKind", () => {
  it("еда — food, отель — hotel, остальное — sight", () => {
    expect(tagForGuideKind("food")).toBe("food");
    expect(tagForGuideKind("stay")).toBe("hotel");
    expect(tagForGuideKind("sight")).toBe("sight");
    expect(tagForGuideKind("tip")).toBe("sight");
  });
});

describe("ключ места k", () => {
  it("переживает разбор и сериализацию", () => {
    const raw = JSON.stringify([
      { s: "a1b2c3", n: "Музей", k: "victoria_peak" },
      { s: "d4e5f6", n: "Без ключа" },
    ]);
    expect(parseAddedStops(raw)).toEqual([
      { s: "a1b2c3", n: "Музей", k: "victoria_peak" },
      { s: "d4e5f6", n: "Без ключа" },
    ]);
    expect(parseAddedStops(JSON.stringify([{ s: "a1b2c3", n: "Музей", k: "bad key!" }]))).toEqual([
      { s: "a1b2c3", n: "Музей" },
    ]);
    expect(
      serializeAddedStops([{ s: "a1b2c3", n: "Музей", k: "victoria_peak" }]),
    ).toBe('[{"s":"a1b2c3","n":"Музей","k":"victoria_peak"}]');
  });

  it("addedStopToStop сохраняет ключ места", () => {
    expect(addedStopToStop({ s: "a1b2c3", n: "Музей", k: "victoria_peak" }).k).toBe(
      "victoria_peak",
    );
  });
});

describe("addedStopFromGuide", () => {
  it("строит запись с тегом, заметкой без HTML и id карточки", () => {
    expect(
      addedStopFromGuide({
        kind: "food",
        city: "hk",
        id: "mak-man-kee",
        en: "Mak Man Kee",
        note: "<b>Лапша</b> &nbsp; с  <a href=\"#\">утки</a>",
      }),
    ).toEqual({
      s: "am9nlb",
      n: "Mak Man Kee",
      t: "food",
      d: "Лапша &nbsp; с утки",
      g: "mak-man-kee",
    });
  });

  it("не пишет пустое описание", () => {
    expect(
      addedStopFromGuide({ kind: "sight", city: "hk", id: "peak", en: "Peak" }),
    ).toEqual({ s: "8bmotu", n: "Peak", t: "sight", g: "peak" });
  });
});

describe("addedStopFromStop", () => {
  it("вырезает HTML из заметки и сохраняет ключ места", () => {
    expect(
      addedStopFromStop(
        {
          k: "victoria_peak",
          name: "Пик",
          tag: "sight",
          cost: "HK$100",
          note: "<b>Смотровая</b> и <i>трамвай</i>",
        },
        "peak1234",
        "victoria-peak",
      ),
    ).toEqual({
      s: "peak1234",
      n: "Пик",
      t: "sight",
      c: "HK$100",
      d: "Смотровая и трамвай",
      g: "victoria-peak",
      k: "victoria_peak",
    });
  });
});

describe("planStopMove", () => {
  const added = { s: "peak1234", n: "Пик", t: "sight" as const, k: "victoria_peak" };

  it("обычную остановку скрывает в исходном дне и добавляет в целевой", () => {
    const plan = planStopMove({
      fromTexts: { title: "День" },
      toTexts: {},
      slug: "peak1234",
      added,
      hideInSource: true,
    });

    expect(plan.error).toBeUndefined();
    expect(plan.from).toEqual({ title: "День", hide: "peak1234" });
    expect(plan.to).toEqual({ add: JSON.stringify([added]) });
  });

  it("добавленную остановку убирает из add исходного дня", () => {
    const plan = planStopMove({
      fromTexts: { add: JSON.stringify([added, { s: "keep1234", n: "Другое" }]) },
      toTexts: {},
      slug: "peak1234",
      added,
      hideInSource: false,
    });

    expect(plan.error).toBeUndefined();
    expect(plan.from).toEqual({ add: JSON.stringify([{ s: "keep1234", n: "Другое" }]) });
    expect(plan.to).toEqual({ add: JSON.stringify([added]) });
  });

  it("added: null без записи в add — только скрывает исходный день", () => {
    const plan = planStopMove({
      fromTexts: { title: "День" },
      toTexts: {},
      slug: "peak1234",
      added: null,
      hideInSource: true,
    });

    expect(plan.error).toBeUndefined();
    expect(plan.from).toEqual({ title: "День", hide: "peak1234" });
    expect(plan.to).toEqual({});
  });

  it("если в целевом дне уже есть этот slug — duplicate без изменений", () => {
    const plan = planStopMove({
      fromTexts: { title: "День" },
      toTexts: { add: JSON.stringify([added]) },
      slug: "peak1234",
      added: null,
      hideInSource: true,
    });

    expect(plan.error).toBe("duplicate");
    expect(plan.from).toEqual({ title: "День" });
    expect(plan.to).toEqual({ add: JSON.stringify([added]) });
  });

  it("лимит 8 добавленных в целевом дне — limit без изменений", () => {
    const full = Array.from({ length: 8 }, (_, i) => ({
      s: "s" + String(i).padStart(5, "0"),
      n: "Место " + i,
    }));
    const fromTexts = { title: "День" };
    const toTexts = { add: JSON.stringify(full) };
    const plan = planStopMove({
      fromTexts,
      toTexts,
      slug: "peak1234",
      added,
      hideInSource: true,
    });

    expect(plan.error).toBe("limit");
    expect(plan.from).toEqual(fromTexts);
    expect(plan.to).toEqual(toTexts);
  });

  it("в целевом дне возвращает место из hide и missed, пустые списки удаляет", () => {
    const plan = planStopMove({
      fromTexts: { title: "День" },
      toTexts: { hide: "other1,peak1234", missed: "peak1234" },
      slug: "peak1234",
      added: null,
      hideInSource: true,
    });

    expect(plan.error).toBeUndefined();
    expect(plan.to).toEqual({ hide: "other1" });
  });
});
