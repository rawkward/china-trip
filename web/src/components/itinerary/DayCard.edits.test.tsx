import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GUIDE_ITEMS } from "@/data";
import { stopSlug } from "@/lib/slug";
import type { Day } from "@/types";
import { DayCard, restoredLists } from "./DayCard";
import type { ItineraryEditApi } from "./EditableText";

function makeApi(overrides: Partial<ItineraryEditApi> = {}): ItineraryEditApi {
  return {
    token: "token",
    editing: {},
    setEditing: vi.fn(),
    saveText: vi.fn(async () => {}),
    dayNotes: {},
    stopNotes: {},
    saveDayNote: vi.fn(async () => {}),
    deleteDayNote: vi.fn(async () => {}),
    saveStopNote: vi.fn(async () => {}),
    resetStopNote: vi.fn(async () => {}),
    ...overrides,
  };
}

const day: Day = {
  n: 1,
  date: "07.12 · пн",
  city: "hk",
  title: "Первый день",
  sub: "Прилёт и заселение",
  places: [
    { k: "a", name: "Заселение", tag: "hotel", _slug: "a" },
    { k: "b", name: "Трамвай на Пик", tag: "sight", _slug: "b" },
    { k: "c", name: "Ужин", tag: "food", _slug: "c" },
  ],
};

function renderCard(props: Partial<Parameters<typeof DayCard>[0]> = {}) {
  return render(
    <DayCard
      day={day}
      dayKey="hk|07.12"
      texts={{}}
      api={makeApi()}
      open
      onToggle={vi.fn()}
      onFocusDay={vi.fn()}
      {...props}
    />,
  );
}

describe("DayCard: правки заголовка", () => {
  it("карандаш открывает редактор нужного поля", () => {
    const api = makeApi();
    renderCard({ api });

    fireEvent.click(screen.getByRole("button", { name: "править заголовок дня" }));
    expect(api.setEditing).toHaveBeenCalledWith({ text: "title" });

    fireEvent.click(screen.getByRole("button", { name: "править подзаголовок дня" }));
    expect(api.setEditing).toHaveBeenCalledWith({ text: "sub" });
  });

  it("редактор заголовка сохраняет введённый текст через saveText", () => {
    const api = makeApi({ editing: { text: "title" } });
    renderCard({ api, texts: {} });

    const input = screen.getByLabelText("Заголовок дня");
    fireEvent.change(input, { target: { value: "Новый заголовок" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(api.saveText).toHaveBeenCalledWith("hk|07.12", "title", "Новый заголовок");
  });

  it("у правленого заголовка есть кнопка сброса, она пишет пустую строку", () => {
    const api = makeApi({ editing: { text: "title" } });
    renderCard({ api, texts: { title: "Правка" } });

    fireEvent.click(screen.getByRole("button", { name: "Сбросить" }));
    expect(api.saveText).toHaveBeenCalledWith("hk|07.12", "title", "");
  });

  it("Отмена закрывает редактор, не сохраняя", () => {
    const api = makeApi({ editing: { text: "sub" } });
    renderCard({ api });

    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));
    expect(api.setEditing).toHaveBeenCalledWith({ text: undefined });
    expect(api.saveText).not.toHaveBeenCalled();
  });
});

describe("DayCard: перестановка остановок", () => {
  it("кнопка «ниже» отправляет правильный порядок slug'ов", () => {
    const api = makeApi();
    renderCard({ api });

    fireEvent.click(within(screen.getByRole("region", { name: "День 1" })).getAllByRole("button", { name: "ниже" })[0]);

    expect(api.saveText).toHaveBeenCalledWith("hk|07.12", "order", "b,a,c");
  });

  it("кнопка «выше» на второй остановке возвращает исходный порядок", () => {
    const api = makeApi();
    renderCard({ api });

    fireEvent.click(within(screen.getByRole("region", { name: "День 1" })).getAllByRole("button", { name: "выше" })[1]);

    expect(api.saveText).toHaveBeenCalledWith("hk|07.12", "order", "b,a,c");
  });

  it("крайние кнопки перестановки заблокированы", () => {
    renderCard();
    const region = screen.getByRole("region", { name: "День 1" });
    const ups = within(region).getAllByRole("button", { name: "выше" });
    const downs = within(region).getAllByRole("button", { name: "ниже" });
    expect(ups[0]).toBeDisabled();
    expect(downs[downs.length - 1]).toBeDisabled();
  });
});

describe("DayCard: пустой день", () => {
  it("день без остановок рендерится и не падает", () => {
    renderCard({ day: { ...day, places: [] } });

    expect(screen.getByRole("region", { name: "День 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Показать на карте/ })).toBeInTheDocument();
    expect(screen.getByText((_content, element) => element?.textContent === "0 остановок")).toBeInTheDocument();
  });
});

describe("DayCard: удаление остановок из дня", () => {
  it("удаление сохраняет поле hide с нужным slug", () => {
    const api = makeApi();
    renderCard({ api });

    fireEvent.click(
      within(screen.getByRole("region", { name: "День 1" })).getAllByRole("button", {
        name: "убрать из маршрута",
      })[0],
    );

    expect(api.saveText).toHaveBeenCalledWith("hk|07.12", "hide", "a");
  });

  it("второе удаление добавляет второй slug", () => {
    const api = makeApi();
    renderCard({ api, texts: { hide: "a" } });

    fireEvent.click(
      within(screen.getByRole("region", { name: "День 1" })).getAllByRole("button", {
        name: "убрать из маршрута",
      })[1],
    );

    expect(api.saveText).toHaveBeenCalledWith("hk|07.12", "hide", "a,b");
  });

  it("«вернуть» убирает slug из списка", () => {
    const api = makeApi();
    const hiddenDay: Day = { ...day, _hidden: [day.places[1], day.places[2]] };
    renderCard({ api, day: hiddenDay, texts: { hide: "b,c" } });

    fireEvent.click(screen.getByRole("button", { name: "вернуть Трамвай на Пик" }));

    expect(api.saveText).toHaveBeenCalledWith("hk|07.12", "hide", "c");
  });

  it("возврат последней остановки сбрасывает поле пустой строкой", () => {
    const api = makeApi();
    const hiddenDay: Day = { ...day, _hidden: [day.places[2]] };
    renderCard({ api, day: hiddenDay, texts: { hide: "c" } });

    fireEvent.click(screen.getByRole("button", { name: "вернуть Ужин" }));

    expect(api.saveText).toHaveBeenCalledWith("hk|07.12", "hide", "");
  });

  it("у скрытой остановки есть кнопка переноса в «Можно посмотреть», она пишет missed", () => {
    const api = makeApi();
    const hiddenDay: Day = { ...day, places: [day.places[0]], _hidden: [day.places[1], day.places[2]] };
    renderCard({ api, day: hiddenDay, texts: { hide: "b,c" } });

    fireEvent.click(
      screen.getByRole("button", { name: "перенести Трамвай на Пик в можно посмотреть" }),
    );

    expect(api.saveText).toHaveBeenCalledWith("hk|07.12", "missed", "b");
    expect(api.saveText).not.toHaveBeenCalledWith("hk|07.12", "hide", expect.anything());
  });

  it("остановка из missed не показывается в блоке «убрано из маршрута»", () => {
    const hiddenDay: Day = { ...day, places: [day.places[0]], _hidden: [day.places[1], day.places[2]] };
    renderCard({ api: makeApi(), day: hiddenDay, texts: { hide: "b,c", missed: "b" } });

    expect(screen.queryByText("Трамвай на Пик")).not.toBeInTheDocument();
    expect(screen.getByText("Ужин")).toBeInTheDocument();
  });

  it("«вернуть» чистит и hide, и missed", () => {
    expect(restoredLists("b,c", "b,c", "b")).toEqual({ hide: "c", missed: "c" });
    expect(restoredLists("b", "", "b")).toEqual({ hide: "", missed: "" });

    const api = makeApi();
    const hiddenDay: Day = { ...day, places: [day.places[0]], _hidden: [day.places[1]] };
    renderCard({ api, day: hiddenDay, texts: { hide: "b" } });

    fireEvent.click(screen.getByRole("button", { name: "вернуть Трамвай на Пик" }));
    expect(api.saveText).toHaveBeenCalledWith("hk|07.12", "hide", "");
  });

  it("блок «убрано из маршрута» виден только с токеном", () => {
    const hiddenDay: Day = { ...day, _hidden: [day.places[2]] };
    const { rerender } = renderCard({ api: makeApi({ token: null }), day: hiddenDay });
    expect(screen.queryByText(/убрано из маршрута/)).not.toBeInTheDocument();

    rerender(
      <DayCard
        day={hiddenDay}
        dayKey="hk|07.12"
        texts={{}}
        api={makeApi()}
        open
        onToggle={vi.fn()}
        onFocusDay={vi.fn()}
      />,
    );
    expect(screen.getByText(/убрано из маршрута/)).toBeInTheDocument();
    expect(screen.getAllByText("Ужин").length).toBeGreaterThan(0);
  });
});

describe("DayCard: добавление остановок", () => {
  it("кнопка добавления есть только с токеном", () => {
    const { rerender } = renderCard({ api: makeApi({ token: null }) });
    expect(screen.queryByRole("button", { name: "добавить остановку" })).not.toBeInTheDocument();

    rerender(
      <DayCard
        day={day}
        dayKey="hk|07.12"
        texts={{}}
        api={makeApi()}
        open
        onToggle={vi.fn()}
        onFocusDay={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "добавить остановку" })).toBeInTheDocument();
  });

  it("своя остановка сохраняется в add компактным JSON", () => {
    const api = makeApi();
    renderCard({ api });

    fireEvent.click(screen.getByRole("button", { name: "добавить остановку" }));
    fireEvent.change(screen.getByLabelText("название новой остановки"), {
      target: { value: "Новый музей" },
    });
    fireEvent.click(screen.getByRole("button", { name: "добавить" }));

    expect(api.saveText).toHaveBeenCalledWith(
      "hk|07.12",
      "add",
      JSON.stringify([{ s: stopSlug("Новый музей"), n: "Новый музей" }]),
    );
    expect(screen.getByLabelText("название новой остановки")).toBeInTheDocument();
  });

  it("карточка справочника даёт id карточки и тег", () => {
    const peak = GUIDE_ITEMS.find((it) => it.id === "victoria-peak")!;
    const api = makeApi();
    renderCard({ api });

    fireEvent.click(screen.getByRole("button", { name: "добавить остановку" }));
    fireEvent.change(screen.getByLabelText("поиск по справочнику"), { target: { value: "Victoria" } });
    fireEvent.click(screen.getByRole("button", { name: /Victoria Peak & Peak Tram/ }));

    expect(api.saveText).toHaveBeenCalledWith(
      "hk|07.12",
      "add",
      JSON.stringify([
        {
          s: stopSlug(peak.en),
          n: peak.en,
          t: "sight",
          d: peak.note?.slice(0, 300),
          g: peak.id,
        },
      ]),
    );
  });

  it("уже добавленная в день карточка недоступна для повторного выбора", () => {
    const peak = GUIDE_ITEMS.find((it) => it.id === "victoria-peak")!;
    const texts = { add: JSON.stringify([{ s: stopSlug(peak.en), n: peak.en, g: peak.id }]) };
    renderCard({ texts });

    fireEvent.click(screen.getByRole("button", { name: "добавить остановку" }));
    fireEvent.change(screen.getByLabelText("поиск по справочнику"), { target: { value: "Victoria" } });
    const button = screen.getByRole("button", { name: /Victoria Peak & Peak Tram/ });
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("уже в дне");
  });

  it("удаление добавленной остановки убирает её из add, а не пишет hide", () => {
    const api = makeApi();
    const added = { k: "", s: "a1b2c3", n: "Новый музей", tag: "sight" as const, _slug: "a1b2c3", _name: "Новый музей", _added: true };
    const withAdded: Day = { ...day, places: [...day.places, added] };
    renderCard({ api, day: withAdded, texts: { add: JSON.stringify([{ s: "a1b2c3", n: "Новый музей" }]) } });

    fireEvent.click(
      within(screen.getByRole("region", { name: "День 1" })).getAllByRole("button", {
        name: "убрать из маршрута",
      })[3],
    );

    expect(api.saveText).toHaveBeenCalledWith("hk|07.12", "add", "");
    expect(api.saveText).not.toHaveBeenCalledWith("hk|07.12", "hide", expect.anything());
  });

  it("повторное добавление своей остановки не пишет дубль и показывает подсказку", () => {
    const api = makeApi();
    renderCard({ api });

    fireEvent.click(screen.getByRole("button", { name: "добавить остановку" }));
    const input = screen.getByLabelText("название новой остановки");
    fireEvent.change(input, { target: { value: "Новый музей" } });
    fireEvent.click(screen.getByRole("button", { name: "добавить" }));

    expect(api.saveText).toHaveBeenCalledTimes(1);

    fireEvent.change(input, { target: { value: "Новый музей" } });
    expect(screen.getByRole("button", { name: "добавить" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("уже в дне");

    fireEvent.keyDown(input, { key: "Enter" });
    expect(api.saveText).toHaveBeenCalledTimes(1);
  });

  it("своя остановка не дублирует уже добавленную в текстах дня", () => {
    const api = makeApi();
    const texts = { add: JSON.stringify([{ s: stopSlug("Новый музей"), n: "Новый музей" }]) };
    renderCard({ api, texts });

    fireEvent.click(screen.getByRole("button", { name: "добавить остановку" }));
    const input = screen.getByLabelText("название новой остановки");
    fireEvent.change(input, { target: { value: "Новый музей" } });
    expect(screen.getByRole("button", { name: "добавить" })).toBeDisabled();

    fireEvent.keyDown(input, { key: "Enter" });
    expect(api.saveText).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("уже в дне");
  });
});
